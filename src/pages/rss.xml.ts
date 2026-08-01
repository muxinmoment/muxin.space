import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const notes = await getCollection("notes", ({ data }) => !data.draft);
  const memos = await getCollection("memo", ({ data }) => !data.draft);

  const items = [
    ...notes.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: `/notes/${entry.id}/`,
    })),
    ...memos.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      link: `/memo/${entry.id}/`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: "muxin.space",
    description: "分享 AI 工程、全栈实践、项目复盘和带点个人风格的长期内容。",
    site: context.site ?? "https://muxin.space",
    items,
  });
}
