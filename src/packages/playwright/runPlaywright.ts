import fs from 'node:fs';
import path from 'node:path';

import type { SpecCompassConfig, TestSuiteResult } from '../core/types';
import { deriveSuiteMetrics, parsePlaywrightFailures } from '../core/parseFailures';
import { resolveCommand } from '../core/resolveCommand';
import { runCommand } from '../core/runCommand';
import { attachArtifactsToFailures, collectPlaywrightArtifacts } from './artifacts';
import { createPlaywrightConfig } from './base';
import { createPlaywrightConfigFile } from './configFile';
import { parsePlaywrightJsonReport } from './jsonReport';

const DEFAULT_PLAYWRIGHT_ARGS = ['test'];

function hasReporterArg(args: string[]): boolean {
  return args.some(
    (arg, index) =>
      arg === '--reporter' ||
      arg.startsWith('--reporter=') ||
      (index > 0 && args[index - 1] === '--reporter'),
  );
}

export async function runPlaywright(
  projectPath: string,
  config: SpecCompassConfig,
): Promise<TestSuiteResult> {
  if (!config.playwright) {
    const result: TestSuiteResult = {
      suite: 'playwright',
      status: 'skipped',
      command: 'playwright',
      args: [],
      exitCode: null,
      stdout: '',
      stderr: '',
      summary: 'Playwright is not configured for this project.',
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

  const runtimeConfig = createPlaywrightConfig(config);
  const resolved = resolveCommand({
    cwd: projectPath,
    explicitCommand: config.playwright.command,
    localBinaryName: 'playwright',
    packageManagerPackage: 'playwright',
  });
  const args = [...resolved.args, ...DEFAULT_PLAYWRIGHT_ARGS];

  if (runtimeConfig.testDir) {
    args.push(runtimeConfig.testDir);
  }

  if (runtimeConfig.use.headless === false) {
    args.push('--headed');
  }

  const generatedConfigPath = config.playwright.configFile
    ? null
    : createPlaywrightConfigFile(projectPath, runtimeConfig);
  const configPath = config.playwright.configFile ?? generatedConfigPath;

  if (configPath) {
    args.push('--config', configPath);
  }

  if (config.playwright.args) {
    args.push(...config.playwright.args);
  }

  if (!hasReporterArg(args)) {
    args.push('--reporter=json');
  }

  const result = await runCommand({
    cwd: projectPath,
    command: resolved.command,
    args,
    summary: `Playwright finished running via ${resolved.resolution}.`,
    missingCommandSummary:
      'Playwright command was not found. Install it locally or configure playwright.command.',
  });

  if (generatedConfigPath && fs.existsSync(generatedConfigPath)) {
    fs.unlinkSync(generatedConfigPath);
    fs.rmSync(path.dirname(generatedConfigPath), { recursive: true, force: true });
  }

  const structuredReport = parsePlaywrightJsonReport(result.stdout);
  const scannedArtifacts = collectPlaywrightArtifacts(projectPath, runtimeConfig.outputDir);
  const artifacts =
    structuredReport && structuredReport.artifacts.length > 0
      ? [...structuredReport.artifacts, ...scannedArtifacts].filter(
          (artifact, index, current) =>
            current.findIndex(
              (candidate) =>
                candidate.type === artifact.type && candidate.path === artifact.path,
            ) === index,
        )
      : scannedArtifacts;
  const failureDetails = structuredReport
    ? attachArtifactsToFailures(structuredReport.failureDetails, artifacts)
    : attachArtifactsToFailures(parsePlaywrightFailures(result.stdout, result.stderr), artifacts);
  const suiteResult: TestSuiteResult = {
    suite: 'playwright',
    ...result,
    failureDetails,
    metrics: deriveSuiteMetrics({
      failureDetails,
      stdout: result.stdout,
      stderr: result.stderr,
    }),
    artifacts,
  };

  return suiteResult;
}
