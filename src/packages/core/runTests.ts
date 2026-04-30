import { runPlaywright } from '../playwright/runPlaywright';
import { runVitest } from '../vitest/runVitest';

import { loadConfig } from './loadConfig';
import { createEmptyResultOutput, writeRunResultFiles } from './output';
import { redactLocalPaths } from './redactPaths';
import { formatRunReport } from './report';
import type { RunTestsResult, TestSuiteResult } from './types';

function collectFailures(results: TestSuiteResult[]): TestSuiteResult[] {
  return results.filter((result) => result.status === 'failed');
}

function buildSummary(results: TestSuiteResult[]) {
  return {
    totalSuites: results.length,
    failedSuites: results.filter((result) => result.status === 'failed').length,
    skippedSuites: results.filter((result) => result.status === 'skipped').length,
    totalFailures: results.reduce((count, result) => count + result.metrics.failureCount, 0),
    totalArtifacts: results.reduce((count, result) => count + result.artifacts.length, 0),
    durationMs: results.reduce((total, result) => total + result.durationMs, 0),
  };
}

export async function runTests(projectPath: string): Promise<RunTestsResult> {
  const config = await loadConfig(projectPath);

  const vitest = await runVitest(projectPath, config);
  const playwright = await runPlaywright(projectPath, config);
  const allResults = [vitest, playwright];
  const failures = collectFailures(allResults);

  const draftResult: RunTestsResult = {
    config,
    vitest,
    playwright,
    hasFailures: failures.length > 0,
    summary: buildSummary(allResults),
    output: createEmptyResultOutput(projectPath, config),
  };

  const reportResult = redactLocalPaths(draftResult, projectPath);
  const output = writeRunResultFiles(
    projectPath,
    config,
    formatRunReport(reportResult),
    reportResult,
  );

  return {
    ...reportResult,
    output,
  };
}
