# 今天吃什么 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a polished, local-first “今天吃什么” Web app with direct and hierarchical food wheels.

**Architecture:** A dependency-free static application separates preset data, pure picker rules, versioned storage, synthesized audio, and DOM orchestration. Node’s built-in test runner verifies all decision rules and page contracts; Playwright performs end-to-end interaction and responsive visual QA.

**Tech Stack:** Semantic HTML, CSS, Vanilla JavaScript ES modules, Canvas 2D, Web Audio API, localStorage, Node.js 22 test runner, Playwright for local QA, GitHub Pages.

## Global Constraints

- The application must remain a static Web project with no runtime dependencies or build step.
- The project folder is `what-to-eat/` inside `vibe-coding-lab`.
- The product name displayed in the application is `今天吃什么`.
- The two decision modes are `直接开转` and `按菜系选`.
- The visual direction is “趣味食堂”: 18px fine green print grid, dark green, vermilion, mustard, rice white, hard offset shadows.
- The app must not add accounts, backend, database, maps, restaurants, recipes, nutrition calculations, AI, menu scanning, or paid services.
- Each wheel must show 8–12 candidates when the eligible pool permits.
- The three most recently accepted concrete dishes are excluded; temporary rejection lasts 24 hours.
- Sound must be generated locally through Web Audio API and must load no audio files.
- Runtime visual assets must be local files.
- Open-source attribution to `Kayleeli/food-spinner` and its MIT license must be preserved.

---

## File Map

- `what-to-eat/index.html`: semantic application shell, controls, drawers, dialogs, accessible labels.
- `what-to-eat/styles.css`: responsive “趣味食堂” design, wheel, result ticket, drawer, states.
- `what-to-eat/foods.js`: preset food taxonomy and validation helpers.
- `what-to-eat/picker.js`: filtering, sampling, hierarchy, secure random selection, exclusions.
- `what-to-eat/storage.js`: versioned persistence, validation, expiration cleanup.
- `what-to-eat/audio.js`: synthesized tick and result sounds.
- `what-to-eat/app.js`: state machine, Canvas rendering, animation, DOM events.
- `what-to-eat/assets/food-poster.webp`: local raster visual for result/empty states.
- `what-to-eat/tests/picker.test.js`: picker behavior tests.
- `what-to-eat/tests/storage.test.js`: persistence behavior tests.
- `what-to-eat/tests/ui-contract.test.js`: markup, copy, asset, and accessibility contracts.
- `what-to-eat/package.json`: Node test command and ES module mode.
- `what-to-eat/README.md`: user-facing project documentation.
- `what-to-eat/LICENSE`: repository MIT license.
- `what-to-eat/THIRD_PARTY_NOTICES.md`: source attribution and original MIT notice.
- `what-to-eat/docs/images/what-to-eat-preview.png`: verified product screenshot.
- `README.md`, `projects/README.md`, `site/index.html`, `.github/workflows/pages.yml`: portfolio integration.

---

### Task 1: Preset Taxonomy and Picker Rules

**Files:**
- Create: `what-to-eat/package.json`
- Create: `what-to-eat/tests/picker.test.js`
- Create: `what-to-eat/foods.js`
- Create: `what-to-eat/picker.js`

**Interfaces:**
- Produces `FOODS`, `TOP_LEVEL_GROUPS`, `CHINESE_CUISINES`, `getFoodById(id)`.
- Produces `filterFoods(foods, filters, exclusions, now)`, `sampleCandidates(items, limit, rng)`, `buildHierarchyOptions(foods, path)`, `pickSecureIndex(length, randomValues)`, `createCandidatePool(options)`.

- [ ] **Step 1: Create the test runner and failing picker tests**

