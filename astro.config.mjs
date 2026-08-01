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
  integrations: [sitemap(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
  },
});
