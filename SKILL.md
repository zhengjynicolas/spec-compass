---
name: speccompass-workflow
description: Use this skill when working in a project that uses SpecCompass to initialize a shared Vitest + Playwright test workspace, generate or update tests, run them through the speccompass CLI, and iterate from reports and Playwright artifacts. Trigger when the task is to add tests, repair tests, standardize test structure, or use SpecCompass's init/run workflow in a host project.
---

# SpecCompass Workflow

Use this skill when the repo or host project uses `SpecCompass` as the test kernel.

## Goal

Treat `SpecCompass` as a small execution kernel:

- `init` creates the standard test workspace
- `run` executes Vitest and Playwright
- reports and Playwright artifacts become the feedback loop for further edits

Do not treat this repo as a general testing platform. Prefer simple workflows and minimal abstraction.

## Default Workflow

1. Inspect the host project structure and existing tests.
2. Make sure the host project has `vitest` and `playwright` installed.
3. If the project is not initialized, run `speccompass init`.
4. Read `tests/testing.config.*` and respect the existing paths and conventions.
5. Generate or update tests under:
   - `tests/unit/`
   - `tests/e2e/`
6. Run `speccompass run`.
7. Read:
   - `test-results/speccompass-report.txt`
   - `test-results/speccompass-report.json`
   - `.speccompass/artifacts/` when Playwright failures produce screenshots, traces, or video
8. Iterate until tests are stable or you hit a real blocker.

## Commands

Use these commands as the main interface:

```bash
npx speccompass init
npx speccompass run
```

Inside the `SpecCompass` repo itself, use:

```bash
node dist/cli/index.js init --project <target-project>
node dist/cli/index.js run --project <target-project>
```

## What `init` Guarantees

After `init`, expect these files and directories:

- `tests/testing.config.ts`
- `tests/unit/`
- `tests/e2e/`
- `vitest.speccompass.config.ts`
- `playwright.speccompass.config.ts`

Also expect package scripts:

- `test:auto`
- `test:auto:init`

## What `run` Guarantees

`run` should:

- load the project config
- run Vitest
- run Playwright
- write text and JSON reports to `test-results/`
- collect Playwright artifacts when present

Use those outputs as the source of truth for follow-up edits.

## Test Authoring Guidance

- Put logic and module tests in `tests/unit/`
- Put browser and page-flow tests in `tests/e2e/`
- Prefer small, readable tests over large generated suites
- Reuse the project's existing naming and assertion style
- When adding Playwright tests, favor flows that benefit from screenshots and traces
- If a project already has native test setup, adapt to it instead of duplicating structure

## Editing Rules

- Keep changes inside the host project's existing conventions
- Prefer extending current tests over replacing them wholesale
- Do not invent extra command layers around `init` and `run`
- Do not add AI orchestration modules to this repo; keep intelligence in the skill workflow

## Failure Loop

When `run` fails:

1. Read the JSON report first for structured failures.
2. Read the text report for quick summary and command context.
3. If Playwright failed, inspect artifact paths and use screenshots/traces when useful.
4. Fix the smallest likely cause.
5. Re-run `run`.

## Success Criteria

The task is complete when:

- the project is initialized if needed
- tests are present in the standard directories
- `run` completes cleanly, or remaining failures are clearly explained
- reports and artifacts are left in their standard locations
