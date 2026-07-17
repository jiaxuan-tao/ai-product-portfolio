import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { FOODS } from "../foods.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artPath = path.join(projectRoot, "food-art.js");

test("food artwork module exists as a local runtime asset", () => {
  assert.ok(existsSync(artPath), "food-art.js should exist");
});

test("every preset dish receives a deterministic unique artwork descriptor", async () => {
  assert.ok(existsSync(artPath), "food-art.js should exist");
  const { getFoodArtDescriptor } = await import("../food-art.js");
  assert.equal(typeof getFoodArtDescriptor, "function");

  const firstPass = FOODS.map(getFoodArtDescriptor);
  const secondPass = FOODS.map(getFoodArtDescriptor);
  const signatures = firstPass.map((descriptor) => descriptor.signature);

  assert.deepEqual(firstPass, secondPass);
  assert.equal(signatures.length, FOODS.length);
  assert.equal(new Set(signatures).size, FOODS.length);
  assert.ok(firstPass.every((descriptor) => (
    descriptor.name
    && descriptor.group
    && descriptor.visual
    && descriptor.palette.length >= 4
    && descriptor.alt.includes(descriptor.name)
  )));
});

test("artwork descriptors distinguish representative dish families", async () => {
  assert.ok(existsSync(artPath), "food-art.js should exist");
  const { getFoodArtDescriptor } = await import("../food-art.js");
  const representativeIds = [
    "beef-noodles",
    "claypot-rice",
    "spicy-hotpot",
    "tuna-sushi",
    "lamb-skewers",
    "classic-burger",
    "margherita-pizza",
    "chicken-salad",
    "basque-cheesecake",
  ];
  const visuals = representativeIds.map((id) => (
    getFoodArtDescriptor(FOODS.find((food) => food.id === id)).visual
  ));

  assert.equal(new Set(visuals).size, representativeIds.length);
});
