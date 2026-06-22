---
title: "做 Aido 记忆系统 Backend 时，我重新梳理了偏好记忆到底该由谁负责"
description: "这次做 Aido Preference Memory V1，我真正想清楚的不是抽象概念本身，而是 web、backend、agent 三端应该怎么分工，后端为什么必须接住偏好记忆的落库、版本管理和加载链路。"
pubDate: 2026-06-21
category: "项目记录"
tags:
  - aido
  - backend
  - memory-system
  - preference-memory
  - spring-boot
  - ddd-lite
draft: false
---

这次做 Aido 记忆系统 backend，我最大的收获并不是又背了一遍 `Entity`、`Repository`、`DTO` 这些术语，而是终于把一个更实际的问题想清楚了：

> 在 Aido 这种前端、backend、agent 分开的系统里，偏好记忆到底该由谁负责，边界应该画在哪里？

如果这个问题不先讲清楚，后面代码很容易写着写着就乱掉。因为“记忆系统”听起来像一个很抽象的大模块，但真正落到工程里，它其实不是一个模糊概念，而是一条非常具体的业务链路。

## 先把 Aido 的三层分工说清楚

我现在的 Aido 更适合这样理解：

```text
Web 前端
  -> 负责展示、交互、触发操作

Backend
  -> 负责业务事实、数据库、接口编排、权限校验、状态管理

Agent
  -> 负责模型推理、结构化提取、反刍生成、AI 能力执行
```

这次做的记忆系统，不是让某一端“全包”，而是三端协作：

- `web` 负责触发和展示，比如以后查看偏好、触发反刍、管理说明书版本。
- `agent` 负责生成候选结果，比如从计划差异里提取偏好，或者把一批偏好反刍成一份候选说明书。
- `backend` 负责把这些 AI 结果变成可管理、可落库、可回滚、可加载的业务事实。

这也是我这次最明确的一点：`agent` 不是偏好记忆的最终事实来源，`backend` 才是。

## 这次 backend 真正在做什么

如果只用一句话概括这次的工作，其实就是：

> 把 agent 产出的“候选偏好”接住，变成 backend 可管理的 Preference Memory V1。

这条 V1 链路的最小闭环是这样的：

```text
Preference v2 提取偏好
-> backend 保存 hot preferences
-> backend 手动触发 rumination
-> backend 保存 private manual version
-> backend 标记已消费的 hot preferences
-> Planner 加载 active manual 的 model_text
```

这里最关键的一点在于，backend 不是单纯“转发接口”，而是在做几件 agent 不应该直接做的事情：

- 校验哪些偏好值得入库
- 维护偏好碎片的状态
- 维护 private manual 的版本
- 决定当前哪个 manual 是 active
- 给 planner 组装稳定可用的记忆上下文

这已经不是一个简单的“调模型接口”问题了，它本质上是一个业务系统问题。

## 为什么偏好记忆的事实数据要落在 backend

这次看完方案之后，我对这个边界判断更坚定了。

Preference Memory V1 的核心原则可以概括成一句话：

```text
aido-agent 负责生成 proposal
aido-backend 负责校验、落库、版本管理、Planner 加载
```

这样设计有几个很现实的原因。

### 1. agent 负责推理，不负责业务事实

agent 擅长的是：

- 从计划差异中提取候选偏好
- 根据 hot preferences 反刍出 candidate manual
- 输出结构化 JSON

但它不应该直接决定：

- 这条偏好是否进入正式存储
- 用户当前哪份 manual 生效
- 删除、禁用、回滚后如何处理历史版本

这些都属于业务事实管理，不是模型推理本身。

### 2. 可见、可删、可禁用的数据必须由 backend 统一管理

只要你希望以后做这些能力：

- 用户查看自己的偏好
- 用户删除某条偏好
- 用户禁用某条偏好
- 用户查看 manual 历史版本
- planner 始终读取当前 active 版本

那这些数据就应该统一在 backend 的业务库里，而不是散落在 agent 内部。

### 3. backend 更适合做状态和事务

比如一次 rumination 成功之后，backend 需要保证这些动作一起成立：

- 新 manual 成功保存
- 旧 active manual 被归档
- 新 manual 被激活
- 本次参与反刍的 hot preferences 标记为 `consumed`

这就是典型的事务边界。  
agent 可以负责产出候选结果，但这类“多状态一起落地”的动作，更适合由 backend 来接住。

## Preference Memory V1 具体落了哪些东西

这次我也不再把“记忆系统”想得太大，而是先收缩成一个非常小但闭环的版本。

V1 真正需要的核心存储只有两块：

### 1. `hot_preferences`

它的角色是“临时偏好碎片池”。

来源目前主要是：

- `Preference v2` 从 `ai_draft_plan` 和 `user_final_plan` 的差异中提取出来的偏好

它存的是候选偏好，不是最终稳定偏好。  
所以它更像一个等待后续处理的中间层。

我现在会把它理解成：

```text
模型先观察到一些偏好碎片
-> backend 先把它们放进 hot pool
-> 后面再决定哪些被反刍进 manual
```

### 2. `private_manual_versions`

这个表保存的是“用户私人偏好说明书”的版本。

它不是一堆零散偏好，而是经过整理后的稳定视图。  
而且它会同时保存两种表达：

- `rules_json`：结构化规则，方便系统处理
- `model_text`：给 planner 看的偏好说明书
- `user_text`：给用户看的自然语言说明

