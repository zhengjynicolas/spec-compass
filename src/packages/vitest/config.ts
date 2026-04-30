import type { SpecCompassConfig, VitestRuntimeConfig } from '../core/types';

export function createVitestConfig(appConfig: SpecCompassConfig): VitestRuntimeConfig {
  const coverage = appConfig.coverage ?? {};

  return {
    include: appConfig.vitest?.include ?? [],
    passWithNoTests: appConfig.vitest?.passWithNoTests ?? false,
    coverage: {
      enabled: coverage.enabled ?? true,
      provider: coverage.provider ?? 'v8',
      reportsDirectory: coverage.reportsDirectory ?? 'coverage',
      reporter: coverage.reporter ?? ['text', 'html', 'json-summary'],
      clean: coverage.clean ?? true,
      reportOnFailure: coverage.reportOnFailure ?? true,
      all: coverage.all,
    },
  };
}
