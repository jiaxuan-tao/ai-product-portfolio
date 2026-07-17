const LEGACY_FOREIGN_GROUPS = new Set([
  "西餐",
  "日料",
  "韩餐",
  "东南亚",
  "快餐小吃",
  "轻食甜品",
]);

export function normalizeLegacyHierarchyPath(value) {
  const savedPath = Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 2)
    : [];
  const [first, second] = savedPath;

  if (first === "中餐") {
    return [
      "中餐",
      { 北方菜: "东北菜", 面食: "粉面米线" }[second] || second,
    ].filter(Boolean);
  }
  if (first === "外国菜") return savedPath;
  if (["西餐", "日料", "韩餐"].includes(first)) return ["外国菜", first];
  if (first === "东南亚") {
    const cuisine = ["泰国菜", "越南菜"].includes(second) ? second : "东南亚其他";
    return ["外国菜", cuisine];
  }
  if (["快餐小吃", "轻食甜品"].includes(first)) return ["外国菜", "西餐"];
  return [];
}

export function normalizeLegacyCustomTaxonomy(food = {}) {
  if (["中餐", "外国菜"].includes(food.origin)) {
    return {
      origin: food.origin,
      cuisine: food.cuisine || "我的自定义",
    };
  }

  const origin = LEGACY_FOREIGN_GROUPS.has(food.group) ? "外国菜" : "中餐";
  const cuisine = ["西餐", "日料", "韩餐"].includes(food.group)
    ? food.group
    : (food.cuisine || "我的自定义");
  return { origin, cuisine };
}