```json
{
  "name": "what-to-eat",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

Test concrete behaviors: taxonomy has at least 90 unique concrete dishes; filters intersect meal/flavor/spend; recent accepted IDs are excluded; unexpired temporary blocks are excluded; expired blocks are restored; candidate sampling returns 8–12 unique items; hierarchy root returns seven top-level groups; the Chinese path returns the nine specified sub-cuisines; secure index values stay in bounds.

- [ ] **Step 2: Run tests and confirm the RED state**

Run: `cd what-to-eat && npm test`

Expected: FAIL because `foods.js` and `picker.js` do not exist.

- [ ] **Step 3: Implement the preset data and pure picker functions**

Use records shaped as:

```js
{
  id: "luosifen",
  name: "螺蛳粉",
  group: "中餐",
  cuisine: "广西风味",
  meals: ["午餐", "晚餐", "夜宵"],
  flavors: ["想吃辣", "来点硬菜"],
  spends: ["简单吃", "正常吃"],
  visual: "noodles"
}
```

`filterFoods` must use exact tag membership, exclude `recentAccepted`, and compare `blockedUntil[id] > now`. `sampleCandidates` must use Fisher–Yates with injected `rng` and clamp its size to 12.

- [ ] **Step 4: Run picker tests and confirm GREEN**

Run: `cd what-to-eat && npm test`

Expected: all picker tests pass.

- [ ] **Step 5: Commit the picker core**

```bash
git add what-to-eat/package.json what-to-eat/foods.js what-to-eat/picker.js what-to-eat/tests/picker.test.js
git commit -m "feat: add food taxonomy and picker rules"
```

---

### Task 2: Versioned Local Persistence

**Files:**
- Create: `what-to-eat/tests/storage.test.js`
- Create: `what-to-eat/storage.js`

**Interfaces:**
- Consumes food IDs and filter labels from Task 1.
- Produces `DEFAULT_STATE`, `normalizeState(value, now)`, `loadState(storage, now)`, `saveState(storage, state)`, `blockTemporarily(state, foodId, now)`, `acceptFood(state, foodId)`.

- [ ] **Step 1: Write failing storage tests**

Cover missing storage, malformed JSON, wrong schema version, invalid custom foods, expired temporary blocks, three-item accepted history, duplicate favorites, sound persistence, and `setItem` failure.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `cd what-to-eat && node --test tests/storage.test.js`

Expected: FAIL because `storage.js` does not exist.

- [ ] **Step 3: Implement storage normalization**

Use key `what-to-eat.state.v1`. `loadState` must never throw. `acceptFood` prepends the accepted ID, removes duplicates, and truncates to three. `blockTemporarily` stores `now + 86_400_000`.

- [ ] **Step 4: Run all tests and confirm GREEN**

Run: `cd what-to-eat && npm test`

Expected: picker and storage tests pass.

- [ ] **Step 5: Commit persistence**

```bash
git add what-to-eat/storage.js what-to-eat/tests/storage.test.js
git commit -m "feat: persist food preferences locally"
```

---

### Task 3: Accessible Application Shell and UI Contracts

**Files:**
- Create: `what-to-eat/tests/ui-contract.test.js`
- Create: `what-to-eat/index.html`
- Create: `what-to-eat/styles.css`
- Create: `what-to-eat/assets/food-poster.webp`

**Interfaces:**
- Produces stable DOM IDs consumed by Task 4: `wheel`, `spin-button`, `mode-control`, `filter-meal`, `filter-flavor`, `filter-spend`, `candidate-list`, `result-ticket`, `library-drawer`, `sound-toggle`.

- [ ] **Step 1: Write failing UI contract tests**

Tests read HTML/CSS as text and require the product title, both modes, three filter controls, Canvas fallback text, standard icon button accessible labels, result actions, library tabs, custom food form, `<dialog>`/drawer semantics, local poster asset, `prefers-reduced-motion`, mobile breakpoint, 18px grid, and no external runtime image/font URLs.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `cd what-to-eat && node --test tests/ui-contract.test.js`

Expected: FAIL because the application shell does not exist.

- [ ] **Step 3: Generate and save the local food poster**

Create one screen-print-style raster illustration with bowls, noodles, sushi, hotpot, dumplings, and chopsticks. It must contain no text and use the established green/red/mustard/rice palette.

- [ ] **Step 4: Implement semantic HTML and responsive CSS**

Build the confirmed layout: dark green header, segmented mode control, quick filters, left path rail, central wheel, right candidate ticket, bottom status strip, result ticket, and library drawer. Keep all buttons at least 44px on touch layouts and prevent horizontal overflow at 390px.

- [ ] **Step 5: Run UI contracts and confirm GREEN**

Run: `cd what-to-eat && npm test`

Expected: all picker, storage, and UI contract tests pass.

- [ ] **Step 6: Commit the visual shell**

```bash
git add what-to-eat/index.html what-to-eat/styles.css what-to-eat/assets/food-poster.webp what-to-eat/tests/ui-contract.test.js
git commit -m "feat: build playful canteen interface"
```

---

### Task 4: Audio, Wheel Animation, and Complete Interaction Flow

**Files:**
- Create: `what-to-eat/audio.js`
- Create: `what-to-eat/app.js`
- Modify: `what-to-eat/tests/ui-contract.test.js`

**Interfaces:**
- Consumes all Task 1 picker functions and Task 2 persistence functions.
- Produces browser behavior for mode changes, filtering, candidate refresh, spin, hierarchy drill-down, result actions, custom food management, favorites, temporary blocks, keyboard focus, and sound.

- [ ] **Step 1: Add failing contracts for module wiring and result actions**

Require module script loading, imports from all four modules, `requestAnimationFrame`, `crypto.getRandomValues`, audio labels, result focus management, and handlers for accept/reroll/block/continue.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `cd what-to-eat && node --test tests/ui-contract.test.js`

Expected: FAIL because `audio.js` and `app.js` do not exist.

- [ ] **Step 3: Implement synthesized audio**

`createAudioController()` must lazily create `AudioContext`, expose `setEnabled`, `tick`, `result`, and `dispose`, and return silently when disabled or unsupported. Tick uses a short oscillator envelope; result plays a short ascending two-note sequence.

- [ ] **Step 4: Implement the application state machine**

Represent hierarchy path as `[]`, `[group]`, or `[group, cuisine]`. Preselect meal from local time. Draw Canvas segments with stable dimensions and dynamically sized Chinese labels. Compute the visual stop angle from the already selected final index so the pointer and result cannot disagree.

- [ ] **Step 5: Implement result and library workflows**

Cuisine results expose accept/continue. Concrete dish results expose temporary block/reroll/accept. Opening the library traps focus through native dialog behavior; closing restores focus to the invoking button. Add, favorite, delete, unblock, and save preset interactions must persist immediately.

- [ ] **Step 6: Run all tests and confirm GREEN**

Run: `cd what-to-eat && npm test`

Expected: all tests pass with no warnings.

- [ ] **Step 7: Commit the complete interaction**

```bash
git add what-to-eat/audio.js what-to-eat/app.js what-to-eat/tests/ui-contract.test.js
git commit -m "feat: complete layered wheel interactions"
```

---

### Task 5: Documentation, Attribution, and Portfolio Integration

**Files:**
- Create: `what-to-eat/README.md`
- Create: `what-to-eat/LICENSE`
- Create: `what-to-eat/THIRD_PARTY_NOTICES.md`
- Modify: `README.md`
- Modify: `projects/README.md`
- Modify: `site/index.html`
- Modify: `.github/workflows/pages.yml`

**Interfaces:**
- Publishes the app at `/vibe-coding-lab/what-to-eat/`.

- [ ] **Step 1: Write user-oriented documentation**

Document the problem, direct and hierarchical modes, filters, personal library, local privacy, sound approach, local setup, tests, architecture, limits, and open-source adaptation. Do not include employment-oriented wording.

- [ ] **Step 2: Add license and attribution**

Use MIT for the new project. In `THIRD_PARTY_NOTICES.md`, link to `https://github.com/Kayleeli/food-spinner`, identify Canvas wheel math as the adapted idea, include the source MIT notice, and state which areas were rewritten.

