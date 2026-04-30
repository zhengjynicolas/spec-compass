import os from 'node:os';
import path from 'node:path';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pathVariants(value: string): string[] {
  const resolved = path.resolve(value);
  return Array.from(new Set([resolved, resolved.split(path.sep).join('/')])).sort(
    (a, b) => b.length - a.length,
  );
}

function redactString(value: string, projectPath: string): string {
  let redacted = value;
  const replacements = [
    { marker: '<project>', values: pathVariants(projectPath) },
    { marker: '<temp>', values: pathVariants(os.tmpdir()) },
  ];

  for (const replacement of replacements) {
    for (const target of replacement.values) {
      redacted = redacted.replace(new RegExp(escapeRegExp(target), 'g'), replacement.marker);
    }
  }

  return redacted;
}

export function redactLocalPaths<T>(value: T, projectPath: string): T {
  if (typeof value === 'string') {
    return redactString(value, projectPath) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactLocalPaths(item, projectPath)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactLocalPaths(item, projectPath)]),
    ) as T;
  }

  return value;
}
