import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(projectRoot, "index.html");
const cssPath = path.join(projectRoot, "styles.css");
const appPath = path.join(projectRoot, "app.js");
const audioPath = path.join(projectRoot, "audio.js");
const artPath = path.join(projectRoot, "food-art.js");
const selectMenuPath = path.join(projectRoot, "select-menu.js");
const posterPath = path.join(projectRoot, "assets", "food-poster.jpg");
const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
const app = existsSync(appPath) ? readFileSync(appPath, "utf8") : "";
const audio = existsSync(audioPath) ? readFileSync(audioPath, "utf8") : "";

test("application shell files and the local JPEG poster exist", () => {
  assert.ok(existsSync(htmlPath), "index.html should exist");
  assert.ok(existsSync(cssPath), "styles.css should exist");
  assert.ok(existsSync(posterPath), "assets/food-poster.jpg should exist");
});

test("shell exposes the title, modes, filters, and stable Task 4 hooks", () => {
  assert.match(html, /<title>今天吃什么<\/title>/);
  assert.match(html, /<h1[^>]*>[\s\S]*今天吃什么[\s\S]*<\/h1>/);
  assert.match(html, /id="mode-control"/);
  assert.match(html, />\s*直接开转\s*</);
  assert.match(html, />\s*按菜系选\s*</);

  for (const id of [
    "filter-meal",
    "filter-flavor",
    "filter-spend",
    "wheel",
    "spin-button",
    "candidate-list",
    "result-ticket",
    "library-drawer",
    "sound-toggle",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing stable hook #${id}`);
  }
});

test("wheel, path rail, candidate ticket, and status strip are semantically present", () => {
  assert.match(html, /<nav[^>]*aria-label="选择路径"/);
  assert.match(html, /<canvas[^>]*id="wheel"[^>]*>[\s\S]*浏览器不支持 Canvas[\s\S]*<\/canvas>/);
  assert.match(html, /<section[^>]*aria-labelledby="candidate-heading"/);
  assert.match(html, /id="candidate-list"/);
  assert.match(html, /换一批候选/);
  assert.match(html, /<footer[^>]*class="[^"]*status-strip[^"]*"/);
  assert.match(html, /最近 3 次不重复/);
});

test("icon-only controls have accessible names and tooltips", () => {
  for (const id of ["sound-toggle", "open-library", "close-library", "close-result"]) {
    assert.match(
      html,
      new RegExp(`<button(?=[^>]*id="${id}")(?=[^>]*aria-label="[^"]+")(?=[^>]*title="[^"]+")[^>]*>`),
      `#${id} should have aria-label and title`,
    );
  }
});

test("result ticket includes local artwork and every decision action", () => {
  assert.match(html, /<dialog[^>]*id="result-ticket"/);
  assert.match(html, /<canvas[^>]*id="result-art"/);
  assert.ok(existsSync(artPath), "food-art.js should exist");
  assert.match(html, /就吃这个菜系/);
  assert.match(html, /继续选一道菜/);
  assert.match(html, /暂时不要/);
  assert.match(html, /再转一次/);
  assert.match(html, /就吃这个/);
});

test("food library dialog includes four tabs and a complete custom-food form", () => {
  assert.match(html, /<dialog[^>]*id="library-drawer"/);
  assert.match(html, /role="tablist"/);
  for (const tab of ["预设", "收藏", "自定义", "暂时不要"]) {
    assert.match(html, new RegExp(`role="tab"[^>]*>[\\s\\S]*?${tab}`));
  }

  assert.match(html, /<form[^>]*id="custom-food-form"/);
  assert.match(html, /name="food-name"/);
  assert.match(html, /name="food-group"/);
  assert.match(html, /name="food-meal"/);
  assert.match(html, /name="food-flavor"/);
  assert.match(html, /name="food-spend"/);
  assert.match(html, /添加到菜库/);
  assert.match(html, /role="status"/);
});

test("HTML uses only local runtime images, styles, scripts, and fonts", () => {
  assert.doesNotMatch(html, /<(?:img|script|link)[^>]+(?:src|href)="https?:\/\//i);
  assert.doesNotMatch(css, /url\(\s*["']?https?:\/\//i);
  assert.doesNotMatch(css, /@import/i);
});

test("playful canteen CSS defines its grid, hard shadows, layout, and responsive safeguards", () => {
  assert.match(css, /background-size:\s*18px 18px/);
  assert.match(css, /grid-template-areas:[\s\S]*path[\s\S]*wheel[\s\S]*candidates/);
  assert.match(css, /box-shadow:\s*[^;]*(?:--vermilion|--mustard)/);
  assert.match(css, /overflow-x:\s*(?:clip|hidden)/);
  assert.match(css, /@media\s*\(max-width:\s*(?:48rem|768px)\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test("desktop application is constrained to one viewport without body scrolling", () => {
  assert.match(css, /(?:html,\s*body|body,\s*html)[^{]*\{[^}]*height:\s*100%/s);
  assert.match(css, /\.app-shell\s*\{[^}]*height:\s*100dvh/s);
  assert.match(css, /\.app-shell\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.main-stage\s*\{[^}]*min-height:\s*0/s);
  assert.match(css, /\.wheel-wrap\s*\{[^}]*--wheel-size:/s);
  assert.match(css, /aspect-ratio:\s*1(?:\s*\/\s*1)?/);
});

test("filter controls use themed listboxes instead of opening native select menus", () => {
  assert.ok(existsSync(selectMenuPath), "select-menu.js should exist");
  assert.match(app, /from\s+["']\.\/select-menu\.js["']/);
  assert.match(app, /enhanceSelects/);
  assert.match(css, /\.select-trigger/);
  assert.match(css, /\.select-popover/);
  assert.match(css, /\[role="listbox"\]/);
});

test("candidate ticket uses clear date copy, a meaningful stamp, and non-overlapping actions", () => {
  assert.match(html, /<time[^>]*id="ticket-date"/);
  assert.doesNotMatch(html, /NO\.\s*<span id="ticket-number"/);
  assert.match(app, /getMonth\(\)\s*\+\s*1\}月\$\{today\.getDate\(\)\}日/);
  assert.match(html, /class="ticket-stamp"[^>]*>\s*今日\s*</);
  assert.match(html, /class="candidate-actions"[\s\S]*id="refresh-candidates"[\s\S]*id="save-combination"/);
  assert.match(css, /\.candidate-actions\s*\{[^}]*display:\s*grid/s);
});

test("path current state is non-interactive while completed steps are explicit back buttons", () => {
  assert.match(app, /className\s*=\s*["']path-current["']/);
  assert.match(app, /className\s*=\s*["']path-back["']/);
  assert.match(app, /aria-current/);
});

test("topbar tools expose visible sound and library state", () => {
  assert.match(html, /id="sound-state"/);
  assert.match(html, /id="library-state"/);
  assert.match(html, /id="open-library"[^>]*aria-expanded="false"/s);
  assert.match(app, /dataset\.enabled/);
  assert.match(app, /aria-expanded/);
  assert.match(css, /\.tool-button\[data-enabled="false"\]/);
  assert.match(css, /\.tool-button\[aria-expanded="true"\]/);
});

test("application module wires picker, storage, audio, animation, and secure randomness", () => {
  assert.ok(existsSync(appPath), "app.js should exist");
  assert.ok(existsSync(audioPath), "audio.js should exist");
  assert.match(html, /<script\s+type="module"\s+src="app\.js"><\/script>/);
  assert.match(app, /from\s+["']\.\/foods\.js["']/);
  assert.match(app, /from\s+["']\.\/picker\.js["']/);
  assert.match(app, /from\s+["']\.\/storage\.js["']/);
  assert.match(app, /from\s+["']\.\/audio\.js["']/);
  assert.match(app, /from\s+["']\.\/food-art\.js["']/);
  assert.match(app, /requestAnimationFrame/);
  assert.match(app, /crypto\.getRandomValues/);
  assert.match(app, /prefers-reduced-motion/);
});

test("result workflow handles every decision and moves focus to the result", () => {
  for (const id of [
    "accept-cuisine",
    "continue-cuisine",
    "block-result",
    "reroll-result",
    "accept-result",
    "close-result",
  ]) {
    assert.match(app, new RegExp(`getElementById\\(["']${id}["']\\)`), `missing handler hook #${id}`);
  }
  assert.match(app, /resultName\.focus\(\)/);
  assert.match(app, /showModal\(\)/);
});

test("library workflow persists custom foods, favorites, blocks, and saved combinations", () => {
  assert.match(app, /custom-food-form/);
  assert.match(app, /favorites/);
  assert.match(app, /blockedUntil/);
  assert.match(app, /savedCombinations/);
  assert.match(app, /normalizeSavedCombination/);
  assert.match(app, /\.map\(normalizeSavedCombination\)/);
  assert.match(app, /saveState\(/);
  assert.match(app, /localStorage/);
});

test("library tabs implement roving tabindex and synchronized panels", () => {
  assert.match(app, /ArrowLeft/);
  assert.match(app, /ArrowRight/);
  assert.match(app, /\.tabIndex\s*=/);
  assert.match(app, /aria-selected/);
  assert.match(app, /aria-controls/);
});

test("runtime normalizes legacy filter options and guards undersized candidate pools", () => {
  assert.match(app, /来点硬菜/);
  assert.match(app, /犒劳自己/);
  assert.match(app, /createHierarchyCandidates/);
  assert.match(app, /candidatePool\.length\s*<\s*2/);
  assert.match(app, /放宽|减少筛选|候选不足/);
});

test("custom foods receive a stable cuisine and return to the wheel after loading", () => {
  assert.match(app, /cuisine:\s*["']我的自定义["']/);
  assert.match(app, /customFoods/);
  assert.match(app, /FOODS[\s\S]*customFoods|customFoods[\s\S]*FOODS/);
});

test("audio controller is lazy, optional, and exposes synthesized tick and result sounds", () => {
  assert.match(audio, /export function createAudioController/);
  assert.match(audio, /AudioContext/);
  assert.match(audio, /createOscillator/);
  assert.match(audio, /createGain/);
  assert.match(audio, /setEnabled/);
  assert.match(audio, /tick/);
  assert.match(audio, /result/);
  assert.match(audio, /dispose/);
});
