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
    expect(
      fs.existsSync(path.join(projectPath, '.codex/skills/speccompass-workflow/SKILL.md')),
    ).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'AGENTS.md'))).toBe(true);
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

    const testingConfig = fs.readFileSync(path.join(projectPath, 'tests/testing.config.ts'), 'utf8');
    expect(testingConfig).toContain('coverage: {');
    expect(testingConfig).toContain("reportsDirectory: 'coverage'");

    const agentsInstructions = fs.readFileSync(path.join(projectPath, 'AGENTS.md'), 'utf8');
    expect(agentsInstructions).toContain('.codex/skills/speccompass-workflow/SKILL.md');
    expect(agentsInstructions).toContain('npm run test:auto');
    expect(agentsInstructions).toContain('real user tasks');

    fs.rmSync(projectPath, { recursive: true, force: true });
  });

  it('refreshes managed agent workflow files on repeated init', () => {
    const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'speccompass-init-refresh-'));
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      `${JSON.stringify({ name: 'refresh-project', private: true, scripts: {} }, null, 2)}\n`,
      'utf8',
    );

    initializeProject(projectPath);

    const skillPath = path.join(projectPath, '.codex/skills/speccompass-workflow/SKILL.md');
    const agentsPath = path.join(projectPath, 'AGENTS.md');
    fs.writeFileSync(skillPath, 'old skill\n', 'utf8');
    fs.writeFileSync(
      agentsPath,
      [
        '# Agent Instructions',
        '',
        '<!-- speccompass:start -->',
        'old section',
        '<!-- speccompass:end -->',
        '',
      ].join('\n'),
      'utf8',
    );

    const result = initializeProject(projectPath);

    expect(fs.readFileSync(skillPath, 'utf8')).toContain('E2E User Journey Guidance');
    expect(fs.readFileSync(agentsPath, 'utf8')).toContain('real user tasks');
    expect(result.updatedFiles).toEqual(expect.arrayContaining([skillPath, agentsPath]));

    fs.rmSync(projectPath, { recursive: true, force: true });
  });
});
