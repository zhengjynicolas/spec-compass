import fs from 'node:fs';
import path from 'node:path';

import type { ArtifactFile, FailureDetail } from '../core/types';

function classifyArtifact(filePath: string): ArtifactFile['type'] {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.png' || extension === '.jpg' || extension === '.jpeg' || extension === '.webp') {
    return 'screenshot';
  }

  if (extension === '.zip') {
    return 'trace';
  }

  if (extension === '.webm' || extension === '.mp4' || extension === '.mov') {
    return 'video';
  }

  return 'other';
}

function walk(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

export function collectPlaywrightArtifacts(projectPath: string, outputDir?: string): ArtifactFile[] {
  const resolvedOutputDir = path.resolve(projectPath, outputDir ?? '.speccompass/artifacts');

  if (!fs.existsSync(resolvedOutputDir)) {
    return [];
  }

  return walk(resolvedOutputDir).map((filePath) => ({
    type: classifyArtifact(filePath),
    path: filePath,
  }));
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForMatch(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function basenameWithoutExt(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

function collectFailureHints(failure: FailureDetail): string[] {
  const titleTokens = tokenize(failure.title);
  const messageTokens = tokenize(failure.message).slice(0, 8);
  const locationTokens = failure.location ? tokenize(path.basename(failure.location)) : [];
  return [...new Set([...titleTokens, ...locationTokens, ...messageTokens])];
}

function artifactSearchText(artifact: ArtifactFile): string {
  return normalizeForMatch(`${artifact.path} ${basenameWithoutExt(artifact.path)}`);
}

function scoreArtifactForFailure(failure: FailureDetail, artifact: ArtifactFile): number {
  const searchText = artifactSearchText(artifact);
  const hints = collectFailureHints(failure);
  let score = 0;

  for (const hint of hints) {
    if (searchText.includes(hint)) {
      score += hint.length >= 6 ? 2 : 1;
    }
  }

  if (failure.location) {
    const locationBaseName = normalizeForMatch(path.basename(failure.location));
    if (locationBaseName && searchText.includes(locationBaseName)) {
      score += 3;
    }
  }

  if (artifact.type === 'trace') {
    score += 1;
  }

  return score;
}

export function attachArtifactsToFailures(
  failures: FailureDetail[],
  artifacts: ArtifactFile[],
): FailureDetail[] {
  if (failures.length === 0 || artifacts.length === 0) {
    return failures;
  }

  if (failures.length === 1) {
    return [
      {
        ...failures[0],
        relatedArtifacts: artifacts,
      },
    ];
  }

  return failures.map((failure) => {
    const matchedArtifacts = artifacts.filter((artifact) => scoreArtifactForFailure(failure, artifact) > 0);
    return {
      ...failure,
      relatedArtifacts: matchedArtifacts,
    };
  });
}
