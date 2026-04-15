import { describe, expect, it, vi, afterEach } from 'vitest';

import { runCLI } from '../../src/packages/core/cli';

const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

afterEach(() => {
  process.stdout.write = originalStdoutWrite;
  process.stderr.write = originalStderrWrite;
  process.exitCode = undefined;
});

describe('runCLI', () => {
  it('reports unknown commands instead of silently running tests', async () => {
    let stderr = '';

    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderr += chunk.toString();
      return true;
    }) as typeof process.stderr.write;

    process.stdout.write = (() => true) as typeof process.stdout.write;

    await runCLI(['nope']);

    expect(stderr).toContain('Unknown command: nope');
    expect(process.exitCode).toBe(1);
  });
});
