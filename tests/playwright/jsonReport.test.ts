import { describe, expect, it } from 'vitest';

import { attachArtifactsToFailures } from '../../src/packages/playwright/artifacts';
import { parsePlaywrightJsonReport } from '../../src/packages/playwright/jsonReport';

describe('parsePlaywrightJsonReport', () => {
  it('extracts failure details and attachments from playwright json reporter output', () => {
    const report = JSON.stringify({
      suites: [
        {
          specs: [
            {
              title: 'login flow should submit',
              file: 'tests/e2e/login.spec.ts',
              line: 22,
              column: 9,
              tests: [
                {
                  projectName: 'chromium',
                  results: [
                    {
                      status: 'failed',
                      error: {
                        message: 'locator.click: Timeout 5000ms exceeded.',
                        location: {
                          file: 'tests/e2e/login.spec.ts',
                          line: 22,
                          column: 9,
                        },
                      },
                      attachments: [
                        {
                          name: 'screenshot',
                          path: '/tmp/login-flow-should-submit.png',
                        },
                        {
                          name: 'trace',
                          path: '/tmp/login-flow-should-submit-trace.zip',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const parsed = parsePlaywrightJsonReport(report);

    expect(parsed).not.toBeNull();
    expect(parsed?.failureDetails).toHaveLength(1);
    expect(parsed?.failureDetails[0]?.title).toBe('login flow should submit [chromium]');
    expect(parsed?.failureDetails[0]?.location).toBe('tests/e2e/login.spec.ts:22:9');
    expect(parsed?.failureDetails[0]?.message).toContain('Timeout 5000ms exceeded');
    expect(parsed?.failureDetails[0]?.relatedArtifacts).toHaveLength(2);
    expect(parsed?.artifacts).toHaveLength(2);
  });

  it('returns null for non-json stdout', () => {
    expect(parsePlaywrightJsonReport('not-json')).toBeNull();
  });
});

describe('attachArtifactsToFailures', () => {
  it('attaches all artifacts when there is only one failure', () => {
    const failures = [
      {
        suite: 'playwright' as const,
        title: 'single failing test',
        message: 'locator.click failed',
        relatedArtifacts: [],
      },
    ];

    const artifacts = [
      { type: 'screenshot' as const, path: '/tmp/failure.png' },
      { type: 'trace' as const, path: '/tmp/trace.zip' },
    ];

    const linked = attachArtifactsToFailures(failures, artifacts);

    expect(linked[0]?.relatedArtifacts).toHaveLength(2);
  });

  it('matches artifacts to the most relevant failure by title/location hints', () => {
    const failures = [
      {
        suite: 'playwright' as const,
        title: 'login flow should submit',
        location: 'tests/e2e/login.spec.ts:22:9',
        message: 'locator.click failed',
        relatedArtifacts: [],
      },
      {
        suite: 'playwright' as const,
        title: 'dashboard should render',
        location: 'tests/e2e/dashboard.spec.ts:10:1',
        message: 'Expected visible',
        relatedArtifacts: [],
      },
    ];

    const artifacts = [
      { type: 'screenshot' as const, path: '/tmp/login-spec-error.png' },
      { type: 'trace' as const, path: '/tmp/login.spec-trace.zip' },
      { type: 'video' as const, path: '/tmp/dashboard-render.webm' },
    ];

    const linked = attachArtifactsToFailures(failures, artifacts);

    expect(linked[0]?.relatedArtifacts.map((artifact) => artifact.path)).toEqual(
      expect.arrayContaining(['/tmp/login-spec-error.png', '/tmp/login.spec-trace.zip']),
    );
    expect(linked[1]?.relatedArtifacts.map((artifact) => artifact.path)).toEqual(
      expect.arrayContaining(['/tmp/dashboard-render.webm']),
    );
  });
});
