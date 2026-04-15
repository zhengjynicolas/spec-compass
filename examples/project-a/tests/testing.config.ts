export default {
  name: 'project-a',
  baseURL: 'http://localhost:3000',
  vitest: {
    include: ['tests/unit/**/*.test.ts'],
    command: 'echo',
    args: ['vitest demo executed'],
    passWithNoTests: true,
  },
  playwright: {
    testDir: 'tests/e2e',
    command: 'echo',
    args: ['playwright demo executed'],
    headless: true,
    trace: 'on-first-retry',
  },
  artifacts: {
    outputDir: '.speccompass/artifacts',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  results: {
    outputDir: 'test-results',
  },
};
