import { expect, test } from "@playwright/test";

const viewports = [
  ["wide", 2048, 1024],
  ["desktop", 1440, 900],
  ["laptop", 1366, 768],
  ["short desktop", 800, 600],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
  ["small phone", 320, 568],
];

async function openFresh(page) {
  await page.goto("./");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

for (const [name, width, height] of viewports) {
  test(`${name} stays inside one viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openFresh(page);

    const metrics = await page.evaluate(() => {
      const wheel = document.querySelector(".wheel-wrap").getBoundingClientRect();
      const candidate = document.querySelector(".candidate-ticket").getBoundingClientRect();
      const refresh = document.querySelector("#refresh-candidates").getBoundingClientRect();
      const save = document.querySelector("#save-combination").getBoundingClientRect();
      const feedback = document.querySelector("#wheel-feedback").getBoundingClientRect();
      const intersects = (first, second) => !(
        first.right <= second.left
        || second.right <= first.left
        || first.bottom <= second.top
        || second.bottom <= first.top
      );

      return {
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        wheelWidth: wheel.width,
        wheelHeight: wheel.height,
        wheelInViewport: wheel.top >= -1 && wheel.bottom <= window.innerHeight + 1,
        candidateInViewport: candidate.top >= -1 && candidate.bottom <= window.innerHeight + 1,
        actionOverlap: intersects(refresh, save),
        stageOverlap: intersects(wheel, candidate),
        actionsInTicket: refresh.bottom <= candidate.bottom + 1 && save.bottom <= candidate.bottom + 1,
        feedbackHeight: feedback.height,
      };
    });

    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(Math.abs(metrics.wheelWidth - metrics.wheelHeight)).toBeLessThan(1);
    expect(metrics.wheelInViewport).toBe(true);
    expect(metrics.candidateInViewport).toBe(true);
    expect(metrics.actionOverlap).toBe(false);
    expect(metrics.stageOverlap).toBe(false);
    expect(metrics.actionsInTicket).toBe(true);
    expect(metrics.feedbackHeight).toBeLessThan(48);
  });
}

test("spin locks mutable controls and resolves from its candidate snapshot", async ({ page }) => {
  await openFresh(page);
  const candidates = await page.locator("#candidate-list li b").allTextContents();
  const locked = await page.evaluate(() => {
    document.querySelector("#spin-button").click();
    return {
      mode: document.querySelector('input[name="mode"]').disabled,
      meal: document.querySelector("#filter-meal").disabled,
      library: document.querySelector("#open-library").disabled,
    };
  });

  expect(locked).toEqual({ mode: true, meal: true, library: true });
  await expect(page.locator("#result-ticket")).toHaveAttribute("open", "");
  await expect(page.locator("#result-name")).toHaveText(new RegExp(candidates.join("|")));
  await page.locator("#close-result").click();
  await expect(page.locator('input[name="mode"]').first()).toBeEnabled();
});

test("cuisine flow advances from direction to a concrete dish with local images", async ({ page }) => {
  await openFresh(page);
  await page.locator('input[name="mode"][value="cuisine"]').check();
  await page.locator('#direction-control label:has(input[value="中餐"])').click();
  await page.locator("#spin-button").click();
  await expect(page.locator("#result-ticket")).toHaveAttribute("open", "");
  await expect(page.locator("#restart-cuisine")).toBeVisible();
  await expect(page.locator("#continue-cuisine")).toBeVisible();
  expect(await page.locator("#result-art").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);

  await page.locator("#continue-cuisine").click();
  await expect(page.locator("#wheel-heading")).toContainText("选一道菜");
  await page.locator("#spin-button").click();
  await expect(page.locator("#result-ticket")).toHaveAttribute("open", "");
  await expect(page.locator("#food-result-actions")).toBeVisible();
  expect(await page.locator("#result-art").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
});

test("optional cuisines can be enabled and persist after reload", async ({ page }) => {
  await openFresh(page);
  await page.locator("#open-library").click();
  await page.locator('#optional-cuisines input[value="印度菜"]').check();
  await page.locator("#close-library").click();
  await page.locator('input[name="mode"][value="cuisine"]').check();
  await page.locator('#direction-control label:has(input[value="外国菜"])').click();
  await expect(page.locator("#candidate-list")).toContainText("印度菜");

  await page.reload();
  await page.locator('input[name="mode"][value="cuisine"]').check();
  await page.locator('#direction-control label:has(input[value="外国菜"])').click();
  await expect(page.locator("#candidate-list")).toContainText("印度菜");
});

test("a one-item custom cuisine remains selectable", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => {
    localStorage.setItem("what-to-eat.state.v1", JSON.stringify({
      version: 1,
      filters: { meal: "早餐", flavor: "想吃辣", spend: "犒劳自己" },
      customFoods: [{
        id: "custom-only",
        name: "家常拌饭",
        origin: "中餐",
        group: "中餐",
        cuisine: "我的自定义",
        meals: ["午餐"],
        flavors: ["清淡点"],
        spends: ["简单吃"],
      }],
      favorites: [],
      blockedUntil: {},
      recentAccepted: ["custom-only"],
      enabledOptionalCuisines: [],
      soundEnabled: false,
    }));
    localStorage.setItem("what-to-eat.ui.v1", JSON.stringify({
      mode: "direct",
      direction: "中餐",
      savedCombinations: [{
        id: "single-custom",
        name: "单菜测试",
        mode: "cuisine",
        filters: { meal: "早餐", flavor: "想吃辣", spend: "犒劳自己" },
        path: ["中餐", "我的自定义"],
      }],
    }));
  });
  await page.reload();
  await page.locator("#open-library").click();
  await page.getByRole("button", { name: "使用组合单菜测试" }).click();
  await expect(page.locator("#spin-button")).toBeEnabled();
  await expect(page.locator("#candidate-list li b")).toHaveText("家常拌饭");
  await page.locator("#spin-button").click();
  await expect(page.locator("#result-name")).toHaveText("家常拌饭");
});

test("legacy Southeast Asia combinations migrate and enable their optional cuisine", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => {
    localStorage.setItem("what-to-eat.state.v1", JSON.stringify({
      version: 1,
      filters: { meal: "不限", flavor: "不限", spend: "不限" },
      customFoods: [],
      favorites: [],
      blockedUntil: {},
      recentAccepted: [],
      enabledOptionalCuisines: [],
      soundEnabled: false,
    }));
    localStorage.setItem("what-to-eat.ui.v1", JSON.stringify({
      mode: "direct",
      direction: "中餐",
      savedCombinations: [{
        id: "legacy-sea",
        name: "旧东南亚组合",
        mode: "cuisine",
        filters: { meal: "不限", flavor: "不限", spend: "不限" },
        path: ["东南亚", "印尼菜"],
      }],
    }));
  });
  await page.reload();
  await page.locator("#open-library").click();
  await page.getByRole("button", { name: "使用组合旧东南亚组合" }).click();
  await expect(page.locator("#wheel-heading")).toContainText("东南亚其他");
  expect(Number(await page.locator("#stage-count").textContent())).toBeGreaterThan(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("what-to-eat.state.v1")));
  expect(saved.enabledOptionalCuisines).toContain("东南亚其他");
});
