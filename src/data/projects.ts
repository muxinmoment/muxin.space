import type { Project } from "./types";

export const projects: Project[] = [
  {
    name: "Aido",
    status: "主线项目",
    summary:
      "自研 Agent Harness 个人效能管家，重点在 Agent Loop、工具调用与外部状态管理，用真实实验数据驱动架构取舍。",
    stack: ["Agent Harness", "FastAPI", "SSE", "PostgreSQL"],
    highlights: ["Agent Harness", "实验驱动迭代", "偏好记忆"],
    liveUrl: "http://121.43.163.163/",
    liveLabel: "进入 Aido",
  },
  {
    name: "KeeperKit",
    status: "迭代中",
    summary:
      "面向 TRPG 守秘人/GM 的本地优先 AI 工具箱，首个模块是规则书 RAG 问答服务，已迭代 MVP → V1.0 → V1.2 三个版本。",
    stack: ["FastAPI", "ChromaDB", "sentence-transformers", "LangGraph"],
    highlights: ["RAG 流水线", "可替换组件架构", "需求分析驱动"],
    liveUrl: "https://github.com/muxinmoment/keeperkit",
    liveLabel: "GitHub 源码",
  },
  {
    name: "muxin.space",
    status: "进行中",
    summary:
      "个人知识分享站与内容中台，承载文章和项目公开记录。",
    stack: ["Astro", "Markdown", "Cloudflare"],
    highlights: ["知识分享", "内容归档", "发布演练"],
    liveUrl: "https://github.com/muxinmoment/muxin.space",
    liveLabel: "GitHub 源码",
  },
];
