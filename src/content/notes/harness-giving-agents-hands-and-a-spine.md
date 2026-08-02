---
title: "Harness：给 Agent 装上手和脊椎"
description: "模型负责想，harness 负责做。这篇整理业界对 agent harness 的定义和五个核心职责，再用我自己在 Aido Planner 上做的一次真实改造，把抽象概念钉在一个具体案例上。"
pubDate: 2026-08-02
category: "技术分享"
tags:
  - agent
  - harness
  - llm
  - tool-calling
  - aido
draft: false
---

模型负责"想"，harness 负责"做"。这篇整理两件事：一是 harness 这个概念到底指什么，业界怎么定义、怎么拆解；二是用我自己在 Aido Planner 上做的一次真实 harness 改造，把抽象概念钉在一个具体案例上——包括三次被数据打脸又纠正回来的过程。

## 先对齐一个概念：Agent = Model + Harness

这个等式来自 Databricks 的定义，业界几家（LangChain、Martin Fowler、PuppyGraph）说法略有不同，但核心一致：

![Agent = Model + Harness，运行时是一个 ReAct 循环](/diagrams/harness-equation-and-loop.svg)

Harness 是包裹在语言模型外面的软件基础设施，负责让模型"能对任务采取行动"，而不只是"对提示做出响应"。模型负责推理、决定下一步做什么；harness 负责把这个决定接到工具、系统、内存和执行环境上。

LangChain 说得更直白：

> A harness is every piece of code, configuration, and execution logic that isn't the model itself.

一句话记住这个分工：

```
模型：推理引擎，决定下一步做什么       ← 非确定性，唯一有"智能"的部分
Harness：一切不是模型的代码            ← 确定性，负责让决定落地
```

Oracle 技术博客那篇《The Agent Loop Decoded》补了一句很关键的话：多数 agent 工程工作发生在 harness 里，不是在模型里。理解这条边界，才能看清失败到底出在哪、干预从哪里下手才有效。

换句话说：**当你的 agent 表现不稳定，大概率不是模型不够聪明，而是 harness 没接住。** 这句话我在后面案例部分会验证一遍。

## Harness 在做哪五件事

综合几家的说法，可以归纳成五个核心职责：

**约束动作空间。** 模型原始输出是任意文本，但生产里的 agent 需要执行具体、明确的动作。Harness 用带严格 schema 的工具，把模型的"意图"收窄成安全、结构化的操作。

**管理对话状态与上下文窗口。** 真实任务往往要好几轮交互。Harness 要维护这段历史、管理有限的上下文窗口，确保模型在每一步都拿到它需要的信息——注意，是"需要的"，不是"所有的"。这句话是今天案例部分的核心矛盾。

**执行动作循环（ReAct Loop）。** 这是最核心的机制，来自 2022 年 ReAct 论文（Reasoning and Acting in Language Models）：模型接收上下文，决定调工具、直接回答、转交子 agent 还是请求更多信息；harness 把这个决定路由给具体工具执行；工具返回结果写回上下文；循环，直到任务完成或触发终止条件。

这个循环里只有"模型决定"这一步是非确定性的，其余所有环节都应该是确定性的。这也是为什么 harness 工程的大部分工作是在写"确定性的脚手架"，而不是调 prompt。

还有个容易忽略的点：**模型不再调用工具、开始输出纯文本，不代表任务真的完成了。** 它可能只是在提一个澄清问题，或者给了一个不完整的结果。判断"目标是否真正达成"，这件事的责任在 harness，不在模型有没有停止吐 tool_calls。

**安全护栏。** 执行任何动作前，harness 要评估这个动作是否被允许——结合用户显式授权、自动安全分类器、当前操作上下文。

**持久化状态。** 会话、工具调用记录、预算消耗——这些需要跨轮次、甚至跨进程重启保留下来。

![Harness 的五件事：模型只负责决定，剩下全靠 harness 接住](/diagrams/harness-five-responsibilities.svg)

## 一个容易被忽视的框架：Harness 是 Context Engineering 的交付机制

有篇关于自建 harness 的深度文章提出一个我很认同的框架：harness 是 context engineering 的交付机制。模型是无状态的，它每一轮只能看到你为它组装的东西；模型的表现会随着上下文塞入越来越多噪音而系统性下降。几乎所有精巧的 harness 特性——压缩、子 agent、工具输出治理、基于文件的记忆——本质上都是在解决同一件事：把对的信息送到模型面前，把错的信息挡在外面。

