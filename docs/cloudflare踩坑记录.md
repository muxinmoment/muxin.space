# Cloudflare 踩坑记录

## 这次问题的真实原因

这次部署报错里最显眼的是：

- Cloudflare 在创建 `muxin-space-session` 这个 KV namespace
- 但同名 namespace 已经存在
- 因此创建失败，中断了自动配置流程

它带来的连锁反应是：

- 根目录没有成功生成 `wrangler.jsonc`
- Wrangler 只能退回去使用构建产物里的临时配置
- 临时配置位于 `dist/` 目录，每次构建都会被覆盖，不能作为长期配置源

## 当前项目该怎么修

`muxin.space` 当前是一个纯静态 `Astro` 站点，部署目标是 `Cloudflare Pages`。

这意味着：

- 当前项目不需要 `KV`
- 当前项目不需要手动添加 `SESSION` 绑定
- 当前项目只需要一个稳定的 `wrangler.jsonc`，告诉 Wrangler 输出目录是 `dist`

因此仓库里补上的配置是：

- 根目录 `wrangler.jsonc`
- `pages_build_output_dir: "dist"`
- `deploy:pages` 脚本

## 为什么没有直接加 KV 配置

因为代码里现在根本没有在使用 KV。

如果我们为了“消除报错”硬塞一个：

- `kv_namespaces`
- `binding: "SESSION"`

那只是把部署配置做复杂了，并没有解决当前站点真正的需求。

更稳的策略是：

1. 先让静态站点正常部署
2. 以后如果真要上登录态、会话、Cloudflare Sessions 或其他边缘存储
3. 再根据真实功能补 `KV` / `D1` / `R2` 绑定

## 当前推荐配置

`wrangler.jsonc`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "muxin-space",
  "compatibility_date": "2026-06-02",
  "pages_build_output_dir": "dist",
  "telemetry": false
}
```

## 现在怎么用

本地手动部署：

```bash
npm run deploy:pages
```

Cloudflare Dashboard 配置：

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`

## 如果以后真的要用 KV

那时再做下面这些：

1. 在 Cloudflare 后台创建或复用 KV namespace
2. 把 namespace ID 填到 `wrangler.jsonc`
3. 在代码里真正读取对应 binding
4. 再重新部署

在那之前，不要为了“感觉以后可能会用”提前把 KV 配死。
