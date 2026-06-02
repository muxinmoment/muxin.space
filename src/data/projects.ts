import type { Project } from "./types";

export const projects: Project[] = [
  {
    name: "Aido",
    status: "主线项目",
    summary:
      "自研多智能体个人效能管家，重点在 Agent Loop、流式响应和外部状态管理，也会持续拆成可公开分享的工程内容。",
    stack: ["FastAPI", "SSE", "PostgreSQL"],
    highlights: ["Agent Loop", "流式渲染", "状态外置"],
  },
  {
    name: "muxin.space",
    status: "进行中",
    summary:
      "个人知识分享站与内容中台，承载文章、项目公开记录，以及和 B 站/小红书联动的长文完整版。",
    stack: ["Astro", "Markdown", "Cloudflare"],
    highlights: ["知识分享", "内容归档", "发布演练"],
  },
  {
    name: "Kacha.ai",
    status: "观察中",
    summary:
      "为摄影师做的 Moodboard 生成器，作为未来副业方向持续储备，后续也适合做成产品拆解与设计分享素材。",
    stack: ["React", "API 聚合", "图版排版"],
    highlights: ["图文排版", "灵感板", "轻量生成"],
  },
];
