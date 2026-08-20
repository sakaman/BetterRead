# BetterRead

BetterRead 是一个面向微信读书网页版的 Tampermonkey 用户脚本。它通过本地 CSS 和轻量页面适配增强主题、排版与沉浸阅读体验，不读取或上传书籍内容，也不接管微信读书的进度、目录和笔记逻辑。

## 功能

- 纸张白、暖黄、护眼绿、深色、OLED 黑、跟随系统和自定义主题
- 字体、字号、行高、字间距、段落间距、阅读栏宽度与对齐方式
- 沉浸模式、自动隐藏控件、顶部阅读进度和段落聚焦
- 全局设置及单本书独立配置
- `Alt+B` 设置、`Alt+T` 主题、`Alt+F` 沉浸模式、`Alt+0` 恢复默认
- Shadow DOM 设置面板，避免与原网页样式互相污染

## 安装

[点击在线安装 BetterRead](https://raw.githubusercontent.com/sakaman/BetterRead/main/dist/better-read.user.js)

1. 先安装 Tampermonkey。
2. 点击上面的在线安装链接，并在 Tampermonkey 安装页面确认。
3. 打开任意 `https://weread.qq.com/web/reader/*` 阅读页。

BetterRead 不会自动修改浏览器中已有的脚本。发布文件只申请本地样式、设置存储和菜单命令权限，没有网络访问权限。

## 在线更新

脚本的 `@downloadURL` 和 `@updateURL` 均指向本仓库 `main` 分支的发布文件。Tampermonkey 会按照自身的更新检查周期读取线上版本号；发现更高版本后即可更新。

发布新版本时先提升 `package.json` 的版本号，再执行 `pnpm run build`。构建脚本会自动把该版本号写入发布文件的 `@version` 字段。

## 开发

```powershell
pnpm install --store-dir .pnpm-store
pnpm run check
pnpm run test
pnpm run build
pnpm run preview
```

本地预览地址为 `http://127.0.0.1:4173/tests/fixture.html`。构建产物是单文件 `dist/better-read.user.js`。

## 目录

- `src/core`：设置、存储和 SPA 生命周期
- `src/platform`：微信读书页面适配层
- `src/features`：主题、排版与阅读辅助
- `src/ui`：隔离的设置面板
- `tests`：行为测试与无真实书籍数据的页面夹具
