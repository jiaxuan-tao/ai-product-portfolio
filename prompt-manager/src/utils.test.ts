import { describe, expect, it } from "vitest";
import { nextVersion, normalizeBackup, textSnippet } from "./utils";

describe("Prompt Manager 数据工具", () => {
  it("递增补丁版本号", () => {
    expect(nextVersion("v1.2.9")).toBe("v1.2.10");
    expect(nextVersion("未知")).toBe("v1.0.1");
  });

  it("生成紧凑摘要", () => {
    expect(textSnippet("第一行\n  第二行", 20)).toBe("第一行 第二行");
  });

  it("过滤缺少父级关系的导入数据", () => {
    const backup = normalizeBackup({
      scenes: [{ id: "s1", name: "场景" }],
      prompts: [
        { id: "p1", sceneId: "s1" },
        { id: "p2", sceneId: "missing" },
      ],
      versions: [
        { id: "v1", promptId: "p1" },
        { id: "v2", promptId: "p2" },
      ],
    });
    expect(backup.prompts).toHaveLength(1);
    expect(backup.versions).toHaveLength(1);
  });
});
