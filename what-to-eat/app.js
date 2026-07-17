import { FOODS, OPTIONAL_FOREIGN_CUISINES } from "./foods.js";
import {
  createCandidatePool,
  createHierarchyCandidates,
  pickSecureIndex,
} from "./picker.js";
import {
  acceptFood,
  blockTemporarily,
  loadState,
  saveState,
} from "./storage.js";
import { createAudioController } from "./audio.js";
import {
  normalizeLegacyCustomTaxonomy,
  normalizeLegacyHierarchyPath,
} from "./migration.js";
import {
  enhanceSelects,
  syncEnhancedSelects,
} from "./select-menu.js";

const UI_STORAGE_KEY = "what-to-eat.ui.v1";
const CORE_STORAGE_KEY = "what-to-eat.state.v1";
const TAU = Math.PI * 2;
const WHEEL_COLORS = ["#c8422f", "#d9a321", "#2d6f88", "#fffaf0", "#82a68b"];

const elements = {
  modeControl: document.getElementById("mode-control"),
  directionControl: document.getElementById("direction-control"),
  meal: document.getElementById("filter-meal"),
  flavor: document.getElementById("filter-flavor"),
  spend: document.getElementById("filter-spend"),
  wheel: document.getElementById("wheel"),
  spin: document.getElementById("spin-button"),
  feedback: document.getElementById("wheel-feedback"),
  stageCount: document.getElementById("stage-count"),
  wheelHeading: document.getElementById("wheel-heading"),
  candidateList: document.getElementById("candidate-list"),
  refresh: document.getElementById("refresh-candidates"),
  saveCombination: document.getElementById("save-combination"),
  ticketDate: document.getElementById("ticket-date"),
  pathList: document.getElementById("path-list"),
  sound: document.getElementById("sound-toggle"),
  soundState: document.getElementById("sound-state"),
  openLibrary: document.getElementById("open-library"),
  libraryState: document.getElementById("library-state"),
  library: document.getElementById("library-drawer"),
  closeLibrary: document.getElementById("close-library"),
  result: document.getElementById("result-ticket"),
  closeResult: document.getElementById("close-result"),
  resultName: document.getElementById("result-name"),
  resultCategory: document.getElementById("result-category"),
  resultArt: document.getElementById("result-art"),
  resultTags: document.getElementById("result-tags"),
  cuisineActions: document.getElementById("cuisine-result-actions"),
  foodActions: document.getElementById("food-result-actions"),
  restartCuisine: document.getElementById("restart-cuisine"),
  continueCuisine: document.getElementById("continue-cuisine"),
  blockResult: document.getElementById("block-result"),
  rerollResult: document.getElementById("reroll-result"),
  acceptResult: document.getElementById("accept-result"),
  customForm: document.getElementById("custom-food-form"),
  customFeedback: document.getElementById("custom-food-feedback"),
  presetFoods: document.getElementById("preset-foods"),
  presetCount: document.getElementById("preset-count"),
  favoriteCount: document.getElementById("favorite-count"),
  customFoods: document.getElementById("custom-foods"),
  blockedFoods: document.getElementById("blocked-foods"),
  optionalCuisines: document.getElementById("optional-cuisines"),
};

let coreState = loadState(window.localStorage);
let uiState = loadUiState();
let mode = uiState.mode;
let hierarchyPath = mode === "cuisine" ? [uiState.direction] : [];
let candidatePool = [];
let selectedResult = null;
let currentRotation = 0;
let isSpinning = false;
let resultInvoker = elements.spin;
let libraryInvoker = elements.openLibrary;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const audio = createAudioController({ enabled: coreState.soundEnabled });
const wheelContext = elements.wheel.getContext("2d");

function normalizeSavedCombination(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;

  const filters = {
    meal: ["不限", "早餐", "午餐", "晚餐", "夜宵"].includes(item.filters?.meal)
      ? item.filters.meal
      : "不限",
    flavor: ["不限", "想吃辣", "清淡点", "来点硬菜", "想吃甜"].includes(item.filters?.flavor)
      ? item.filters.flavor
      : "不限",
    spend: ["不限", "简单吃", "正常吃", "犒劳自己"].includes(item.filters?.spend)
      ? item.filters.spend
      : "不限",
  };
  const path = normalizeLegacyHierarchyPath(item.path);
  const name = typeof item.name === "string" && item.name.trim()
    ? item.name.trim()
    : combinationLabel(filters, path);

  return {
    id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : `saved-${index}`,
    name,
    mode: item.mode === "cuisine" ? "cuisine" : "direct",
    filters,
    path,
  };
}

