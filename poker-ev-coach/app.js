import { createDeck, simulateEquity } from "./poker.js";
import {
  calculateCallEV,
  calculatePotOdds,
  getDecision,
  getDecisionExplanation
} from "./decision.js";
import {
  getPresetAmount,
  isWholeChipAmount,
  stepChipAmount
} from "./amount-controls.js";

const ITERATIONS = 5000;
const SIMULATION_BATCH_SIZE = 250;
const DEFAULT_INPUTS = {
  blindLevel: "5/10",
  pot: "100",
  call: "20",
  opponents: "1"
};
const EXAMPLE = {
  hero: ["Ah", "Kh"],
  board: ["Qh", "Jh", "2c", null, null],
  blindLevel: "5/10",
  pot: "120",
  call: "30",
  opponents: "2"
};
const RANK_LABELS = {
  T: "10",
  J: "J",
  Q: "Q",
  K: "K",
  A: "A"
};
const SUITS = {
  c: { symbol: "♣", label: "梅花", red: false },
  d: { symbol: "♦", label: "方片", red: true },
  h: { symbol: "♥", label: "红桃", red: true },
  s: { symbol: "♠", label: "黑桃", red: false }
};

const state = {
  hero: [null, null],
  board: [null, null, null, null, null],
  activeSlot: null,
  calculating: false
};

const elements = {
  form: document.querySelector("#hand-form"),
  cardSlots: [...document.querySelectorAll(".card-slot")],
  picker: document.querySelector("#card-picker"),
  pickerDeck: document.querySelector("#picker-deck"),
  closePicker: document.querySelector("#close-picker"),
  blindLevel: document.querySelector("#blind-level"),
  pot: document.querySelector("#pot"),
  call: document.querySelector("#call"),
  opponents: document.querySelector("#opponents"),
  stepButtons: [...document.querySelectorAll("[data-step-target]")],
  amountPresetButtons: [...document.querySelectorAll("[data-amount-target]")],
  formError: document.querySelector("#form-error"),
  exampleButton: document.querySelector("#example-button"),
  resetButton: document.querySelector("#reset-button"),
  calculateButton: document.querySelector("#calculate-button"),
  results: document.querySelector(".results"),
  resultStatus: document.querySelector("#result-status"),
  resultEmpty: document.querySelector("#result-empty"),
  resultContent: document.querySelector("#result-content"),
  verdict: document.querySelector("#verdict"),
  verdictReason: document.querySelector("#verdict-reason"),
  edgeSummary: document.querySelector("#edge-summary"),
  equityValue: document.querySelector("#equity-value"),
  potOddsValue: document.querySelector("#pot-odds-value"),
  evValue: document.querySelector("#ev-value"),
  edgeValue: document.querySelector("#edge-value"),
  explanationCost: document.querySelector("#explanation-cost"),
  explanationEquity: document.querySelector("#explanation-equity"),
  explanationEv: document.querySelector("#explanation-ev"),
  explanationNote: document.querySelector("#explanation-note"),
  comparisonTrack: document.querySelector("#comparison-track"),
  legendEquity: document.querySelector("#legend-equity"),
  legendOdds: document.querySelector("#legend-odds"),
  winsValue: document.querySelector("#wins-value"),
  tiesValue: document.querySelector("#ties-value"),
  lossesValue: document.querySelector("#losses-value")
};

buildPicker();
renderSlots();
updateAmountControls();

elements.cardSlots.forEach((slot) => {
  slot.addEventListener("click", () => handleSlotClick(slot));
});

elements.pickerDeck.addEventListener("click", handlePickerClick);
elements.closePicker.addEventListener("click", () => elements.picker.close());
elements.picker.addEventListener("click", handlePickerBackdropClick);
elements.picker.addEventListener("close", restoreSlotFocus);
elements.exampleButton.addEventListener("click", loadExample);
elements.resetButton.addEventListener("click", resetApp);
elements.form.addEventListener("submit", calculate);
elements.blindLevel.addEventListener("change", handleBlindLevelChange);
elements.stepButtons.forEach((button) => {
  button.addEventListener("click", handleAmountStep);
});
elements.amountPresetButtons.forEach((button) => {
  button.addEventListener("click", applyAmountPreset);
});
[elements.pot, elements.call, elements.opponents].forEach((input) => {
  input.addEventListener("input", handleInputChange);
});

