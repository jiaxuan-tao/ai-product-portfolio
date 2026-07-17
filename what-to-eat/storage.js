const STORAGE_KEY = "what-to-eat.state.v1";
const SCHEMA_VERSION = 1;
const BLOCK_DURATION_MS = 86_400_000;
const OPTIONAL_CUISINES = new Set([
  "泰国菜",
  "越南菜",
  "东南亚其他",
  "印度菜",
  "墨西哥菜",
  "中东菜",
]);

export const DEFAULT_STATE = {
  version: SCHEMA_VERSION,
  filters: {
    meal: "不限",
    flavor: "不限",
    spend: "不限",
  },
  customFoods: [],
  favorites: [],
  blockedUntil: {},
  recentAccepted: [],
  enabledOptionalCuisines: [],
  soundEnabled: true,
};

function createDefaultState() {
  return {
    ...DEFAULT_STATE,
    filters: { ...DEFAULT_STATE.filters },
    customFoods: [],
    favorites: [],
    blockedUntil: {},
    recentAccepted: [],
    enabledOptionalCuisines: [],
  };
}

function normalizeId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeIds(value, limit = Infinity) {
  if (!Array.isArray(value)) return [];

  const ids = [];
  const seen = new Set();
  for (const item of value) {
    const id = normalizeId(item);
    if (id && !seen.has(id)) {
      ids.push(id);
      seen.add(id);
      if (ids.length === limit) break;
    }
  }
  return ids;
}

function normalizeCustomFoods(value) {
  if (!Array.isArray(value)) return [];

  const foods = [];
  const seenIds = new Set();
  for (const food of value) {
    if (!food || typeof food !== "object" || Array.isArray(food)) continue;

    const id = normalizeId(food.id);
    const name = typeof food.name === "string" && food.name.trim() ? food.name.trim() : undefined;
    if (!id || !name || seenIds.has(id)) continue;

    const normalized = { id, name };
    for (const field of ["group", "origin", "cuisine", "category", "visual", "image"]) {
      if (typeof food[field] === "string" && food[field].trim()) {
        normalized[field] = food[field].trim();
      }
    }
    for (const field of ["meals", "flavors", "spends"]) {
      if (Array.isArray(food[field])) normalized[field] = normalizeIds(food[field]);
    }

    foods.push(normalized);
    seenIds.add(id);
  }
  return foods;
}

function normalizeFilters(value) {
  const filters = { ...DEFAULT_STATE.filters };
  if (!value || typeof value !== "object" || Array.isArray(value)) return filters;

  for (const key of Object.keys(filters)) {
    if (typeof value[key] === "string" && value[key].trim()) filters[key] = value[key].trim();
  }
  return filters;
}

function normalizeBlockedUntil(value, now) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const blockedUntil = {};
  for (const [candidateId, expiresAt] of Object.entries(value)) {
    const id = normalizeId(candidateId);
    if (id && Number.isFinite(expiresAt) && expiresAt > now) blockedUntil[id] = expiresAt;
  }
  return blockedUntil;
}

export function normalizeState(value, now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== SCHEMA_VERSION) {
    return createDefaultState();
  }

  return {
    version: SCHEMA_VERSION,
    filters: normalizeFilters(value.filters),
    customFoods: normalizeCustomFoods(value.customFoods),
    favorites: normalizeIds(value.favorites),
    blockedUntil: normalizeBlockedUntil(value.blockedUntil, now),
    recentAccepted: normalizeIds(value.recentAccepted, 3),
    enabledOptionalCuisines: normalizeIds(value.enabledOptionalCuisines)
      .filter((name) => OPTIONAL_CUISINES.has(name)),
    soundEnabled: typeof value.soundEnabled === "boolean"
      ? value.soundEnabled
      : DEFAULT_STATE.soundEnabled,
  };
}

export function loadState(storage, now = Date.now()) {
  try {
    if (!storage || typeof storage.getItem !== "function") return createDefaultState();

    const savedState = storage.getItem(STORAGE_KEY);
    if (typeof savedState !== "string") return createDefaultState();

    return normalizeState(JSON.parse(savedState), now);
  } catch {
    return createDefaultState();
  }
}

export function saveState(storage, state) {
  try {
    if (!storage || typeof storage.setItem !== "function") return false;

    storage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
    return true;
  } catch {
    return false;
  }
}

export function blockTemporarily(state, foodId, now = Date.now()) {
  const normalized = normalizeState(state, now);
  const id = normalizeId(foodId);
  if (!id) return normalized;

  return {
    ...normalized,
    blockedUntil: {
      ...normalized.blockedUntil,
      [id]: now + BLOCK_DURATION_MS,
    },
  };
}

export function acceptFood(state, foodId) {
  const normalized = normalizeState(state);
  const id = normalizeId(foodId);
  if (!id) return normalized;

  return {
    ...normalized,
    recentAccepted: [id, ...normalized.recentAccepted.filter((acceptedId) => acceptedId !== id)].slice(0, 3),
  };
}
