# Poker EV Coach Design

> **Migration note (2026-07-17):** The project was initially delivered as a
> standalone repository and was later moved to
> `vibe-coding-lab/poker-ev-coach/`. Standalone repository publication
> details below are historical and should not be repeated.

## Goal

Build a small, self-contained Texas Hold'em decision assistant that can be
finished in one day, demonstrated in a browser, and published as a clean
GitHub project.

The product is a study and review tool. It does not support real-money play,
live table capture, account systems, hand-history storage, GTO solving, or AI
chat.

## Product Scope

The user selects:

- Two hole cards
- Zero to five community cards
- Pot size before calling
- Call amount
- Number of opponents

The application calculates:

- Estimated showdown equity using Monte Carlo simulation
- Pot odds required to call
- Estimated call EV
- A simple `Fold`, `Call`, or `Raise candidate` verdict
- A short Chinese explanation of the result

The application also includes example scenarios, reset controls, validation,
and a short educational disclaimer.

## Delivery Shape

This is a responsive static web application. It is designed primarily for a
desktop browser and remains usable in a mobile browser. It is not a native
mobile application.

The project uses plain HTML, CSS, and JavaScript with no runtime dependencies,
backend, database, login, API key, or build step. It can be served locally by
any static web server and deployed directly to GitHub Pages.

## Architecture

- `index.html`: semantic page structure and controls
- `styles.css`: responsive visual system and card-selection interface
- `poker.js`: card model, five-card and seven-card hand evaluation, deck
  construction, and Monte Carlo simulation
- `app.js`: UI state, validation, calculations, verdict rules, examples, and
  rendering
- `tests/poker.test.js`: deterministic unit tests using Node's built-in test
  runner
- `README.md`: project purpose, feature list, local usage, calculation model,
  limitations, and interview-ready explanation

The poker engine exposes pure functions so it can be tested independently from
the browser interface.

## Calculation Rules

Equity is estimated by repeatedly dealing unknown board cards and opponent
hands from the remaining deck. Ties contribute fractional equity.

Pot odds use:

`call amount / (current pot + call amount)`

Call EV uses:

`equity * (current pot + call amount) - call amount`

The verdict is intentionally heuristic:

- `Fold` when equity is below the required pot odds
- `Call` when equity clears the required pot odds
- `Raise candidate` when equity clears the threshold by a meaningful margin

The interface labels the raise result as a candidate rather than a definitive
strategy because position, stack depth, ranges, future betting, and player
tendencies are outside the model.

## Interaction Design

The first screen is the tool itself, not a marketing page. Card slots open a
compact card picker. Selected cards are disabled everywhere else to prevent
duplicates.

The layout contains:

1. Hand and board selection
2. Pot, call, and opponent inputs
3. One primary calculate action
4. Stable result metrics and decision explanation

Desktop uses a two-column workspace; mobile collapses to a single column.
Controls have fixed dimensions so cards and result values do not shift the
layout.

## Error Handling

The calculate action is disabled or returns an inline message when:

- Fewer than two hole cards are selected
- Pot or call values are invalid
- An impossible duplicate-card state is encountered

Simulation work is capped to keep the interface responsive. A loading state
prevents repeated calculations while a run is active.

## Testing

Unit tests cover:

- Hand-category ordering
- Wheel straight handling
- Tie comparison
- Duplicate-card rejection
- Simulation result bounds
- Pot-odds and EV formulas

Manual browser checks cover:

- Card selection and deselection
- Example loading and reset
- Desktop and mobile layouts
- Calculation loading and result states
- No console errors

## Publishing

The finished project will be initialized as its own Git repository and
published as a public GitHub repository named `poker-ev-coach`, unless that
name is unavailable. GitHub Pages will be enabled if the available GitHub
authentication permits it.
