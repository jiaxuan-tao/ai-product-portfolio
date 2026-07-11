# 已知限制

- Codex 数据来自非公开只读接口，字段或认证方式可能变化。
- 当前发布包未签名、未公证；Windows 可能触发 SmartScreen，macOS 可能触发 Gatekeeper。
- macOS Universal 包由 GitHub Actions 的 `macos-latest` runner 构建，不能在 Windows 本机直接生成。
- Claude provider 在 v1 中未启用。
- 重置机会只读取数量和到期时间，不能在应用内兑换。
- 真实额度准确性依赖 Codex 后端返回的窗口数据；应用不会根据本地 token 消耗自行估算额度。
- CSS 毛玻璃效果在 Windows WebView2 中对桌面背景的支持有限；当前设计优先保证透明圆角悬浮球的一致外观。
- 公开分发前建议补齐 Windows 代码签名、macOS Developer ID 签名和 notarization。
