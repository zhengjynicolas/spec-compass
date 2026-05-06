---
name: speccompass-workflow
description: Use this skill when working in a project that uses SpecCompass to initialize a shared Vitest + Playwright test workspace, generate or update user-journey E2E tests, run them through the speccompass CLI, and iterate from reports and Playwright artifacts. Trigger when the task is to add tests, repair tests, standardize test structure, simulate real user operations, or use SpecCompass's init/run workflow in a host project.
---

# SpecCompass Workflow

Use this skill when the repo or host project uses `SpecCompass` as the test kernel.

## Goal

Treat `SpecCompass` as a small execution kernel:

- `init` creates the standard test workspace
- `run` executes Vitest and Playwright
- coverage, reports, and Playwright artifacts become the feedback loop for further edits

Do not treat this repo as a general testing platform. Prefer simple workflows and minimal abstraction.

## Agent Source of Truth

This `SKILL.md` is the agent-facing workflow copied into host projects by `speccompass init`.

- Treat this file as the primary guide for generating and running tests
- Treat `docs/` as human-facing background, not required agent context
- Keep user-operation E2E decisions in this file so installed projects remain self-contained

## Default Workflow

1. Inspect the host project structure and existing tests.
2. Make sure the host project has `vitest` and `@playwright/test` installed.
3. If the project is not initialized, run `speccompass init`.
4. Read `tests/testing.config.*` and respect the existing paths and conventions.
5. Generate or update tests under:
   - `tests/unit/`
   - `tests/e2e/`
6. Run `speccompass run`.
7. Read:
   - `test-results/speccompass-report.txt`
   - `test-results/speccompass-report.json`
   - `coverage/coverage-summary.json`
   - `coverage/index.html`
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

- `.codex/skills/speccompass-workflow/SKILL.md`
- `tests/testing.config.ts`
- `tests/unit/`
- `tests/e2e/`
- `vitest.speccompass.config.ts`
- `playwright.speccompass.config.ts`
- `AGENTS.md` with a SpecCompass workflow pointer

Also expect package scripts:

- `test:auto`
- `test:auto:init`

## What `run` Guarantees

`run` should:

- load the project config
- run Vitest
- run Playwright
- write text and JSON reports to `test-results/`
- write Vitest coverage reports to `coverage/`
- collect Playwright artifacts when present

Use those outputs as the source of truth for follow-up edits.

## Test Authoring Guidance

- Put logic and module tests in `tests/unit/`
- Put browser and page-flow tests in `tests/e2e/`
- Prefer small, readable tests over large generated suites
- Reuse the project's existing naming and assertion style
- When adding Playwright tests, favor flows that benefit from screenshots and traces
- If a project already has native test setup, adapt to it instead of duplicating structure

## Testing Layer Decision

Choose the test layer by user-observable risk:

- Use `@playwright/test` in `tests/e2e/` when the task needs real browser automation, screenshots, videos, traces, navigation, auth state, or cross-page flows
- Use `vitest` + `jsdom` + Testing Library in `tests/unit/` when the task needs fast component/DOM feedback such as validation, disabled states, dialogs, keyboard behavior, or error text
- Pair both layers for important behavior: small jsdom tests catch detailed UI states, one Playwright journey proves the real browser path
- Do not stretch jsdom into fake E2E; it cannot prove real rendering, routing, browser input, screenshots, videos, or traces
- Do not use Playwright for every tiny component branch if a faster jsdom test gives the same confidence

## E2E User Journey Guidance

Write E2E tests as user tasks, not implementation scripts.

- Use `@playwright/test` for browser automation, screenshots, videos, traces, navigation, and real input
- Pair `jsdom` and Testing Library with Playwright when the project needs fast unit/component interaction tests before slower E2E checks
- Do not use `jsdom` as an E2E substitute; it complements Playwright but cannot provide screenshots, videos, traces, navigation, or real browser input
- Start each spec from a real user goal: sign in, create an item, checkout, search, recover a password
- Use Playwright locators that match what users perceive: `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByAltText`
- Prefer `await expect(locator).toBeVisible()` and URL/state assertions over arbitrary sleeps
- Avoid `waitForTimeout`, brittle CSS/XPath selectors, `{ force: true }`, and direct DOM mutation unless there is no user-facing alternative
- Seed prerequisite data through public APIs, fixtures, or test helpers before the UI flow; do not click through unrelated setup screens
- Keep mocks at system boundaries such as third-party payment, email, maps, or analytics; do not mock the app behavior that the journey is meant to verify
- Label long flows with `test.step` so reports and traces read like a user story
- Assert the final user-visible outcome and leave screenshot/trace/video artifacts to explain failures

Useful optional host-project libraries:

- `@faker-js/faker`: realistic names, emails, addresses, product data
- `msw`: API boundary mocking when external services make the journey unstable
- `@axe-core/playwright`: accessibility checks for important pages and flows
- `start-server-and-test`: start the app, wait for readiness, then run `speccompass run`
- `jsdom` + `@testing-library/dom` or `@testing-library/react` + `@testing-library/user-event`: optional fast DOM/component interaction layer that complements Playwright E2E
- `playwright-bdd` or `@cucumber/cucumber`: only when the team wants plain-language scenarios
- `@percy/playwright`: visual regression for screenshot-sensitive flows

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
