import {
  CHINESE_CUISINES,
  DEFAULT_FOREIGN_CUISINES,
  OPTIONAL_FOREIGN_CUISINES,
} from "./foods.js";

function matchesTag(tags, selectedTag) {
  return !selectedTag || selectedTag === "不限" || tags.includes(selectedTag);
}

function isCuisineEnabled(food, enabledOptionalCuisines = []) {
  return food.availability !== "optional" || enabledOptionalCuisines.includes(food.cuisine);
}

export function filterFoods(
  foods,
  filters = {},
  exclusions = {},
  now = Date.now(),
  enabledOptionalCuisines = [],
) {
  const recentAccepted = new Set((exclusions.recentAccepted ?? []).slice(0, 3));
  const blockedUntil = exclusions.blockedUntil ?? {};

  return foods.filter((food) => (
    matchesTag(food.meals, filters.meal)
    && matchesTag(food.flavors, filters.flavor)
    && matchesTag(food.spends, filters.spend)
    && isCuisineEnabled(food, enabledOptionalCuisines)
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

export function buildHierarchyOptions(foods, path = [], enabledOptionalCuisines = []) {
  if (path.length === 0) {
    return [];
  }

  const [origin, cuisine] = path;
  if (!cuisine) {
    const availableCuisines = [
      ...new Set(
        foods
          .filter((food) => (
            food.origin === origin
            && isCuisineEnabled(food, enabledOptionalCuisines)
          ))
          .map((food) => food.cuisine),
      ),
    ];
    const preferredOrder = origin === "中餐"
      ? CHINESE_CUISINES
      : [
        ...DEFAULT_FOREIGN_CUISINES,
        ...OPTIONAL_FOREIGN_CUISINES.filter((name) => enabledOptionalCuisines.includes(name)),
      ];
    const cuisines = [
      ...preferredOrder.filter((name) => availableCuisines.includes(name)),
      ...availableCuisines.filter((name) => !preferredOrder.includes(name)),
    ];
    return cuisines.map((name) => ({
      id: `${origin}:${name}`,
      name,
      type: "cuisine",
      origin,
      image: `assets/cuisines/${encodeURIComponent(name)}.webp`,
    }));
  }

  return foods.filter((food) => (
    food.origin === origin
    && food.cuisine === cuisine
    && isCuisineEnabled(food, enabledOptionalCuisines)
  ));
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

  throw new RangeError("No accepted secure random value; retry with fresh random values.");
}

export function createCandidatePool({
  foods,
  filters = {},
  exclusions = {},
  now = Date.now(),
  limit = 12,
  rng = Math.random,
  enabledOptionalCuisines = [],
}) {
  const eligibleFoods = filterFoods(
    foods,
    filters,
    exclusions,
    now,
    enabledOptionalCuisines,
  );
  const requestedLimit = Number.isFinite(Number(limit)) ? Math.floor(Number(limit)) : 12;
  const candidateLimit = eligibleFoods.length >= 8
    ? Math.max(8, requestedLimit)
    : eligibleFoods.length;

  return sampleCandidates(eligibleFoods, candidateLimit, rng);
}

export function createHierarchyCandidates({
  foods,
  path = [],
  filters = {},
  exclusions = {},
  now = Date.now(),
  limit = 12,
  rng = Math.random,
  enabledOptionalCuisines = [],
}) {
  if (path.length === 0) {
    return [];
  }

  if (path.length === 1) {
    return buildHierarchyOptions(foods, path, enabledOptionalCuisines);
  }

  const scopedFoods = foods.filter((food) => (
    food.origin === path[0] && food.cuisine === path[1]
  ));

  const filteredCandidates = createCandidatePool({
    foods: scopedFoods,
    filters,
    exclusions,
    now,
    limit,
    rng,
    enabledOptionalCuisines,
  });

  if (filteredCandidates.length >= 2 || scopedFoods.length < 2) {
    return filteredCandidates;
  }

  const relaxedCandidates = createCandidatePool({
    foods: scopedFoods,
    filters: {},
    exclusions,
    now,
    limit,
    rng,
    enabledOptionalCuisines,
  });

  if (relaxedCandidates.length >= 2 || scopedFoods.length < 2) {
    return relaxedCandidates;
  }

  return createCandidatePool({
    foods: scopedFoods,
    filters: {},
    exclusions: {
      ...exclusions,
      recentAccepted: [],
    },
    now,
    limit,
    rng,
    enabledOptionalCuisines,
  });
}
