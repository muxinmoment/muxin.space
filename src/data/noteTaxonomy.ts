export const noteCategoryLabels = [
  "项目记录",
  "技术分享",
  "思考随笔",
] as const;

export type NoteCategory = (typeof noteCategoryLabels)[number];

export const noteCategoryMeta: Record<
  NoteCategory,
  {
    slug: string;
    description: string;
    prompt: string;
  }
> = {
  项目记录: {
    slug: "project-log",
    description: "记录项目从想法到实现、迭代和复盘的过程，适合放真实推进中的主线内容。",
    prompt: "想看项目怎么推进、卡点在哪里、为什么这么做，先看这里。",
  },
  技术分享: {
    slug: "tech-sharing",
    description: "集中讲清楚一个技术点、工具链或工程方案，适合做可复现的知识输出。",
    prompt: "想直接学做法、看技术拆解、抄配置和流程，先看这里。",
  },
  思考随笔: {
    slug: "reflection",
    description: "放更偏个人判断、经验总结和长期表达的内容，不追求教程化，但追求真实。",
    prompt: "想看观点、经验和阶段性思考，不想只看教程，就看这里。",
  },
};

export const getNoteCategoryBySlug = (slug: string) =>
  noteCategoryLabels.find((label) => noteCategoryMeta[label].slug === slug);
