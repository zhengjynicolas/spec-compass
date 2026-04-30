import type { SpecCompassConfig } from '../core/types';

function stringifyInclude(include: string[]): string {
  return include.map((pattern) => `'${pattern}'`).join(', ');
}

export function createVitestConfigTemplate(appConfig: SpecCompassConfig): string {
  const include = appConfig.vitest?.include ?? ['tests/unit/**/*.test.ts'];
  const passWithNoTests = appConfig.vitest?.passWithNoTests ?? false;

  return [
    "import { defineConfig } from 'vitest/config';",
    '',
    'export default defineConfig({',
    '  test: {',
    `    include: [${stringifyInclude(include)}],`,
    `    passWithNoTests: ${passWithNoTests ? 'true' : 'false'},`,
    '  },',
    '});',
    '',
  ].join('\n');
}
