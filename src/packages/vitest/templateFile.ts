import fs from 'node:fs';
import path from 'node:path';

import type { TestingPlatformConfig } from '../core/types';
import { createVitestConfigTemplate } from './template';

export function createVitestTemplateFile(
  projectPath: string,
  appConfig: TestingPlatformConfig,
): string {
  const outputPath = path.join(projectPath, 'vitest.speccompass.config.ts');
  fs.writeFileSync(outputPath, createVitestConfigTemplate(appConfig), 'utf8');
  return outputPath;
}
