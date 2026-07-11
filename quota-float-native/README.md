# Quota Float Native

一款采用 macOS 原生视觉语言的 Codex 额度悬浮窗。它读取本机 Codex Desktop
已有登录态，以只读方式查询真实额度，并在轻量、常驻置顶的小组件中展示结果。

![Quota Float Native quota states](docs/images/quota-states.png)

## 功能

- 展示套餐、5 小时额度、每周额度与下一次重置时间。
- 空闲时自动收起为悬浮小窗，鼠标移入后展开。
- 显示额度健康、提醒、临界、过期、未登录和不可用状态。
- 在额度发生变化时显示正在消耗状态。
- 支持窗口置顶、登录时启动与系统托盘操作。
- 当服务返回相关数据时，展示重置机会及其到期时间。
- 失败时保留可信的旧数据或显示不可用状态，不推测、伪造额度。

## macOS 原生视觉

界面使用系统 SF 字体、Vibrancy 风格半透明材质、系统状态色、原生圆角工具按钮
与环形额度仪表。Windows 版本保留完全相同的功能，并使用对应的系统字体回退。

| 额度状态 | 收起态 | 重置机会 |
| --- | --- | --- |
| ![健康、提醒与临界状态](docs/images/quota-states.png) | ![悬浮小窗](docs/images/quota-orb.png) | ![重置机会到期时间](docs/images/quota-reset-expiration.png) |

## 工作方式

应用读取本机 Codex Desktop 登录状态，并使用其中的现有会话查询 Codex/ChatGPT
额度端点。它不根据本地 token 数估算额度，不兑换重置机会，也不修改账号设置。

浏览器预览使用模拟数据；真实额度读取需要 Tauri 桌面应用，并要求同一台电脑已
登录 Codex Desktop。

## 下载

从作品集仓库的 [Quota Float Native v0.1.2 Release](https://github.com/jiaxuan-tao/ai-product-portfolio/releases/tag/quota-float-native-v0.1.2)
下载未签名构建：

- [macOS Universal](https://github.com/jiaxuan-tao/ai-product-portfolio/releases/download/quota-float-native-v0.1.2/quota-float-native-macos-universal-unsigned.zip)
- [Windows](https://github.com/jiaxuan-tao/ai-product-portfolio/releases/download/quota-float-native-v0.1.2/quota-float-native-windows-unsigned.zip)

未签名构建可能触发 macOS Gatekeeper 或 Windows SmartScreen。面向普通用户的
公开分发应使用已签名并公证的构建。

## 隐私与准确性

- 只读取本机 Codex 登录态以查询额度。
- 现有访问令牌只发送到 ChatGPT 额度端点。
- 仅在应用配置目录保存小组件偏好。
- 不保存 Codex 令牌、账号 ID、提示词、聊天记录、原始额度响应或本地认证路径。
- 不包含遥测、分析、崩溃上报或第三方追踪。

完整边界见 [PRIVACY.md](PRIVACY.md) 与 [SECURITY.md](SECURITY.md)。

## 本地开发

需要 Node.js 20+、Rust stable 与当前平台的 Tauri 2 系统依赖。

```bash
npm install
npm run dev
npm run test
npm run build
npm run tauri dev
```

桌面构建：

```bash
npm run tauri build
```

## Vibe Coding 迭代记录

这个项目从可用的额度读取基础出发，重点练习如何把真实反馈转化为可验证的桌面产品迭代：

- `v0.1.0`：保留额度读取和悬浮窗能力，建立 macOS 原生风格的视觉层。
- `v0.1.1`：根据实际截图修复百分号越界，移除英文切换并统一中文界面。
- `v0.1.2`：根据真机运行结果补齐 Tauri macOS 透明窗口能力，为展开卡片增加透明边距，修复四角白色背景。

每次修改都先在浏览器预览中检查布局，再通过 GitHub Actions 在 macOS Universal 与 Windows 环境执行 Rust 测试和完整 Tauri 构建。详细版本变化见 [CHANGELOG](CHANGELOG.md)。
