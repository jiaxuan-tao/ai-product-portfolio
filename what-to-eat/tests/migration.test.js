import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeLegacyCustomTaxonomy,
  normalizeLegacyHierarchyPath,
} from "../migration.js";

test("legacy saved hierarchy paths migrate to the new direction and cuisine model", () => {
  assert.deepEqual(normalizeLegacyHierarchyPath(["中餐", "面食"]), ["中餐", "粉面米线"]);
  assert.deepEqual(normalizeLegacyHierarchyPath(["中餐", "北方菜"]), ["中餐", "东北菜"]);
  assert.deepEqual(normalizeLegacyHierarchyPath(["日料", "拉面"]), ["外国菜", "日料"]);
  assert.deepEqual(normalizeLegacyHierarchyPath(["东南亚", "泰国菜"]), ["外国菜", "泰国菜"]);
  assert.deepEqual(normalizeLegacyHierarchyPath(["东南亚", "印尼菜"]), ["外国菜", "东南亚其他"]);
  assert.deepEqual(normalizeLegacyHierarchyPath(["东南亚", "马来菜"]), ["外国菜", "东南亚其他"]);
  assert.deepEqual(normalizeLegacyHierarchyPath(["快餐小吃", "汉堡"]), ["外国菜", "西餐"]);
});

test("legacy custom foods retain a sensible Chinese or foreign direction", () => {
  assert.deepEqual(
    normalizeLegacyCustomTaxonomy({ group: "日料", cuisine: "我的自定义" }),
    { origin: "外国菜", cuisine: "日料" },
  );
  assert.deepEqual(
    normalizeLegacyCustomTaxonomy({ group: "中餐", cuisine: "我的自定义" }),
    { origin: "中餐", cuisine: "我的自定义" },
  );
  assert.deepEqual(
    normalizeLegacyCustomTaxonomy({ origin: "外国菜", cuisine: "我的自定义" }),
    { origin: "外国菜", cuisine: "我的自定义" },
  );
});
