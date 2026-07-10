# User Flow｜Vibe Coding Prompt Library

## 1. 用户进入页面

- User Action｜用户动作：用户打开 `app/index.html`。
- System Response｜系统反馈：页面展示 Vibe Coding Prompt Library 标题、默认分类、Prompt 列表和 Prompt 详情区域。
- Product Note｜产品说明：应用不需要登录和网络请求，默认内容从页面内置数据加载，本地修改保存在浏览器中。

## 2. 查看默认 Prompt 分类

- User Action｜用户动作：用户查看左侧分类列表。
- System Response｜系统反馈：系统展示 PRD Prompts、Codex Instructions、UI Refinement、Debug & Fix、README Writing、Changelog Writing、User Flow、Product Structure 等分类，并显示数量。
- Product Note｜产品说明：默认分类围绕 Vibe Coding 的常见任务组织，而不是通用 Prompt 管理分类。

## 3. 搜索或筛选 Prompt

- User Action｜用户动作：用户点击分类，或在搜索框输入关键词。
- System Response｜系统反馈：系统实时过滤 Prompt 列表，展示符合分类和关键词的结果。
- Product Note｜产品说明：搜索范围包括标题、分类、简短说明和 Prompt 正文，方便从任务名称或正文关键词定位模板。

## 4. 查看 Prompt 详情

- User Action｜用户动作：用户点击中间列表中的某个 Prompt。
- System Response｜系统反馈：右侧详情区展示 Prompt 的标题、分类、说明和正文。
- Product Note｜产品说明：详情区同时是编辑区，用户可以直接基于模板调整内容。

## 5. 复制 Prompt

- User Action｜用户动作：用户点击 `Copy body`。
- System Response｜系统反馈：系统将 Prompt 正文复制到剪贴板，并显示复制状态。
- Product Note｜产品说明：复制动作只处理正文，便于用户直接粘贴到 Codex 或其他对话窗口中。

## 6. 根据当前项目修改占位符内容

- User Action｜用户动作：用户在复制后替换 `[填写...]` 或 `[在这里...]` 等占位符。
- System Response｜系统反馈：如果用户在页面中直接编辑，系统标记为未保存变更。
- Product Note｜产品说明：占位符让模板保持可复用，同时保留每个项目的具体上下文。

## 7. 保存新的 Prompt

- User Action｜用户动作：用户点击 `New prompt` 新建，或点击 `Duplicate` 基于默认模板创建副本，然后点击 `Save prompt`。
- System Response｜系统反馈：系统将 Prompt 保存到浏览器 `localStorage` 中，并更新列表。
- Product Note｜产品说明：本地保存适合个人资料库，不需要后端或账号。

## 8. 后续复用

- User Action｜用户动作：用户再次打开页面，通过分类或搜索找到保存过的 Prompt。
- System Response｜系统反馈：系统从本地存储读取用户保存的数据并展示。
- Product Note｜产品说明：复用价值来自持续沉淀；当前版本的数据与浏览器和设备绑定。
