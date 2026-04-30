import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import type { SpecCompassConfig } from './types';

const DEFAULT_CONFIG_FILE_NAMES = [
  'tests/testing.config.ts',
  'tests/testing.config.mts',
  'tests/testing.config.cts',
  'tests/testing.config.js',
  'tests/testing.config.mjs',
  'tests/testing.config.cjs',
];

interface TypeScriptRuntime {
  ModuleKind: Record<string, number>;
  ScriptTarget: Record<string, number>;
  transpileModule: (
    source: string,
    options: {
      compilerOptions: Record<string, unknown>;
      fileName: string;
    },
  ) => { outputText: string };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function ensureConfig(value: unknown): SpecCompassConfig {
  if (!isObject(value)) {
    throw new Error('testing.config must export a default object.');
  }

  if (typeof value.name !== 'string' || value.name.trim() === '') {
    throw new Error('testing.config must provide a non-empty "name".');
  }

  return value as unknown as SpecCompassConfig;
}

function resolveConfigPath(projectPath: string): string {
  for (const relativePath of DEFAULT_CONFIG_FILE_NAMES) {
    const absolutePath = path.join(projectPath, relativePath);
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  throw new Error(
    `Unable to find testing config. Expected one of: ${DEFAULT_CONFIG_FILE_NAMES.join(', ')}`,
  );
}

async function loadJavaScriptConfig(configPath: string): Promise<unknown> {
  const module = (await import(pathToFileURL(configPath).href)) as { default?: unknown };
  return module.default ?? module;
}

async function loadTypeScriptRuntime(): Promise<TypeScriptRuntime | null> {
  try {
    const runtime = (await import('typescript')) as TypeScriptRuntime;
    return runtime;
  } catch {
    return null;
  }
}

async function loadTypeScriptConfig(configPath: string): Promise<unknown> {
  const typescript = await loadTypeScriptRuntime();

  if (!typescript) {
    throw new Error(
      'Found a TypeScript testing config, but the "typescript" package is not available at runtime.',
    );
  }

  const source = fs.readFileSync(configPath, 'utf8');
  const transpiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: configPath,
  });

  const localRequire = createRequire(configPath);
  const module = { exports: {} as Record<string, unknown> };
  const executor = new Function(
    'require',
    'module',
    'exports',
    '__filename',
    '__dirname',
    transpiled.outputText,
  ) as (
    require: NodeJS.Require,
    module: { exports: Record<string, unknown> },
    exports: Record<string, unknown>,
    __filename: string,
    __dirname: string,
  ) => void;

  executor(localRequire, module, module.exports, configPath, path.dirname(configPath));

  return module.exports.default ?? module.exports;
}

export async function loadConfig(projectPath: string): Promise<SpecCompassConfig> {
  const configPath = resolveConfigPath(projectPath);
  const extension = path.extname(configPath);
  const config =
    extension === '.ts' || extension === '.mts' || extension === '.cts'
      ? await loadTypeScriptConfig(configPath)
      : await loadJavaScriptConfig(configPath);

  return ensureConfig(config);
}
