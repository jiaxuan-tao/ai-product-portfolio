# Expanded Blind Levels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 25/50, 50/100, and 100/200 blind levels while retaining BB-based amount presets and unknown-opponent simulation.

**Architecture:** Extend the existing static `<select>` options in `index.html`. Reuse `currentBigBlind()` and `getPresetAmount()` so no calculation or state architecture changes are required.

**Tech Stack:** Static HTML, CSS, JavaScript ES modules, Node.js built-in test runner.

## Global Constraints

- Keep opponents as unknown random hands; do not add opponent card inputs.
- Keep amount presets BB-based; do not add fixed chip-amount buttons.
- Add no runtime dependencies.

---

### Task 1: Expand Blind Levels

**Files:**
- Modify: `index.html`
- Modify: `tests/ui-contract.test.js`

**Interfaces:**
- Consumes: `<option data-big-blind>` markup and `getPresetAmount(bigBlind, multiplier)`.
- Produces: selectable 25/50, 50/100, and 100/200 levels with automatically scaled preset amounts.

- [ ] **Step 1: Write the failing contract and conversion tests**

Add assertions for `value="25/50"`, `value="50/100"`, and `value="100/200"` to the blind-level contract test. Add conversion assertions:

```js
assert.equal(getPresetAmount(50, 2), 100);
assert.equal(getPresetAmount(100, 2), 200);
assert.equal(getPresetAmount(200, 2), 400);
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/ui-contract.test.js`

Expected: FAIL because the new option values are absent from `index.html`.

- [ ] **Step 3: Add the three blind options**

Insert these options after 10/20:

```html
<option value="25/50" data-small-blind="25" data-big-blind="50">25 / 50</option>
<option value="50/100" data-small-blind="50" data-big-blind="100">50 / 100</option>
<option value="100/200" data-small-blind="100" data-big-blind="200">100 / 200</option>
```

- [ ] **Step 4: Run automated verification**

Run: `npm test && node --check app.js && node --check amount-controls.js && git diff --check`

Expected: all tests pass with zero syntax or diff errors.

- [ ] **Step 5: Run browser verification**

Verify that selecting 25/50, 50/100, and 100/200 updates the 2 BB amount to 100, 200, and 400 respectively. Confirm calculation and mobile layout still work.

- [ ] **Step 6: Commit and publish**

```bash
git add index.html tests/ui-contract.test.js docs/superpowers/plans/2026-07-17-expanded-blind-levels.md
git commit -m "feat: expand blind level options"
git push origin main
```
