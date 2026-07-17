# Poker EV Coach Implementation Plan

> **Migration note (2026-07-17):** This plan records the original standalone
> delivery. The maintained project now lives at
> `vibe-coding-lab/poker-ev-coach/`; do not rerun the standalone repository
> creation or publication steps.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a responsive, dependency-free Texas Hold'em equity and EV decision assistant.

**Architecture:** A static ES-module web application separates the poker engine, decision formulas, and DOM interface. Node's built-in test runner validates pure logic without adding production dependencies.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, Node.js built-in test runner, GitHub Pages

## Global Constraints

- No backend, database, login, API key, runtime dependency, or build step.
- The tool is for study and review, not real-money play or live table assistance.
- The interface is Chinese-first and works in desktop and mobile browsers.
- Advice remains heuristic and labels aggressive action as a raise candidate.

---

### Task 1: Poker Engine

**Files:**
- Create: `package.json`
- Create: `poker.js`
- Create: `tests/poker.test.js`

**Interfaces:**
- Produces: `createDeck(): string[]`
- Produces: `evaluateHand(cards: string[]): number[]`
- Produces: `compareScores(a: number[], b: number[]): number`
- Produces: `simulateEquity(options): { equity: number, wins: number, ties: number, losses: number, iterations: number }`

- [ ] **Step 1: Add the module and test setup**

```json
{
  "name": "poker-ev-coach",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Write failing evaluator tests**

```js
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
```

- [ ] **Step 3: Run the tests and verify failure**

Run: `npm test`

Expected: FAIL because `poker.js` does not exist.

- [ ] **Step 4: Implement the evaluator and simulation**

Use rank vectors ordered as:

```js
const CATEGORY = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8
};
```

`evaluateHand` enumerates all five-card combinations from five to seven cards,
scores each combination, and returns the highest lexicographic score.
`simulateEquity` removes known cards, shuffles a fresh remaining deck for each
iteration, fills the board, deals opponent hands, compares all scores, and
counts a tie as `1 / tiedPlayers` equity.

- [ ] **Step 5: Add deterministic simulation boundary tests**

```js
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
```

- [ ] **Step 6: Run engine tests**

Run: `npm test`

Expected: all poker engine tests PASS.

### Task 2: Decision Model

**Files:**
- Create: `decision.js`
- Create: `tests/decision.test.js`

**Interfaces:**
- Produces: `calculatePotOdds(pot: number, call: number): number`
- Produces: `calculateCallEV(equity: number, pot: number, call: number): number`
- Produces: `getDecision(equity: number, potOdds: number, ev: number): { key: string, label: string, reason: string }`

- [ ] **Step 1: Write failing formula tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { calculatePotOdds, calculateCallEV, getDecision } from "../decision.js";

test("pot odds include the call in the final pot", () => {
  assert.equal(calculatePotOdds(100, 25), 0.2);
});

test("call EV follows the documented formula", () => {
  assert.equal(calculateCallEV(0.4, 100, 25), 25);
});

test("negative EV returns fold", () => {
  assert.equal(getDecision(0.15, 0.2, -6.25).key, "fold");
});

test("large equity edge returns raise candidate", () => {
  assert.equal(getDecision(0.42, 0.2, 27.5).key, "raise");
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `npm test`

Expected: FAIL because `decision.js` does not exist.

- [ ] **Step 3: Implement formulas and verdict thresholds**

```js
export function calculatePotOdds(pot, call) {
  if (!Number.isFinite(pot) || !Number.isFinite(call) || pot < 0 || call <= 0) {
    throw new Error("请输入有效的底池和跟注金额");
  }
  return call / (pot + call);
}

export function calculateCallEV(equity, pot, call) {
  return equity * (pot + call) - call;
}

export function getDecision(equity, potOdds, ev) {
  const edge = equity - potOdds;
  if (ev < 0 || edge < 0) return { key: "fold", label: "建议弃牌", reason: "胜率不足以覆盖跟注成本。" };
  if (edge >= 0.12) return { key: "raise", label: "可考虑加注", reason: "当前胜率明显高于所需底池赔率。" };
  return { key: "call", label: "建议跟注", reason: "当前胜率能够覆盖跟注成本。" };
}
```

- [ ] **Step 4: Run all logic tests**

Run: `npm test`

Expected: all tests PASS.

### Task 3: Responsive Web Interface

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`

**Interfaces:**
- Consumes: poker engine and decision model exports from Tasks 1 and 2
- Produces: a directly usable static browser experience

- [ ] **Step 1: Create semantic page structure**

Build a compact application shell with:

```html
<main class="app-shell">
  <section class="workspace" aria-label="牌局输入"></section>
  <aside class="results" aria-live="polite"></aside>
</main>
```

Include two hole-card slots, five board-card slots, numeric inputs for pot,
call, and opponents, calculate/reset/example actions, four result metrics, and
a card-picker dialog.

- [ ] **Step 2: Implement state and card interactions**

Use one state object:

```js
const state = {
  hero: [null, null],
  board: [null, null, null, null, null],
  activeSlot: null,
  calculating: false
};
```

Selected cards are disabled in the picker. Clicking a filled slot removes that
card. Example scenarios set both cards and numeric inputs. Reset restores the
initial state.

- [ ] **Step 3: Connect calculation and validation**

On calculate, require two hole cards and valid numeric inputs. Run 5,000
iterations after yielding one animation frame, then render equity, pot odds,
EV, the verdict, win/tie/loss counts, and a limitation note.

- [ ] **Step 4: Add responsive visual styling**

Use a neutral ink background, green table surface, warm amber action color,
white cards, and red card suits. Keep cards at stable aspect ratios and use a
two-column layout above 900px and one column below it. Add visible focus states,
reduced-motion handling, and a 44px minimum touch target.

- [ ] **Step 5: Run static checks**

Run: `node --check app.js && node --check poker.js && node --check decision.js`

Expected: no output and exit code 0.

### Task 4: Documentation, Browser QA, and Publishing

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `.gitignore`
- Modify: interface files only if QA finds defects

**Interfaces:**
- Consumes: complete local application
- Produces: tested local URL, public GitHub repository, and GitHub Pages URL when available

- [ ] **Step 1: Write project documentation**

README sections:

- Product overview
- Live demo
- Features
- How the calculation works
- Local usage
- Project structure
- Limitations and responsible-use statement
- Short interview explanation

- [ ] **Step 2: Start the local site**

Run: `python3 -m http.server 5175 --bind 127.0.0.1`

Expected: application loads at `http://127.0.0.1:5175/`.

- [ ] **Step 3: Perform browser QA**

Check desktop at 1440x900 and mobile at 390x844. Exercise card selection,
duplicate prevention, reset, example loading, calculation, and invalid input.
Verify no horizontal overflow, overlap, blank content, or console errors.

- [ ] **Step 4: Run final verification**

Run: `npm test`

Expected: all tests PASS.

Run: `git status --short`

Expected: only intended project files are present.

- [ ] **Step 5: Initialize and publish**

```bash
git init
git add .
git commit -m "feat: build poker EV decision assistant"
gh repo create poker-ev-coach --public --source=. --remote=origin --push
```

Enable GitHub Pages from the default branch through GitHub CLI/API if
authentication and repository permissions allow it, then verify the public
page returns successfully.
