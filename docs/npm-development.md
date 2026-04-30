# NPM Development Guide

这份文档专门面向 `SpecCompass` 包维护者，回答两类问题：

- 本地怎么把当前仓库接到另一个项目里调试
- 怎么把 `spec-compass` 正式发布到 npm

## 名称约定

- npm 包名：`spec-compass`
- CLI 命令：`speccompass`
- 展示名称：`SpecCompass`

也就是说：

```bash
npm install -D spec-compass
npx speccompass init
```

`init` 会把包内的 `SKILL.md` 复制到宿主项目：

```text
.codex/skills/speccompass-workflow/SKILL.md
```

同时它会创建或补充宿主项目的 `AGENTS.md`，让 agent 在测试任务里知道要读取这份 skill。

需要注意：`npm install` 本身不会让 agent 自动“记住”工作流，它只会安装包文件。真正让 agent 在宿主仓库里稳定看见 workflow 的步骤是 `npx speccompass init`，然后把生成的 `.codex/skills/speccompass-workflow/SKILL.md` 和 `AGENTS.md` 一起保留在宿主项目中。

## 本地联调

本地联调有 3 种常用方式。

### 方式 1：`npm link`

适合你正在频繁修改 `SpecCompass` 仓库，并且希望宿主项目立刻使用本地最新构建产物。

先在 `SpecCompass` 仓库里执行：

```bash
npm install
npm run build
npm link
```

再到宿主项目里执行：

```bash
npm link spec-compass
npm install -D vitest playwright
npx speccompass init
```

特点：

- 优点：改完包、重新 build 后，宿主项目能直接用到最新本地版本
- 缺点：基于全局 link，切换机器或清理全局环境后容易忘记依赖关系

推荐工作流：

1. 在本仓库改代码
2. 执行 `npm run build`
3. 回到宿主项目执行 `npx speccompass run`

取消 link：

宿主项目里：

```bash
npm unlink spec-compass
```

包仓库里：

```bash
npm unlink
```

### 方式 2：本地路径依赖

适合你想把依赖关系写进宿主项目 `package.json`，避免依赖全局 link。

在宿主项目里执行：

```bash
npm install -D ../path/to/speccompass-repo
npm install -D vitest playwright
```

或者直接写成：

```json
{
  "devDependencies": {
    "spec-compass": "file:../path/to/speccompass-repo"
  }
}
```

特点：

- 优点：依赖关系清楚，适合固定的本地双仓开发
- 缺点：每次你修改 `SpecCompass` 后，通常还要重新 build，必要时重新安装依赖

更稳的做法是让宿主项目依赖本仓库打包后的结果，而不是源码目录本身。

### 方式 3：`npm pack`

适合你想验证“真正发布到 npm 的包”在宿主项目里的实际安装效果。

先在 `SpecCompass` 仓库里执行：

```bash
npm install
npm run build
npm test
npm pack
```

这会生成一个类似下面的文件：

```text
spec-compass-0.1.0.tgz
```

然后在宿主项目里安装这个本地 tarball：

```bash
npm install -D /absolute/path/to/spec-compass-0.1.0.tgz
npm install -D vitest playwright
npx speccompass init
```

特点：

- 优点：最接近真实 npm 安装效果，最适合发包前验证
- 缺点：调试迭代速度不如 `npm link`

## 推荐的本地开发顺序

如果你正在开发 `SpecCompass` 本身，最推荐：

1. 在本仓库执行 `npm install`
2. 执行 `npm run build`
3. 使用 `npm link` 或 `npm pack` 接到宿主项目
4. 在宿主项目执行 `npx speccompass init`
5. 在宿主项目执行 `npx speccompass run`
6. 每次改完本仓库代码后重新 `npm run build`

如果你要验证“最终发布包是否干净”，再额外跑一次：

```bash
npm pack --dry-run
```

## 发布到 npm

### 发包前检查

正式发布前，至少确认这些项：

1. `package.json` 中的包名和版本正确
2. `npm run build` 通过
3. `npm test` 通过
4. `npm pack --dry-run` 正常，确认 tarball 内容完整
5. README、文档、CLI 名称都已经是你要发布的最终版本

当前仓库里，`prepublishOnly` 已经会自动执行：

```bash
npm run build && npm test
```

### 登录 npm

如果本机还没登录 npm：

```bash
npm login
```

登录后可以确认当前身份：

```bash
npm whoami
```

### 发布命令

确认版本号后，在仓库根目录执行：

```bash
npm publish
```

当前包配置里已经包含：

- `publishConfig.access = "public"`
- `prepublishOnly`

所以公开包会按公开方式发布，并且发布前会先 build/test。

### 升版本

如果你要发布新版本，先改版本号，再发包。

常见做法：

```bash
npm version patch
```

或者：

```bash
npm version minor
npm version major
```

然后再执行：

```bash
npm publish
```

## 一个最实用的发布前流程

```bash
npm install
npm run build
npm test
npm pack --dry-run
npm publish
```

如果你还想在正式发包前做一次宿主项目验证，建议用：

```bash
npm pack
```

再把生成的 `.tgz` 安装到宿主项目里试跑一次。

## 常见问题

### 为什么宿主项目还要自己安装 `vitest` 和 `playwright`？

因为 `SpecCompass` 只负责初始化和执行流程，不把测试框架本体作为发布依赖一起带进去。

宿主项目推荐安装：

```bash
npm install -D spec-compass vitest playwright
```

### 为什么我改了包代码，宿主项目没生效？

通常是因为你改的是 TypeScript 源码，但宿主项目实际执行的是 `dist/` 里的编译结果。

先重新执行：

```bash
npm run build
```

然后再去宿主项目重新跑 `npx speccompass run`。

### 应该优先用 `npm link` 还是 `npm pack`？

- 快速联调：优先 `npm link`
- 验证真实发布效果：优先 `npm pack`
