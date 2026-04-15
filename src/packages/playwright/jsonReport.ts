import path from 'node:path';

import type { ArtifactFile, FailureDetail } from '../core/types';

function classifyArtifact(filePath: string): ArtifactFile['type'] {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.png' || extension === '.jpg' || extension === '.jpeg' || extension === '.webp') {
    return 'screenshot';
  }

  if (extension === '.zip') {
    return 'trace';
  }

  if (extension === '.webm' || extension === '.mp4' || extension === '.mov') {
    return 'video';
  }

  return 'other';
}

interface PlaywrightJsonAttachment {
  name?: string;
  path?: string;
  contentType?: string;
}

interface PlaywrightJsonError {
  message?: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
  };
}

interface PlaywrightJsonResult {
  status?: string;
  error?: PlaywrightJsonError;
  errors?: PlaywrightJsonError[];
  attachments?: PlaywrightJsonAttachment[];
}

interface PlaywrightJsonTest {
  projectName?: string;
  results?: PlaywrightJsonResult[];
}

interface PlaywrightJsonSpec {
  title?: string;
  file?: string;
  line?: number;
  column?: number;
  tests?: PlaywrightJsonTest[];
}

interface PlaywrightJsonSuite {
  title?: string;
  file?: string;
  line?: number;
  column?: number;
  specs?: PlaywrightJsonSpec[];
  suites?: PlaywrightJsonSuite[];
}

interface PlaywrightJsonReport {
  suites?: PlaywrightJsonSuite[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeJsonParse(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildLocation(file?: string, line?: number, column?: number): string | undefined {
  if (!file) {
    return undefined;
  }

  if (line && column) {
    return `${file}:${line}:${column}`;
  }

  if (line) {
    return `${file}:${line}`;
  }

  return file;
}

function toArtifact(attachment: PlaywrightJsonAttachment): ArtifactFile | null {
  if (!attachment.path) {
    return null;
  }

  return {
    type: classifyArtifact(attachment.path),
    path: attachment.path,
  };
}

function uniqueArtifacts(artifacts: ArtifactFile[]): ArtifactFile[] {
  const seen = new Set<string>();
  return artifacts.filter((artifact) => {
    const key = `${artifact.type}|${artifact.path}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function collectResultArtifacts(results: PlaywrightJsonResult[]): ArtifactFile[] {
  return uniqueArtifacts(
    results.flatMap((result) => (result.attachments ?? []).map(toArtifact).filter(Boolean) as ArtifactFile[]),
  );
}

function collectResultMessages(results: PlaywrightJsonResult[]): string[] {
  return results.flatMap((result) => {
    const direct = result.error?.message ? [result.error.message] : [];
    const nested = (result.errors ?? [])
      .map((error) => error.message)
      .filter((message): message is string => typeof message === 'string' && message.trim().length > 0);
    return [...direct, ...nested];
  });
}

function collectResultLocation(results: PlaywrightJsonResult[], fallback?: string): string | undefined {
  for (const result of results) {
    if (result.error?.location?.file) {
      return buildLocation(
        result.error.location.file,
        result.error.location.line,
        result.error.location.column,
      );
    }

    const nested = result.errors ?? [];
    for (const error of nested) {
      if (error.location?.file) {
        return buildLocation(error.location.file, error.location.line, error.location.column);
      }
    }
  }

  return fallback;
}

function normalizeFailureTitle(spec: PlaywrightJsonSpec, test: PlaywrightJsonTest): string {
  const projectSuffix = test.projectName ? ` [${test.projectName}]` : '';
  return `${spec.title ?? 'Unnamed Playwright Test'}${projectSuffix}`;
}

function parseSpecFailures(spec: PlaywrightJsonSpec): FailureDetail[] {
  const tests = spec.tests ?? [];
  const failures: FailureDetail[] = [];
  const fallbackLocation = buildLocation(spec.file, spec.line, spec.column);

  for (const test of tests) {
    const results = (test.results ?? []).filter((result) => result.status && result.status !== 'passed');
    if (results.length === 0) {
      continue;
    }

    const relatedArtifacts = collectResultArtifacts(results);
    const messages = collectResultMessages(results);
    const location = collectResultLocation(results, fallbackLocation);
    const message =
      messages.length > 0
        ? messages.join(' ')
        : `Playwright reported ${results.length} non-passing result(s) for this test.`;

    failures.push({
      suite: 'playwright',
      title: normalizeFailureTitle(spec, test),
      location,
      message,
      relatedArtifacts,
    });
  }

  return failures;
}

function walkSuites(suites: PlaywrightJsonSuite[]): FailureDetail[] {
  const failures: FailureDetail[] = [];

  for (const suite of suites) {
    if (suite.specs) {
      failures.push(...suite.specs.flatMap(parseSpecFailures));
    }

    if (suite.suites) {
      failures.push(...walkSuites(suite.suites));
    }
  }

  return failures;
}

export interface ParsedPlaywrightJsonReport {
  failureDetails: FailureDetail[];
  artifacts: ArtifactFile[];
}

export function parsePlaywrightJsonReport(stdout: string): ParsedPlaywrightJsonReport | null {
  const parsed = safeJsonParse(stdout);
  if (!isObject(parsed)) {
    return null;
  }

  const report = parsed as PlaywrightJsonReport;
  const suites = Array.isArray(report.suites) ? report.suites : [];
  const failureDetails = walkSuites(suites);
  const artifacts = uniqueArtifacts(failureDetails.flatMap((failure) => failure.relatedArtifacts));

  return {
    failureDetails,
    artifacts,
  };
}
