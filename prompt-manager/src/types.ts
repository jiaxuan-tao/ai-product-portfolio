export type SceneIcon = "briefcase" | "code" | "pen" | "chart" | "sparkle" | "target";

export interface Scene {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: SceneIcon;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PromptItem {
  id: string;
  sceneId: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  note: string;
  isFavorite: boolean;
  currentVersion: string;
  variableValues?: Record<string, string>;
  lastUsedAt?: string | null;
  deletedAt?: string | null;
  deletedWithSceneId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  number: string;
  content: string;
  note: string;
  createdAt: string;
}

export interface PromptBackup {
  schemaVersion: 1 | 2;
  exportedAt: string;
  app: "Prompt Manager";
  scenes: Scene[];
  prompts: PromptItem[];
  versions: PromptVersion[];
}

export type ImportMode = "merge" | "replace";
export type LibraryMode = "scene" | "favorites" | "recent" | "trash";
export type PromptSort = "updated" | "used" | "name";
