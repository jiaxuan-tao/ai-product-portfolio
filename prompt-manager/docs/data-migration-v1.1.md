# v1.1 数据迁移说明

v1.1 继续使用数据库 `prompt-manager-local-v3`，Dexie schema 从版本 2 升级到版本 3，不创建新数据库，因此已有场景、提示词和版本历史会原地保留。

新增字段：

- `Scene.deletedAt`：场景软删除时间。
- `PromptItem.variableValues`：变量本地默认值。
- `PromptItem.lastUsedAt`：最近打开或复制时间。
- `PromptItem.deletedAt`：提示词软删除时间。
- `PromptItem.deletedWithSceneId`：标记提示词是否随场景一起删除，用于精确恢复。

升级时，旧记录会自动补齐空值。导出格式升级为 `schemaVersion: 2`；导入仍兼容 v1.0 的 `schemaVersion: 1` 备份。
