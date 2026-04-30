import type { SpecCompassConfig } from '../core/types';

function stringifyInclude(include: string[]): string {
  return include.map((pattern) => `'${pattern}'`).join(', ');
}

export function createVitestConfigTemplate(appConfig: SpecCompassConfig): string {
  const include = appConfig.vitest?.include ?? ['tests/unit/**/*.test.ts'];
  const passWithNoTests = appConfig.vitest?.passWithNoTests ?? false;
  const coverage = appConfig.coverage ?? {};
  const coverageReporter = coverage.reporter ?? ['text', 'html', 'json-summary'];

  return [
    "import { defineConfig } from 'vitest/config';",
    '',
    'export default defineConfig({',
    '  test: {',
    `    include: [${stringifyInclude(include)}],`,
    `    passWithNoTests: ${passWithNoTests ? 'true' : 'false'},`,
    '    coverage: {',
    `      enabled: ${coverage.enabled ?? true},`,
    `      provider: '${coverage.provider ?? 'v8'}',`,
    `      reportsDirectory: '${coverage.reportsDirectory ?? 'coverage'}',`,
    `      reporter: [${coverageReporter.map((reporter) => `'${reporter}'`).join(', ')}],`,
    `      clean: ${coverage.clean ?? true},`,
    `      reportOnFailure: ${coverage.reportOnFailure ?? true},`,
    '    },',
    '  },',
    '});',
    '',
  ].join('\n');
}
