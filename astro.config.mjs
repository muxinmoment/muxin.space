// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://muxin-space.top",
  prefetch: {
    defaultStrategy: "hover",
  },
  markdown: {
    syntaxHighlight: false,
  },
  integrations: [
    sitemap({
      // 私有页面不进 sitemap（/tracker 秋招看板）
      filter: (page) => !page.includes("/tracker"),
    }),
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
