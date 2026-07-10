import type { PromptBackup, PromptItem, PromptVersion, Scene } from "./types";

export const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(value))
    .replaceAll("/", "/");

export const nextVersion = (version: string) => {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return "v1.0.1";
  return `v${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
};

export const textSnippet = (text: string, length = 180) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > length ? `${normalized.slice(0, length)}…` : normalized;
};

const isString = (value: unknown): value is string => typeof value === "string";

export function normalizeBackup(value: unknown): PromptBackup {
  if (!value || typeof value !== "object") throw new Error("文件不是有效的 JSON 对象");
  const source = value as Partial<PromptBackup>;
  if (!Array.isArray(source.scenes) || !Array.isArray(source.prompts) || !Array.isArray(source.versions)) {
    throw new Error("备份缺少 scenes、prompts 或 versions 数据");
  }

  const scenes = source.scenes.filter(
    (scene): scene is Scene => Boolean(scene && isString(scene.id) && isString(scene.name)),
  );
  const sceneIds = new Set(scenes.map((scene) => scene.id));
  const prompts = source.prompts.filter(
    (prompt): prompt is PromptItem =>
      Boolean(prompt && isString(prompt.id) && isString(prompt.sceneId) && sceneIds.has(prompt.sceneId)),
  );
  const promptIds = new Set(prompts.map((prompt) => prompt.id));
  const versions = source.versions.filter(
    (version): version is PromptVersion =>
      Boolean(version && isString(version.id) && isString(version.promptId) && promptIds.has(version.promptId)),
  );

  if (!scenes.length && !prompts.length) throw new Error("备份中没有可导入的数据");

  return {
    schemaVersion: 1,
    exportedAt: isString(source.exportedAt) ? source.exportedAt : new Date().toISOString(),
    app: "Prompt Manager",
    scenes,
    prompts,
    versions,
  };
}
