# PRD｜Vibe Coding Prompt Library

## Background｜背景

Vibe Coding Prompt Library 是一个基于开源项目 promptcat 的轻量改造版本。原始 promptcat 提供了单 HTML、零依赖、本地优先的 Prompt 管理器思路，本项目将其改造成面向个人 Vibe Coding 工作流的提示词资料库。

在 Vibe Coding 中，用户经常需要反复编写类似的 PRD、Codex 指令、UI 修改说明、Debug 描述和项目文档 Prompt。当前问题不是缺少复杂平台，而是常用模板分散、不易复用、难以沉淀。

## User Problem｜用户问题

- Prompt 和 Codex 指令散落在不同聊天记录、项目文件和临时笔记中。
- 每次启动新项目时，需要重复整理类似的需求描述。
- 给 Codex 的指令如果结构不清晰，容易导致修改范围扩大。
- 文档类输出需要稳定结构，但人工重复组织成本高。
- 个人轻量工作流不需要登录、云同步和后端系统。

## Target User｜目标用户

目标用户是通过 Vibe Coding 推进轻量 AI 产品、小工具或页面项目的个人用户。

用户通常需要：

- 快速启动一个小项目。
- 将模糊想法整理成轻量 PRD。
- 给 Codex 提供清晰的修改指令。
- 对 UI、bug、README、changelog 等工作使用稳定 Prompt 模板。
- 在本地浏览器中沉淀自己的提示词资产。

## Product Goal｜产品目标

提供一个可以直接打开的本地 Prompt 模板库，让用户能够集中管理和复用 Vibe Coding 中高频使用的提示词。

产品目标包括：

- 降低重复编写 Prompt 的成本。
- 让 Codex 指令更结构化。
- 让项目文档 Prompt 可持续复用。
- 保持工具轻量、透明、可修改。
- 不引入不必要的服务端和复杂依赖。

## MVP Scope｜MVP 范围

MVP 包括：

- 单页 HTML 应用。
- 默认 Vibe Coding 分类。
- 默认 Prompt 模板。
- Prompt 搜索。
- 分类筛选。
- Prompt 详情查看。
- Prompt 正文复制。
- Prompt 新建、编辑、复制和删除。
- 浏览器本地存储。
- 项目 README 和 docs 文档。

## Non-goals｜暂不做什么

- 不做完整 SaaS。
- 不做用户账号。
- 不做团队协作。
- 不做云同步。
- 不接入 AI API。
- 不做后端服务。
- 不做复杂数据库。
- 不做付费、订阅或会员。
- 不引入 React、Vue、Next.js 等前端框架。

## Core Use Cases｜核心使用场景

- 用户有一个新产品想法，需要用 PRD Prompt 整理轻量 PRD。
- 用户准备让 Codex 修改代码，需要复制 Codex Build Instruction。
- 用户完成基础页面后，需要使用 UI Refinement Prompt 优化页面。
- 用户发现 bug，需要用 Bug Fix Prompt 描述问题、复现步骤和期望结果。
- 用户完成项目后，需要使用 README、Changelog、User Flow 和 Product Structure 模板补齐文档。
- 用户在使用过程中保存自己的 Prompt 变体，后续继续复用。

## Feature List｜功能列表

- 分类导航：展示所有默认分类和数量。
- Prompt 列表：展示标题、分类、说明和默认 / 保存状态。
- 搜索：按标题、分类、说明和正文搜索。
- 详情编辑：展示并编辑标题、分类、说明和正文。
- 复制正文：将 Prompt body 复制到剪贴板，并兼容本地文件场景。
- 本地保存：使用 `localStorage` 保存用户新增或修改内容。
- 复制模板：基于已有模板创建本地副本。
- 重置默认：恢复 8 个默认模板。

## Success Criteria｜成功标准

- 用户可以直接打开 `app/index.html` 使用。
- 默认 8 个分类和 8 个模板正常展示。
- 搜索和分类筛选可以定位模板。
- 用户可以复制任意 Prompt 正文。
- 用户可以保存新的 Prompt 或模板副本。
- 页面不依赖后端、构建工具、登录和 AI API。
- README 与 docs 清楚说明本项目基于 promptcat 的轻量改造。

## Future Iteration｜后续迭代方向

- 增加 JSON 导入 / 导出。
- 支持自定义分类。
- 支持标签和多维筛选。
- 增加模板版本记录。
- 支持 Markdown 预览。
- 增加更多 Vibe Coding 场景模板。