function buildPicker() {
  const fragment = document.createDocumentFragment();
  const deck = createDeck();

  for (const [suitKey, suit] of Object.entries(SUITS)) {
    const group = document.createElement("section");
    group.className = "suit-group";
    group.setAttribute("aria-label", `${suit.label}牌`);

    const suitLabel = document.createElement("span");
    suitLabel.className = `suit-label${suit.red ? " suit-label--red" : ""}`;
    suitLabel.textContent = suit.symbol;
    suitLabel.setAttribute("aria-hidden", "true");

    const cardGrid = document.createElement("div");
    cardGrid.className = "suit-cards";

    for (const card of deck.filter((deckCard) => deckCard[1] === suitKey)) {
      const button = document.createElement("button");
      button.className = `picker-card${suit.red ? " picker-card--red" : ""}`;
      button.type = "button";
      button.dataset.card = card;
      button.setAttribute("aria-label", `${suit.label}${spokenRank(card[0])}`);
      button.append(createCardFace(card, true));
      cardGrid.append(button);
    }

    group.append(suitLabel, cardGrid);
    fragment.append(group);
  }

  elements.pickerDeck.append(fragment);
}

function handleSlotClick(slot) {
  if (state.calculating) return;

  const zone = slot.dataset.zone;
  const index = Number(slot.dataset.index);
  if (state[zone][index]) {
    state[zone][index] = null;
    clearValidation();
    clearResult();
    renderSlots();
    return;
  }

  state.activeSlot = { zone, index };
  updatePickerAvailability();
  elements.picker.showModal();
}

function handlePickerClick(event) {
  const cardButton = event.target.closest("[data-card]");
  if (!cardButton || cardButton.disabled || !state.activeSlot) return;

  const { zone, index } = state.activeSlot;
  state[zone][index] = cardButton.dataset.card;
  clearValidation();
  clearResult();
  renderSlots();
  elements.picker.close();
}

function handlePickerBackdropClick(event) {
  if (event.target === elements.picker) elements.picker.close();
}

function restoreSlotFocus() {
  if (!state.activeSlot) return;
  const { zone, index } = state.activeSlot;
  const slot = elements.cardSlots.find(
    (candidate) => candidate.dataset.zone === zone && Number(candidate.dataset.index) === index
  );
  state.activeSlot = null;
  slot?.focus();
}

function renderSlots() {
  for (const slot of elements.cardSlots) {
    const zone = slot.dataset.zone;
    const index = Number(slot.dataset.index);
    const card = state[zone][index];
    const positionName = zone === "hero" ? `第${index + 1}张底牌` : `第${index + 1}张公共牌`;

    slot.replaceChildren();
    if (!card) {
      delete slot.dataset.card;
      slot.setAttribute("aria-label", `选择${positionName}`);
      slot.title = `选择${positionName}`;
      continue;
    }

    const suit = SUITS[card[1]];

    slot.dataset.card = card;
    slot.setAttribute("aria-label", `${positionName}为${suit.label}${spokenRank(card[0])}，点击移除`);
    slot.title = "点击移除";
    slot.append(createCardFace(card));
  }

  updatePickerAvailability();
}

function createCardFace(card, compact = false) {
  const suit = SUITS[card[1]];
  const rank = rankLabel(card[0]);
  const face = document.createElement("span");
  face.className = `card-face${suit.red ? " card-face--red" : ""}${
    compact ? " card-face--compact" : ""
  }`;

  const topCorner = createCardCorner(rank, suit.symbol, "card-corner card-corner--top");
  const pip = document.createElement("span");
  pip.className = "card-pip";
  pip.dataset.suit = suit.symbol;
  pip.textContent = suit.symbol;
  pip.setAttribute("aria-hidden", "true");
  const bottomCorner = createCardCorner(
    rank,
    suit.symbol,
    "card-corner card-corner--bottom"
  );

  face.append(topCorner, pip, bottomCorner);
  return face;
}

