# AI 热点采集 Skill

这是一个面向 Codex 的 AI 热点采集 Skill，用于搜索并整理过去 24 小时内值得关注的模型更新、AI 产品和开发工具动态。

## 功能

- 按模型更新、AI 产品和开发工具三个类别采集信息
- 只保留过去 24 小时内发布或发生的内容
- 优先引用官方公告、产品博客和项目仓库
- 自动合并重复事件，过滤缺少有效来源的内容
- 输出中文标题、事件时间、来源链接和关注理由

## 安装

需要先安装 Codex。

```bash
mkdir -p ~/.codex/skills/topic-collector
curl -sL https://raw.githubusercontent.com/jiaxuan-tao/vibe-coding-lab/main/ai-topic-collector-skill/SKILL.md \
  > ~/.codex/skills/topic-collector/SKILL.md
```

重新打开 Codex 后即可使用。

## 手动使用

在 Codex 对话中输入以下任一指令：

- `采集热点`
- `今日 AI 热点`
- `只看模型动态`
- `只看 AI 开发工具`

## 定时使用

在 Codex 的定时任务中设置每天执行一次，并在任务提示词中明确调用：

```text
请调用 $topic-collector，采集过去 24 小时的 AI 热点，并按模型更新、AI 产品和开发工具分类输出。
```

如果定时任务需要使用本地 Skill，请保持电脑开机并让 Codex 桌面应用处于运行状态。

## 输出示例

```text
今日 AI 热点

模型更新
1. 标题
   时间：2026-07-17
   来源：官方公告
   链接：https://example.com
   关注理由：说明这项更新对产品或开发工作的影响。
```

## 边界

该 Skill 依赖 Codex 可用的互联网搜索能力，不包含自建爬虫、资讯数据库或长期内容存储。重要信息仍应通过原始来源核验。
