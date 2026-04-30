import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { runVitest } from '../../src/packages/vitest/runVitest';

describe('runVitest', () => {
  it('enables coverage by default', async () => {
    const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-vitest-run-'));
    const result = await runVitest(projectPath, {
      name: 'coverage-project',
      vitest: {
        command: 'echo',
        include: ['tests/unit/**/*.test.ts'],
        passWithNoTests: true,
      },
    });

    expect(result.args).toContain('--coverage');
    expect(result.args).toContain('--coverage.provider=v8');
    expect(result.args).toContain('--coverage.reportsDirectory=coverage');
    expect(result.args).toContain('--coverage.clean=true');
    expect(result.args).toContain('--coverage.reporter=html');
    expect(result.coverage).toEqual({
      enabled: true,
      reportsDirectory: 'coverage',
      htmlReportPath: path.join('coverage', 'index.html'),
      summaryPath: path.join('coverage', 'coverage-summary.json'),
    });

    fs.rmSync(projectPath, { recursive: true, force: true });
  });

  it('allows coverage to be disabled explicitly', async () => {
    const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-vitest-run-'));
    const result = await runVitest(projectPath, {
      name: 'coverage-project',
      vitest: {
        command: 'echo',
        include: ['tests/unit/**/*.test.ts'],
      },
      coverage: {
        enabled: false,
      },
    });

    expect(result.args).not.toContain('--coverage');
    expect(result.coverage?.enabled).toBe(false);

    fs.rmSync(projectPath, { recursive: true, force: true });
  });
});
