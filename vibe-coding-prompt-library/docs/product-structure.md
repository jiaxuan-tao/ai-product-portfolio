# Product Structure｜Vibe Coding Prompt Library

## Page Structure｜页面结构

页面由三个主要区域组成：

- 顶部信息区：展示项目名称、副标题、中文定位和本地优先状态。
- 左侧分类区：展示默认分类和 Prompt 数量，提供新建与重置操作。
- 中间列表区：提供搜索框和 Prompt 列表。
- 右侧详情区：展示并编辑当前 Prompt 的标题、分类、说明和正文。

整体结构保持工具型界面，不做营销页或复杂视觉包装。

## Module Structure｜模块结构

- Category Module：负责分类展示、数量统计和筛选状态。
- Search Module：负责按关键词过滤 Prompt。
- Prompt List Module：负责展示当前筛选结果。
- Prompt Detail Module：负责查看、编辑和保存 Prompt。
- Copy Module：负责复制 Prompt 正文，并提供本地文件打开场景下的兼容复制方式。
- Storage Module：负责读取和写入浏览器本地数据。
- Default Template Module：负责提供首次使用时的 8 个默认模板。

## Prompt Data Structure｜Prompt 数据结构

每个 Prompt 使用轻量对象保存：

```json
{
  "id": "prd-draft-prompt",
  "title": "PRD Draft Prompt",
  "category": "PRD Prompts",
  "description": "Turn a raw product idea into a lightweight PRD for a Vibe Coding project.",
  "body": "Prompt body text",
  "isDefault": true,
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

当前版本只使用单层数据结构，不引入数据库表关系或复杂权限模型。

## Local-first Design｜本地优先设计

项目采用本地优先方式：

- 应用是一个单页 HTML 文件。
- 不需要安装依赖。
- 不需要启动服务。
- 不向服务器发送数据。
- 用户数据保存在当前浏览器的 `localStorage`。

这种设计适合个人 Prompt 资料库，但也意味着数据与当前浏览器环境绑定。清理浏览器数据、换设备或换浏览器后，需要手动迁移。

## Template System｜模板体系

默认模板围绕 Vibe Coding 的常见任务组织：

- PRD Prompts：把产品想法整理成轻量 PRD。
- Codex Instructions：给 Codex 提供结构化修改指令。
- UI Refinement：在不重构功能的前提下优化页面。
- Debug & Fix：描述问题、复现步骤和期望结果。
- README Writing：记录轻量项目背景、功能和运行方式。
- Changelog Writing：整理版本改动记录。
- User Flow：描述用户完成核心任务的路径。
- Product Structure：说明页面、模块和数据结构。

当前版本不是 AI 生成工具，而是 Prompt 资产管理工具。它的价值在于帮助个人把 Vibe Coding 中反复使用的提示词结构化沉淀。

## Current Limitation｜当前限制

- 不支持跨设备同步。
- 不支持导入 / 导出。
- 不支持自定义分类管理界面。
- 不支持 Markdown 预览。
- 不支持版本历史。
- 不支持团队共享。
- 本地保存依赖浏览器 `localStorage`。

## Possible Extension｜可能扩展

- 增加 JSON 导入 / 导出。
- 增加自定义分类。
- 增加标签系统。
- 增加 Markdown 预览。
- 增加模板版本记录。
- 增加更细的 Vibe Coding 场景模板。
- 在仍然保持本地优先的前提下，探索可选备份能力。
