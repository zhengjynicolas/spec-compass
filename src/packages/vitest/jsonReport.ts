import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { FailureDetail } from '../core/types';

interface VitestJsonAssertionResult {
  ancestorTitles?: string[];
  fullName?: string;
  status?: string;
  title?: string;
  duration?: number | null;
  failureMessages?: string[] | null;
  location?: {
    line?: number;
    column?: number;
  } | null;
}

interface VitestJsonTestResult {
  message?: string;
  name?: string;
  status?: 'failed' | 'passed';
  assertionResults?: VitestJsonAssertionResult[];
}

interface VitestJsonReport {
  numFailedTests?: number;
  numFailedTestSuites?: number;
  numPassedTests?: number;
  numPassedTestSuites?: number;
  numPendingTests?: number;
  numPendingTestSuites?: number;
  numTodoTests?: number;
  numTotalTests?: number;
  numTotalTestSuites?: number;
  startTime?: number;
  success?: boolean;
  testResults?: VitestJsonTestResult[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeReadJsonFile(filePath: string): unknown | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function buildLocation(filePath: string | undefined, line?: number, column?: number): string | undefined {
  if (!filePath) {
    return undefined;
  }

  if (line && column) {
    return `${filePath}:${line}:${column}`;
  }

  if (line) {
    return `${filePath}:${line}`;
  }

  return filePath;
}

function sanitizeMessage(message: string): string {
  return message
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .trim();
}

function parseAssertionFailure(
  suiteName: string | undefined,
  assertion: VitestJsonAssertionResult,
): FailureDetail | null {
  if (assertion.status !== 'failed') {
    return null;
  }

  const location = buildLocation(suiteName, assertion.location?.line, assertion.location?.column);
  const title =
    assertion.fullName ??
    [...(assertion.ancestorTitles ?? []), assertion.title ?? 'Unnamed Vitest Assertion']
      .filter(Boolean)
      .join(' > ');
  const failureMessages = (assertion.failureMessages ?? []).filter(
    (message): message is string => typeof message === 'string' && message.trim().length > 0,
  );
  const message =
    failureMessages.length > 0
      ? sanitizeMessage(failureMessages.join('\n'))
      : 'Vitest reported a failed assertion without a failure message.';

  return {
    suite: 'vitest',
    title,
    location,
    message,
    relatedArtifacts: [],
  };
}

export interface ParsedVitestJsonReport {
  failureDetails: FailureDetail[];
}

export function parseVitestJsonReportFile(reportPath: string): ParsedVitestJsonReport | null {
  const parsed = safeReadJsonFile(reportPath);
  if (!isObject(parsed)) {
    return null;
  }

  const report = parsed as VitestJsonReport;
  const testResults = Array.isArray(report.testResults) ? report.testResults : [];
  const failureDetails = testResults.flatMap((suiteResult) => {
    const suiteName = suiteResult.name;
    const assertions = Array.isArray(suiteResult.assertionResults)
      ? suiteResult.assertionResults
      : [];
    return assertions
      .map((assertion) => parseAssertionFailure(suiteName, assertion))
      .filter((failure): failure is FailureDetail => failure !== null);
  });

  return {
    failureDetails,
  };
}

export function createVitestJsonReportPath(projectPath: string): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-vitest-report-'));
  return path.join(tempDir, 'vitest.report.json');
}
