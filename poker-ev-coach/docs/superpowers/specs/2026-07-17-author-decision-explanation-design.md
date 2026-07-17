# Author Credit and Decision Explanation Design

## Goal

Replace the redundant simulation count in the header with an author credit, and explain each decision using the calculated numbers already shown in the result panel.

## Header

Show `作者 · Jiaxuan Tao` as a link to `https://github.com/jiaxuan-tao`. Open the profile in a new tab and provide an accessible label.

Alternatives considered:

1. Plain author text. Rejected because the GitHub profile is useful project provenance.
2. GitHub handle only. Rejected because the author's readable name is more appropriate in the product header.
3. Linked readable name. Selected because it is compact, clear, and useful.

## Decision Explanation

Add a `为什么这样建议` section below the metric row and above the comparison chart. Render three deterministic items:

1. `成本门槛`: the minimum equity required to call.
2. `胜率比较`: current equity and the percentage-point gap above or below Pot Odds.
3. `长期结果`: positive or negative Call EV expressed as the average chip result of repeating a similar call.

For a raise candidate, add a short boundary note explaining that the raise label comes from a large equity edge and does not model fold equity or raise sizing.

Alternatives considered:

1. A longer free-form paragraph. Rejected because it is difficult to scan and test.
2. AI-generated advice. Rejected because it adds latency, cost, and unstable output to a lightweight static project.
3. Three structured deterministic explanations. Selected for clarity, speed, and testability.

## Validation

- Unit tests cover negative and positive EV explanations.
- UI contract tests cover the author link and explanation container.
- Browser checks cover fold and raise rendering on desktop and mobile.
