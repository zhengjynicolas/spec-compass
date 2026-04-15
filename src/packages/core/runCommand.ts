import { spawn } from 'node:child_process';

import type { CommandExecutionResult } from './types';

export interface RunCommandOptions {
  cwd: string;
  command: string;
  args?: string[];
  env?: Record<string, string | undefined>;
  summary: string;
  missingCommandSummary: string;
}

function isMissingCommandError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string };
  return maybeError.code === 'ENOENT';
}

export async function runCommand(options: RunCommandOptions): Promise<CommandExecutionResult> {
  const startTime = Date.now();
  const args = options.args ?? [];
  const child = spawn(options.command, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  let spawnError: unknown;

  child.stdout?.on('data', (chunk: Buffer | string) => {
    stdout += chunk.toString();
  });

  child.stderr?.on('data', (chunk: Buffer | string) => {
    stderr += chunk.toString();
  });

  child.on('error', (error: unknown) => {
    spawnError = error;
  });

  const exitCode = await new Promise<number | null>((resolve) => {
    child.on('close', (code: number | null) => {
      resolve(code);
    });

    child.on('error', () => {
      resolve(null);
    });
  });

  if (spawnError && isMissingCommandError(spawnError)) {
    return {
      status: 'skipped',
      command: options.command,
      args,
      exitCode,
      stdout,
      stderr,
      summary: options.missingCommandSummary,
      durationMs: Date.now() - startTime,
    };
  }

  return {
    status: exitCode === 0 ? 'passed' : 'failed',
    command: options.command,
    args,
    exitCode,
    stdout,
    stderr,
    summary: options.summary,
    durationMs: Date.now() - startTime,
  };
}
