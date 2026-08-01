import type { Project } from "./types";

export const projects: Project[] = [
  {
    name: "Aido",
    status: "主线项目",
    summary:
      "自研多智能体个人效能管家，重点在 Agent Loop、流式响应和外部状态管理，也会持续拆成可公开分享的工程内容。",
    stack: ["FastAPI", "SSE", "PostgreSQL"],
    highlights: ["Agent Loop", "流式渲染", "状态外置"],
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