function loadUiState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(UI_STORAGE_KEY) || "{}");
    const savedCombinations = Array.isArray(parsed.savedCombinations)
      ? parsed.savedCombinations
        .map(normalizeSavedCombination)
        .filter(Boolean)
        .slice(0, 12)
      : [];
    return {
      mode: parsed.mode === "cuisine" ? "cuisine" : "direct",
      direction: parsed.direction === "外国菜" ? "外国菜" : "中餐",
      savedCombinations,
    };
  } catch {
    return { mode: "direct", direction: "中餐", savedCombinations: [] };
  }
}

function saveUiState() {
  try {
    window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify({
      mode,
      direction: uiState.direction,
      savedCombinations: uiState.savedCombinations,
    }));
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

function persistCoreState() {
  saveState(window.localStorage, coreState);
}

function inferMeal() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return "早餐";
  if (hour >= 10 && hour < 15) return "午餐";
  if (hour >= 15 && hour < 22) return "晚餐";
  return "夜宵";
}

function normalizeCustomFood(food) {
  const { origin, cuisine } = normalizeLegacyCustomTaxonomy(food);
  return {
    ...food,
    origin,
    group: origin,
    cuisine,
    category: food.category || "我的自定义",
    availability: "default",
    image: food.image || "assets/food-poster.jpg",
    meals: food.meals?.length ? [...food.meals] : ["午餐", "晚餐"],
    flavors: food.flavors?.length ? [...food.flavors] : ["来点硬菜"],
    spends: food.spends?.length ? [...food.spends] : ["正常吃"],
    visual: food.visual || "dish",
  };
}

function getAllFoods() {
  return [...FOODS, ...coreState.customFoods.map(normalizeCustomFood)];
}

function replaceOptions(select, options) {
  const fragment = document.createDocumentFragment();
  options.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    fragment.append(option);
  });
  select.replaceChildren(fragment);
}

function normalizeFilterControls() {
  replaceOptions(elements.flavor, [
    ["", "不限"],
    ["想吃辣", "想吃辣"],
    ["清淡点", "清淡点"],
    ["来点硬菜", "来点硬菜"],
    ["想吃甜", "想吃甜"],
  ]);
  replaceOptions(elements.spend, [
    ["", "不限"],
    ["简单吃", "简单吃"],
    ["正常吃", "正常吃"],
    ["犒劳自己", "犒劳自己"],
  ]);
  replaceOptions(elements.customForm.elements["food-flavor"], [
    ["", "请选择"],
    ["想吃辣", "想吃辣"],
    ["清淡点", "清淡点"],
    ["来点硬菜", "来点硬菜"],
    ["想吃甜", "想吃甜"],
  ]);
  replaceOptions(elements.customForm.elements["food-spend"], [
    ["", "请选择"],
    ["简单吃", "简单吃"],
    ["正常吃", "正常吃"],
    ["犒劳自己", "犒劳自己"],
  ]);

  let hasSavedCoreState = false;
  try {
    hasSavedCoreState = Boolean(window.localStorage.getItem(CORE_STORAGE_KEY));
  } catch {
    hasSavedCoreState = false;
  }

  if (!hasSavedCoreState || coreState.filters.meal === "不限") {
    coreState = {
      ...coreState,
      filters: { ...coreState.filters, meal: inferMeal() },
    };
  }

  const selectValues = {
    meal: coreState.filters.meal === "不限" ? "" : coreState.filters.meal,
    flavor: ["想吃辣", "清淡点", "来点硬菜", "想吃甜"].includes(coreState.filters.flavor)
      ? coreState.filters.flavor
      : "",
    spend: ["简单吃", "正常吃", "犒劳自己"].includes(coreState.filters.spend)
      ? coreState.filters.spend
      : "",
  };

  elements.meal.value = selectValues.meal;
  elements.flavor.value = selectValues.flavor;
  elements.spend.value = selectValues.spend;
  coreState = {
    ...coreState,
    filters: {
      meal: selectValues.meal || "不限",
      flavor: selectValues.flavor || "不限",
      spend: selectValues.spend || "不限",
    },
    customFoods: coreState.customFoods.map(normalizeCustomFood),
  };
  persistCoreState();
}

