export type FocusItem = {
  text: string;
  status: "进行中" | "已上线" | "规划中";
};

export const currentFocus: FocusItem[] = [
  { text: "把 muxin.space 做成可持续更新的知识分享主站", status: "进行中" },
  { text: "沉淀 Aido、自研 Agent Loop、SSE 流式交互相关的公开经验", status: "已上线" },
  { text: "把项目实践中的方法论拆成可复用的文章，而不是一次性动态", status: "规划中" },
];