function createCardCorner(rank, suit, className) {
  const corner = document.createElement("span");
  corner.className = className;
  corner.setAttribute("aria-hidden", "true");

  const rankMark = document.createElement("span");
  rankMark.className = "card-rank";
  rankMark.textContent = rank;
  const suitMark = document.createElement("span");
  suitMark.className = "card-suit";
  suitMark.textContent = suit;
  corner.append(rankMark, suitMark);
  return corner;
}

function updatePickerAvailability() {
  const selectedCards = new Set([...state.hero, ...state.board].filter(Boolean));
  elements.pickerDeck.querySelectorAll("[data-card]").forEach((button) => {
    const selected = selectedCards.has(button.dataset.card);
    button.disabled = selected;
    button.setAttribute("aria-disabled", String(selected));
  });
}

function loadExample() {
  if (state.calculating) return;
  state.hero = [...EXAMPLE.hero];
  state.board = [...EXAMPLE.board];
  elements.blindLevel.value = EXAMPLE.blindLevel;
  elements.pot.value = EXAMPLE.pot;
  elements.call.value = EXAMPLE.call;
  elements.opponents.value = EXAMPLE.opponents;
  clearValidation();
  clearResult();
  renderSlots();
  updateAmountControls();
}

function resetApp() {
  if (state.calculating) return;
  state.hero = [null, null];
  state.board = [null, null, null, null, null];
  state.activeSlot = null;
  elements.blindLevel.value = DEFAULT_INPUTS.blindLevel;
  elements.pot.value = DEFAULT_INPUTS.pot;
  elements.call.value = DEFAULT_INPUTS.call;
  elements.opponents.value = DEFAULT_INPUTS.opponents;
  if (elements.picker.open) elements.picker.close();
  clearValidation();
  clearResult();
  renderSlots();
  updateAmountControls();
  elements.cardSlots[0].focus();
}

function handleInputChange() {
  if (state.calculating) return;
  clearValidation();
  clearResult();
  updateAmountControls();
}

function handleBlindLevelChange() {
  if (state.calculating) return;
  clearValidation();
  clearResult();
  updateAmountControls();
}

function handleAmountStep(event) {
  if (state.calculating) return;
  const button = event.currentTarget;
  const input = elements[button.dataset.stepTarget];
  const delta = Number(button.dataset.step);
  const minimum = Number(input.min);
  input.value = String(stepChipAmount(input.value, delta, minimum));
  handleInputChange();
  input.focus();
}

function applyAmountPreset(event) {
  if (state.calculating) return;
  const button = event.currentTarget;
  const input = elements[button.dataset.amountTarget];
  const multiplier = Number(button.dataset.bbMultiplier);
  input.value = String(getPresetAmount(currentBigBlind(), multiplier));
  handleInputChange();
  input.focus();
}

function currentBigBlind() {
  return Number(elements.blindLevel.selectedOptions[0].dataset.bigBlind);
}

function updateAmountControls() {
  const bigBlind = currentBigBlind();
  elements.amountPresetButtons.forEach((button) => {
    const multiplier = Number(button.dataset.bbMultiplier);
    const amount = getPresetAmount(bigBlind, multiplier);
    const input = elements[button.dataset.amountTarget];
    const valueLabel = button.querySelector("[data-preset-value]");
    valueLabel.textContent = String(amount);
    button.setAttribute("aria-label", `${multiplier} BB，${amount} 筹码`);
    button.setAttribute("aria-pressed", String(Number(input.value) === amount));
  });
}

