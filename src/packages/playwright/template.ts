import type { SpecCompassConfig } from '../core/types';

export function createPlaywrightConfigTemplate(appConfig: SpecCompassConfig): string {
  const baseURL = appConfig.baseURL ?? 'http://localhost:3000';
  const testDir = appConfig.playwright?.testDir ?? 'tests/e2e';
  const headless = appConfig.playwright?.headless ?? true;
  const outputDir = appConfig.artifacts?.outputDir ?? '.speccompass/artifacts';
  const trace =
    appConfig.artifacts?.trace ?? appConfig.playwright?.trace ?? 'on-first-retry';
  const screenshot = appConfig.artifacts?.screenshot ?? 'only-on-failure';
  const video = appConfig.artifacts?.video ?? 'retain-on-failure';

  return [
    "import { defineConfig } from '@playwright/test';",
    '',
    'export default defineConfig({',
    `  testDir: '${testDir}',`,
    `  outputDir: '${outputDir}',`,
    '  use: {',
    `    baseURL: '${baseURL}',`,
    `    headless: ${headless ? 'true' : 'false'},`,
    `    trace: '${trace}',`,
    `    screenshot: '${screenshot}',`,
    `    video: '${video}',`,
    '  },',
    '});',
    '',
  ].join('\n');
}
