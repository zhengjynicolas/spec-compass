# Agent Instructions

<!-- speccompass:start -->
## SpecCompass Testing Workflow

This project uses SpecCompass for automated testing. When adding, repairing, or running tests:

- Read `.codex/skills/speccompass-workflow/SKILL.md` first if it exists.
- Use `npm run test:auto:init` to initialize or refresh the test workspace.
- Use `npm run test:auto` or `npx speccompass run` to execute tests.
- Put unit tests under `tests/unit/` and user-journey E2E tests under `tests/e2e/`.
- Write Playwright flows as real user tasks with role/label/text locators and user-visible assertions.
- Use `test-results/speccompass-report.json`, `coverage/coverage-summary.json`, and `.speccompass/artifacts/` as feedback for follow-up edits.

<!-- speccompass:end -->
