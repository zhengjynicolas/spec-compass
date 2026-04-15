import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { initializeProject } from '../../src/packages/core/initProject';

describe('initializeProject', () => {
  it('creates test directories, config files, and package scripts for a host project', () => {
    const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-init-project-'));
    const packageJsonPath = path.join(projectPath, 'package.json');

    fs.writeFileSync(
      packageJsonPath,
      `${JSON.stringify({ name: 'resultprocessing', private: true, scripts: {} }, null, 2)}\n`,
      'utf8',
    );

    const result = initializeProject(projectPath);

    expect(fs.existsSync(path.join(projectPath, 'tests/testing.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'vitest.speccompass.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'playwright.speccompass.config.ts'))).toBe(true);
    expect(result.createdDirectories).toEqual(
      expect.arrayContaining([
        path.join(projectPath, 'tests'),
        path.join(projectPath, 'tests/unit'),
        path.join(projectPath, 'tests/e2e'),
      ]),
    );

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts['test:auto']).toBe('speccompass run');
    expect(packageJson.scripts['test:auto:init']).toBe('speccompass init');

    fs.rmSync(projectPath, { recursive: true, force: true });
  });
});
