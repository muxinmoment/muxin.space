// 秋招投递跟踪数据 —— 私有页面 /tracker 的唯一数据源
//
// ⚠️ 这个页面加了 noindex + 不进 sitemap + 不进导航栏，搜索引擎搜不到。
//    但仓库是公开的，所以：不写身份证/手机号/内推人真名/HR 私聊原话。
//
// 更新方式：只改这个文件，然后 git push，Cloudflare 自动部署。

export type ApplyState =
  | "live" // 已投递，流程还在跑
  | "act" // 有实质进展（笔试/测评/面试）
  | "todo" // 岗位已确认，还没投
  | "dead" // 被筛掉
  | "quit"; // 主动放弃

export type Role = {
  title: string;
  loc?: string;
  status?: string;
};

export type Company = {
  name: string;
  date: string; // 投递日，未投用 "—"
  state: ApplyState;
  label: string; // 卡片上的状态标签
  roles: Role[];
  dir?: "Agent工程" | "AI应用" | "质量效能" | "混合";
  note?: string;
};

export const trackerUpdated = "2026-09-01";

/** 顶部那条最紧急的事，没有就设成 null */
export const deadline: {
  title: string;
  desc: string;
  dates: string[];
} | null = {
  title: "美团集中笔试 9/15 收口",
  desc: "网申写的是 10/17，但笔试窗口比它早整整一个月。志愿一「AI测试开发工程师」已网申成功，等笔试邀请。",
  dates: ["9/5 周六", "9/8 周二", "9/12 周五", "9/15 周二"],
};

