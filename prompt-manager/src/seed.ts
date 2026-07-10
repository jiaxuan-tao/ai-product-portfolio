import type { PromptItem, PromptVersion, Scene } from "./types";

const createdAt = "2026-07-10T09:00:00.000Z";

export const seedScenes: Scene[] = [
  {
    id: "scene-product",
    name: "产品需求分析",
    description: "用于拆解产品需求、用户故事和验收标准",
    color: "#6d5dfc",
    icon: "briefcase",
    createdAt: "2026-07-10T09:00:00.000Z",
    updatedAt: createdAt,
  },
  {
    id: "scene-code",
    name: "代码开发",
    description: "代码生成、重构、评审与故障排查",
    color: "#16a7a1",
    icon: "code",
    createdAt: "2026-07-10T09:00:01.000Z",
    updatedAt: createdAt,
  },
  {
    id: "scene-writing",
    name: "内容创作",
    description: "写作润色、选题策划与多平台改写",
    color: "#e765a3",
    icon: "pen",
    createdAt: "2026-07-10T09:00:02.000Z",
    updatedAt: createdAt,
  },
  {
    id: "scene-data",
    name: "数据洞察",
    description: "数据分析、指标解读与结论表达",
    color: "#f29b45",
    icon: "chart",
    createdAt: "2026-07-10T09:00:03.000Z",
    updatedAt: createdAt,
  },
];

export const seedPrompts: PromptItem[] = [
  {
    id: "prompt-requirement",
    sceneId: "scene-product",
    title: "需求文档评审助手",
    summary: "从用户价值、范围边界和验收标准三个角度评审需求文档。",
    content:
      "你是一名资深产品经理。请阅读我提供的需求文档，并完成以下评审：\n\n1. 用一句话概括目标用户与核心价值。\n2. 找出范围不清、依赖缺失或逻辑冲突之处。\n3. 将需求拆分为可验证的用户故事。\n4. 为每个故事补充 Given / When / Then 验收标准。\n5. 输出风险、待确认问题和建议优先级。\n\n请使用简体中文，以 Markdown 表格输出。",
    tags: ["产品", "需求评审"],
    note: "适合需求进入开发排期前使用。",
    isFavorite: true,
    currentVersion: "v1.0.2",
    createdAt,
    updatedAt: "2026-07-10T10:20:00.000Z",
  },
  {
    id: "prompt-user-story",
    sceneId: "scene-product",
    title: "用户故事生成器",
    summary: "把自然语言需求转成结构清晰、可验收的用户故事。",
    content:
      "请将以下需求转写为用户故事。每条必须包含：角色、目标、价值、前置条件、主流程、异常流程和验收标准。不要补充未经确认的业务规则；不确定内容统一放入“待确认问题”。",
    tags: ["产品", "用户故事"],
    note: "",
    isFavorite: false,
    currentVersion: "v1.0.0",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "prompt-refactor",
    sceneId: "scene-code",
    title: "安全重构计划",
    summary: "先识别约束和测试缺口，再输出可回滚的渐进式重构方案。",
    content:
      "你是一名负责大型代码库演进的技术负责人。分析下面的代码与目标，在不改变外部行为的前提下制定重构计划。\n\n输出：\n- 当前职责与依赖\n- 主要风险和隐式约束\n- 需要先补充的测试\n- 按最小可验证单元拆分的步骤\n- 每一步的验证与回滚方案",
    tags: ["工程", "重构"],
    note: "先让模型提问，再进入代码修改。",
    isFavorite: true,
    currentVersion: "v1.1.0",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "prompt-polish",
    sceneId: "scene-writing",
    title: "中文文案精修",
    summary: "保留原意与语气，降低机器感，给出修改依据。",
    content:
      "请精修下面的中文文案。保持事实、立场和信息密度不变，删除空话与重复表达，使句子更自然。输出“精修稿”和不超过 5 条的“关键修改说明”。",
    tags: ["写作", "润色"],
    note: "",
    isFavorite: false,
    currentVersion: "v1.0.1",
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "prompt-insight",
    sceneId: "scene-data",
    title: "数据结论提炼",
    summary: "从数据中区分事实、解释与行动建议。",
    content:
      "分析我提供的数据。严格区分：1）数据直接支持的事实；2）可能的解释；3）需要额外验证的假设；4）建议采取的行动。不得把相关性表述为因果关系。",
    tags: ["数据", "分析"],
    note: "",
    isFavorite: false,
    currentVersion: "v1.0.0",
    createdAt,
    updatedAt: createdAt,
  },
];

export const seedVersions: PromptVersion[] = seedPrompts.flatMap((prompt) => {
  const base: PromptVersion = {
    id: `version-${prompt.id}-initial`,
    promptId: prompt.id,
    number: "v1.0.0",
    content: prompt.content,
    note: "初始版本",
    createdAt: prompt.createdAt,
  };
  if (prompt.currentVersion === "v1.0.0") return [base];
  return [
    base,
    {
      ...base,
      id: `version-${prompt.id}-current`,
      number: prompt.currentVersion,
      note: "优化指令结构与输出约束",
      createdAt: prompt.updatedAt,
    },
  ];
});