- [ ] **Step 3: Add project links and card**

Add `What to Eat 今天吃什么` to both Markdown indexes. Add `PROJECT 05` to the portfolio page with online and source links. Update Pages assembly to copy the entire static project and its preview image.

- [ ] **Step 4: Run repository tests**

Run:

```bash
cd what-to-eat && npm test
cd ../poker-ev-coach && npm test
cd ../prompt-manager && npm test
```

Expected: all project tests pass.

- [ ] **Step 5: Commit docs and integration**

```bash
git add what-to-eat/README.md what-to-eat/LICENSE what-to-eat/THIRD_PARTY_NOTICES.md README.md projects/README.md site/index.html .github/workflows/pages.yml
git commit -m "docs: add what-to-eat to project lab"
```

---

### Task 6: Browser QA, Preview Asset, Deployment, and Final Verification

**Files:**
- Create: `what-to-eat/docs/images/what-to-eat-preview.png`
- Modify if defects are found: files from Tasks 3–5.

**Interfaces:**
- Produces a verified local and deployed experience.

- [ ] **Step 1: Start a local static server**

Run: `python3 -m http.server 51880 --bind 127.0.0.1`

Expected: `http://127.0.0.1:51880/what-to-eat/` returns HTTP 200.

- [ ] **Step 2: Test the desktop flow with Playwright**

At 1440×1000, verify direct spin, mode switch, Chinese hierarchy, continue to a dish, accept, reroll, temporary block, sound toggle, library add/favorite/delete, refresh persistence, keyboard focus, and zero console errors.

- [ ] **Step 3: Test tablet and mobile layouts**

At 768×1024 and 390×844, verify no overlap, no horizontal scrolling, readable wheel labels, bottom drawer behavior, result actions, and fixed wheel dimensions.

- [ ] **Step 4: Verify motion and canvas pixels**

Check the Canvas has non-background pixels before and during spin; confirm the transform/angle changes over time. Emulate reduced motion and confirm the flow completes without decorative shake.

- [ ] **Step 5: Capture the portfolio screenshot**

Save a 1440px-wide screenshot to `what-to-eat/docs/images/what-to-eat-preview.png`. Ensure it shows the real wheel, filters, candidate ticket, and no browser chrome.

- [ ] **Step 6: Run the full verification suite**

Run:

```bash
git diff --check
cd what-to-eat && npm test
cd ../poker-ev-coach && npm test
cd ../prompt-manager && npx tsc --noEmit && npm test && npm run build
```

Expected: every command exits 0.

- [ ] **Step 7: Commit final QA assets and fixes**

```bash
git add what-to-eat site .github README.md projects/README.md
git commit -m "test: verify what-to-eat experience"
```

- [ ] **Step 8: Push and verify GitHub Pages**

Run:

```bash
git push origin main
gh run watch --repo jiaxuan-tao/vibe-coding-lab --exit-status
```

Open `https://jiaxuan-tao.github.io/vibe-coding-lab/what-to-eat/` and repeat one direct spin and one hierarchical spin. Confirm the portfolio card image and both links work.
