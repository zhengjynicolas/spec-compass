# Contributing

感谢你为 `auto-test` 做贡献。

## 开发流程

1. Fork 或基于主仓库新建分支。
2. 保持改动尽量聚焦，避免一次提交混入多个主题。
3. 新增能力时，优先放在对应的 `src/packages/*` 模块中。
4. 修改 CLI 或配置模型时，同步更新 `README.md` 和相关示例。

## 提交建议

- 功能改动：说明用户能得到什么能力
- 重构改动：说明模块边界或后续维护收益
- 文档改动：说明覆盖了哪些使用场景

## Pull Request Checklist

- 代码遵循 TypeScript 模块化设计
- 文档与示例已同步更新
- 没有引入与任务无关的大范围改动
- 公共接口变更已在 `src/packages/core/types.ts` 体现