这里有个术语值得单独讲：**context rot**（上下文腐化）——不是"多喂点信息模型自己会挑"，是塞多了会真的变差。

![Context Rot：塞得越多，模型判断力掉得越快](/diagrams/harness-context-rot.svg)

同一篇文章还给了三条很实用的工程准则：对工具输出要狠一点做治理，两千行的日志原样塞进上下文就是"context poison"，要截断、摘要，或者把大结果扔到文件里让模型自己去 grep，返回的是引用而不是原始负载；让工具的报错"说人话"，一条说清楚"哪里错了、正确调用长什么样"的错误信息，能把一次失败变成模型自我纠正的一步，而不是死循环；优先设计成可幂等、可回滚的动作。

这三条我在案例里会对应到具体实现。

## 落地案例：给 Aido Planner 做一次真实的 harness 改造

前面讲的都是概念，接下来把它钉在一个真实项目上——我自己在做的 Aido（AI 个人任务管理应用）里的 Planner 智能体。

### 问题：装配层在代替模型做判断

Aido Planner 原来的信息供给方式是全量装配：不管用户说"帮我排今天的活"还是"下周交方案帮我倒推准备"，backend 都把同一份 25 个 key 的 context 塞给模型。

真实数据（20 条日志抽样）：context key 数中位数 25、峰值 25；渲染后 prompt 字符中位数 15,574、峰值 33,901；估算 tokens 中位数 6,349、峰值 11,485。

装配这份 context 要跑 22 + N 次 service 调用，其中一张任务表在一次请求里被读了 9 遍。而这些数据里，接近一半根本不参与最终决策——`past_week_tasks` 占最大样本 46.2%，prompt 自己都写着"它默认不是直接候选池"。

这正好对应前面说的 context rot：装配层不知道这次规划到底需要什么，只能把所有可能相关的信息全塞进去，模型的判断质量被这堆噪音拖累。

### 现有代码比想象中薄——这决定了改造范围

盘点现状发现一个反直觉的事实：自研 runtime 只有四个文件，最高抽象是"一次调用 + 一次解析"，零 tool calling 相关代码。LangGraph 那层更只是个壳——`START → chat_node → json_node → END`，没有循环、没有分支。真正的业务逻辑全在 714 行手写归一化函数里（防幻觉的核心：来源枚举校验、项目字段 grounding、日期归一化）。

结论：**这次改造不是替换编排框架，是补上一个从来不存在的能力层**——tool 注册、调度、循环控制、预算约束，基本全部新建。这正对应前面说的五个职责：动作空间约束（ToolRegistry）、循环执行（AgentLoop）、预算管理（LoopBudget）。

### 目标架构：让模型自己开口要

![Aido harness 目标架构：AgentLoop / Skills / Tools / runtime 五层怎么串起来](/diagrams/aido-harness-architecture.svg)

```
Harness（新增）
├── AgentLoop：调模型 → 判 tool_calls → 执行工具 → 追加结果 → 再调，直到 finish
├── ToolRegistry：工具注册与调度
└── LoopBudget：轮次上限 / 调用数上限 / token 硬上限

Skills（下沉）：planner_skill / goal_skill / review_skill / preference_skill
Tools（新增）：query_tasks_by_range / query_project_tasks / query_templates 等 5 个

runtime（扩展）：llm_client 加 tool_calls / tool_call_id 支持
```

第一期只做 5 个工具，覆盖最大的浪费点。工具的 `description` 里刻意写了两条硬约束（并有测试守着）：`query_tasks_by_range` 明确写"查到的历史任务不是候选池，不要直接当作今天要排的项"，防止模型把历史任务错当今日候选；`query_project_tasks` 明确写"project_id 必须来自上下文中已有的候选，不要凭空构造"，防止越权查询。

这两条对应前面说的"让工具的报错说人话"，只是把这个原则前移到了工具描述本身，让模型在决定调用之前就拿到边界，而不是调错了再纠正。

### 第一次预期落空：真实数据一测，总 token 不降反升

前两轮用测试账号（历史任务是空的），数据很漂亮：context token 降 87-89%，延迟不恶化。

换成真实账号（71 个任务）后翻脸：装配层 context token 确实降了 82-89%，但**总 LLM token 从 v1 的 6.1K 涨到 v3 的 18-20K**。

![三轮实验：token 到底降没降](/diagrams/aido-harness-token-reversal.svg)

