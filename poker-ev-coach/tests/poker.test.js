import test from "node:test";
import assert from "node:assert/strict";
import { createDeck, evaluateHand, compareScores, simulateEquity } from "../poker.js";

test("deck contains 52 unique cards", () => {
  const deck = createDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck).size, 52);
});

test("straight flush outranks four of a kind", () => {
  const straightFlush = evaluateHand(["Ah", "Kh", "Qh", "Jh", "Th", "2c", "3d"]);
  const quads = evaluateHand(["As", "Ah", "Ad", "Ac", "Kd", "2c", "3d"]);
  assert.equal(compareScores(straightFlush, quads), 1);
});

test("wheel straight is evaluated below a six-high straight", () => {
  const wheel = evaluateHand(["As", "2h", "3d", "4c", "5s", "Kh", "Qd"]);
  const sixHigh = evaluateHand(["2s", "3h", "4d", "5c", "6s", "Kh", "Qd"]);
  assert.equal(compareScores(wheel, sixHigh), -1);
});

test("simulation rejects duplicate cards", () => {
  assert.throws(
    () => simulateEquity({ hero: ["Ah", "Ah"], board: [], opponents: 1, iterations: 10 }),
    /重复/
  );
});

test("simulation returns bounded results", () => {
  const result = simulateEquity({
    hero: ["Ah", "Ad"],
    board: ["As", "7c", "2d"],
    opponents: 1,
    iterations: 100,
    rng: () => 0.5
  });
  assert.equal(result.iterations, 100);
  assert.ok(result.equity >= 0 && result.equity <= 1);
  assert.equal(result.wins + result.ties + result.losses, 100);
});

test("simulation splits equity between players tied by the board", () => {
  const result = simulateEquity({
    hero: ["2c", "3d"],
    board: ["Ah", "Kh", "Qh", "Jh", "Th"],
    opponents: 1,
    iterations: 10,
    rng: () => 0.5
  });
  assert.equal(result.wins, 0);
  assert.equal(result.ties, 10);
  assert.equal(result.losses, 0);
  assert.equal(result.equity, 0.5);
});
