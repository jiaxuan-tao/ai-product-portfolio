# 参考来源｜Vibe Coding 提示词资料库

## 原始参考项目名称

promptcat

## 原始 GitHub 链接

[https://github.com/sevenreasons/promptcat](https://github.com/sevenreasons/promptcat)

## 原始 Demo 链接

[https://sevenreasons.github.io/promptcat/](https://sevenreasons.github.io/promptcat/)

## 本项目改造内容

本项目是基于开源项目 promptcat 的轻量改造版本。

本项目将 promptcat 的通用提示词管理器方向改造成个人 Vibe Coding 提示词模板库，重点服务 PRD、Codex 指令、UI 修改、问题修复、README、Changelog、用户流程和产品结构等高频工作流。

## 保留和复用的部分

- 保留单页 HTML 应用的产品形态。
- 保留无框架、无构建、零依赖的轻量方式。
- 保留本地优先的使用思路。
- 保留直接打开 HTML 文件即可使用的分发方式。
- 保留提示词管理器的基本信息结构：列表、分类、详情、复制和保存。

## 新增和调整的部分

- 将项目名称调整为 Vibe Coding 提示词资料库。
- 将页面文案调整为 Vibe Coding 工作流语境。
- 将默认分类替换为 Vibe Coding 相关分类。
- 新增 8 个面向个人 Vibe Coding 的默认提示词模板。
- 使用 `localStorage` 实现当前版本的轻量本地保存。
- 补充 README、PRD、user-flow、product-structure、prompts、changelog 和 reference 文档。
- 调整界面为简洁、轻量、偏 GitHub 工具感的样式。

## 开源协议注意事项

promptcat 的公开 README 中展示了 WTFPL license badge，并说明项目使用 HTML、CSS、Vanilla JS，零依赖，单 HTML 文件，本地存储。

当前项目保留原始项目名称、GitHub 链接和演示链接，并明确说明本项目是基于 promptcat 的轻量改造版本，而不是从零独立实现的项目。

如后续直接复制或大规模复用 promptcat 的原始代码，应继续保留上游归因和协议信息，并在发布或分发前检查上游仓库的最新 license 状态。
