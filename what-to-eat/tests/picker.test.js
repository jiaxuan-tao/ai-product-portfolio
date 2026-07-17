import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CHINESE_CUISINES,
  DEFAULT_FOREIGN_CUISINES,
  DIRECTIONS,
  FOODS,
  OPTIONAL_FOREIGN_CUISINES,
  getFoodById,
} from "../foods.js";
import {
  buildHierarchyOptions,
  createCandidatePool,
  filterFoods,
  pickSecureIndex,
  sampleCandidates,
} from "../picker.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("preset taxonomy has at least 100 uniquely identified concrete dishes with local images", () => {
  assert.ok(FOODS.length >= 100);
  assert.equal(new Set(FOODS.map((food) => food.id)).size, FOODS.length);
  assert.equal(new Set(FOODS.map((food) => food.name)).size, FOODS.length);
  assert.ok(FOODS.every((food) => food.meals.length && food.flavors.length && food.spends.length));
  assert.ok(FOODS.every((food) => DIRECTIONS.includes(food.origin)));
  assert.ok(FOODS.every((food) => food.image === `assets/dishes/${food.id}.webp`));
  assert.ok(FOODS.every((food) => ["default", "optional"].includes(food.availability)));
  assert.ok(Object.isFrozen(FOODS));
  assert.ok(FOODS.every((food) => (
    Object.isFrozen(food)
    && Object.isFrozen(food.meals)
    && Object.isFrozen(food.flavors)
    && Object.isFrozen(food.spends)
  )));
  assert.notEqual(FOODS[0].meals, FOODS[1].meals);
  assert.notEqual(FOODS[0].spends, FOODS[1].spends);
  assert.equal(getFoodById("luosifen")?.name, "螺蛳粉");
  assert.equal(getFoodById("missing-food"), undefined);
  assert.ok(FOODS.every((food) => existsSync(path.join(projectRoot, food.image))));
});

