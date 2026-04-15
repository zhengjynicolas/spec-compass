import type { FailureDetail, SuiteMetrics, TestSuiteResult } from './types';

function uniqueFailures(failures: FailureDetail[]): FailureDetail[] {
  const seen = new Set<string>();
  return failures.filter((failure) => {
    const key = `${failure.suite}|${failure.title}|${failure.location ?? ''}|${failure.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function trimMessageBlock(value: string): string {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ')
    .trim();
}

function isDividerLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '' || /^[-=]{3,}$/.test(trimmed);
}

function isLocationLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^at\s+/.test(trimmed) ||
    /:\d+:\d+$/.test(trimmed) ||
    /^[\w./\\-]+:\d+:\d+$/.test(trimmed) ||
    /›/.test(trimmed)
  );
}

function cleanLocation(line: string): string {
  return line.trim().replace(/^\bat\s+/, '').replace(/^>\s+/, '');
}

function createFailure(
  suite: 'vitest' | 'playwright',
  title: string,
  messageLines: string[],
  location?: string,
): FailureDetail {
  return {
    suite,
    title: title.trim(),
    location: location ? cleanLocation(location) : undefined,
    message: trimMessageBlock(messageLines.join('\n')),
    relatedArtifacts: [],
  };
}

function collectIndentedBlock(lines: string[], startIndex: number): { block: string[]; nextIndex: number } {
  const block: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const current = lines[index] ?? '';
    const trimmed = current.trim();
    if (block.length > 0 && (isDividerLine(current) || /^(\d+\)|FAIL\b|Error:|×|✘)/.test(trimmed))) {
      break;
    }

    if (trimmed.length === 0 && block.length === 0) {
      index += 1;
      continue;
    }

    if (trimmed.length === 0 && block.length > 0) {
      break;
    }

    block.push(current);
    index += 1;
  }

  return { block, nextIndex: index };
}

export function parseVitestFailures(stdout: string, stderr: string): FailureDetail[] {
  const text = `${stdout}\n${stderr}`;
  const lines = text.split('\n');
  const failures: FailureDetail[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? '';
    const failLineMatch = line.match(/^FAIL\s+(.+)$/i);
    const errorLineMatch = line.match(/^Error:\s*(.+)$/i);
    const testCaseMatch = line.match(/^[×✘]\s+(.+)$/);

    if (!failLineMatch && !errorLineMatch && !testCaseMatch) {
      continue;
    }

    const title = failLineMatch?.[1] ?? errorLineMatch?.[1] ?? testCaseMatch?.[1] ?? 'Vitest Failure';
    const { block, nextIndex } = collectIndentedBlock(lines, index + 1);
    const locationLine = block.find((candidate) => isLocationLine(candidate));
    const messageLines = [line, ...block.filter((candidate) => candidate.trim() !== locationLine?.trim())];
    failures.push(createFailure('vitest', title, messageLines, locationLine));
    index = nextIndex - 1;
  }

  return uniqueFailures(failures);
}

export function parsePlaywrightFailures(stdout: string, stderr: string): FailureDetail[] {
  const text = `${stdout}\n${stderr}`;
  const lines = text.split('\n');
  const failures: FailureDetail[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.trim();
    const numberedTestMatch = line.match(/^\d+\)\s+(.+)$/);
    const failedTestMatch = line.match(/^[×✘]\s+(.+)$/);
    const bracketedTestMatch = line.match(/^(\d+\)\s+)?(.+?)\s+\[.*\]$/);
    const errorMatch = line.match(/^Error:\s*(.+)$/);
    const timeoutMatch = line.match(/^(Timeout of .+ exceeded\.)$/);
    const locationMatch = line.match(/^>\s+(.+:\d+:\d+)$/);

    if (errorMatch || timeoutMatch) {
      const title = errorMatch ? 'Playwright Error' : 'Playwright Timeout';
      const message = errorMatch?.[1] ?? timeoutMatch?.[1] ?? 'Unknown Playwright error';
      const { block, nextIndex } = collectIndentedBlock(lines, index + 1);
      const inlineLocation = block.find((candidate) => isLocationLine(candidate));
      failures.push(createFailure('playwright', title, [message, ...block], inlineLocation));
      index = nextIndex - 1;
      continue;
    }

    if (locationMatch && failures.length > 0) {
      const previous = failures[failures.length - 1];
      if (!previous.location) {
        previous.location = cleanLocation(locationMatch[1]);
      }
      continue;
    }

    const title =
      failedTestMatch?.[1] ?? bracketedTestMatch?.[2] ?? numberedTestMatch?.[1] ?? null;

    if (!title) {
      continue;
    }

    const { block, nextIndex } = collectIndentedBlock(lines, index + 1);
    const locationLine = block.find((candidate) => isLocationLine(candidate));
    const hasFailureSignal = block.some((candidate) => {
      const trimmed = candidate.trim();
      return (
        /^Error:/.test(trimmed) ||
        /^Expected:/.test(trimmed) ||
        /^Received:/.test(trimmed) ||
        /^Timeout/.test(trimmed) ||
        /locator\./.test(trimmed)
      );
    });

    if (!hasFailureSignal) {
      continue;
    }

    failures.push(
      createFailure(
        'playwright',
        title.trim(),
        [line, ...block.filter((candidate) => candidate.trim() !== locationLine?.trim())],
        locationLine,
      ),
    );
    index = nextIndex - 1;
  }

  return uniqueFailures(failures);
}

export function deriveSuiteMetrics(
  result: Pick<TestSuiteResult, 'failureDetails' | 'stderr' | 'stdout'>,
): SuiteMetrics {
  const warningMatches = `${result.stdout}\n${result.stderr}`.match(/\bwarn(ing)?\b/gi);
  return {
    failureCount: result.failureDetails.length,
    warningCount: warningMatches ? warningMatches.length : 0,
  };
}
