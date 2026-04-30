import type { SpecCompassConfig, VitestRuntimeConfig } from '../core/types';

export function createVitestConfig(appConfig: SpecCompassConfig): VitestRuntimeConfig {
  return {
    include: appConfig.vitest?.include ?? [],
    passWithNoTests: appConfig.vitest?.passWithNoTests ?? false,
  };
}