原因：多轮调用让 345 行 planner prompt 被重复计费了几次——省了单轮冗余字段的钱，多付了几次完整 prompt 的钱。这不是架构判断错了，是没有把"多轮意味着多付固定成本"这件事算进去。

### 第二次修正：我自己先报错了一次口径

复盘发现，上一轮报的"18-20K vs 6.1K"对比本身是错的——18-20K 是多轮 input+output 累加，6.1K 只是单纯的 context 字符估算，两个东西口径不一样，不能直接比。

拆开后 input 是 9,881，output 是 2,235——output 是产出结果的必要成本，砍不掉；真正能砍的是被重复计费的固定 prompt 部分。

对症做法：把 345 行 prompt 拆成两半，第一轮用完整版，工具执行完后第二轮换成一份 2,122 字符的精简版（只留字段规则、输出契约）。效果：第二轮消息体积从 15,203 字符降到 4,192，降 72%。

这里留一条工程习惯：**发现反直觉数字时，先怀疑测量口径，再怀疑方案本身。**

### 第三次意外：想用的优化技术，此路不通

顺手探测 prompt caching 能不能用。三组证据交叉验证后结论很干脆：不支持。官方返回的 `cached_tokens` 字段本身不可信，连续 6 次调用命中模式是"0、0、命中、命中、0、命中"——真缓存命中该在 TTL 内稳定，不会中途跳回 0；延迟没有下降趋势，反而从 3.42 秒涨到 5.40 秒；显式传官方要求的缓存标记，被静默忽略，usage 毫无变化。

判断一个技术路径能不能走通，光看文档不够，要自己拿真实调用交叉验证几次再下结论。

### 最坦诚的一次自我推翻：灰度开关能切，但切了也没用

加了配置开关 `PLANNER_ENGINE=harness`，功能测试全过——新端点能返回、响应里的 metrics 显示引擎是 harness、重启前测试确认端点原来是 404。

但认真捋一遍真实调用路径后发现：**前端是 SSE 优先，只有流式失败才兜底调同步接口**，而流式端点根本没接这个开关判断。

拼起来：这个开关打开后，正常用户走的还是老链路，harness 只在异常路径上才会被执行到。

这条我原本可以带过去，报告写"灰度开关已完成"（测试确实都通过了）。但那样表述会让人误以为这是条能随时切生产流量的路径，事实不是。所以单独记下来：**开关可用，但它切换的那条路径在生产中几乎不被走到。**

### 一个更隐蔽的坑：静默降级没有任何信号

精简装配模式的前提是"模型会用工具主动查回来"，这个前提在代码层没有任何保障。

真实撞过反例：某次调用模型一个工具都没调，输入比对照组更少，耗时却更长——系统对这种情况没有任何感知，请求正常返回，结果悄悄变差。

补的办法：harness 模式下工具调用次数为零时打一条 WARN，明确写清楚"精简 context 没有被按需查询补偿，可能是静默降级"。这条日志把问题从"不可见"变成"可搜索"，但还没在生产上真正验证过效果。

这一条正好对应前面 Oracle 那句话——模型停止调工具不代表任务真的完成了，harness 有责任去判断"没查"这件事本身是否合理，而不是默认信任模型的沉默。

## 收束：这次改造沉淀下来的判断标准

架构决策的依据是必要性，不是某一轮的性能数字。全量装配随用户活跃度增长只会越浪费，这个判断不因某次延迟测好或测坏而改变。

但不能对反直觉数字视而不见。三次预期落空，三次都是因为认真拆开数字去查原因，不是靠猜或者靠信念硬撑过去。

Harness 的价值不在"省了多少 token"，在"让谁来做判断"。装配层猜不到用户意图，模型自己知道；把判断权交给对的一方，这件事本身就值得做，token 数字只是用来指导怎么做，不是决定要不要做。

没有代码保障的假设，一定会在某个真实场景里落空。"模型会主动查"这个假设撞上了零工具调用的反例，好在补了告警，让问题从不可见变成可搜索。

---

参考资料：Databricks《What is an AI Agent Harness?》、LangChain《The Anatomy of an Agent Harness》、Martin Fowler《Harness engineering for coding agent users》、PuppyGraph《Agent Harness: What It Is and How to Build One》、Oracle Developers Blog《The Agent Loop Decoded》、DEV Community《Designing Your Own AI Harness》、Yao et al.《ReAct: Synergizing Reasoning and Acting in Language Models》(2022)。Aido harness 案例部分数据来源于项目内部架构规格文档。
