# What to Eat UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复用户反馈的八项布局、交互、分类和结果视觉问题，并保持纯前端、无外部运行时资源。

**Architecture:** 页面继续使用 Vanilla JavaScript 和 Canvas。筛选菜单抽成独立增强模块，菜品结果视觉抽成独立 Canvas 渲染模块，分层候选规则下沉到 `picker.js`，主应用只负责编排状态。桌面、平板和手机均由 `100dvh` 约束，不允许页面主体产生滚动条。

**Tech Stack:** HTML、CSS、ES Modules、Canvas 2D、Node.js test、Playwright。

## Global Constraints

- 不引入后端、数据库、外部图片、外部字体或运行时 CDN。
- 保留“趣味食堂”的墨绿、朱红、芥末黄、米白视觉体系。
- 桌面、平板和手机页面主体都必须一屏展示，弹窗自身可以滚动。
- 93 道预设菜品必须各自产生独立且与菜名、菜品类型对应的本地 Canvas 视觉。
- 所有新增交互必须支持键盘、焦点状态和 `prefers-reduced-motion`。

---

### Task 1: Regression Contracts

**Files:**
- Modify: `what-to-eat/tests/picker.test.js`
- Modify: `what-to-eat/tests/ui-contract.test.js`
- Create: `what-to-eat/tests/food-art.test.js`

- [ ] 添加第一层大类不受餐次、口味和预算筛选影响的失败测试。
- [ ] 添加一屏布局、自定义下拉、日期文案、按钮容器、工具状态和结果 Canvas 的失败契约。
- [ ] 添加 93 道菜都能得到唯一视觉描述的失败测试。
- [ ] 运行 `cd what-to-eat && npm test`，确认新增测试因功能缺失而失败。

### Task 2: Hierarchy and Filter Menus

**Files:**
- Modify: `what-to-eat/picker.js`
- Create: `what-to-eat/select-menu.js`
- Modify: `what-to-eat/app.js`
- Modify: `what-to-eat/index.html`

- [ ] 在 `picker.js` 实现 `createHierarchyCandidates()`，第一层固定返回完整常见大类，第二层和菜品层才应用筛选。
- [ ] 实现可复用自定义下拉菜单，支持点击外部关闭、Escape、方向键、Home/End 和原生 `change` 事件。
- [ ] 在顶部筛选和菜库表单接入自定义菜单，保留原生 `select` 作为表单数据源。
- [ ] 运行测试并确认分类与菜单契约通过。

### Task 3: One-Screen Layout and State Clarity

**Files:**
- Modify: `what-to-eat/index.html`
- Modify: `what-to-eat/styles.css`
- Modify: `what-to-eat/app.js`

- [ ] 将应用外壳改为固定 `100dvh`，主区域使用剩余高度，转盘尺寸同时受宽度和高度约束。
- [ ] 压缩候选行并在小屏改为紧凑网格，确保页面主体无纵向和横向滚动。
- [ ] 将候选日期改为明确日期文案，把“鲜”印章改为“今日”，把两个票据按钮放入独立网格容器。
- [ ] 当前路径改为不可点击状态块，只有已完成路径使用返回按钮。
- [ ] 音效与菜库按钮增加文字、开关状态和展开状态，打开或关闭后视觉立即变化。

### Task 4: Per-Dish Artwork

**Files:**
- Create: `what-to-eat/food-art.js`
- Modify: `what-to-eat/index.html`
- Modify: `what-to-eat/styles.css`
- Modify: `what-to-eat/app.js`

- [ ] 实现基于菜品 `id`、`name`、`visual`、`group` 的确定性 Canvas 插画描述。
- [ ] 为粉面、饭、火锅、寿司、烧烤、汉堡、披萨、沙拉、甜品等视觉类型绘制不同餐盘构图。
- [ ] 结果弹窗每次根据当前菜品重绘插画，并同步 Canvas 的可访问名称。
- [ ] 菜系中间结果使用对应分类海报，不再复用具体菜品图片。

### Task 5: Verification and Delivery

**Files:**
- Modify: `what-to-eat/README.md`
- Modify: `what-to-eat/docs/images/what-to-eat-preview.png`

- [ ] 运行全部 Node 测试、语法检查和 `git diff --check`。
- [ ] 使用 Playwright 在 `2048×1024`、`1440×900`、`1366×768`、`768×1024`、`390×844` 验证一屏、正圆、无重叠和核心流程。
- [ ] 验证 93 道菜视觉签名唯一，并抽样检查至少 12 种菜品类型。
- [ ] 更新 README 与总览截图，提交、推送并等待 GitHub Pages 成功部署。
- [ ] 在线再次验证直接模式、三级菜系模式、音效、菜库、自定义下拉和结果插画。
