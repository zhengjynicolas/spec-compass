import fs from 'node:fs';
import path from 'node:path';

import type { ResultOutputFiles, RunTestsResult, TestingPlatformConfig } from './types';

const DEFAULT_RESULTS_DIR = 'test-results';
const TEXT_REPORT_FILE_NAME = 'speccompass-report.txt';
const JSON_REPORT_FILE_NAME = 'speccompass-report.json';

export function resolveResultsOutputDir(
  projectPath: string,
  config: TestingPlatformConfig,
): string {
  return path.resolve(projectPath, config.results?.outputDir ?? DEFAULT_RESULTS_DIR);
}

export function createEmptyResultOutput(
  projectPath: string,
  config: TestingPlatformConfig,
): ResultOutputFiles {
  const outputDir = resolveResultsOutputDir(projectPath, config);

  return {
    outputDir,
    textReportPath: path.join(outputDir, TEXT_REPORT_FILE_NAME),
    jsonReportPath: path.join(outputDir, JSON_REPORT_FILE_NAME),
  };
}

export function writeRunResultFiles(
  projectPath: string,
  config: TestingPlatformConfig,
  textReport: string,
  result: RunTestsResult,
): ResultOutputFiles {
  const outputDir = resolveResultsOutputDir(projectPath, config);
  fs.mkdirSync(outputDir, { recursive: true });

  const textReportPath = path.join(outputDir, TEXT_REPORT_FILE_NAME);
  const jsonReportPath = path.join(outputDir, JSON_REPORT_FILE_NAME);

  fs.writeFileSync(textReportPath, `${textReport}\n`, 'utf8');
  fs.writeFileSync(jsonReportPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  return {
    outputDir,
    textReportPath,
    jsonReportPath,
  };
}
