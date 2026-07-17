import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getPresetAmount,
  isWholeChipAmount,
  stepChipAmount
} from "../amount-controls.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

function inputMarkup(id) {
  const match = html.match(new RegExp(`<input[\\s\\S]*?id="${id}"[\\s\\S]*?\\/>`));
  assert.ok(match, `missing input #${id}`);
  return match[0];
}

test("chip amount inputs advance in whole-chip steps", () => {
  for (const id of ["pot", "call"]) {
    const markup = inputMarkup(id);
    assert.match(markup, /step="1"/);
    assert.match(markup, /inputmode="numeric"/);
    assert.doesNotMatch(markup, /0\.01/);
  }
});

test("amount controls expose blind levels and BB presets", () => {
  assert.match(html, /id="blind-level"/);
  for (const [value, smallBlind, bigBlind] of [
    ["1/2", 1, 2],
    ["2/5", 2, 5],
    ["5/10", 5, 10],
    ["10/20", 10, 20],
    ["25/50", 25, 50],
    ["50/100", 50, 100],
    ["100/200", 100, 200]
  ]) {
    assert.ok(
      html.includes(
        `value="${value}" data-small-blind="${smallBlind}" data-big-blind="${bigBlind}"`
      ),
      `missing blind level ${value} with ${smallBlind}/${bigBlind} data`
    );
  }
  assert.match(html, /data-amount-target="pot"/);
  assert.match(html, /data-amount-target="call"/);
  assert.match(html, /data-bb-multiplier="10"/);
  assert.match(app, /function applyAmountPreset/);
});

test("BB presets convert the selected big blind to whole chips", () => {
  assert.equal(getPresetAmount(2, 10), 20);
  assert.equal(getPresetAmount(5, 3), 15);
  assert.equal(getPresetAmount(10, 20), 200);
  assert.equal(getPresetAmount(50, 2), 100);
  assert.equal(getPresetAmount(100, 2), 200);
  assert.equal(getPresetAmount(200, 2), 400);
});

test("amount steppers move by one chip and respect minimums", () => {
  assert.equal(stepChipAmount("20", 1, 1), 21);
  assert.equal(stepChipAmount("20", -1, 1), 19);
  assert.equal(stepChipAmount("1", -1, 1), 1);
  assert.equal(stepChipAmount("", 1, 0), 1);
});

test("chip validation rejects decimals and empty values", () => {
  assert.equal(isWholeChipAmount("100", 0), true);
  assert.equal(isWholeChipAmount("0", 0), true);
  assert.equal(isWholeChipAmount("1", 1), true);
  assert.equal(isWholeChipAmount("0.01", 0), false);
  assert.equal(isWholeChipAmount("", 0), false);
  assert.equal(isWholeChipAmount("0", 1), false);
});

test("rendered cards use full playing-card anatomy", () => {
  assert.match(app, /card-corner card-corner--top/);
  assert.match(app, /card-corner card-corner--bottom/);
  assert.match(app, /card-pip/);
  assert.match(css, /\.card-corner--bottom/);
  assert.match(css, /\.card-pip/);
  assert.match(css, /\.card-slot\[data-card\]::after/);
});

test("header replaces the simulation badge with an accessible author link", () => {
  assert.doesNotMatch(html, /5,000 次模拟/);
  assert.match(
    html,
    /<a\s+class="author-link"\s+href="https:\/\/github\.com\/jiaxuan-tao"\s+target="_blank"\s+rel="noopener noreferrer"\s+aria-label="访问 Jiaxuan Tao 的 GitHub 主页"\s*>作者 · Jiaxuan Tao<\/a>/
  );
  assert.match(css, /\.author-link/);
});

test("result content contains a semantic decision explanation before the comparison", () => {
  const explanationIndex = html.indexOf('class="decision-explanation"');
  const comparisonIndex = html.indexOf('class="comparison"');

  assert.ok(explanationIndex > -1, "missing decision explanation section");
  assert.ok(comparisonIndex > explanationIndex, "explanation must appear before comparison");
  assert.match(
    html,
    /<section class="decision-explanation" aria-labelledby="decision-explanation-title">[\s\S]*?<h3 id="decision-explanation-title">为什么这样建议<\/h3>[\s\S]*?<dl class="decision-explanation-list">[\s\S]*?<dt>成本门槛<\/dt>[\s\S]*?<dd id="explanation-cost">[\s\S]*?<dt>胜率比较<\/dt>[\s\S]*?<dd id="explanation-equity">[\s\S]*?<dt>长期结果<\/dt>[\s\S]*?<dd id="explanation-ev">[\s\S]*?<\/dl>[\s\S]*?<p class="decision-explanation-note" id="explanation-note" hidden><\/p>[\s\S]*?<\/section>/
  );
  assert.match(app, /getDecisionExplanation/);
  assert.match(app, /function renderDecisionExplanation/);
  assert.match(css, /\.decision-explanation/);
});
