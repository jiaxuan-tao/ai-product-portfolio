import assert from "node:assert/strict";
import test from "node:test";

import {
  CHINESE_CUISINES,
  FOODS,
  TOP_LEVEL_GROUPS,
  getFoodById,
} from "../foods.js";
import {
  buildHierarchyOptions,
  createCandidatePool,
  filterFoods,
  pickSecureIndex,
  sampleCandidates,
} from "../picker.js";

test("preset taxonomy has at least 90 uniquely identified concrete dishes", () => {
  assert.ok(FOODS.length >= 90);
  assert.equal(new Set(FOODS.map((food) => food.id)).size, FOODS.length);
  assert.equal(new Set(FOODS.map((food) => food.name)).size, FOODS.length);
  assert.ok(FOODS.every((food) => food.meals.length && food.flavors.length && food.spends.length));
  assert.equal(getFoodById("luosifen")?.name, "螺蛳粉");
  assert.equal(getFoodById("missing-food"), undefined);
});

test("filterFoods intersects exact meal, flavor, and spend tags", () => {
  const foods = [
    { id: "match", meals: ["午餐"], flavors: ["想吃辣"], spends: ["正常吃"] },
    { id: "wrong-meal", meals: ["早餐"], flavors: ["想吃辣"], spends: ["正常吃"] },
    { id: "wrong-flavor", meals: ["午餐"], flavors: ["清淡点"], spends: ["正常吃"] },
    { id: "wrong-spend", meals: ["午餐"], flavors: ["想吃辣"], spends: ["简单吃"] },
  ];

  const result = filterFoods(
    foods,
    { meal: "午餐", flavor: "想吃辣", spend: "正常吃" },
    {},
    1_000,
  );

  assert.deepEqual(result.map((food) => food.id), ["match"]);
});

test("filterFoods excludes recent accepted dishes and only unexpired blocks", () => {
  const foods = [
    { id: "recent", meals: [], flavors: [], spends: [] },
    { id: "blocked", meals: [], flavors: [], spends: [] },
    { id: "expired", meals: [], flavors: [], spends: [] },
    { id: "available", meals: [], flavors: [], spends: [] },
  ];

  const result = filterFoods(
    foods,
    {},
    {
      recentAccepted: ["recent"],
      blockedUntil: { blocked: 1_001, expired: 1_000 },
    },
    1_000,
  );

  assert.deepEqual(result.map((food) => food.id), ["expired", "available"]);
});

test("sampleCandidates returns unique items and clamps the requested size to 12", () => {
  const items = Array.from({ length: 20 }, (_, index) => ({ id: `food-${index}` }));
  const candidates = sampleCandidates(items, 99, () => 0);

  assert.equal(candidates.length, 12);
  assert.equal(new Set(candidates.map((item) => item.id)).size, 12);
  assert.equal(items.length, 20);
});

test("buildHierarchyOptions returns the seven root groups", () => {
  assert.deepEqual(TOP_LEVEL_GROUPS, ["中餐", "西餐", "日料", "韩餐", "东南亚", "快餐小吃", "轻食甜品"]);
  assert.deepEqual(
    buildHierarchyOptions(FOODS, []).map((option) => option.name),
    TOP_LEVEL_GROUPS,
  );
});

test("buildHierarchyOptions returns the nine Chinese sub-cuisines", () => {
  assert.deepEqual(
    CHINESE_CUISINES,
    ["川湘菜", "粤菜", "江浙菜", "北方菜", "西北菜", "云贵菜", "广西风味", "火锅烧烤", "面食"],
  );
  assert.deepEqual(
    buildHierarchyOptions(FOODS, ["中餐"]).map((option) => option.name),
    CHINESE_CUISINES,
  );
});

test("buildHierarchyOptions returns matching dishes at a complete path", () => {
  const options = buildHierarchyOptions(FOODS, ["中餐", "广西风味"]);

  assert.ok(options.length > 0);
  assert.ok(options.every((food) => food.group === "中餐" && food.cuisine === "广西风味"));
});

test("pickSecureIndex always returns an in-bounds index", () => {
  for (const randomValues of [[0], [1], [0xffffffff], [0xffffffff, 5]]) {
    const index = pickSecureIndex(7, randomValues);
    assert.ok(index >= 0 && index < 7);
  }
  assert.equal(pickSecureIndex(0, [1]), -1);
});

test("createCandidatePool filters before sampling", () => {
  const foods = [
    { id: "eligible", meals: ["晚餐"], flavors: ["清淡点"], spends: ["简单吃"] },
    { id: "recent", meals: ["晚餐"], flavors: ["清淡点"], spends: ["简单吃"] },
    { id: "other", meals: ["午餐"], flavors: ["清淡点"], spends: ["简单吃"] },
  ];

  const pool = createCandidatePool({
    foods,
    filters: { meal: "晚餐" },
    exclusions: { recentAccepted: ["recent"] },
    now: 1_000,
    limit: 8,
    rng: () => 0,
  });

  assert.deepEqual(pool.map((food) => food.id), ["eligible"]);
});
