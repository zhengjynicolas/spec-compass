import fs from 'node:fs';
import path from 'node:path';

import { createPlaywrightTemplateFile } from '../playwright/templateFile';
import { createVitestTemplateFile } from '../vitest/templateFile';

import type { SpecCompassConfig } from './types';

export interface InitProjectResult {
  projectPath: string;
  createdDirectories: string[];
  createdFiles: string[];
  updatedFiles: string[];
  skippedFiles: string[];
}

function ensureDir(dirPath: string, createdDirectories: string[]): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    createdDirectories.push(dirPath);
  }
}

function detectProjectName(projectPath: string): string {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { name?: string };
      if (typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
        return parsed.name;
      }
    } catch {
      return path.basename(projectPath);
    }
  }

  return path.basename(projectPath);
}

function createTestingConfigTemplate(projectName: string): string {
  return [
    'export default {',
    `  name: '${projectName}',`,
    "  baseURL: 'http://localhost:3000',",
    '  vitest: {',
    "    include: ['tests/unit/**/*.test.ts'],",
    '  },',
    '  playwright: {',
    "    testDir: 'tests/e2e',",
    '    headless: true,',
    "    trace: 'on-first-retry',",
    '  },',
    '  artifacts: {',
    "    outputDir: '.speccompass/artifacts',",
    "    screenshot: 'only-on-failure',",
    "    video: 'retain-on-failure',",
    "    trace: 'on-first-retry',",
    '  },',
    '  results: {',
    "    outputDir: 'test-results',",
    '  },',
    '};',
    '',
  ].join('\n');
}

function writeFileIfMissing(
  filePath: string,
  contents: string,
  createdFiles: string[],
  skippedFiles: string[],
): void {
  if (fs.existsSync(filePath)) {
    skippedFiles.push(filePath);
    return;
  }

  fs.writeFileSync(filePath, contents, 'utf8');
  createdFiles.push(filePath);
}

function updatePackageJsonScripts(
  projectPath: string,
  updatedFiles: string[],
  skippedFiles: string[],
): void {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    skippedFiles.push(packageJsonPath);
    return;
  }

  const parsed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>;
    [key: string]: unknown;
  };

  const scripts = parsed.scripts ?? {};
  const desiredScripts: Record<string, string> = {
    'test:auto': 'speccompass run',
    'test:auto:init': 'speccompass init',
  };

  let changed = false;
  for (const [key, value] of Object.entries(desiredScripts)) {
    if (scripts[key] !== value) {
      scripts[key] = value;
      changed = true;
    }
  }

  if (!changed) {
    skippedFiles.push(packageJsonPath);
    return;
  }

  parsed.scripts = scripts;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  updatedFiles.push(packageJsonPath);
}

export function initializeProject(projectPath: string): InitProjectResult {
  const createdDirectories: string[] = [];
  const createdFiles: string[] = [];
  const updatedFiles: string[] = [];
  const skippedFiles: string[] = [];

  const testsDir = path.join(projectPath, 'tests');
  const unitDir = path.join(testsDir, 'unit');
  const e2eDir = path.join(testsDir, 'e2e');

  ensureDir(testsDir, createdDirectories);
  ensureDir(unitDir, createdDirectories);
  ensureDir(e2eDir, createdDirectories);

  const projectName = detectProjectName(projectPath);
  const config: SpecCompassConfig = {
    name: projectName,
    baseURL: 'http://localhost:3000',
    vitest: {
      include: ['tests/unit/**/*.test.ts'],
    },
    playwright: {
      testDir: 'tests/e2e',
      headless: true,
      trace: 'on-first-retry',
    },
    artifacts: {
      outputDir: '.speccompass/artifacts',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      trace: 'on-first-retry',
    },
    results: {
      outputDir: 'test-results',
    },
  };

  writeFileIfMissing(
    path.join(testsDir, 'testing.config.ts'),
    createTestingConfigTemplate(projectName),
    createdFiles,
    skippedFiles,
  );

  const vitestConfigPath = path.join(projectPath, 'vitest.speccompass.config.ts');
  if (!fs.existsSync(vitestConfigPath)) {
    createVitestTemplateFile(projectPath, config);
    createdFiles.push(vitestConfigPath);
  } else {
    skippedFiles.push(vitestConfigPath);
  }

  const playwrightConfigPath = path.join(projectPath, 'playwright.speccompass.config.ts');
  if (!fs.existsSync(playwrightConfigPath)) {
    createPlaywrightTemplateFile(projectPath, config);
    createdFiles.push(playwrightConfigPath);
  } else {
    skippedFiles.push(playwrightConfigPath);
  }

  updatePackageJsonScripts(projectPath, updatedFiles, skippedFiles);

  return {
    projectPath,
    createdDirectories,
    createdFiles,
    updatedFiles,
    skippedFiles,
  };
}
