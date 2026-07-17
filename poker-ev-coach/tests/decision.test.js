import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePotOdds,
  calculateCallEV,
  getDecision,
  getDecisionExplanation
} from "../decision.js";

test("pot odds include the call in the final pot", () => {
  assert.equal(calculatePotOdds(100, 25), 0.2);
});

test("call EV follows the documented formula", () => {
  assert.equal(calculateCallEV(0.4, 100, 25), 25);
});

test("negative EV returns fold", () => {
  assert.equal(getDecision(0.15, 0.2, -6.25).key, "fold");
});

test("large equity edge returns raise candidate", () => {
  assert.equal(getDecision(0.42, 0.2, 27.5).key, "raise");
});

test("negative-EV fold explanation shows the required threshold and loss", () => {
  assert.deepEqual(
    getDecisionExplanation({
      equity: 0.15,
      potOdds: 0.2,
      ev: -6.25,
      call: 25,
      decisionKey: "fold"
    }),
    {
      items: [
        { label: "成本门槛", text: "本次跟注 25 筹码，至少需要 20.0% 胜率。" },
        {
          label: "胜率比较",
          text: "当前胜率 15.0%，低于 Pot Odds 5.0 个百分点。"
        },
        {
          label: "长期结果",
          text: "重复类似跟注，平均每次亏损 6.25 筹码。"
        }
      ],
      note: ""
    }
  );
});

test("positive-EV raise explanation shows the edge, profit, and boundary", () => {
  assert.deepEqual(
    getDecisionExplanation({
      equity: 0.42,
      potOdds: 0.2,
      ev: 27.5,
      call: 25,
      decisionKey: "raise"
    }),
    {
      items: [
        { label: "成本门槛", text: "本次跟注 25 筹码，至少需要 20.0% 胜率。" },
        {
          label: "胜率比较",
          text: "当前胜率 42.0%，高于 Pot Odds 22.0 个百分点。"
        },
        {
          label: "长期结果",
          text: "重复类似跟注，平均每次盈利 27.50 筹码。"
        }
      ],
      note: "加注建议来自较大的胜率优势，未计入弃牌率或加注尺度。"
    }
  );
});

test("zero edge and EV explanation uses break-even language", () => {
  const explanation = getDecisionExplanation({
    equity: 0.2,
    potOdds: 0.2,
    ev: 0,
    call: 25,
    decisionKey: "call"
  });

  assert.equal(explanation.items[1].text, "当前胜率 20.0%，与 Pot Odds 基本持平。");
  assert.equal(explanation.items[2].text, "重复类似跟注，长期平均结果接近盈亏平衡。");
});

test("edge and EV rounded to zero use break-even language", () => {
  const explanation = getDecisionExplanation({
    equity: 0.20049,
    potOdds: 0.2,
    ev: 0.0049,
    call: 25,
    decisionKey: "call"
  });

  assert.equal(explanation.items[1].text, "当前胜率 20.0%，与 Pot Odds 基本持平。");
  assert.equal(explanation.items[2].text, "重复类似跟注，长期平均结果接近盈亏平衡。");
});

test("changing call changes the cost threshold explanation", () => {
  const explanation = getDecisionExplanation({
    equity: 0.4,
    potOdds: calculatePotOdds(100, 25),
    ev: calculateCallEV(0.4, 100, 25),
    call: 25,
    decisionKey: "call"
  });
  const largerCallExplanation = getDecisionExplanation({
    equity: 0.4,
    potOdds: calculatePotOdds(100, 50),
    ev: calculateCallEV(0.4, 100, 50),
    call: 50,
    decisionKey: "call"
  });

  assert.notEqual(explanation.items[0].text, largerCallExplanation.items[0].text);
  assert.equal(explanation.items[0].text, "本次跟注 25 筹码，至少需要 20.0% 胜率。");
  assert.equal(largerCallExplanation.items[0].text, "本次跟注 50 筹码，至少需要 33.3% 胜率。");
});
