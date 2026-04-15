import type { PlaywrightRuntimeConfig, TestingPlatformConfig } from '../core/types';

export const baseConfig: PlaywrightRuntimeConfig = {
  outputDir: '.speccompass/artifacts',
  use: {
    baseURL: undefined,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
};

export function createPlaywrightConfig(
  appConfig: TestingPlatformConfig,
): PlaywrightRuntimeConfig {
  return {
    ...baseConfig,
    testDir: appConfig.playwright?.testDir,
    outputDir: appConfig.artifacts?.outputDir ?? baseConfig.outputDir,
    use: {
      ...baseConfig.use,
      baseURL: appConfig.baseURL,
      headless: appConfig.playwright?.headless ?? baseConfig.use.headless,
      trace: appConfig.artifacts?.trace ?? appConfig.playwright?.trace ?? baseConfig.use.trace,
      screenshot: appConfig.artifacts?.screenshot ?? baseConfig.use.screenshot,
      video: appConfig.artifacts?.video ?? baseConfig.use.video,
    },
  };
}
