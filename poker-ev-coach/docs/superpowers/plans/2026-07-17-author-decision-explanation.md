# Author Credit and Decision Explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the header simulation badge with the author's GitHub credit and add deterministic numeric explanations for each recommendation.

**Architecture:** Add a pure `getDecisionExplanation()` function to `decision.js` and render its returned items in `app.js`. Add static semantic containers to `index.html` and focused styles to `styles.css`.

**Tech Stack:** Static HTML, CSS, JavaScript ES modules, Node.js built-in test runner.

## Global Constraints

- Author text must be `作者 · Jiaxuan Tao`.
- Author URL must be `https://github.com/jiaxuan-tao`.
- Explanations must be deterministic and use existing Equity, Pot Odds, Call EV, call amount, and decision key.
- Add no runtime dependency or external AI call.

---

### Task 1: Decision Explanation Logic

**Files:**
- Modify: `decision.js`
- Modify: `tests/decision.test.js`

**Interfaces:**
- Produces: `getDecisionExplanation({ equity, potOdds, ev, call, decisionKey })` returning `{ items, note }`.
- Consumes: numeric decision inputs already calculated in `app.js`.

- [ ] Write failing tests for a negative-EV fold and a positive-EV raise candidate.
- [ ] Run `node --test tests/decision.test.js` and confirm the export is missing.
- [ ] Implement three structured explanation items and the raise boundary note.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Author and Explanation UI

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/ui-contract.test.js`

**Interfaces:**
- Consumes: `getDecisionExplanation()` from Task 1.
- Produces: linked author credit and a responsive `为什么这样建议` result section.

- [ ] Write failing UI contract tests for the author link and explanation container.
- [ ] Run `node --test tests/ui-contract.test.js` and confirm failure.
- [ ] Replace the simulation badge, add semantic explanation markup, render items, and style desktop/mobile states.
- [ ] Run `npm test`, syntax checks, and `git diff --check`.
- [ ] Verify fold and raise examples in the browser at desktop and mobile widths.
- [ ] Commit and push after review.
