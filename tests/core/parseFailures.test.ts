import { describe, expect, it } from 'vitest';

import { parsePlaywrightFailures, parseVitestFailures } from '../../src/packages/core/parseFailures';

describe('parseVitestFailures', () => {
  it('parses FAIL blocks with location and assertion details', () => {
    const stdout = `
FAIL tests/unit/login.test.ts > login should reject invalid password
AssertionError: expected 200 to be 401
at tests/unit/login.test.ts:12:3
Expected: 401
Received: 200
`;

    const failures = parseVitestFailures(stdout, '');

    expect(failures).toHaveLength(1);
    expect(failures[0]?.title).toContain('tests/unit/login.test.ts > login should reject invalid password');
    expect(failures[0]?.location).toBe('tests/unit/login.test.ts:12:3');
    expect(failures[0]?.message).toContain('Expected: 401');
    expect(failures[0]?.relatedArtifacts).toEqual([]);
  });

  it('parses x-style vitest test case failures', () => {
    const stderr = `
× login should reject invalid password
Error: expected true to be false
at tests/unit/auth.test.ts:20:7
`;

    const failures = parseVitestFailures('', stderr);

    expect(failures).toHaveLength(1);
    expect(failures[0]?.title).toBe('login should reject invalid password');
    expect(failures[0]?.location).toBe('tests/unit/auth.test.ts:20:7');
  });
});

describe('parsePlaywrightFailures', () => {
  it('parses numbered playwright failures with locator and location lines', () => {
    const stderr = `
1) login flow should submit
Error: locator.click: Timeout 5000ms exceeded.
Expected: visible
Received: hidden
> tests/e2e/login.spec.ts:22:9
`;

    const failures = parsePlaywrightFailures('', stderr);

    expect(failures).toHaveLength(1);
    expect(failures[0]?.title).toBe('login flow should submit');
    expect(failures[0]?.message).toContain('locator.click');
    expect(failures[0]?.location).toBe('tests/e2e/login.spec.ts:22:9');
  });

  it('parses generic playwright timeout failures', () => {
    const stderr = `
Timeout of 30000ms exceeded.
at tests/e2e/dashboard.spec.ts:45:11
`;

    const failures = parsePlaywrightFailures('', stderr);

    expect(failures).toHaveLength(1);
    expect(failures[0]?.title).toBe('Playwright Timeout');
    expect(failures[0]?.location).toBe('tests/e2e/dashboard.spec.ts:45:11');
  });
});