test("real preset foods cover common Chinese and foreign cuisines", () => {
  assert.ok(CHINESE_CUISINES.every((cuisine) => (
    FOODS.some((food) => food.origin === "中餐" && food.cuisine === cuisine)
  )));
  assert.ok(DEFAULT_FOREIGN_CUISINES.every((cuisine) => (
    FOODS.some((food) => food.origin === "外国菜" && food.cuisine === cuisine)
  )));
  assert.ok(OPTIONAL_FOREIGN_CUISINES.every((cuisine) => (
    FOODS.some((food) => (
      food.origin === "外国菜"
      && food.cuisine === cuisine
      && food.availability === "optional"
    ))
  )));
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

test("filterFoods internally excludes only the three most recent accepted IDs", () => {
  const foods = ["first", "second", "third", "older"].map((id) => ({
    id,
    meals: [],
    flavors: [],
    spends: [],
  }));

  const result = filterFoods(foods, {}, { recentAccepted: ["first", "second", "third", "older"] }, 1_000);

  assert.deepEqual(result.map((food) => food.id), ["older"]);
});

test("sampleCandidates returns unique items and clamps the requested size to 12", () => {
  const items = Array.from({ length: 20 }, (_, index) => ({ id: `food-${index}` }));
  const candidates = sampleCandidates(items, 99, () => 0);

  assert.equal(candidates.length, 12);
  assert.equal(new Set(candidates.map((item) => item.id)).size, 12);
  assert.equal(items.length, 20);
});

test("buildHierarchyOptions returns common Chinese cuisines after choosing direction", () => {
  assert.deepEqual(
    CHINESE_CUISINES,
    ["川湘菜", "粤菜", "江浙菜", "东北菜", "西北菜", "云贵菜", "广西风味", "火锅烧烤", "粉面米线", "中式小吃", "中式甜品"],
  );
  assert.deepEqual(
    buildHierarchyOptions(FOODS, ["中餐"]).map((option) => option.name),
    CHINESE_CUISINES,
  );
});

test("buildHierarchyOptions keeps custom Chinese cuisines reachable", () => {
  const options = buildHierarchyOptions([
    ...FOODS,
    {
      id: "custom-noodles",
      name: "家传拌面",
      origin: "中餐",
      cuisine: "我的自定义",
      meals: ["晚餐"],
      flavors: ["清淡点"],
      spends: ["简单吃"],
    },
  ], ["中餐"]);

  assert.deepEqual(options.map((option) => option.name), [...CHINESE_CUISINES, "我的自定义"]);
});

test("buildHierarchyOptions returns matching dishes at a complete path", () => {
  const options = buildHierarchyOptions(FOODS, ["中餐", "广西风味"]);

  assert.ok(options.length > 0);
  assert.ok(options.every((food) => food.origin === "中餐" && food.cuisine === "广西风味"));
});

test("foreign cuisine wheel defaults to Japanese, Korean, and Western food", async () => {
  const picker = await import("../picker.js");
  const cuisines = picker.createHierarchyCandidates({
    foods: FOODS,
    path: ["外国菜"],
    enabledOptionalCuisines: [],
    filters: { meal: "午餐", flavor: "不限", spend: "不限" },
    exclusions: {},
    now: 1_000,
  });

  assert.deepEqual(cuisines.map((candidate) => candidate.name), DEFAULT_FOREIGN_CUISINES);
});

test("cuisine wheel remains complete when current dish filters are narrow", async () => {
  const picker = await import("../picker.js");
  const cuisines = picker.createHierarchyCandidates({
    foods: FOODS,
    path: ["外国菜"],
    enabledOptionalCuisines: ["印度菜"],
    filters: { meal: "夜宵", flavor: "想吃甜", spend: "简单吃" },
  });

  assert.deepEqual(
    cuisines.map((candidate) => candidate.name),
    [...DEFAULT_FOREIGN_CUISINES, "印度菜"],
  );
});

test("optional foreign cuisines only enter wheels after a one-click enable", async () => {
  const picker = await import("../picker.js");
  const disabled = picker.createHierarchyCandidates({
    foods: FOODS,
    path: ["外国菜"],
    enabledOptionalCuisines: [],
  });
  const enabled = picker.createHierarchyCandidates({
    foods: FOODS,
    path: ["外国菜"],
    enabledOptionalCuisines: ["泰国菜", "印度菜"],
  });
  const directPool = createCandidatePool({
    foods: FOODS.filter((food) => ["印度菜", "日料"].includes(food.cuisine)),
    enabledOptionalCuisines: [],
    limit: 12,
    rng: () => 0,
  });

  assert.ok(!disabled.some((candidate) => candidate.name === "泰国菜"));
  assert.deepEqual(
    enabled.map((candidate) => candidate.name),
    [...DEFAULT_FOREIGN_CUISINES, "泰国菜", "印度菜"],
  );
  assert.ok(directPool.every((food) => food.cuisine === "日料"));
});

test("hierarchy filters dishes after a cuisine is chosen", async () => {
  const picker = await import("../picker.js");
  const dishes = picker.createHierarchyCandidates({
    foods: FOODS,
    path: ["中餐", "粉面米线"],
    filters: { meal: "早餐", flavor: "清淡点", spend: "简单吃" },
    exclusions: {},
    now: 1_000,
    limit: 12,
    rng: () => 0,
  });

  assert.ok(dishes.length >= 2);
  assert.ok(dishes.every((food) => (
    food.origin === "中餐"
    && food.cuisine === "粉面米线"
    && food.meals.includes("早餐")
    && food.flavors.includes("清淡点")
    && food.spends.includes("简单吃")
  )));
});

test("pickSecureIndex returns an in-bounds index from accepted secure values", () => {
  for (const randomValues of [[0], [1], [0xffffffff, 5]]) {
    const index = pickSecureIndex(7, randomValues);
    assert.ok(index >= 0 && index < 7);
  }
  assert.equal(pickSecureIndex(0, [1]), -1);
});

test("pickSecureIndex rejects exhausted out-of-range entropy without modulo bias", () => {
  assert.throws(
    () => pickSecureIndex(7, [0xffffffff]),
    /fresh random values/i,
  );
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

test("createCandidatePool keeps eight candidates when at least eight foods are eligible", () => {
  const foods = Array.from({ length: 10 }, (_, index) => ({
    id: `eligible-${index}`,
    meals: ["晚餐"],
    flavors: ["清淡点"],
    spends: ["简单吃"],
  }));

  for (const limit of [0, 1]) {
    const pool = createCandidatePool({ foods, filters: { meal: "晚餐" }, limit, rng: () => 0 });
    assert.equal(pool.length, 8);
    assert.equal(new Set(pool.map((food) => food.id)).size, 8);
  }
});

test("dish wheel relaxes narrow filters inside the selected cuisine instead of dead-ending", async () => {
  const picker = await import("../picker.js");
  const dishes = picker.createHierarchyCandidates({
    foods: FOODS,
    path: ["中餐", "川湘菜"],
    filters: { meal: "早餐", flavor: "想吃甜", spend: "简单吃" },
    exclusions: {},
    limit: 12,
    rng: () => 0,
  });

  assert.ok(dishes.length >= 2);
  assert.ok(dishes.every((food) => food.origin === "中餐" && food.cuisine === "川湘菜"));
});

test("dish wheel may repeat a recent result when a small cuisine would otherwise dead-end", async () => {
  const picker = await import("../picker.js");
  const dishes = picker.createHierarchyCandidates({
    foods: FOODS,
    path: ["中餐", "川湘菜"],
    exclusions: { recentAccepted: ["mapo-tofu", "kung-pao-chicken"] },
    limit: 12,
    rng: () => 0,
  });

  assert.ok(dishes.length >= 2);
  assert.ok(dishes.every((food) => food.origin === "中餐" && food.cuisine === "川湘菜"));
});

test("createCandidatePool returns every eligible food when fewer than eight remain", () => {
  const foods = Array.from({ length: 2 }, (_, index) => ({
    id: `eligible-${index}`,
    meals: ["晚餐"],
    flavors: ["清淡点"],
    spends: ["简单吃"],
  }));

  const pool = createCandidatePool({ foods, filters: { meal: "晚餐" }, limit: 0, rng: () => 0 });

  assert.deepEqual(pool.map((food) => food.id).sort(), ["eligible-0", "eligible-1"]);
});

test("picker functions leave caller-provided inputs unchanged", () => {
  const foods = [
    { id: "one", meals: ["晚餐"], flavors: ["清淡点"], spends: ["简单吃"], origin: "中餐", cuisine: "川湘菜" },
    { id: "two", meals: ["午餐"], flavors: ["想吃辣"], spends: ["正常吃"], origin: "中餐", cuisine: "粤菜" },
  ];
  const filters = { meal: "晚餐" };
  const exclusions = { recentAccepted: [], blockedUntil: { one: 999 } };
  const path = ["中餐"];
  const foodsBefore = structuredClone(foods);
  const filtersBefore = structuredClone(filters);
  const exclusionsBefore = structuredClone(exclusions);
  const pathBefore = structuredClone(path);

  filterFoods(foods, filters, exclusions, 1_000);
  sampleCandidates(foods, 2, () => 0);
  buildHierarchyOptions(foods, path);
  createCandidatePool({ foods, filters, exclusions, now: 1_000, limit: 8, rng: () => 0 });

  assert.deepEqual(foods, foodsBefore);
  assert.deepEqual(filters, filtersBefore);
  assert.deepEqual(exclusions, exclusionsBefore);
  assert.deepEqual(path, pathBefore);
});
