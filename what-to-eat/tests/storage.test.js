import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_STATE,
  acceptFood,
  blockTemporarily,
  loadState,
  normalizeState,
  saveState,
} from "../storage.js";

const NOW = 1_700_000_000_000;
const STORAGE_KEY = "what-to-eat.state.v1";

function createStorage(initialValue) {
  const values = new Map(initialValue === undefined ? [] : [[STORAGE_KEY, initialValue]]);

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    values,
  };
}

test("loadState returns a fresh default state when storage is unavailable", () => {
  const state = loadState(undefined, NOW);

  assert.deepEqual(state, DEFAULT_STATE);
  assert.notEqual(state, DEFAULT_STATE);
  assert.notEqual(state.filters, DEFAULT_STATE.filters);
});

test("loadState falls back to defaults for malformed JSON and unsupported schema versions", () => {
  assert.deepEqual(loadState(createStorage("{"), NOW), DEFAULT_STATE);
  assert.deepEqual(
    loadState(createStorage(JSON.stringify({ version: 2, soundEnabled: false })), NOW),
    DEFAULT_STATE,
  );
});

test("normalizeState retains only valid custom foods", () => {
  const state = normalizeState({
    version: 1,
    customFoods: [
      { id: "family-noodles", name: "家常拌面" },
      { id: "", name: "空 ID" },
      { id: "missing-name" },
      "fried-rice",
      { id: "family-noodles", name: "重复菜品" },
    ],
  }, NOW);

  assert.deepEqual(state.customFoods, [{ id: "family-noodles", name: "家常拌面" }]);
});

test("normalizeState removes expired temporary blocks", () => {
  const state = normalizeState({
    version: 1,
    blockedUntil: {
      "fresh-food": NOW + 1,
      "expired-food": NOW,
      "invalid-food": "tomorrow",
    },
  }, NOW);

  assert.deepEqual(state.blockedUntil, { "fresh-food": NOW + 1 });
});

test("acceptFood prepends unique IDs and preserves only the latest three", () => {
  const state = acceptFood({
    ...DEFAULT_STATE,
    recentAccepted: ["second", "first", "older"],
  }, "first");

  assert.deepEqual(state.recentAccepted, ["first", "second", "older"]);
  assert.deepEqual(acceptFood(state, "newest").recentAccepted, ["newest", "first", "second"]);
});

test("normalizeState de-duplicates favorite food IDs", () => {
  const state = normalizeState({
    version: 1,
    favorites: ["mapo-tofu", "mapo-tofu", "luosifen", "", 123],
  }, NOW);

  assert.deepEqual(state.favorites, ["mapo-tofu", "luosifen"]);
});

test("saveState and loadState preserve the sound preference", () => {
  const storage = createStorage();
  const state = { ...DEFAULT_STATE, soundEnabled: false };

  assert.equal(saveState(storage, state), true);
  assert.deepEqual(JSON.parse(storage.values.get(STORAGE_KEY)), state);
  assert.equal(loadState(storage, NOW).soundEnabled, false);
});

test("saveState returns false when storage rejects writes", () => {
  const storage = {
    setItem() {
      throw new Error("quota exceeded");
    },
  };

  assert.equal(saveState(storage, DEFAULT_STATE), false);
});

test("blockTemporarily sets an ID expiry one day from now", () => {
  const state = blockTemporarily(DEFAULT_STATE, "mapo-tofu", NOW);

  assert.equal(state.blockedUntil["mapo-tofu"], NOW + 86_400_000);
  assert.deepEqual(DEFAULT_STATE.blockedUntil, {});
});
