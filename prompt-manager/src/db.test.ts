import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, movePromptToTrash, moveSceneToTrash, restorePrompt, restoreScene } from "./db";
import type { PromptItem, Scene } from "./types";

const now = "2026-07-11T00:00:00.000Z";

const scene: Scene = {
  id: "scene-test",
  name: "测试场景",
  description: "",
  color: "#6d5dfc",
  icon: "code",
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const prompt = (id: string): PromptItem => ({
  id,
  sceneId: scene.id,
  title: id,
  summary: "",
  content: "测试内容",
  tags: [],
  note: "",
  isFavorite: false,
  currentVersion: "v1.0.0",
  variableValues: {},
  lastUsedAt: null,
  deletedAt: null,
  deletedWithSceneId: null,
  createdAt: now,
  updatedAt: now,
});

describe("Prompt Manager 回收站", () => {
  beforeEach(async () => {
    await db.open();
    await db.transaction("rw", db.scenes, db.prompts, db.versions, async () => {
      await db.versions.clear();
      await db.prompts.clear();
      await db.scenes.clear();
      await db.scenes.add(scene);
      await db.prompts.bulkAdd([prompt("active"), { ...prompt("already-deleted"), deletedAt: now }]);
    });
  });

  afterAll(async () => {
    db.close();
  });

  it("恢复场景时只恢复随场景删除的提示词", async () => {
    await moveSceneToTrash(scene.id);
    expect((await db.prompts.get("active"))?.deletedWithSceneId).toBe(scene.id);
    expect((await db.prompts.get("already-deleted"))?.deletedWithSceneId).toBeNull();

    await restoreScene(scene.id);
    expect((await db.prompts.get("active"))?.deletedAt).toBeNull();
    expect((await db.prompts.get("already-deleted"))?.deletedAt).toBe(now);
  });

  it("单独恢复提示词时一并恢复所属场景", async () => {
    await movePromptToTrash("active");
    await db.scenes.update(scene.id, { deletedAt: now });
    await restorePrompt("active");

    expect((await db.prompts.get("active"))?.deletedAt).toBeNull();
    expect((await db.scenes.get(scene.id))?.deletedAt).toBeNull();
  });
});