async function calculate(event) {
  event.preventDefault();
  if (state.calculating) return;

  const values = validateInputs();
  if (!values) return;

  setCalculating(true);
  await yieldForPaint();

  try {
    const simulation = await simulateEquityInBatches({
      hero: [...state.hero],
      board: state.board.filter(Boolean),
      opponents: values.opponents,
      iterations: ITERATIONS
    });
    const potOdds = calculatePotOdds(values.pot, values.call);
    const ev = calculateCallEV(simulation.equity, values.pot, values.call);
    const decision = getDecision(simulation.equity, potOdds, ev);
    renderResult({ simulation, potOdds, ev, call: values.call, decision });
  } catch (error) {
    showError(error instanceof Error ? error.message : "计算失败，请检查输入后重试。");
  } finally {
    setCalculating(false);
  }
}

async function simulateEquityInBatches(options) {
  const aggregate = {
    equityTotal: 0,
    wins: 0,
    ties: 0,
    losses: 0,
    iterations: 0
  };

  while (aggregate.iterations < options.iterations) {
    const batchIterations = Math.min(
      SIMULATION_BATCH_SIZE,
      options.iterations - aggregate.iterations
    );
    const batch = simulateEquity({ ...options, iterations: batchIterations });

    aggregate.equityTotal += batch.equity * batch.iterations;
    aggregate.wins += batch.wins;
    aggregate.ties += batch.ties;
    aggregate.losses += batch.losses;
    aggregate.iterations += batch.iterations;

    updateLoadingProgress(aggregate.iterations, options.iterations);
    if (aggregate.iterations < options.iterations) await yieldForPaint();
  }

  return {
    equity: aggregate.equityTotal / aggregate.iterations,
    wins: aggregate.wins,
    ties: aggregate.ties,
    losses: aggregate.losses,
    iterations: aggregate.iterations
  };
}

function updateLoadingProgress(completed, total) {
  const progress = Math.round((completed / total) * 100);
  elements.resultStatus.textContent = `模拟中… ${progress}%`;
  elements.calculateButton.setAttribute("aria-label", `正在模拟，已完成 ${progress}%`);
}

function validateInputs() {
  clearValidation();

  if (state.hero.some((card) => card === null)) {
    showError("请先选择两张底牌。");
    elements.cardSlots.find((slot) => slot.dataset.zone === "hero" && !slot.dataset.card)?.focus();
    return null;
  }

  const pot = Number(elements.pot.value);
  const call = Number(elements.call.value);
  const opponents = Number(elements.opponents.value);
  const invalidFields = [];

  if (!isWholeChipAmount(elements.pot.value, 0)) {
    invalidFields.push({ element: elements.pot, message: "当前底池须为不小于 0 的整数筹码。" });
  }
  if (!isWholeChipAmount(elements.call.value, 1)) {
    invalidFields.push({ element: elements.call, message: "跟注金额须为大于 0 的整数筹码。" });
  }
  if (!Number.isInteger(opponents) || opponents < 1 || opponents > 8) {
    invalidFields.push({ element: elements.opponents, message: "对手人数须为 1 至 8 的整数。" });
  }

  if (invalidFields.length > 0) {
    invalidFields.forEach(({ element }) => element.setAttribute("aria-invalid", "true"));
    showError(invalidFields[0].message);
    invalidFields[0].element.focus();
    return null;
  }

  return { pot, call, opponents };
}

function setCalculating(calculating) {
  state.calculating = calculating;
  elements.results.setAttribute("aria-busy", String(calculating));
  elements.calculateButton.disabled = calculating;
  elements.calculateButton.classList.toggle("button--loading", calculating);
  elements.calculateButton.setAttribute(
    "aria-label",
    calculating ? "正在进行 5,000 次模拟" : "开始计算"
  );
  elements.exampleButton.disabled = calculating;
  elements.resetButton.disabled = calculating;
  elements.blindLevel.disabled = calculating;
  elements.pot.disabled = calculating;
  elements.call.disabled = calculating;
  elements.opponents.disabled = calculating;
  elements.cardSlots.forEach((slot) => {
    slot.disabled = calculating;
  });
  [...elements.stepButtons, ...elements.amountPresetButtons].forEach((button) => {
    button.disabled = calculating;
  });

  if (calculating) {
    elements.resultStatus.textContent = "模拟中… 0%";
    elements.formError.hidden = true;
  }
}

