export function calculatePotOdds(pot, call) {
  if (!Number.isFinite(pot) || !Number.isFinite(call) || pot < 0 || call <= 0) {
    throw new Error("请输入有效的底池和跟注金额");
  }
  return call / (pot + call);
}

export function calculateCallEV(equity, pot, call) {
  return equity * (pot + call) - call;
}

export function getDecision(equity, potOdds, ev) {
  const edge = equity - potOdds;
  if (ev < 0 || edge < 0) {
    return { key: "fold", label: "建议弃牌", reason: "胜率不足以覆盖跟注成本。" };
  }
  if (edge >= 0.12) {
    return { key: "raise", label: "可考虑加注", reason: "当前胜率明显高于所需底池赔率。" };
  }
  return { key: "call", label: "建议跟注", reason: "当前胜率能够覆盖跟注成本。" };
}

export function getDecisionExplanation({ equity, potOdds, ev, call, decisionKey }) {
  const edge = equity - potOdds;
  const edgeText = `${(Math.abs(edge) * 100).toFixed(1)} 个百分点`;
  const result = ev >= 0 ? "盈利" : "亏损";
  const edgeExplanation =
    Math.abs(edge) < 0.0005
      ? `当前胜率 ${(equity * 100).toFixed(1)}%，与 Pot Odds 基本持平。`
      : `当前胜率 ${(equity * 100).toFixed(1)}%，${edge >= 0 ? "高于" : "低于"} Pot Odds ${edgeText}。`;
  const evExplanation =
    Math.abs(ev) < 0.005
      ? "重复类似跟注，长期平均结果接近盈亏平衡。"
      : `重复类似跟注，平均每次${result} ${Math.abs(ev).toFixed(2)} 筹码。`;

  return {
    items: [
      {
        label: "成本门槛",
        text: `本次跟注 ${call} 筹码，至少需要 ${(potOdds * 100).toFixed(1)}% 胜率。`
      },
      {
        label: "胜率比较",
        text: edgeExplanation
      },
      {
        label: "长期结果",
        text: evExplanation
      }
    ],
    note:
      decisionKey === "raise"
        ? "加注建议来自较大的胜率优势，未计入弃牌率或加注尺度。"
        : ""
  };
}
