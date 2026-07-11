# GitHub 发布与分享清单

## 需要提前安装或准备什么

本机 Windows 不需要安装 macOS 构建工具，也不能直接构建 macOS 安装包。macOS 包由 GitHub Actions 的 `macos-latest` runner 构建。

本机需要：

- Git
- Node.js 20+
- Rust stable
- npm 依赖已安装

GitHub 需要：

- 一个 GitHub 仓库
- GitHub Actions 已启用
- 代码已推送到默认分支

macOS Universal 构建需要的 Rust targets 已经在 CI/release workflow 中自动安装：

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
```

你不需要在 Windows 本机安装这两个 target。

## 代码所在仓库

项目位于 `jiaxuan-tao/ai-product-portfolio` 的 `quota-float-native/` 目录，不单独创建仓库。提交项目变更时只暂存该目录、作品集索引和对应工作流。

```bash
git add .
git commit -m "更新 Quota Float Native"
git push origin main
```

## 生成可分享版本

推送 `quota-float-native-v*` tag 会触发专属 release workflow：

```bash
git tag quota-float-native-v0.1.2
git push origin quota-float-native-v0.1.2
```

构建完成后，到作品集仓库的 Releases 页面检查发布。附件应包含：

- `quota-float-native-windows-unsigned.zip`
- `quota-float-native-macos-universal-unsigned.zip`

确认 Release 和附件均已上传后，再分享项目专属 Release 链接。

## 发给 Mac 用户时的说明

当前 macOS 包是 unsigned 包。用户首次打开可能会被 Gatekeeper 拦截，可以这样打开：

1. 下载 `quota-float-native-macos-universal-unsigned.zip`。
2. 解压后把应用拖到 Applications 或任意测试目录。
3. 右键点击应用，选择 Open。
4. 在系统提示里再次选择 Open。
5. 如果仍被拦截，到 System Settings -> Privacy & Security 里允许打开。

## 以后公开分发还需要什么

如果要面向非技术用户公开分发，建议补：

- Windows 代码签名证书。
- Apple Developer ID Application 证书。
- Apple Team ID。
- Apple app-specific password。
- GitHub Secrets 中的签名和公证配置。

这些账号、证书和密码不能由代码生成，需要项目所有者申请或购买。
