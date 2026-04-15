import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  createVitestJsonReportPath,
  parseVitestJsonReportFile,
} from '../../src/packages/vitest/jsonReport';

describe('parseVitestJsonReportFile', () => {
  it('extracts failed assertions from vitest json reporter output', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-vitest-json-test-'));
    const reportPath = path.join(tempDir, 'report.json');

    fs.writeFileSync(
      reportPath,
      JSON.stringify({
        numFailedTests: 1,
        testResults: [
          {
            name: 'tests/unit/login.test.ts',
            status: 'failed',
            assertionResults: [
              {
                ancestorTitles: ['auth'],
                fullName: 'auth > login should reject invalid password',
                status: 'failed',
                title: 'login should reject invalid password',
                failureMessages: ['AssertionError: expected 200 to be 401'],
                location: {
                  line: 12,
                  column: 3,
                },
              },
            ],
          },
        ],
      }),
      'utf8',
    );

    const parsed = parseVitestJsonReportFile(reportPath);

    expect(parsed).not.toBeNull();
    expect(parsed?.failureDetails).toHaveLength(1);
    expect(parsed?.failureDetails[0]?.title).toBe(
      'auth > login should reject invalid password',
    );
    expect(parsed?.failureDetails[0]?.location).toBe(
      'tests/unit/login.test.ts:12:3',
    );
    expect(parsed?.failureDetails[0]?.message).toContain('expected 200 to be 401');

    fs.unlinkSync(reportPath);
    fs.rmdirSync(tempDir);
  });

  it('returns null when the report file is missing or invalid', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-vitest-json-missing-'));
    const missingPath = path.join(tempDir, 'missing.json');

    expect(parseVitestJsonReportFile(missingPath)).toBeNull();

    const invalidPath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(invalidPath, 'not-json', 'utf8');
    expect(parseVitestJsonReportFile(invalidPath)).toBeNull();

    fs.unlinkSync(invalidPath);
    fs.rmdirSync(tempDir);
  });
});

describe('createVitestJsonReportPath', () => {
  it('creates a temp-file path in the system temp directory', () => {
    const reportPath = createVitestJsonReportPath(process.cwd());

    expect(reportPath).toContain('speccompass-vitest-report-');
    expect(path.basename(reportPath)).toBe('vitest.report.json');
    expect(fs.existsSync(path.dirname(reportPath))).toBe(true);

    fs.rmdirSync(path.dirname(reportPath));
  });
});
