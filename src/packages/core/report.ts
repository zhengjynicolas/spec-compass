import type { FailureDetail, RunTestsResult, TestSuiteResult } from './types';

function formatFailureDetail(failure: FailureDetail): string {
  const location = failure.location ? ` @ ${failure.location}` : '';
  const lines = [`  - ${failure.title}${location}: ${failure.message}`];
  if (failure.relatedArtifacts.length > 0) {
    lines.push(...failure.relatedArtifacts.map((artifact) => `    relatedArtifact: ${artifact.type}: ${artifact.path}`));
  }
  return lines.join('\n');
}

function formatSuiteResult(result: TestSuiteResult): string {
  const lines = [
    `- ${result.suite}: ${result.status}`,
    `  command: ${[result.command, ...result.args].join(' ')}`,
    `  summary: ${result.summary}`,
    `  exitCode: ${result.exitCode ?? 'n/a'}`,
    `  durationMs: ${result.durationMs}`,
    `  failures: ${result.metrics.failureCount}`,
    `  warnings: ${result.metrics.warningCount}`,
    `  artifacts: ${result.artifacts.length}`,
  ];

  if (result.failureDetails.length > 0) {
    lines.push('  failureDetails:');
    lines.push(...result.failureDetails.map(formatFailureDetail));
  }

  if (result.artifacts.length > 0) {
    lines.push('  artifactFiles:');
    lines.push(
      ...result.artifacts.map((artifact) => `  - ${artifact.type}: ${artifact.path}`),
    );
  }

  return lines.join('\n');
}

export function formatRunReport(result: RunTestsResult): string {
  return [
    `SpecCompass Report (${result.config.name})`,
    `hasFailures: ${result.hasFailures ? 'yes' : 'no'}`,
    `summary: suites=${result.summary.totalSuites}, failed=${result.summary.failedSuites}, skipped=${result.summary.skippedSuites}, failureDetails=${result.summary.totalFailures}, artifacts=${result.summary.totalArtifacts}, durationMs=${result.summary.durationMs}`,
    `outputDir: ${result.output.outputDir}`,
    `textReport: ${result.output.textReportPath}`,
    `jsonReport: ${result.output.jsonReportPath}`,
    formatSuiteResult(result.vitest),
    formatSuiteResult(result.playwright),
  ].join('\n');
}
