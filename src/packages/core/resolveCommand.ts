import fs from 'node:fs';
import path from 'node:path';

import type { ResolvedCommand } from './types';

interface ResolveCommandOptions {
  cwd: string;
  explicitCommand?: string;
  localBinaryName: string;
  packageManagerPackage: string;
}

function canUseDirectPath(command: string): boolean {
  return command.includes('/') || command.includes('\\');
}

function resolveLocalBin(cwd: string, binaryName: string): string | null {
  const candidate = path.join(cwd, 'node_modules', '.bin', binaryName);
  return fs.existsSync(candidate) ? candidate : null;
}

export function resolveCommand(options: ResolveCommandOptions): ResolvedCommand {
  if (options.explicitCommand) {
    return {
      command: options.explicitCommand,
      args: [],
      resolution: canUseDirectPath(options.explicitCommand) ? 'local-bin' : 'explicit',
    };
  }

  const localBinary = resolveLocalBin(options.cwd, options.localBinaryName);
  if (localBinary) {
    return {
      command: localBinary,
      args: [],
      resolution: 'local-bin',
    };
  }

  return {
    command: 'npx',
    args: [options.packageManagerPackage],
    resolution: 'package-manager',
  };
}
