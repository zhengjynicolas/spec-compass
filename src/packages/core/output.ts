import fs from 'node:fs';
import path from 'node:path';

import type { ResultOutputFiles, RunTestsResult, SpecCompassConfig } from './types';

const DEFAULT_RESULTS_DIR = 'test-results';
const TEXT_REPORT_FILE_NAME = 'speccompass-report.txt';
const JSON_REPORT_FILE_NAME = 'speccompass-report.json';

export function resolveResultsOutputDir(
  projectPath: string,
  config: SpecCompassConfig,
): string {
  return path.resolve(projectPath, config.results?.outputDir ?? DEFAULT_RESULTS_DIR);
}

function toProjectRelativePath(projectPath: string, absolutePath: string): string {
  const relativePath = path.relative(projectPath, absolutePath);
  if (relativePath === '') {
    return '.';
  }

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return absolutePath;
  }

  return relativePath;
}

function createResultOutputFiles(projectPath: string, outputDir: string): ResultOutputFiles {
  const relativeOutputDir = toProjectRelativePath(projectPath, outputDir);

  return {
    outputDir: relativeOutputDir,
    textReportPath: path.join(relativeOutputDir, TEXT_REPORT_FILE_NAME),
    jsonReportPath: path.join(relativeOutputDir, JSON_REPORT_FILE_NAME),
  };
}

export function createEmptyResultOutput(
  projectPath: string,
  config: SpecCompassConfig,
): ResultOutputFiles {
  const outputDir = resolveResultsOutputDir(projectPath, config);

  return createResultOutputFiles(projectPath, outputDir);
}

export function writeRunResultFiles(
  projectPath: string,
  config: SpecCompassConfig,
  textReport: string,
  result: RunTestsResult,
): ResultOutputFiles {
  const outputDir = resolveResultsOutputDir(projectPath, config);
  fs.mkdirSync(outputDir, { recursive: true });

  const textReportPath = path.join(outputDir, TEXT_REPORT_FILE_NAME);
  const jsonReportPath = path.join(outputDir, JSON_REPORT_FILE_NAME);

  fs.writeFileSync(textReportPath, `${textReport}\n`, 'utf8');
  fs.writeFileSync(jsonReportPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  return createResultOutputFiles(projectPath, outputDir);
}
