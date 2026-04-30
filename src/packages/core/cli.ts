import path from 'node:path';

import { initializeProject } from './initProject';
import { formatRunReport } from './report';
import { runTests } from './runTests';

type CLICommand = 'run' | 'init';

function parseCommand(value: string | undefined): CLICommand | null {
  if (value === undefined || value === 'run' || value.startsWith('--')) {
    return 'run';
  }

  if (value === 'init') {
    return value;
  }

  return null;
}

function parseProjectPath(args: string[]): string {
  const projectFlagIndex = args.findIndex((arg) => arg === '--project');
  if (projectFlagIndex >= 0 && args[projectFlagIndex + 1]) {
    return path.resolve(args[projectFlagIndex + 1]);
  }

  return process.cwd();
}

export async function runCLI(argv: string[]): Promise<void> {
  const command = parseCommand(argv[0]);
  const projectPath = parseProjectPath(argv);

  if (command === null) {
    process.stderr.write(`Unknown command: ${argv[0]}. Supported commands: init, run.\n`);
    process.exitCode = 1;
    return;
  }

  if (command === 'init') {
    const result = initializeProject(projectPath);
    process.stdout.write(
      [
        `Initialized speccompass in: ${result.projectPath}`,
        `Created directories: ${result.createdDirectories.length > 0 ? result.createdDirectories.join(', ') : 'none'}`,
        `Created files: ${result.createdFiles.length > 0 ? result.createdFiles.join(', ') : 'none'}`,
        `Updated files: ${result.updatedFiles.length > 0 ? result.updatedFiles.join(', ') : 'none'}`,
        `Skipped existing: ${result.skippedFiles.length > 0 ? result.skippedFiles.join(', ') : 'none'}`,
        'Agent workflow: keep .codex/skills/speccompass-workflow/SKILL.md and AGENTS.md in the host project so future agents can read the same SpecCompass workflow.',
      ].join('\n') + '\n',
    );
    return;
  }

  const result = await runTests(projectPath);

  process.stdout.write(`${formatRunReport(result)}\n`);
  process.stdout.write(`Result files saved under: ${result.output.outputDir}\n`);

  if (result.hasFailures) {
    process.exitCode = 1;
  }
}