function renderResult({ simulation, potOdds, ev, call, decision }) {
  const equity = simulation.equity;
  const edge = equity - potOdds;
  const equityPercent = percent(equity);
  const oddsPercent = percent(potOdds);
  const edgePercent = signedPercent(edge);

  elements.resultEmpty.hidden = true;
  elements.resultContent.hidden = false;
  elements.results.dataset.decision = decision.key;
  elements.resultStatus.textContent = "计算完成";
  elements.verdict.textContent = decision.label;
  elements.verdictReason.textContent = `${decision.reason} Equity ${
    edge >= 0 ? "高于" : "低于"
  } Pot Odds ${percent(Math.abs(edge))}。`;
  elements.edgeSummary.textContent = `优势 ${edgePercent}`;
  elements.equityValue.textContent = equityPercent;
  elements.potOddsValue.textContent = oddsPercent;
  elements.evValue.textContent = amount(ev);
  elements.evValue.classList.toggle("negative", ev < 0);
  elements.edgeValue.textContent = edgePercent;
  renderDecisionExplanation({ equity, potOdds, ev, call, decisionKey: decision.key });
  elements.legendEquity.textContent = equityPercent;
  elements.legendOdds.textContent = oddsPercent;
  elements.winsValue.textContent = simulation.wins.toLocaleString("zh-CN");
  elements.tiesValue.textContent = simulation.ties.toLocaleString("zh-CN");
  elements.lossesValue.textContent = simulation.losses.toLocaleString("zh-CN");

  const clampedEquity = Math.min(Math.max(equity * 100, 0), 100);
  const clampedOdds = Math.min(Math.max(potOdds * 100, 0), 100);
  elements.comparisonTrack.style.setProperty("--equity", `${clampedEquity}%`);
  elements.comparisonTrack.style.setProperty("--odds", `${clampedOdds}%`);
  elements.comparisonTrack.setAttribute(
    "aria-label",
    `Equity ${equityPercent}，Pot Odds ${oddsPercent}，优势 ${edgePercent}`
  );
}

function renderDecisionExplanation({ equity, potOdds, ev, call, decisionKey }) {
  const explanation = getDecisionExplanation({ equity, potOdds, ev, call, decisionKey });
  const [cost, equityComparison, longTerm] = explanation.items;

  elements.explanationCost.textContent = cost.text;
  elements.explanationEquity.textContent = equityComparison.text;
  elements.explanationEv.textContent = longTerm.text;
  elements.explanationNote.textContent = explanation.note;
  elements.explanationNote.hidden = !explanation.note;
}

function clearResult() {
  delete elements.results.dataset.decision;
  elements.results.removeAttribute("aria-busy");
  elements.resultStatus.textContent = "等待输入";
  elements.resultEmpty.hidden = false;
  elements.resultContent.hidden = true;
}

function showError(message) {
  elements.formError.textContent = message;
  elements.formError.hidden = false;
  elements.resultStatus.textContent = "输入有误";
}

function clearValidation() {
  elements.formError.hidden = true;
  elements.formError.textContent = "";
  [elements.pot, elements.call, elements.opponents].forEach((input) => {
    input.removeAttribute("aria-invalid");
  });
}

function yieldForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function signedPercent(value) {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${percent(Math.abs(value))}`;
}

function amount(value) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

function rankLabel(rank) {
  return RANK_LABELS[rank] ?? rank;
}

function spokenRank(rank) {
  const names = {
    T: "10",
    J: "J",
    Q: "Q",
    K: "K",
    A: "A"
  };
  return names[rank] ?? rank;
}
