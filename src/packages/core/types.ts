export interface TestingPlatformConfig {
  name: string;
  baseURL?: string;
  vitest?: VitestConfig;
  playwright?: PlaywrightConfig;
  artifacts?: ArtifactsConfig;
  results?: ResultsConfig;
}

export interface VitestConfig {
  include?: string[];
  command?: string;
  args?: string[];
  passWithNoTests?: boolean;
  configFile?: string;
}

export interface PlaywrightConfig {
  testDir?: string;
  command?: string;
  args?: string[];
  headless?: boolean;
  trace?: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
  configFile?: string;
}

export interface ArtifactsConfig {
  outputDir?: string;
  screenshot?: 'off' | 'on' | 'only-on-failure';
  video?: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
  trace?: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
}

export interface ResultsConfig {
  outputDir?: string;
}

export interface CommandExecutionResult {
  status: 'passed' | 'failed' | 'skipped';
  command: string;
  args: string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
  summary: string;
  durationMs: number;
}

export interface ResolvedCommand {
  command: string;
  args: string[];
  resolution: 'explicit' | 'local-bin' | 'package-manager' | 'direct';
}

export interface TestSuiteResult extends CommandExecutionResult {
  suite: 'vitest' | 'playwright';
  failureDetails: FailureDetail[];
  metrics: SuiteMetrics;
  artifacts: ArtifactFile[];
}

export interface RunTestsResult {
  config: TestingPlatformConfig;
  vitest: TestSuiteResult;
  playwright: TestSuiteResult;
  hasFailures: boolean;
  summary: RunSummary;
  output: ResultOutputFiles;
}

export interface PlaywrightRuntimeConfig {
  testDir?: string;
  outputDir?: string;
  use: {
    baseURL?: string;
    headless: boolean;
    trace: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
    screenshot: 'off' | 'on' | 'only-on-failure';
    video: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
  };
}

export interface VitestRuntimeConfig {
  include: string[];
  passWithNoTests: boolean;
}

export interface FailureDetail {
  suite: 'vitest' | 'playwright';
  title: string;
  location?: string;
  message: string;
  relatedArtifacts: ArtifactFile[];
}

export interface SuiteMetrics {
  failureCount: number;
  warningCount: number;
}

export interface RunSummary {
  totalSuites: number;
  failedSuites: number;
  skippedSuites: number;
  totalFailures: number;
  totalArtifacts: number;
  durationMs: number;
}

export interface ArtifactFile {
  type: 'screenshot' | 'trace' | 'video' | 'other';
  path: string;
}

export interface ResultOutputFiles {
  outputDir: string;
  textReportPath: string;
  jsonReportPath: string;
}
