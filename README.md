# SpecCompass

`SpecCompass` 是一个很小的测试工具：用少量稳定代码统一 `Vitest + Playwright` 的初始化、执行、截图和结果输出。

## 项目定位

`SpecCompass` 主要解决 3 件事：

- 让任意项目都能快速接入一套统一的测试目录和默认配置
- 让任意项目都能用统一命令执行 `Vitest` 和 `Playwright`
- 让失败报告、截图、trace、视频等产物稳定落到固定目录

## 设计原则

- 小内核：只把所有项目都会重复用到的能力沉淀成代码
- 强约定：统一目录、统一配置名、统一结果输出
- 低侵入：优先生成默认文件和脚本，不强绑业务项目内部实现
- 简单直接：优先保持命令少、结构清楚、行为可预测

## 核心能力

- `init`: 初始化测试目录、默认配置和脚本
- `run`: 统一执行 `Vitest` 与 `Playwright`
- 结构化结果输出：文本报告 + JSON 报告
- Playwright 失败产物收集：截图、trace、视频

## 推荐工作流

```text
业务项目
  -> 接入 SpecCompass
  -> 执行 init
  -> 得到统一 tests 结构和默认配置
  -> 编写或补充测试代码
  -> 执行 run
  -> 查看 test-results 与 Playwright 截图产物
  -> 根据结果继续迭代
```

## 当前结构

```text
src/
  cli/
  packages/
    core/
    vitest/
    playwright/
examples/
docs/
```

从维护角度看，长期应把仓库重心放在 `core`、`vitest`、`playwright` 这几个稳定模块上。

## 安装与接入

推荐作为开发依赖安装到业务项目：

```bash
npm install -D spec-compass vitest playwright
npx speccompass init
npm run test:auto
```

宿主项目需要自己安装 `vitest` 和 `playwright`。`SpecCompass` 会调用宿主项目里的测试命令，不会把这两个框架作为发布依赖一起带进去。

第一次执行 `init` 后，会自动创建：

- `tests/testing.config.ts`
- `tests/unit`
- `tests/e2e`
- `vitest.speccompass.config.ts`
- `playwright.speccompass.config.ts`
- `package.json` 里的 `test:auto*` 脚本

更完整的接入说明见 [docs/guide.md](docs/guide.md)。

## 常用命令

```bash
npx speccompass init
npx speccompass run
```

如果你已经在 `package.json` 里使用了 `init` 自动写入的脚本，也可以直接执行：

```bash
npm run test:auto
npm run test:auto:init
```

## 默认配置

`init` 生成的 `tests/testing.config.ts` 默认包含：

```ts
export default {
  name: 'your-project-name',
  baseURL: 'http://localhost:3000',
  vitest: {
    include: ['tests/unit/**/*.test.ts'],
  },
  playwright: {
    testDir: 'tests/e2e',
    headless: true,
    trace: 'on-first-retry',
  },
  artifacts: {
    outputDir: '.speccompass/artifacts',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  results: {
    outputDir: 'test-results',
  },
};
```

完整示例见 [examples/project-a/tests/testing.config.ts](examples/project-a/tests/testing.config.ts)。

## 结果与产物

每次执行后的文本报告和 JSON 报告会默认写入接入项目根目录的 `test-results/`：

- `test-results/speccompass-report.txt`
- `test-results/speccompass-report.json`

如果 Playwright 运行中生成了截图、trace 或视频，默认会落到：

- `.speccompass/artifacts/`

这些路径的重点是让测试结果和页面产物始终落在固定位置，便于排查和迭代。

## 对维护者的建议

如果你要继续迭代这个仓库，建议优先投入在：

- 初始化模板质量
- 测试运行稳定性
- Playwright 产物收集和失败关联
- 接入项目时的默认体验

建议谨慎扩展的方向：

- 大而全的测试平台抽象
- 过重的 provider / orchestrator 设计

## 本仓库开发

如果你是在 `SpecCompass` 仓库自身里开发：

```bash
npm install
npm run build
npm test
node dist/cli/index.js run --project examples/project-a
```

CLI 只有两个有效命令：

- `init`
- `run`

未知命令会直接报错，不会再静默回退成 `run`。

## 文档

- [docs/guide.md](docs/guide.md): 接入与使用说明
- [docs/npm-development.md](docs/npm-development.md): npm 本地联调与发包说明
- [docs/architecture.md](docs/architecture.md): 小内核架构说明
- [docs/api.md](docs/api.md): 代码接口说明

## 许可证

本项目采用 [MIT License](LICENSE)。
