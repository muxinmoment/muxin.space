# muxin.space

一个基于 `Astro + Tailwind CSS` 的个人网站，定位是学习笔记、项目分享和二次元摄影风格的个人主页。

## 现在的技术栈

- `Astro 6`
- `Tailwind CSS 4`
- `@tailwindcss/typography`
- `Markdown Content Collections`
- `Cloudflare Pages`

## 主要页面

- 首页 `/`
- 笔记 `/notes`
- 笔记详情 `/notes/[slug]`
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

笔记放在 `src/content/notes/`，使用 Markdown 编写。

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

## 当前视觉方向

- 白底、留白充足、紫色点缀
- 轻量卡片、圆角、细边框
- 主页带一点二次元摄影感
- Markdown 文章使用 typography 排版

如果你想继续扩展，我建议下一步做标签页、RSS 和站内搜索。
