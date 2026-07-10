import Dexie, { type EntityTable } from "dexie";
import { seedPrompts, seedScenes, seedVersions } from "./seed";
import type { ImportMode, PromptBackup, PromptItem, PromptVersion, Scene } from "./types";

class PromptManagerDatabase extends Dexie {
  scenes!: EntityTable<Scene, "id">;
  prompts!: EntityTable<PromptItem, "id">;
  versions!: EntityTable<PromptVersion, "id">;

  constructor() {
    super("prompt-manager-local-v3");
    this.version(1).stores({
      scenes: "id, name, updatedAt",
      prompts: "id, sceneId, title, isFavorite, updatedAt",
      versions: "id, promptId, number, createdAt",
    });
    this.version(2).stores({
      scenes: "id, name, createdAt, updatedAt",
      prompts: "id, sceneId, title, isFavorite, updatedAt",
      versions: "id, promptId, number, createdAt",
    });
    this.on("populate", async () => {
      await this.scenes.bulkAdd(seedScenes);
      await this.prompts.bulkAdd(seedPrompts);
      await this.versions.bulkAdd(seedVersions);
    });
  }
}

export const db = new PromptManagerDatabase();

export async function seedDatabase() {
  await db.transaction("rw", db.scenes, db.prompts, db.versions, async () => {
    if ((await db.scenes.count()) > 0) return;
    await db.scenes.bulkAdd(seedScenes);
    await db.prompts.bulkAdd(seedPrompts);
    await db.versions.bulkAdd(seedVersions);
  });
}

export async function createBackup(): Promise<PromptBackup> {
  const [scenes, prompts, versions] = await Promise.all([
    db.scenes.toArray(),
    db.prompts.toArray(),
    db.versions.toArray(),
  ]);
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "Prompt Manager",
    scenes,
    prompts,
    versions,
  };
}

export async function importBackup(backup: PromptBackup, mode: ImportMode) {
  await db.transaction("rw", db.scenes, db.prompts, db.versions, async () => {
    if (mode === "replace") {
      await Promise.all([db.versions.clear(), db.prompts.clear(), db.scenes.clear()]);
    }
    await db.scenes.bulkPut(backup.scenes);
    await db.prompts.bulkPut(backup.prompts);
    await db.versions.bulkPut(backup.versions);
  });
}

export async function deletePrompt(promptId: string) {
  await db.transaction("rw", db.prompts, db.versions, async () => {
    await db.versions.where("promptId").equals(promptId).delete();
    await db.prompts.delete(promptId);
  });
}

export async function deleteScene(sceneId: string) {
  await db.transaction("rw", db.scenes, db.prompts, db.versions, async () => {
    const promptIds = await db.prompts.where("sceneId").equals(sceneId).primaryKeys();
    await db.versions.where("promptId").anyOf(promptIds).delete();
    await db.prompts.bulkDelete(promptIds);
    await db.scenes.delete(sceneId);
  });
}
