# muxin.space

一个基于 `Astro + Tailwind CSS` 的个人知识分享站，定位是公开整理 AI 工程、前端实践、项目复盘与个人表达。

## 现在的技术栈

- `Astro 6`
- `Tailwind CSS 4`
- `@tailwindcss/typography`
- `Markdown Content Collections`
- `Cloudflare Pages`

## 主要页面

- 首页 `/`
- 分享归档 `/notes`
- 分享详情 `/notes/[slug]`
- 项目 `/projects`
- 关于 `/about`
- 404 `/404`

## 本地开发

```bash
npm install
npm run dev
```

默认地址:

```text
http://localhost:4321
```

## 构建与检查

```bash
npm run build
npm run check
npm run preview
```

## 内容写法

公开分享内容放在 `src/content/notes/`，使用 Markdown 编写。

结构化静态数据拆分在 `src/data/` 目录下，例如：

- `profile.ts`
- `projects.ts`
- `timeline.ts`
- `principles.ts`
- `recommendations.ts`

frontmatter 示例:

```md
---
title: "文章标题"
description: "一句话简介"
pubDate: 2026-05-31
tags:
  - astro
  - frontend
---
```

## Cloudflare Pages 部署

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20` 或 `22`

仓库根目录现在包含 `wrangler.jsonc`，用于给 `Wrangler` 一个稳定的 Pages 配置入口。

如果你想本地手动发布到 Cloudflare Pages，可以执行：

```bash
npm run deploy:pages
```

当前项目是纯静态内容站，不需要额外配置 `KV`。如果以后真的要接入会话、边缘存储或数据库，再按功能需要补 `KV` / `D1` / `R2` 绑定。

## 当前视觉方向

- 白底、留白充足、紫色点缀
- 轻量卡片、圆角、细边框
- 主页带一点二次元摄影感
- Markdown 文章使用 typography 排版

如果你想继续扩展，我建议下一步做标签页、RSS、站内搜索，以及和 B 站 / 小红书联动的内容工作流。
