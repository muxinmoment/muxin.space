export type ResumeEducation = {
  school: string;
  major: string;
  degree: string;
  period: string;
  details: string[];
};

export type ResumeExperience = {
  org: string;
  role: string;
  period: string;
  summary: string;
  highlights: string[];
  stack: string[];
};

export type ResumeProject = {
  name: string;
  role: string;
  period: string;
  summary: string;
  highlights: string[];
  stack: string[];
};

export const resumeIntent = {
  headline: "AI 应用开发工程师 / AI Agent 工程师",
  locations: ["广州", "上海", "杭州", "深圳", "武汉"],
  summary:
    "三次独立担任产品负责人的经历（Agent 架构、RAG 工程化、AI 辅助开发实战），从 0 到 1 搭建 Multi-Agent 系统与 RAG 工具链，具备独立拆解需求、设计架构并落地代码的完整能力。",
};

export const education: ResumeEducation[] = [
  {
    school: "武汉理工大学",
    major: "人工智能专业",
    degree: "本科",
    period: "2023.09 - 2027.06",
    details: [
      "主修：数据结构与算法、机器学习与数据挖掘、自然语言处理、数据库系统原理、计算机网络、深度学习",
    ],
  },
];

export const experiences: ResumeExperience[] = [
  {
    org: "华为 · 集团与流程 IT 部门",
    role: "AI 测试平台开发实习生",
    period: "2026.07 - 至今",
    summary:
      "参与一个面向企业协同办公场景的接口自动化测试平台，覆盖多端数百个接口。深入参与「源码→文档校验→用例生成→执行→反馈校准」全链路架构，目标是用 AI 承接原本依赖人工完成的测试用例编写与执行验证工作。",
    highlights: [
      "AI 辅助批量生成标准化测试用例，推动真机一次通过率与用例有效率显著提升",
      "独立设计三维分层 Skill 工程化体系（作用域 + 流程分类 + 成熟度/安全级双维度管控），把项目从零散提示词演进为完整工程化体系",
      "独立设计三阶段人工介入框架（前置/中置/后置），为后续 Agent 自主执行测试任务奠定基础",
      "单月新增/校准用例覆盖 90+ 接口，在 monorepo 架构下跨包维护测试引擎与可视化界面",
    ],
    stack: ["TypeScript", "Mocha", "React", "Node.js"],
  },
];

export const resumeProjects: ResumeProject[] = [
  {
    name: "Aido — 个人排期与规划智能体系统",
    role: "核心 AI 后端开发 / 项目负责人",
    period: "2026.02 - 至今",
    summary:
      "面向个人用户的 AI 效能管理产品（已部署上线），通过大模型实现目标拆解与排期自动化，核心特色是自研偏好记忆引擎。",
    highlights: [
      "Multi-Agent 架构设计：复杂业务编排用 LangGraph 构建目标拆解图网络，基础对话用自研轻量 Agent 状态机",
      "独立设计四层偏好记忆系统，实现用户习惯的静默提取与持续沉淀",
      "主导 PRD 与技术架构文档，拉齐前后端迭代节奏",
    ],
    stack: ["LangGraph", "自研 Agent 框架", "FastAPI", "Vue3", "PostgreSQL"],
  },
  {
    name: "KeeperKit — TRPG 规则 RAG 助手",
    role: "项目负责人（产品 + 全栈开发）",
    period: "2026.03 - 至今",
    summary:
      "面向 TRPG 守秘人/GM 的本地优先 AI 工具箱，首个模块为规则书 RAG 问答服务，已迭代 MVP→V1.0→V1.2 三个版本。",
    highlights: [
      "从 0 独立搭建完整 RAG 流水线：文档加载→切块→向量化→检索→精排→生成",
      "将 Embedding、VectorStore、Reranker、Generator 抽象为可替换接口，支持自由组合升级",
      "产出多篇需求分析文档，明确\"做减法\"的产品策略",
    ],
    stack: ["FastAPI", "ChromaDB", "sentence-transformers", "LangGraph", "React"],
  },
  {
    name: "OPPO 小布助手 — 对话短文本语义匹配",
    role: "项目负责人（算法 + 全流程落地）",
    period: "2025.10 - 2026.01",
    summary:
      "基于阿里云天池语义匹配赛题的实训项目，处理数十万条真实脱敏业务数据。",
    highlights: [
      "将 12 层 BERT 压缩为 4 层 RoBERTa 轻量架构，参数量降低 65%，推理速度提升 3 倍",
      "引入对比学习与对抗训练，自测指标对齐当时官方榜单最高分水平",
    ],
    stack: ["PyTorch", "RoBERTa", "SimCSE", "FGM", "ONNX"],
  },
];

export const resumeHighlights: string[] = [
  "Agent 架构设计（自研 Runtime + LangGraph 多 Agent 编排）",
  "RAG 工程化落地（组件可替换架构，从 0 到 1 完整搭建）",
  "AI 辅助开发实战（全流程 AI-native 开发、Skill 工程化体系设计）",
];