function currentFilters() {
  return {
    meal: elements.meal.value || "不限",
    flavor: elements.flavor.value || "不限",
    spend: elements.spend.value || "不限",
  };
}

function currentExclusions() {
  return {
    recentAccepted: coreState.recentAccepted,
    blockedUntil: coreState.blockedUntil,
  };
}

function describeCandidate(item) {
  if (item.type === "cuisine") return item.origin;
  return `${item.cuisine} · ${item.origin}`;
}

function refreshCandidatePool() {
  const foods = getAllFoods();
  candidatePool = mode === "direct"
    ? createCandidatePool({
      foods,
      filters: currentFilters(),
      exclusions: currentExclusions(),
      limit: 12,
      enabledOptionalCuisines: coreState.enabledOptionalCuisines,
    })
    : createHierarchyCandidates({
      foods,
      path: hierarchyPath,
      filters: currentFilters(),
      exclusions: currentExclusions(),
      limit: 12,
      enabledOptionalCuisines: coreState.enabledOptionalCuisines,
    });

  renderCandidates();
  renderPath();
  drawWheel(candidatePool, currentRotation);
}

function renderCandidates() {
  elements.candidateList.replaceChildren();
  candidatePool.forEach((item, index) => {
    const row = document.createElement("li");
    const number = document.createElement("span");
    const name = document.createElement("b");
    const detail = document.createElement("small");
    number.textContent = String(index + 1).padStart(2, "0");
    name.textContent = item.name;
    detail.textContent = describeCandidate(item);
    row.append(number, name, detail);
    elements.candidateList.append(row);
  });

  const count = candidatePool.length;
  elements.stageCount.textContent = String(count);
  const today = new Date();
  elements.ticketDate.textContent = `${today.getMonth() + 1}月${today.getDate()}日`;
  elements.ticketDate.dateTime = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const filters = currentFilters();

  if (candidatePool.length === 0) {
    elements.spin.disabled = true;
    elements.feedback.textContent = "候选不足，请放宽或减少筛选条件";
  } else if (candidatePool.length === 1) {
    elements.spin.disabled = false;
    elements.feedback.textContent = "只有 1 个候选，点击开转直接确认";
  } else {
    elements.spin.disabled = false;
    elements.feedback.textContent = `${count} 个候选已备好`;
  }

  if (mode === "direct") {
    elements.wheelHeading.textContent = `${filters.meal === "不限" ? "今日" : filters.meal}转盘`;
  } else if (hierarchyPath.length === 1) {
    elements.wheelHeading.textContent = `${hierarchyPath[0]} · 选菜系`;
  } else {
    elements.wheelHeading.textContent = `${hierarchyPath[1]} · 选一道菜`;
  }
}

function appendPathStep(index, label, state, depth) {
  const item = document.createElement("li");
  item.className = `is-${state}`;
  if (state === "current" || state === "selected") {
    const current = document.createElement("div");
    current.className = state === "current" ? "path-current" : "path-selected";
    if (state === "current") current.setAttribute("aria-current", "step");
    const number = document.createElement("span");
    number.textContent = String(index).padStart(2, "0");
    current.append(number, document.createTextNode(label));
    item.append(current);
  } else if (state === "complete") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "path-back";
    button.dataset.depth = String(depth);
    const number = document.createElement("span");
    number.textContent = String(index).padStart(2, "0");
    button.append(number, document.createTextNode(label), document.createTextNode(" 返回"));
    item.append(button);
  } else {
    const pending = document.createElement("span");
    const number = document.createElement("b");
    number.textContent = String(index).padStart(2, "0");
    pending.append(number, document.createTextNode(` ${label}`));
    item.append(pending);
  }
  elements.pathList.append(item);
}

function renderPath() {
  elements.pathList.replaceChildren();
  if (mode === "direct") {
    appendPathStep(1, "全部菜品", "current", 0);
    appendPathStep(2, "菜系类别", "pending", 1);
    appendPathStep(3, "具体菜品", "pending", 2);
    return;
  }

  appendPathStep(1, hierarchyPath[0], "selected", 1);
  appendPathStep(
    2,
    hierarchyPath[1] || "具体菜系",
    hierarchyPath.length === 1 ? "current" : hierarchyPath.length > 1 ? "complete" : "pending",
    1,
  );
  appendPathStep(3, "具体菜品", hierarchyPath.length === 2 ? "current" : "pending", 2);
}

