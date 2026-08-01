import type { CollectionEntry } from "astro:content";

/**
 * 估算中文为主的内容阅读时长。
 * 中文按字符计（约 400 字/分钟阅读速度），英文/数字按单词计（约 200 词/分钟），
 * 两者独立估算后取较大值再取整，避免混合内容时时长被严重低估。
 */
export function estimateReadingMinutes(raw: string): number {
  const stripped = raw
    .replace(/```[\s\S]*?```/g, "") // 代码块不计入阅读时长
    .replace(/`[^`]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // 图片
    .replace(/\[[^\]]*\]\([^)]*\)/g, "") // 链接文本保留，语法去掉
    .replace(/[#>*_~-]/g, " ");

  const cjkCount = (stripped.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const wordCount = (stripped.match(/[A-Za-z0-9]+/g) ?? []).length;

  const cjkMinutes = cjkCount / 400;
  const wordMinutes = wordCount / 200;

  return Math.max(1, Math.round(cjkMinutes + wordMinutes));
}

/**
 * 从同一 collection 中挑选相关内容：按 category 相同 + tags 重叠数排序，
 * 排除自身，最多返回 limit 篇。
 */
export function findRelatedNotes(
  current: CollectionEntry<"notes">,
  all: CollectionEntry<"notes">[],
  limit = 3
): CollectionEntry<"notes">[] {
  const currentTags = new Set(current.data.tags);

  return all
    .filter((note) => note.id !== current.id)
    .map((note) => {
      const sharedTags = note.data.tags.filter((tag) => currentTags.has(tag)).length;
      const sameCategory = note.data.category === current.data.category ? 1 : 0;
      return { note, score: sharedTags * 2 + sameCategory };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.note.data.pubDate.getTime() - a.note.data.pubDate.getTime();
    })
    .slice(0, limit)
    .map(({ note }) => note);
}
