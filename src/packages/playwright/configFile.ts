import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { PlaywrightRuntimeConfig } from '../core/types';

function normalizeRuntimeConfig(
  projectPath: string,
  config: PlaywrightRuntimeConfig,
): PlaywrightRuntimeConfig {
  return {
    ...config,
    testDir: config.testDir ? path.resolve(projectPath, config.testDir) : config.testDir,
    outputDir: config.outputDir ? path.resolve(projectPath, config.outputDir) : config.outputDir,
  };
}

function serializeConfig(config: PlaywrightRuntimeConfig): string {
  return `module.exports = ${JSON.stringify(config, null, 2)};\n`;
}

export function createPlaywrightConfigFile(
  projectPath: string,
  config: PlaywrightRuntimeConfig,
): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-playwright-'));
  const outputPath = path.join(tempDir, 'playwright.speccompass.config.cjs');
  const contents = serializeConfig(normalizeRuntimeConfig(projectPath, config));
  fs.writeFileSync(outputPath, contents, 'utf8');
  return outputPath;
}