这一步非常关键，因为它意味着 backend 不只是存“数据”，而是在存“可被模型使用的稳定偏好视图”。

## 这次我真正学到的，不是全量 DDD，而是 DDD-lite

如果硬要说这次的架构学习点，我觉得更准确的词不是“我做了 DDD”，而是：

> 我开始理解为什么这个模块至少要往 DDD-lite 的方向靠。

原因很简单。偏好记忆已经开始具备自己的业务规则了：

- hot preference 有自己的状态流转
- manual 有自己的版本和激活规则
- rumination 不是单表 CRUD，而是一条业务链路
- planner 读取的也不是某张表原样数据，而是经过整理的上下文视图

这种时候如果继续只靠“Controller 调 Service，Service 全包”，短期能跑，长期一定会越写越肿。

所以更合理的理解是：

- 现在还没必要把整个 backend 重构成完整 DDD
- 但 memory 这个模块已经值得做 DDD-lite
- 也就是先把职责边界拆清楚，让代码不要全堆在 service 里

## 这几个后端概念，放到这次模块里终于不再抽象

以前学这些词，容易停留在定义层。  
这次因为是带着真实模块去看，反而更容易理解。

### Entity

这次我对 `Entity` 的理解更具体了。

它不是“数据库表映射类”这么简单，而是业务里真正需要被识别和管理的对象。

放到这次模块里，很自然的两个实体就是：

- `HotPreference`
- `PrivateManualVersion`

它们各自都有明确身份，也各自有自己的状态和生命周期。

### Repository

`Repository` 在这里也不是“换个名字写 DAO”。

它的价值在于：让业务流程不直接操作 SQL 细节，而是通过存取接口处理实体。

比如这次非常典型的查询就包括：

- 按 `userId + status` 查找待反刍的 hot preferences
- 查找用户当前 active 的 manual
- 查找用户最新版本的 manual

这些一旦被收束进 repository，后面 service 的职责就更清晰，不需要一边写流程一边关心持久化细节。

### DTO

这次我也更清楚为什么不能把数据库实体直接当接口对象用。

因为前后端和 agent 之间传输的数据，不等于数据库真正存储的数据。

举个很实际的例子：

- agent 的 preference 提取响应，是偏向 AI 推理结果的结构
- backend 的 `HotPreference`，是偏向业务落库结构
- planner 最后加载的 memory context，又是偏向提示词消费结构

这三者根本不是一回事。  
如果全混用一个对象，后面一定很难维护。

## 这次最重要的职责判断：哪些东西属于 application，哪些属于 infrastructure

这也是我这次梳理得比较透的一点。

### `PreferenceMemoryService` 更像 application service

因为它负责的不是底层工具，而是业务流程编排，比如：

- 提取并保存 hot preferences
- 触发 rumination
- 发布新的 manual version
- 标记 consumed
- 给 planner 组装 memory context

这就是典型的应用层职责。它在编排流程，但不应该吞掉一切实现细节。

### `AgentClient` 更像 infrastructure

不管它最终是单独类，还是从现有服务里抽出来，本质上它都是“和外部系统交互”的能力。

它做的是：

- 调 `aido-agent` 的 HTTP 接口
- 收发 JSON
- 处理 trace_id、model_name 之类的接入参数

所以它更适合被放在 `infrastructure/client` 一类的位置，而不是被误当成业务核心。

这个判断很重要，因为它直接决定了后面目录和依赖关系怎么长。

## 如果只对 memory 模块做整理，我现在更认可这种结构

我目前更倾向把 memory 先收成一个相对独立的能力模块，再在内部做轻量分层。

像这样：

```text
memory/
  controller/
  application/
  domain/
  infrastructure/
```

或者如果继续按能力域划分整个 agent backend，也可以是：

```text
agent/
  planner/
  memory/
  goal/
  review/
  shared/
```

我现在更认同第二种思路作为长期结构，因为它更符合 Aido 这种多能力并行演进的系统。

也就是说，先按业务能力拆，再在每个能力内部逐渐分层，而不是一开始就把整个项目平铺成统一的 `application / domain / infrastructure` 大目录。

## 这次做完之后，我对 V1 和非 V1 的边界也更清楚了

V1 要解决的是最小闭环，不是一次性把记忆系统做成“大脑”。

这次明确不在 V1 里做的东西，包括：

- warm / cold memory 检索
- 自动定时 rumination
- 复杂的前端管理台
- LangGraph 编排接管整个反刍流程
- agent 直接写 MySQL

这点很重要。因为如果不主动收缩范围，“记忆系统”这个词会非常容易把工程拖进过度设计。

## 我今天最核心的认知变化

如果只让我用一句话总结今天这轮 backend 学习，我会这样说：

> 真正重要的不是会不会讲 DDD，而是你能不能把 AI 系统里“推理结果”和“业务事实”分开。

对这次 Aido 的 Preference Memory V1 来说：

- `agent` 负责生成候选偏好和候选 manual
- `backend` 负责接住这些候选结果，变成有状态、有版本、可加载的记忆事实
- `planner` 最后消费的是 backend 整理后的 active manual，而不是 agent 临时吐出来的一堆原始结果

这也是为什么我现在看这次工作，已经不再把它理解成“给 backend 加两个表”，而是：

> 给 Aido 补上了一条真正属于产品系统的长期记忆链路。

它还只是 V1，但方向已经比较清楚了。