function wrapWheelLabel(name) {
  if (name.length <= 5) return [name];
  const midpoint = Math.ceil(name.length / 2);
  return [name.slice(0, midpoint), name.slice(midpoint)];
}

function drawWheel(items, rotation = 0) {
  const canvas = elements.wheel;
  const context = wheelContext;
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 10;

  context.clearRect(0, 0, size, size);
  context.save();
  context.translate(center, center);

  if (!items.length) {
    context.fillStyle = "#fffaf0";
    context.beginPath();
    context.arc(0, 0, radius, 0, TAU);
    context.fill();
    context.fillStyle = "#123f35";
    context.font = '800 28px "Microsoft YaHei", sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("没有符合条件的候选", 0, -8);
    context.font = '700 18px "Microsoft YaHei", sans-serif';
    context.fillText("试着放宽筛选条件", 0, 30);
    context.restore();
    return;
  }

  const arc = TAU / items.length;
  const fontSize = Math.max(15, Math.min(26, 250 / items.length));

  items.forEach((item, index) => {
    const start = rotation + index * arc - Math.PI / 2;
    const end = start + arc;
    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, start, end);
    context.closePath();
    context.fillStyle = WHEEL_COLORS[index % WHEEL_COLORS.length];
    context.fill();
    context.strokeStyle = "#123f35";
    context.lineWidth = 4;
    context.stroke();

    const middle = start + arc / 2;
    const labelRadius = radius * 0.69;
    context.save();
    context.translate(Math.cos(middle) * labelRadius, Math.sin(middle) * labelRadius);
    context.rotate(middle + Math.PI / 2);
    context.fillStyle = index % WHEEL_COLORS.length === 3 ? "#082d27" : "#fffaf0";
    context.font = `900 ${fontSize}px "Microsoft YaHei", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    wrapWheelLabel(item.name).forEach((line, lineIndex, lines) => {
      context.fillText(line, 0, (lineIndex - (lines.length - 1) / 2) * (fontSize + 3));
    });
    context.restore();
  });

  context.beginPath();
  context.arc(0, 0, radius * 0.1, 0, TAU);
  context.fillStyle = "#123f35";
  context.fill();
  context.restore();
}

function secureIndex(length) {
  if (!window.crypto?.getRandomValues) {
    throw new Error("当前浏览器不支持安全随机选择");
  }

  for (;;) {
    const values = new Uint32Array(4);
    window.crypto.getRandomValues(values);
    try {
      return pickSecureIndex(length, values);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }
}

function easeOutQuint(progress) {
  return 1 - ((1 - progress) ** 5);
}

function setSpinControlsDisabled(disabled) {
  [
    ...elements.modeControl.querySelectorAll("input"),
    ...elements.directionControl.querySelectorAll("input"),
    elements.meal,
    elements.flavor,
    elements.spend,
    elements.refresh,
    elements.openLibrary,
    ...elements.pathList.querySelectorAll("button"),
  ].forEach((control) => {
    control.disabled = disabled;
  });
  elements.spin.disabled = disabled || candidatePool.length === 0;
  syncEnhancedSelects(document);
}

function startSpin() {
  if (isSpinning || candidatePool.length === 0) return;
  const spinCandidates = [...candidatePool];

  let selectedIndex;
  try {
    selectedIndex = secureIndex(spinCandidates.length);
  } catch (error) {
    elements.feedback.textContent = error.message;
    return;
  }

  selectedResult = spinCandidates[selectedIndex];
  isSpinning = true;
  setSpinControlsDisabled(true);
  elements.feedback.textContent = "转盘正在选菜…";

  const arc = TAU / spinCandidates.length;
  const normalizedCurrent = ((currentRotation % TAU) + TAU) % TAU;
  const selectedCenter = ((-(selectedIndex + 0.5) * arc) % TAU + TAU) % TAU;
  const forwardOffset = (selectedCenter - normalizedCurrent + TAU) % TAU;
  const targetRotation = currentRotation + (reducedMotion.matches ? 1 : 6) * TAU + forwardOffset;
  const duration = reducedMotion.matches ? 260 : 3600;
  const startedAt = performance.now();
  let lastBoundary = Math.floor(currentRotation / arc);

  function animate(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = easeOutQuint(progress);
    const rotation = currentRotation + (targetRotation - currentRotation) * eased;
    const boundary = Math.floor(rotation / arc);
    if (boundary !== lastBoundary) {
      audio.tick();
      lastBoundary = boundary;
    }
    drawWheel(spinCandidates, rotation);

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    currentRotation = selectedCenter;
    drawWheel(spinCandidates, currentRotation);
    isSpinning = false;
    setSpinControlsDisabled(false);
    elements.feedback.textContent = `转到了：${selectedResult.name}`;
    audio.result();
    showResult(selectedResult);
  }

  requestAnimationFrame(animate);
}

function resultTags(item) {
  if (item.type === "cuisine") return [item.origin, "下一步选择具体菜品"];
  return [
    item.meals?.[0] || "用餐",
    item.flavors?.[0] || "口味不限",
    item.spends?.[0] || "预算不限",
  ];
}

function showResult(item) {
  const isCategory = item.type === "cuisine";
  elements.resultName.textContent = item.name;
  elements.resultCategory.textContent = isCategory
    ? `${item.name} · ${item.origin}`
    : `${item.cuisine} · ${item.origin}`;
  elements.resultArt.src = item.image || "assets/food-poster.jpg";
  elements.resultArt.alt = isCategory
    ? `${item.name}代表菜拼盘`
    : `${item.name}菜品图`;
  elements.resultTags.replaceChildren(...resultTags(item).map((tag) => {
    const listItem = document.createElement("li");
    listItem.textContent = tag;
    return listItem;
  }));
  elements.cuisineActions.hidden = !isCategory;
  elements.foodActions.hidden = isCategory;
  resultInvoker = elements.spin;

  if (!elements.result.open) elements.result.showModal();
  requestAnimationFrame(() => elements.resultName.focus());
}

function closeResultDialog() {
  if (elements.result.open) elements.result.close();
}

function continueFromCategory() {
  if (selectedResult?.type !== "cuisine") return;
  hierarchyPath = [selectedResult.origin, selectedResult.name];
  closeResultDialog();
  refreshCandidatePool();
  elements.spin.focus();
}

function restartCuisineSelection() {
  if (selectedResult?.type !== "cuisine") return;
  closeResultDialog();
  currentRotation = 0;
  refreshCandidatePool();
  elements.spin.focus();
}

function acceptSelectedFood() {
  if (!selectedResult?.id) return;
  coreState = acceptFood(coreState, selectedResult.id);
  persistCoreState();
  elements.feedback.textContent = `已决定：${selectedResult.name}`;
  closeResultDialog();
  refreshCandidatePool();
}

function rerollSelectedFood() {
  closeResultDialog();
  refreshCandidatePool();
  window.setTimeout(() => elements.spin.click(), reducedMotion.matches ? 20 : 140);
}

function blockSelectedFood() {
  if (!selectedResult?.id) return;
  coreState = blockTemporarily(coreState, selectedResult.id);
  persistCoreState();
  elements.feedback.textContent = `${selectedResult.name} 已暂时移出候选`;
  closeResultDialog();
  refreshCandidatePool();
  renderLibrary();
  if (candidatePool.length > 0) {
    window.setTimeout(() => elements.spin.click(), reducedMotion.matches ? 20 : 140);
  }
}

function setMode(nextMode) {
  mode = nextMode === "cuisine" ? "cuisine" : "direct";
  uiState.mode = mode;
  hierarchyPath = mode === "cuisine" ? [uiState.direction] : [];
  elements.directionControl.hidden = mode !== "cuisine";
  currentRotation = 0;
  saveUiState();
  refreshCandidatePool();
}

function setDirection(direction) {
  if (!["中餐", "外国菜"].includes(direction)) return;
  uiState.direction = direction;
  hierarchyPath = [direction];
  currentRotation = 0;
  saveUiState();
  refreshCandidatePool();
}

function updateFilters() {
  coreState = { ...coreState, filters: currentFilters() };
  persistCoreState();
  currentRotation = 0;
  refreshCandidatePool();
}

function setSoundEnabled(enabled) {
  coreState = { ...coreState, soundEnabled: enabled };
  audio.setEnabled(enabled);
  elements.sound.setAttribute("aria-pressed", String(enabled));
  elements.sound.setAttribute("aria-label", enabled ? "关闭音效" : "开启音效");
  elements.sound.title = enabled ? "关闭音效" : "开启音效";
  elements.sound.dataset.enabled = String(enabled);
  elements.soundState.textContent = enabled ? "音效开" : "音效关";
  persistCoreState();
}

function createLibraryRow(food, action, active = false) {
  const row = document.createElement("li");
  const copy = document.createElement("span");
  const name = document.createElement("b");
  const detail = document.createElement("small");
  const button = document.createElement("button");
  name.textContent = food.name;
  detail.textContent = `${food.cuisine || "我的自定义"} · ${food.meals?.[0] || "用餐"}`;
  copy.append(name, detail);
  button.type = "button";
  button.dataset.action = action;
  button.dataset.foodId = food.id;

  if (action === "favorite") {
    button.textContent = active ? "★" : "☆";
    button.setAttribute("aria-label", `${active ? "取消收藏" : "收藏"}${food.name}`);
    button.title = `${active ? "取消收藏" : "收藏"}${food.name}`;
  } else if (action === "delete") {
    button.textContent = "×";
    button.setAttribute("aria-label", `删除${food.name}`);
    button.title = `删除${food.name}`;
  } else {
    button.textContent = "↩";
    button.setAttribute("aria-label", `解除屏蔽${food.name}`);
    button.title = `解除屏蔽${food.name}`;
  }
  row.append(copy, button);
  return row;
}

function renderLibrary() {
  const allFoods = getAllFoods();
  const foodById = new Map(allFoods.map((food) => [food.id, food]));
  const favoriteIds = new Set(coreState.favorites);
  const favorites = coreState.favorites.map((id) => foodById.get(id)).filter(Boolean);
  const blocked = Object.keys(coreState.blockedUntil).map((id) => foodById.get(id)).filter(Boolean);

  elements.optionalCuisines.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = coreState.enabledOptionalCuisines.includes(checkbox.value);
  });

  elements.presetFoods.replaceChildren(...allFoods.map((food) => (
    createLibraryRow(food, "favorite", favoriteIds.has(food.id))
  )));
  elements.presetCount.textContent = `${allFoods.length} 道`;

  const favoritePanel = document.getElementById("panel-favorites");
  const favoriteEmpty = favoritePanel.querySelector(".empty-state");
  let favoriteList = favoritePanel.querySelector(".library-list");
  if (!favoriteList) {
    favoriteList = document.createElement("ul");
    favoriteList.className = "library-list";
    favoritePanel.append(favoriteList);
  }
  favoriteEmpty.hidden = favorites.length > 0;
  favoriteList.replaceChildren(...favorites.map((food) => createLibraryRow(food, "favorite", true)));
  elements.favoriteCount.textContent = `${favorites.length} 道`;

  elements.customFoods.replaceChildren(...coreState.customFoods.map((food) => (
    createLibraryRow(normalizeCustomFood(food), "delete")
  )));

  const blockedPanel = document.getElementById("panel-blocked");
  blockedPanel.querySelector(".empty-state").hidden = blocked.length > 0;
  elements.blockedFoods.replaceChildren(...blocked.map((food) => createLibraryRow(food, "unblock")));
  renderSavedCombinations();
}

function toggleFavorite(foodId) {
  const exists = coreState.favorites.includes(foodId);
  coreState = {
    ...coreState,
    favorites: exists
      ? coreState.favorites.filter((id) => id !== foodId)
      : [foodId, ...coreState.favorites],
  };
  persistCoreState();
  renderLibrary();
}

function deleteCustomFood(foodId) {
  coreState = {
    ...coreState,
    customFoods: coreState.customFoods.filter((food) => food.id !== foodId),
    favorites: coreState.favorites.filter((id) => id !== foodId),
    recentAccepted: coreState.recentAccepted.filter((id) => id !== foodId),
    blockedUntil: Object.fromEntries(
      Object.entries(coreState.blockedUntil).filter(([id]) => id !== foodId),
    ),
  };
  persistCoreState();
  renderLibrary();
  refreshCandidatePool();
}

function unblockFood(foodId) {
  const blockedUntil = { ...coreState.blockedUntil };
  delete blockedUntil[foodId];
  coreState = { ...coreState, blockedUntil };
  persistCoreState();
  renderLibrary();
  refreshCandidatePool();
}

function handleLibraryAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const foodId = button.dataset.foodId;
  if (button.dataset.action === "favorite") toggleFavorite(foodId);
  if (button.dataset.action === "delete") deleteCustomFood(foodId);
  if (button.dataset.action === "unblock") unblockFood(foodId);
}

function addCustomFood(event) {
  event.preventDefault();
  const formData = new FormData(elements.customForm);
  const name = String(formData.get("food-name") || "").trim();
  if (!name) return;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const food = {
    id: `custom-${suffix}`,
    name,
    origin: String(formData.get("food-group")),
    group: String(formData.get("food-group")),
    cuisine: "我的自定义",
    meals: [String(formData.get("food-meal"))],
    flavors: [String(formData.get("food-flavor"))],
    spends: [String(formData.get("food-spend"))],
    visual: "dish",
    image: "assets/food-poster.jpg",
  };
  coreState = { ...coreState, customFoods: [food, ...coreState.customFoods] };
  persistCoreState();
  elements.customForm.reset();
  syncEnhancedSelects(elements.customForm);
  elements.customFeedback.textContent = `${name} 已添加，可参与筛选和转盘`;
  renderLibrary();
  refreshCandidatePool();
}

function setupLibraryTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function activateTab(activeTab, moveFocus = false) {
    tabs.forEach((candidate) => {
      const selected = candidate === activeTab;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      document.getElementById(candidate.getAttribute("aria-controls")).hidden = !selected;
    });
    if (moveFocus) activeTab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      activateTab(next, true);
    });
  });
  activateTab(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0]);
}

function ensureCombinationControls() {
  elements.saveCombination.addEventListener("click", saveCurrentCombination);

  const panel = document.getElementById("panel-preset");
  if (document.getElementById("saved-combinations")) return;
  const heading = document.createElement("div");
  heading.className = "panel-heading";
  const title = document.createElement("h3");
  title.textContent = "常用组合";
  heading.append(title);
  const list = document.createElement("ul");
  list.id = "saved-combinations";
  list.className = "library-list";
  panel.prepend(list);
  panel.prepend(heading);
}

function combinationLabel(filters, path) {
  const parts = [filters.meal, filters.flavor, filters.spend].filter((value) => value !== "不限");
  if (path.length) parts.push(path.join(" / "));
  return parts.length ? parts.join(" · ") : "不限条件";
}

function saveCurrentCombination() {
  const filters = currentFilters();
  const combination = {
    id: `combo-${Date.now()}`,
    name: combinationLabel(filters, hierarchyPath),
    mode,
    filters,
    path: [...hierarchyPath],
  };
  uiState.savedCombinations = [
    combination,
    ...uiState.savedCombinations.filter((item) => item.name !== combination.name),
  ].slice(0, 12);
  saveUiState();
  renderSavedCombinations();
  elements.feedback.textContent = `已保存组合：${combination.name}`;
}

function renderSavedCombinations() {
  const list = document.getElementById("saved-combinations");
  if (!list) return;
  list.replaceChildren(...uiState.savedCombinations.map((combination) => {
    const row = document.createElement("li");
    const copy = document.createElement("span");
    const name = document.createElement("b");
    const detail = document.createElement("small");
    const apply = document.createElement("button");
    name.textContent = combination.name;
    detail.textContent = combination.mode === "cuisine" ? "按菜系选" : "直接开转";
    copy.append(name, detail);
    apply.type = "button";
    apply.textContent = "用";
    apply.dataset.combinationId = combination.id;
    apply.setAttribute("aria-label", `使用组合${combination.name}`);
    apply.title = `使用组合${combination.name}`;
    row.append(copy, apply);
    return row;
  }));
}

function applyCombination(id) {
  const combination = uiState.savedCombinations.find((item) => item.id === id);
  if (!combination) return;
  mode = combination.mode === "cuisine" ? "cuisine" : "direct";
  uiState.mode = mode;
  hierarchyPath = mode === "cuisine"
    ? (Array.isArray(combination.path) && combination.path.length
      ? combination.path.slice(0, 2)
      : [uiState.direction])
    : [];
  if (mode === "cuisine") uiState.direction = hierarchyPath[0];
  const savedCuisine = hierarchyPath[1];
  if (
    OPTIONAL_FOREIGN_CUISINES.includes(savedCuisine)
    && !coreState.enabledOptionalCuisines.includes(savedCuisine)
  ) {
    coreState = {
      ...coreState,
      enabledOptionalCuisines: [...coreState.enabledOptionalCuisines, savedCuisine],
    };
  }
  coreState = { ...coreState, filters: { ...combination.filters } };
  document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
  document.querySelector(`input[name="direction"][value="${uiState.direction}"]`).checked = true;
  elements.directionControl.hidden = mode !== "cuisine";
  elements.meal.value = combination.filters.meal === "不限" ? "" : combination.filters.meal;
  elements.flavor.value = combination.filters.flavor === "不限" ? "" : combination.filters.flavor;
  elements.spend.value = combination.filters.spend === "不限" ? "" : combination.filters.spend;
  syncEnhancedSelects(document);
  saveUiState();
  persistCoreState();
  refreshCandidatePool();
  elements.library.close();
  elements.openLibrary.setAttribute("aria-expanded", "false");
  elements.libraryState.textContent = "菜库";
  elements.spin.focus();
}

function bindEvents() {
  elements.modeControl.addEventListener("change", (event) => {
    if (event.target.name === "mode") setMode(event.target.value);
  });
  elements.directionControl.addEventListener("change", (event) => {
    if (event.target.name === "direction") setDirection(event.target.value);
  });
  [elements.meal, elements.flavor, elements.spend].forEach((select) => {
    select.addEventListener("change", updateFilters);
  });
  elements.spin.addEventListener("click", startSpin);
  elements.refresh.addEventListener("click", refreshCandidatePool);
  elements.pathList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-depth]");
    if (!button || mode !== "cuisine") return;
    hierarchyPath = hierarchyPath.slice(0, Number(button.dataset.depth));
    currentRotation = 0;
    refreshCandidatePool();
  });

  elements.sound.addEventListener("click", () => setSoundEnabled(!coreState.soundEnabled));
  elements.restartCuisine.addEventListener("click", restartCuisineSelection);
  elements.continueCuisine.addEventListener("click", continueFromCategory);
  elements.blockResult.addEventListener("click", blockSelectedFood);
  elements.rerollResult.addEventListener("click", rerollSelectedFood);
  elements.acceptResult.addEventListener("click", acceptSelectedFood);
  elements.closeResult.addEventListener("click", closeResultDialog);
  elements.result.addEventListener("close", () => resultInvoker?.focus());

  elements.openLibrary.addEventListener("click", () => {
    libraryInvoker = document.activeElement;
    renderLibrary();
    if (!elements.library.open) elements.library.showModal();
    elements.openLibrary.setAttribute("aria-expanded", "true");
    elements.libraryState.textContent = "菜库开";
  });
  elements.closeLibrary.addEventListener("click", () => elements.library.close());
  elements.library.addEventListener("close", () => {
    elements.openLibrary.setAttribute("aria-expanded", "false");
    elements.libraryState.textContent = "菜库";
    libraryInvoker?.focus();
  });
  elements.customForm.addEventListener("submit", addCustomFood);
  elements.optionalCuisines.addEventListener("change", (event) => {
    if (event.target.type !== "checkbox") return;
    coreState = {
      ...coreState,
      enabledOptionalCuisines: [...elements.optionalCuisines.querySelectorAll('input[type="checkbox"]:checked')]
        .map((checkbox) => checkbox.value),
    };
    persistCoreState();
    renderLibrary();
    currentRotation = 0;
    refreshCandidatePool();
  });
  [elements.presetFoods, elements.customFoods, elements.blockedFoods].forEach((list) => {
    list.addEventListener("click", handleLibraryAction);
  });
  document.getElementById("panel-favorites").addEventListener("click", handleLibraryAction);
  document.getElementById("panel-preset").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-combination-id]");
    if (button) applyCombination(button.dataset.combinationId);
  });
  window.addEventListener("beforeunload", () => audio.dispose());
}

function initialize() {
  normalizeFilterControls();
  enhanceSelects(document);
  ensureCombinationControls();
  setupLibraryTabs();
  bindEvents();
  document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
  document.querySelector(`input[name="direction"][value="${uiState.direction}"]`).checked = true;
  elements.directionControl.hidden = mode !== "cuisine";
  elements.resultArt.addEventListener("error", () => {
    if (!elements.resultArt.src.endsWith("/assets/food-poster.jpg")) {
      elements.resultArt.src = "assets/food-poster.jpg";
    }
  });
  setSoundEnabled(coreState.soundEnabled);
  refreshCandidatePool();
}

initialize();
