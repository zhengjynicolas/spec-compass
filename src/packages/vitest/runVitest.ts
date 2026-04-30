import fs from 'node:fs';
import path from 'node:path';

import type { SpecCompassConfig, TestSuiteResult } from '../core/types';
import { deriveSuiteMetrics, parseVitestFailures } from '../core/parseFailures';
import { resolveCommand } from '../core/resolveCommand';
import { runCommand } from '../core/runCommand';
import { createVitestConfigFile } from './configFile';
import { createVitestConfig } from './config';
import { createVitestJsonReportPath, parseVitestJsonReportFile } from './jsonReport';

const DEFAULT_VITEST_ARGS = ['run'];

function hasReporterArg(args: string[]): boolean {
  return args.some(
    (arg, index) =>
      arg === '--reporter' ||
      arg.startsWith('--reporter=') ||
      (index > 0 && args[index - 1] === '--reporter'),
  );
}

function hasOutputFileArg(args: string[]): boolean {
  return args.some(
    (arg, index) =>
      arg === '--outputFile' ||
      arg.startsWith('--outputFile=') ||
      (index > 0 && args[index - 1] === '--outputFile'),
  );
}

export async function runVitest(
  projectPath: string,
  config: SpecCompassConfig,
): Promise<TestSuiteResult> {
  if (!config.vitest) {
    const result: TestSuiteResult = {
      suite: 'vitest',
      status: 'skipped',
      command: 'vitest',
      args: [],
      exitCode: null,
      stdout: '',
      stderr: '',
      summary: 'Vitest is not configured for this project.',
      durationMs: 0,
      failureDetails: [],
      metrics: {
        failureCount: 0,
        warningCount: 0,
      },
      artifacts: [],
    };
    return result;
  }

  const runtimeConfig = createVitestConfig(config);
  const resolved = resolveCommand({
    cwd: projectPath,
    explicitCommand: config.vitest.command,
    localBinaryName: 'vitest',
    packageManagerPackage: 'vitest',
  });
  const args = [...resolved.args, ...DEFAULT_VITEST_ARGS];

  if (runtimeConfig.passWithNoTests) {
    args.push('--passWithNoTests');
  }

  const generatedConfigPath = config.vitest.configFile
    ? null
    : createVitestConfigFile(projectPath, config);
  const configPath = config.vitest.configFile ?? generatedConfigPath;

  if (configPath) {
    args.push('--config', configPath);
  }

  if (config.vitest.args) {
    args.push(...config.vitest.args);
  }

  const jsonReportPath = createVitestJsonReportPath(projectPath);
  if (!hasReporterArg(args)) {
    args.push('--reporter=json');
  }
  if (!hasOutputFileArg(args)) {
    args.push('--outputFile', jsonReportPath);
  }

  const result = await runCommand({
    cwd: projectPath,
    command: resolved.command,
    args,
    summary: `Vitest finished running via ${resolved.resolution}.`,
    missingCommandSummary:
      'Vitest command was not found. Install it locally or configure vitest.command.',
  });

  const parsedFailures = parseVitestFailures(result.stdout, result.stderr);
  const structuredReport = parseVitestJsonReportFile(jsonReportPath);
  if (generatedConfigPath && fs.existsSync(generatedConfigPath)) {
    fs.unlinkSync(generatedConfigPath);
    fs.rmSync(path.dirname(generatedConfigPath), { recursive: true, force: true });
  }
  if (fs.existsSync(jsonReportPath)) {
    fs.unlinkSync(jsonReportPath);
  }
  if (fs.existsSync(path.dirname(jsonReportPath))) {
    fs.rmSync(path.dirname(jsonReportPath), { recursive: true, force: true });
  }

  const failureDetails = structuredReport?.failureDetails ?? parsedFailures;

  const suiteResult: TestSuiteResult = {
    suite: 'vitest',
    ...result,
    failureDetails,
    metrics: deriveSuiteMetrics({
      failureDetails,
      stdout: result.stdout,
      stderr: result.stderr,
    }),
    artifacts: [],
  };

  return suiteResult;
}
