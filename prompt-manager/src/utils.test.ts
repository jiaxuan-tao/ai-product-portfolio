import { describe, expect, it } from "vitest";
import { extractVariables, nextVersion, normalizeBackup, renderTemplate, textSnippet } from "./utils";

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
    expect(backup.schemaVersion).toBe(2);
    expect(backup.prompts[0].variableValues).toEqual({});
  });

  it("提取去重后的模板变量", () => {
    expect(extractVariables("为 {{ audience }} 写 {{tone}} 文案，再检查 {{audience}}"))
      .toEqual(["audience", "tone"]);
  });

  it("渲染已有变量并保留未填写占位符", () => {
    expect(renderTemplate("面向 {{audience}}，采用 {{tone}}", { audience: "产品经理", tone: "" }))
      .toBe("面向 产品经理，采用 {{tone}}");
  });
});
