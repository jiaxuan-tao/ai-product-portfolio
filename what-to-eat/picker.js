import { CHINESE_CUISINES, TOP_LEVEL_GROUPS } from "./foods.js";

function matchesTag(tags, selectedTag) {
  return !selectedTag || selectedTag === "不限" || tags.includes(selectedTag);
}

export function filterFoods(foods, filters = {}, exclusions = {}, now = Date.now()) {
  const recentAccepted = new Set(exclusions.recentAccepted ?? []);
  const blockedUntil = exclusions.blockedUntil ?? {};

  return foods.filter((food) => (
    matchesTag(food.meals, filters.meal)
    && matchesTag(food.flavors, filters.flavor)
    && matchesTag(food.spends, filters.spend)
    && !recentAccepted.has(food.id)
    && !(blockedUntil[food.id] > now)
  ));
}

export function sampleCandidates(items, limit, rng = Math.random) {
  const candidateCount = Math.min(Math.max(0, Math.floor(limit)), 12, items.length);
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const random = Number(rng());
    const swapIndex = Math.min(index, Math.max(0, Math.floor(random * (index + 1))));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, candidateCount);
}

export function buildHierarchyOptions(foods, path = []) {
  if (path.length === 0) {
    return TOP_LEVEL_GROUPS.map((name) => ({ id: name, name, type: "group" }));
  }

  const [group, cuisine] = path;
  if (!cuisine) {
    const cuisines = group === "中餐"
      ? CHINESE_CUISINES
      : [...new Set(foods.filter((food) => food.group === group).map((food) => food.cuisine))];
    return cuisines.map((name) => ({ id: `${group}:${name}`, name, type: "cuisine", group }));
  }

  return foods.filter((food) => food.group === group && food.cuisine === cuisine);
}

export function pickSecureIndex(length, randomValues) {
  if (!Number.isInteger(length) || length <= 0) return -1;

  const values = Array.from(randomValues ?? []);
  const maxUint32 = 0x1_0000_0000;
  const acceptedRange = maxUint32 - (maxUint32 % length);

  for (const value of values) {
    const normalized = Number(value) >>> 0;
    if (normalized < acceptedRange) return normalized % length;
  }

  return values.length ? (Number(values[values.length - 1]) >>> 0) % length : 0;
}

export function createCandidatePool({
  foods,
  filters = {},
  exclusions = {},
  now = Date.now(),
  limit = 12,
  rng = Math.random,
}) {
  return sampleCandidates(filterFoods(foods, filters, exclusions, now), limit, rng);
}
