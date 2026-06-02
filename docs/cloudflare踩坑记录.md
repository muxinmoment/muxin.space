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
  "pages_build_output_dir": "dist"
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

不要把 deploy command 配成：

```bash
npx wrangler deploy
```

因为这条命令是给 `Cloudflare Workers` 用的，不是给 `Cloudflare Pages` 静态站用的。

如果你的项目是 `Pages`，有两种正确方式：

1. 用 Cloudflare Pages 的 Git 集成  
只配置：
   - Build command: `npm run build`
   - Build output directory: `dist`

2. 用命令行手动发布  
执行：

```bash
npm run deploy:pages
```

它内部会调用：

```bash
wrangler pages deploy dist
```

## 这次新报错是什么意思

你这次的新日志里，真正关键的是这两句：

- `It seems that you have run wrangler deploy on a Pages project`
- `Missing entry-point to Worker script or to assets directory`

意思是：

- Cloudflare 发现这是个 `Pages` 项目
- 但你却让它执行了 `wrangler deploy`
- `wrangler deploy` 期待的是一个 Worker 脚本入口，比如 `src/index.ts`
- 而你的项目是静态站，没有 Worker 入口
- 所以它就报了 “Missing entry-point”

这个错误不是你代码有问题，而是 Cloudflare 后台的发布命令配错了。

## 如果以后真的要用 KV

那时再做下面这些：

1. 在 Cloudflare 后台创建或复用 KV namespace
2. 把 namespace ID 填到 `wrangler.jsonc`
3. 在代码里真正读取对应 binding
4. 再重新部署

在那之前，不要为了“感觉以后可能会用”提前把 KV 配死。
