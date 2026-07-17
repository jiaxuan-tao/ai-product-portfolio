const enhancedSelects = new WeakMap();

function closeMenu(select, focusTrigger = false) {
  const control = enhancedSelects.get(select);
  if (!control) return;
  control.trigger.setAttribute("aria-expanded", "false");
  control.popover.hidden = true;
  if (focusTrigger) control.trigger.focus();
}

function openMenu(select) {
  const control = enhancedSelects.get(select);
  if (!control || select.disabled) return;

  document.querySelectorAll(".select-trigger[aria-expanded='true']").forEach((trigger) => {
    if (trigger !== control.trigger) trigger.click();
  });
  control.trigger.setAttribute("aria-expanded", "true");
  control.popover.hidden = false;
  const selected = control.popover.querySelector("[aria-selected='true']");
  (selected || control.options[0])?.focus();
}

function selectOption(select, optionIndex) {
  const control = enhancedSelects.get(select);
  if (!control) return;
  const option = select.options[optionIndex];
  if (!option || option.disabled) return;
  select.selectedIndex = optionIndex;
  syncEnhancedSelect(select);
  closeMenu(select, true);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function moveOptionFocus(control, direction) {
  const currentIndex = control.options.indexOf(document.activeElement);
  const nextIndex = Math.min(
    control.options.length - 1,
    Math.max(0, currentIndex + direction),
  );
  control.options[nextIndex]?.focus();
}

function createOptionButton(select, option, optionIndex) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "select-option";
  button.id = `${select.id || select.name}-option-${optionIndex}`;
  button.setAttribute("role", "option");
  button.dataset.optionIndex = String(optionIndex);
  button.textContent = option.textContent;
  button.disabled = option.disabled;
  button.addEventListener("click", () => selectOption(select, optionIndex));
  button.addEventListener("keydown", (event) => {
    const control = enhancedSelects.get(select);
    if (!control) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveOptionFocus(control, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveOptionFocus(control, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      control.options[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      control.options.at(-1)?.focus();
    } else if (event.key === "Escape" || event.key === "Tab") {
      closeMenu(select, event.key === "Escape");
    }
  });
  return button;
}

function buildOptions(select, popover) {
  const buttons = [...select.options].map((option, index) => (
    createOptionButton(select, option, index)
  ));
  popover.replaceChildren(...buttons);
  return buttons;
}

function enhanceSelect(select) {
  if (enhancedSelects.has(select)) return;

  const control = document.createElement("div");
  control.className = "select-control";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const value = document.createElement("span");
  value.className = "select-value";
  const chevron = document.createElement("span");
  chevron.className = "select-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "⌄";
  trigger.append(value, chevron);

  const popover = document.createElement("div");
  popover.className = "select-popover";
  popover.setAttribute("role", "listbox");
  popover.setAttribute("aria-label", select.getAttribute("aria-label") || select.name || "选择选项");
  popover.hidden = true;

  select.classList.add("native-select");
  select.after(control);
  control.append(trigger, popover);
  const state = { control, trigger, value, popover, options: [] };
  enhancedSelects.set(select, state);
  state.options = buildOptions(select, popover);

  trigger.addEventListener("click", () => {
    if (trigger.getAttribute("aria-expanded") === "true") {
      closeMenu(select);
    } else {
      openMenu(select);
    }
  });
  trigger.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu(select);
    }
  });
  select.addEventListener("change", () => syncEnhancedSelect(select));
  syncEnhancedSelect(select);
}

export function syncEnhancedSelect(select) {
  const control = enhancedSelects.get(select);
  if (!control) return;

  if (control.options.length !== select.options.length) {
    control.options = buildOptions(select, control.popover);
  }

  const selectedIndex = Math.max(0, select.selectedIndex);
  control.value.textContent = select.options[selectedIndex]?.textContent || "请选择";
  control.trigger.disabled = select.disabled;
  control.options.forEach((button, index) => {
    button.setAttribute("aria-selected", String(index === selectedIndex));
  });
}

export function syncEnhancedSelects(root = document) {
  root.querySelectorAll("select").forEach(syncEnhancedSelect);
}

export function enhanceSelects(root = document) {
  root.querySelectorAll("select").forEach(enhanceSelect);

  if (!document.documentElement.dataset.selectMenuReady) {
    document.documentElement.dataset.selectMenuReady = "true";
    document.addEventListener("pointerdown", (event) => {
      document.querySelectorAll(".select-trigger[aria-expanded='true']").forEach((trigger) => {
        if (!trigger.parentElement.contains(event.target)) trigger.click();
      });
    });
  }
}
