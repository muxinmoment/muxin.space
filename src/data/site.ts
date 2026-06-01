export type Project = {
  name: string;
  status: string;
  summary: string;
  stack: string[];
  highlights: string[];
};

export type AnimePick = {
  title: string;
  category: string;
  note: string;
};

export type SkillGroup = {
  title: string;
  items: string[];
};

export type TimelineItem = {
  period: string;
  title: string;
  description: string;
};

export const profile = {
  badge: "二次元喜欢 · Frontend Dev",
  name: "Muxin",
  avatar: "/avatar-placeholder.svg",
  headline: "Hi，我是 Muxin。代码 × 动漫，两手都抓。",
  description:
    "前端工程师，学习中。这里记录我的技术笔记、项目进展，以及偶尔的二次元碎碎念。",
};

export const currentFocus = [
  "把 muxin.space 做成可持续更新的学习站",
  "熟悉 Astro 的内容集合、页面路由和组件化布局",
  "给 Aido 沉淀可公开的技术笔记",
];

export const sitePrinciples = [
  {
    title: "内容优先",
    description: "先把笔记、项目复盘和主页结构搭顺，再谈复杂交互。",
  },
  {
    title: "渐进增强",
    description: "默认静态页面，必要时再引入局部交互。",
  },
  {
    title: "可复用",
    description: "文章、卡片和页面布局要能持续扩展。",
  },
];

export const animeRecommendations: AnimePick[] = [
  {
    title: "葬送的芙莉莲",
    category: "冒险 · 治愈",
    note: "慢节奏，但很适合安静地看。",
  },
  {
    title: "孤独摇滚！",
    category: "音乐 · 日常",
    note: "能量很高，画面节奏也很灵。",
  },
  {
    title: "紫罗兰永恒花园",
    category: "情感 · 光影",
    note: "特别适合参考色彩和镜头感。",
  },
  {
    title: "虫师",
    category: "怪谈 · 旅途",
    note: "低饱和氛围感，摄影灵感很多。",
  },
  {
    title: "少女终末旅行",
    category: "末世 · 日常",
    note: "空旷构图和留白都很漂亮。",
  },
  {
    title: "平稳世代的韦驮天们",
    category: "战斗 · 设定",
    note: "动作感强，适合观察分镜。",
  },
];

export const timeline: TimelineItem[] = [
  {
    period: "2026 - now",
    title: "muxin.space 重构中",
    description: "用 Astro + Tailwind 搭建个人站，练习内容组织与页面叙事。",
  },
  {
    period: "2025 - now",
    title: "Aido 主线项目",
    description: "自研 Agent Loop，打通流式响应、状态管理和多智能体交付。",
  },
  {
    period: "2024 - 2025",
    title: "后端与前端并进",
    description: "FastAPI、Go、React、Cloudflare 等工具栈持续积累。",
  },
  {
    period: "2024",
    title: "OPPO / CosyVoice 基础积累",
    description: "模型轻量化与语音流式交互，让工程实践更完整。",
  },
];

export const skillGroups: SkillGroup[] = [
  {
    title: "Frontend",
    items: ["TypeScript", "React", "Astro", "Tailwind CSS", "Vite"],
  },
  {
    title: "Backend",
    items: ["FastAPI", "Go", "PostgreSQL", "MySQL"],
  },
  {
    title: "AI & Tooling",
    items: ["SSE", "Pydantic", "Cloudflare Pages", "Git"],
  },
];

export const projects: Project[] = [
  {
    name: "Aido",
    status: "主线项目",
    summary:
      "自研多智能体个人效能管家，重点在 Agent Loop、流式响应和外部状态管理。",
    stack: ["FastAPI", "SSE", "PostgreSQL"],
    highlights: ["Agent Loop", "流式渲染", "状态外置"],
  },
  {
    name: "muxin.space",
    status: "进行中",
    summary: "个人站与学习笔记中心，负责公开记录、写作和前端练习。",
    stack: ["Astro", "Markdown", "Cloudflare Pages"],
    highlights: ["笔记系统", "首页叙事", "部署演练"],
  },
  {
    name: "Kacha.ai",
    status: "观察中",
    summary: "为摄影师做的 Moodboard 生成器，作为未来副业方向持续储备。",
    stack: ["React", "API 聚合", "图版排版"],
    highlights: ["图文排版", "灵感板", "轻量生成"],
  },
];
