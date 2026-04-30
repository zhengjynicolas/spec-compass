import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { SpecCompassConfig } from '../core/types';
import { createVitestConfig } from './config';

function createVitestRuntimeConfigTemplate(
  projectPath: string,
  appConfig: SpecCompassConfig,
): string {
  const runtimeConfig = createVitestConfig(appConfig);
  const include = runtimeConfig.include.map((pattern) => path.resolve(projectPath, pattern));

  return [
    "import { defineConfig } from 'vitest/config';",
    '',
    'export default defineConfig({',
    '  test: {',
    `    include: ${JSON.stringify(include, null, 2)},`,
    `    passWithNoTests: ${runtimeConfig.passWithNoTests ? 'true' : 'false'},`,
    '  },',
    '});',
    '',
  ].join('\n');
}

export function createVitestConfigFile(
  projectPath: string,
  appConfig: SpecCompassConfig,
): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-vitest-'));
  const outputPath = path.join(tempDir, 'vitest.speccompass.config.ts');
  fs.writeFileSync(outputPath, createVitestRuntimeConfigTemplate(projectPath, appConfig), 'utf8');
  return outputPath;
}
