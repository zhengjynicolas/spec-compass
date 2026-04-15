# Changelog

## 0.1.0

- 初始化 `auto-test` TypeScript 模块化仓库
- 添加 CLI、配置加载、测试执行器和 AI Agent 骨架
- 添加开源仓库基础文档与示例项目
- 添加 Vitest / Playwright 模板生成与 `generate:configs` 命令
- 添加失败明细解析、指标统计和结构化测试报告
- 增强 Vitest / Playwright 常见输出格式的失败块解析能力
- 添加 Playwright 页面测试产物配置与截图 / trace / 视频收集能力
- 添加测试结果自动输出到接入项目目录的能力，默认写入 `test-results/`
- 添加 Playwright 失败详情与截图 / trace / 视频的关联能力
- Playwright 优先使用 JSON reporter 解析结构化失败结果，减少对文本解析的依赖
- Vitest 优先使用 JSON reporter 和 outputFile 解析结构化失败结果，减少对文本解析的依赖
