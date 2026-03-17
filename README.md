# dev-notes

用 VitePress 来浏览与发布你的 Obsidian Markdown 笔记。

## 本地使用

安装依赖：

```bash
npm i
```

启动开发服务：

```bash
npm run dev
```

构建静态站点：

```bash
npm run build
```

本地预览构建产物：

```bash
npm run preview
```

## 笔记目录约定

- 笔记源文件放在 [notes](file:///Users/eastbuy/study/dev-notes/notes) 目录（它同时也是 VitePress 的站点根目录）
- 静态资源（图片/附件）放在 `notes/public/` 下，例如 `notes/public/attachments/xxx.png`
- Obsidian 常用语法兼容（wikilink / callout）由站点配置内置实现

## Cloudflare Pages 部署

在 Cloudflare Pages 创建项目并绑定仓库后：

- Build command: `npm run build`
- Build output directory: `notes/.vitepress/dist`

如果你的 Pages 项目部署在子路径（例如 `https://example.com/dev-notes/`），需要在 VitePress 配置里把 `base` 改为 `/dev-notes/`。
