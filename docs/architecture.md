# Architecture

`SpecCompass` 是一个小内核工具，不是测试平台。

它只做两件事：

- `init`: 在宿主项目里生成统一测试骨架和 npm 脚本
- `run`: 读取配置、执行 Vitest 和 Playwright、写出报告与产物

## 执行链路

```text
CLI
  -> init / run
  -> loadConfig
  -> runVitest
  -> runPlaywright
  -> report
  -> output files
```

## 目录职责

### `src/packages/core`

主干逻辑：

- `cli.ts`: 命令入口
- `initProject.ts`: 初始化测试目录、配置和脚本
- `loadConfig.ts`: 读取 `tests/testing.config.*`
- `runTests.ts`: 串联 Vitest、Playwright 和结果输出
- `report.ts`: 生成文本报告
- `output.ts`: 写入文本和 JSON 结果
- `types.ts`: 公共类型

### `src/packages/vitest`

Vitest 适配层：

- 生成配置
- 执行 Vitest
- 优先读取 JSON 结果
- 回退到文本失败解析

### `src/packages/playwright`

Playwright 适配层：

- 生成配置
- 执行 Playwright
- 优先读取 JSON 结果
- 收集截图、trace、视频
- 把产物关联回失败

## 长期边界

适合继续稳定沉淀在代码里的：

- `init` 生成的目录和文件约定
- `run` 的执行流程
- 结果输出目录
- Playwright 产物收集
- 公共结果类型

不建议继续做重的方向：

- 平台化抽象
- 多层策略系统
- 过重的命令体系
