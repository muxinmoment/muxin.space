---
title: "Cloudflare Pages 部署清单"
description: "把个人站从本地推到 Cloudflare Pages 时要记住的关键设置。"
pubDate: 2026-05-31
tags:
  - cloudflare
  - deploy
  - checklist
---

部署前先确认这些东西：

- 仓库里要有 `package.json`
- 构建命令要能在本地跑通
- 输出目录通常是 `dist`
- 页面内容最好先做成静态骨架，再考虑动态能力

在 Cloudflare Pages 里，常见设置是：

```text
Build command: npm run build
Build output directory: dist
Node version: 20 或 22
```

如果构建失败，优先排查：

1. `npm install` 是否成功
2. `npm run build` 是否在本地通过
3. 页面里是否引用了不存在的组件或字段

这类问题通常比 Cloudflare 本身更常见。
