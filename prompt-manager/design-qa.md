# Design QA · v1.1

- Source visual truth: `docs/screenshots/home.png`（v1.0 现有产品界面）
- Browser-rendered implementation: `docs/screenshots/v1.1-home.png`
- Combined comparison evidence: `docs/screenshots/v1.1-qa-comparison.png`
- Focused interaction evidence: `docs/screenshots/v1.1-version-diff.png`
- Viewport: 1624 × 920，浅色主题，产品需求分析场景
- State: v1.1 已加载，筛选排序栏可见，两个提示词卡片可见

## Full-view comparison evidence

v1.0 基准与 v1.1 实现已放入同一张并排画布比较。v1.1 保留了既有顶栏、约三分之一宽场景栏、双列提示词卡片、紫色/青绿色令牌、字体层级、圆角与留白节奏。新增筛选排序栏和侧栏资源入口属于本次功能范围，未改变页面主层级。

没有发现 P0/P1/P2 视觉差异。筛选栏使提示词网格下移约 58px，这是为新增功能保留的明确区域，且没有遮挡固定操作或破坏桌面端信息密度。

## Focused region comparison evidence

- 版本对比窗口：`docs/screenshots/v1.1-version-diff.png` 验证了选择器、差异图例、统一差异视图和完成操作的层级；新增/删除语义色在浅色背景上清晰可辨。
- 筛选与排序：控件沿用原有边框、圆角、系统字体与紫色焦点令牌，未引入新的视觉体系。
- 回收站：恢复与永久删除分别使用主色和危险色；卡片降低不透明度但正文仍可读。
- 变量预览：左侧字段、右侧等宽渲染结果与现有编辑器/表单结构一致。

这些区域包含 v1.1 中最密集的新控件，因此进行了聚焦检查；其余收藏与最近使用入口复用已有按钮与图标模式，无需额外裁切证据。

## Required fidelity surfaces

- Fonts and typography: passed. 继续使用系统中文字体和本地等宽字体；标题、辅助信息、标签与代码内容的字号、字重、行高和截断保持一致。
- Spacing and layout rhythm: passed. 主区域比例、场景卡片、双列网格、58px 筛选栏、弹窗内边距、控件间距和圆角均与现有设计系统协调。
- Colors and visual tokens: passed. 新功能只使用既有紫色、青绿色、表面色、边框色和危险色；深色主题对应令牌已覆盖差异色。
- Image quality and asset fidelity: passed. UI 图标继续使用 Phosphor；PWA 图标使用 Phosphor BracketsCurly 原始路径并保留 MIT 说明，没有占位图或低清素材。
- Copy and content: passed. 全部新增固定文案为简体中文，变量、恢复、永久删除与最近使用的行为说明清楚。
- Accessibility: passed for desktop scope. 新按钮具有可访问名称，原生选择框可键盘操作，危险操作有二次确认，状态差异不只依赖颜色。

## Primary interactions tested

- 打开提示词并自动记录最近使用。
- 编辑含 `{{audience}}`、`{{tone}}` 的正文，自动识别变量、填充值并核对渲染结果。
- 保存 `v1.0.1`，打开版本对比并看到按行新增/删除内容。
- 将提示词移入回收站，验证计数、回收站列表和恢复流程。
- 验证收藏/最近使用/回收站入口、标签筛选与排序控件均暴露在浏览器可访问树中。
- 浏览器控制台最终无 warning/error。

## Comparison history

### v1.1 pass 1

- 未发现可执行的 P0/P1/P2 问题，无需视觉修复迭代。
- [P3] v1.1 卡片区域因筛选栏略向下移动；属于功能增加后的预期差异，保留。
- [P3] PWA 使用 SVG `sizes: any` 图标以保持清晰和较小体积；后续若要覆盖更旧的安装环境，可补 192/512 PNG。

## Implementation checklist

- [x] 同视口并排比较 v1.0 与 v1.1 首页。
- [x] 检查版本对比、变量、回收站关键状态。
- [x] 检查字体、间距、颜色、素材、文案与可访问性。
- [x] 检查浏览器控制台。
- [x] 运行 TypeScript、7 项单元测试和 GitHub Pages 生产构建。

final result: passed
