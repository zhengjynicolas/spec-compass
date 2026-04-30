import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { createEmptyResultOutput } from '../../src/packages/core/output';

describe('createEmptyResultOutput', () => {
  it('reports default result files relative to the project', () => {
    const projectPath = path.join(process.cwd(), 'examples/project-a');

    expect(createEmptyResultOutput(projectPath, { name: 'project-a' })).toEqual({
      outputDir: 'test-results',
      textReportPath: path.join('test-results', 'speccompass-report.txt'),
      jsonReportPath: path.join('test-results', 'speccompass-report.json'),
    });
  });
});
