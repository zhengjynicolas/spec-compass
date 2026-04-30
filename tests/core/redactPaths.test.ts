import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { redactLocalPaths } from '../../src/packages/core/redactPaths';

describe('redactLocalPaths', () => {
  it('redacts project and temp paths from nested report data', () => {
    const projectPath = path.join(os.tmpdir(), 'speccompass-project');
    const result = redactLocalPaths(
      {
        command: path.join(projectPath, 'node_modules/.bin/vitest'),
        args: [path.join(os.tmpdir(), 'speccompass-vitest/config.ts')],
        nested: {
          stdout: `config ${path.join(projectPath, 'tests/testing.config.ts')}`,
        },
      },
      projectPath,
    );

    expect(result.command).toBe('<project>/node_modules/.bin/vitest');
    expect(result.args[0]).toContain('<temp>/speccompass-vitest/config.ts');
    expect(result.nested.stdout).toBe('config <project>/tests/testing.config.ts');
  });
});