export const companies: Company[] = [
  // ---------- 进行中 ----------
  {
    name: "美团",
    date: "09-01",
    state: "live",
    label: "网申成功",
    dir: "质量效能",
    roles: [
      { title: "AI测试开发工程师", loc: "深圳", status: "志愿一 · 网申成功" },
      { title: "AI Agent开发工程师", loc: "深圳", status: "志愿二 · 待开启" },
      { title: "AI全栈工程师", loc: "深圳", status: "志愿三 · 待开启" },
    ],
    note: "同一时间只跑 1 个流程 → 三志愿是排队不是并行，志愿一基本决定结果。JD 与实习经历逐条对应，是目前最对口的一投。",
  },
  {
    name: "鹰角网络",
    date: "08-07",
    state: "act",
    label: "笔试已考",
    dir: "质量效能",
    roles: [
      {
        title: "测试开发工程师 · Agent开发方向",
        loc: "上海",
        status: "08-15 笔试已考，等结果",
      },
    ],
    note: "T1 80% / T2 3% / T3 0%。题面与解法复盘已归档。",
  },
  {
    name: "拼多多",
    date: "08-09",
    state: "act",
    label: "笔试已考",
    dir: "Agent工程",
    roles: [
      {
        title: "AI Agent研发工程师 → 转服务端",
        loc: "上海",
        status: "提前批 · 综合测评 + 笔试均已完成",
      },
    ],
    note: "AI Infra 志愿当天被筛；AI Agent 志愿被建议转服务端，接受转岗后才拿到测评与笔试。08-23 笔试已考，结果未出。提前批与正式批可分开投，机会 +1。",
  },
  {
    name: "DeepSeek 幻方",
    date: "08-27",
    state: "live",
    label: "已提交",
    dir: "Agent工程",
    roles: [
      {
        title: "Agent Harness 团队 · 研发工程师",
        loc: "杭州",
        status: "直投，无需内推码",
      },
    ],
    note: "JD 点名 OpenClaw，Agent Loop / Tool Use / MCP / Context Engineering 与 Aido、KeeperKit 全命中。同批 Agent Infra 偏 Rust/C 系统底层，判定不匹配未投。",
  },
  {
    name: "小米",
    date: "08-27",
    state: "live",
    label: "已提交",
    dir: "Agent工程",
    roles: [
      { title: "Agent Harness 研发工程师", loc: "武汉", status: "第 4 志愿" },
    ],
    note: "教训：系统自动带出的附件是几个月前的旧简历，投递前必须核对附件版本。",
  },
  {
    name: "联想",
    date: "08-27",
    state: "live",
    label: "已提交",
    dir: "AI应用",
    roles: [
      { title: "AI应用开发工程师", loc: "深圳", status: "2027 AI 专项校招" },
    ],
    note: "教训：某板块保存长期失败，根因是站内登录态字段缺失 —— 保存请求从未真正发出，UI 却显示成功。表单填完必须刷新页面复核。",
  },
  {
    name: "快手",
    date: "08-12",
    state: "live",
    label: "流程中",
    dir: "AI应用",
    roles: [{ title: "AI应用开发工程师", loc: "杭州", status: "常规批" }],
  },
  {
    name: "哔哩哔哩",
    date: "08-08",
    state: "live",
    label: "已投递",
    dir: "AI应用",
    roles: [
      { title: "AI-Native开发工程师 · 后端" },
      { title: "【主站】AI创作项目工程师" },
    ],
    note: "2 志愿限投已用完。",
  },
  {
    name: "蔚来",
    date: "08-07",
    state: "live",
    label: "已投递",
    dir: "Agent工程",
    roles: [
      { title: "Agent应用开发工程师 · 社区" },
      { title: "座舱Agent Harness算法工程师" },
      { title: "Agent应用开发工程师 · 用户移动" },
    ],
    note: "技术提前批，限投 3 次名额已用完。",
  },
  {
    name: "网易雷火",
    date: "08-07",
    state: "live",
    label: "已投递",
    dir: "Agent工程",
    roles: [
      { title: "游戏Harness算法工程师", loc: "杭州" },
      { title: "游戏AI算法工程师 · 用户个性化Agent", loc: "杭州" },
    ],
  },
  {
    name: "网易互娱",
    date: "08-03",
    state: "live",
    label: "已投递",
    dir: "AI应用",
    roles: [
      { title: "AI应用工程师", loc: "广州" },
      { title: "AI Agent工程师 · 引擎方向", loc: "广州" },
    ],
    note: "最早投的一家，秋招起点。",
  },

  // ---------- 待投递 ----------
  {
    name: "腾讯",
    date: "—",
    state: "todo",
    label: "待筛岗位",
    roles: [
      {
        title: "27届常规校招 · AI 团队普通应届岗",
        status: "8/11 已启动，截止约 9/30",
      },
    ],
    note: "青云计划偏硕博不投，走常规批。",
  },
  {
    name: "深信服",
    date: "—",
    state: "todo",
    label: "提前批开放",
    dir: "Agent工程",
    roles: [
      {
        title: "X-STAR 顶尖AI人才计划 · Agent开发赛道",
        loc: "深圳",
      },
    ],
    note: "JD 偏顶会/竞赛/开源，叙事重点放在 Aido、KeeperKit 的独立从 0 到 1 落地。",
  },
  {
    name: "京东",
    date: "—",
    state: "todo",
    label: "窗口很长",
    roles: [{ title: "JDS新星计划 正式批", status: "简历接收 8/3 – 11/30" }],
    note: "不着急，可占位。TGT 顶尖计划的 Agent 岗偏研究且几乎都在北京。",
  },
  {
    name: "字节 Seed",
    date: "—",
    state: "todo",
    label: "独立项目",
    dir: "Agent工程",
    roles: [{ title: "Seed大模型人才校招", loc: "上海" }],
    note: "与主池投递机会互不影响。偏研究向，对本科不算友好。",
  },
  {
    name: "莲莲丝 / 三七互娱",
    date: "—",
    state: "todo",
    label: "待确认",
    dir: "AI应用",
    roles: [
      { title: "AI NPC方向算法工程师", loc: "上海", status: "27届提前批已开" },
    ],
    note: "与网易系、米哈游、鹰角同赛道，游戏经历是加分项。",
  },

  // ---------- 已结束 ----------
  {
    name: "阿里巴巴",
    date: "08-10",
    state: "dead",
    label: "全部被筛",
    dir: "混合",
    roles: [
      {
        title: "6 份申请 · 覆盖 5 个事业群",
        status: "08-17 确认全部被筛",
      },
    ],
    note: "教训：每业务集团仅 1 次机会，一次投递就要把 2 个意向都加进意向单，投完无法追加。",
  },
  {
    name: "字节跳动",
    date: "08-09",
    state: "dead",
    label: "全部被筛",
    dir: "Agent工程",
    roles: [
      { title: "AI应用工程师 Agent方向 · 抖音直播", loc: "深圳", status: "08-17 被筛" },
      { title: "Agent应用开发工程师 · 飞书", loc: "深圳", status: "08-17 被筛" },
    ],
    note: "账号级 4 次机会已用 2 次，剩 2 次要等次年 1 月刷新。",
  },
  {
    name: "米哈游",
    date: "08-06",
    state: "dead",
    label: "拒信",
    dir: "Agent工程",
    roles: [
      {
        title: "平台研发 · Agent全栈开发工程师",
        loc: "上海",
        status: "08-10 收到拒信",
      },
    ],
    note: "提前批与正式批合并限投 1 次，唯一机会已用完。",
  },
  {
    name: "科大讯飞",
    date: "08-07",
    state: "dead",
    label: "放弃笔试",
    dir: "Agent工程",
    roles: [
      {
        title: "Agent研发工程师 · Harness方向",
        loc: "合肥",
        status: "测评已过，笔试放弃",
      },
    ],
    note: "两次笔试邀请都是 C++/Java/Go 三选一，无 Python 子卷；岗位在合肥不在目标城市。笔试机会只发两次，已结束。",
  },
  {
    name: "多益网络",
    date: "—",
    state: "quit",
    label: "主动放弃",
    roles: [{ title: "—", status: "08-26 决定不投" }],
    note: "公司调性不合。",
  },
];

/** 关键节点，倒序 */
export const milestones: {
  date: string;
  kind: "good" | "bad" | "warn" | "plain";
  text: string;
}[] = [
  { date: "09-01", kind: "good", text: "美团三志愿全部提交，志愿一 AI测试开发工程师网申成功" },
  { date: "08-28", kind: "warn", text: "主动降档休息 —— 连续被筛叠加实习占满，进入疲劳期" },
  { date: "08-27", kind: "good", text: "小米 / 联想 / DeepSeek 一天投出三家" },
  { date: "08-24", kind: "warn", text: "策略下沉中小厂：深信服、京东进入候选" },
  { date: "08-23", kind: "plain", text: "拼多多技术笔试（结果未出）" },
  {
    date: "08-17",
    kind: "bad",
    text: "阿里 6 申请 + 字节 2 岗全部被筛 → 战略调整：主攻二线池 + 把笔试面试当翻盘点",
  },
  { date: "08-15", kind: "plain", text: "鹰角笔试已考 · 拼多多综合测评完成" },
  { date: "08-12", kind: "good", text: "快手 AI应用开发工程师投出" },
  { date: "08-10", kind: "bad", text: "米哈游拒信 —— 唯一投递机会用完" },
  { date: "08-03", kind: "good", text: "网易互娱首投，秋招正式开跑" },
];
