import type { Project } from "./types";

export const projects: Project[] = [
  {
    name: "Aido",
    status: "主线项目",
    summary:
      "自研多智能体个人效能管家，重点在 Agent Loop、流式响应和外部状态管理，也会持续拆成可公开分享的工程内容。",
    stack: ["FastAPI", "SSE", "PostgreSQL"],
    highlights: ["Agent Loop", "流式渲染", "状态外置"],
    liveUrl: "http://47.110.76.9/",
    liveLabel: "进入 Aido",
  },
  {
    name: "muxin.space",
    status: "进行中",
    summary:
      "个人知识分享站与内容中台，承载文章和项目公开记录。",
    stack: ["Astro", "Markdown", "Cloudflare"],
    highlights: ["知识分享", "内容归档", "发布演练"],
  },
];
