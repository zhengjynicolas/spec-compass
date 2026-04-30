import fs from 'node:fs';
import path from 'node:path';

import type { SpecCompassConfig } from '../core/types';
import { createPlaywrightConfigTemplate } from './template';

export function createPlaywrightTemplateFile(
  projectPath: string,
  appConfig: SpecCompassConfig,
): string {
  const outputPath = path.join(projectPath, 'playwright.speccompass.config.ts');
  fs.writeFileSync(outputPath, createPlaywrightConfigTemplate(appConfig), 'utf8');
  return outputPath;
}
