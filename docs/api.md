# API

这份文档只记录当前稳定、值得依赖的入口。

## CLI

只支持两个命令：

- `init`
- `run`

空命令等同于 `run`。未知命令会直接报错。

宿主项目常用命令：

先安装：

```bash
npm install -D spec-compass vitest playwright
```

再执行：

```bash
npx speccompass init
npx speccompass run
```

前提：

- 宿主项目已安装 `vitest`
- 宿主项目已安装 `playwright`

## 核心入口

### `runCLI(argv: string[]): Promise<void>`

位置: [src/packages/core/cli.ts](../src/packages/core/cli.ts)

CLI 总入口。负责：

- 解析 `init` / `run`
- 解析 `--project <path>`
- 执行初始化或测试主流程

### `initializeProject(projectPath: string): InitProjectResult`

位置: [src/packages/core/initProject.ts](../src/packages/core/initProject.ts)

初始化宿主项目，生成：

- `tests/testing.config.ts`
- `tests/unit/`
- `tests/e2e/`
- `.codex/skills/speccompass-workflow/SKILL.md`
- `AGENTS.md` 中的 SpecCompass 工作流提示
- `vitest.speccompass.config.ts`
- `playwright.speccompass.config.ts`
- `package.json` 里的 `test:auto` / `test:auto:init`

### `runTests(projectPath: string): Promise<RunTestsResult>`

位置: [src/packages/core/runTests.ts](../src/packages/core/runTests.ts)

执行主流程：

1. 读取项目配置
2. 运行 Vitest
3. 运行 Playwright
4. 生成覆盖率、文本报告和 JSON 报告

### `loadConfig(projectPath: string): Promise<SpecCompassConfig>`

位置: [src/packages/core/loadConfig.ts](../src/packages/core/loadConfig.ts)

默认读取以下任一文件：

- `tests/testing.config.ts`
- `tests/testing.config.mts`
- `tests/testing.config.cts`
- `tests/testing.config.js`
- `tests/testing.config.mjs`
- `tests/testing.config.cjs`

## 输出

默认输出目录：

- `test-results/speccompass-report.txt`
- `test-results/speccompass-report.json`

Vitest 覆盖率默认输出到：

- `coverage/index.html`
- `coverage/coverage-summary.json`

Playwright 产物默认输出到：

- `.speccompass/artifacts/`

## 关键类型

位置: [src/packages/core/types.ts](../src/packages/core/types.ts)

最重要的类型：

- `SpecCompassConfig`
- `RunTestsResult`
- `TestSuiteResult`
- `FailureDetail`
- `ArtifactFile`

## 运行行为

- Vitest 和 Playwright 都优先走 JSON 结果解析
- JSON 不可用时，才回退到文本失败解析
- Playwright 产物会尽量关联回失败详情
