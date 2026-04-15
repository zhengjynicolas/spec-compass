import type { TestingPlatformConfig, VitestRuntimeConfig } from '../core/types';

export function createVitestConfig(appConfig: TestingPlatformConfig): VitestRuntimeConfig {
  return {
    include: appConfig.vitest?.include ?? [],
    passWithNoTests: appConfig.vitest?.passWithNoTests ?? false,
  };
}
