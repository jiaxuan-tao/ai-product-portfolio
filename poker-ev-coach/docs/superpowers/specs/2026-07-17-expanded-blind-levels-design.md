# Expanded Blind Levels Design

## Goal

Give users more common blind levels without cluttering the betting controls or changing the equity model.

## Decision

Extend the blind selector from four to seven levels:

- 1 / 2
- 2 / 5
- 5 / 10
- 10 / 20
- 25 / 50
- 50 / 100
- 100 / 200

Keep the existing BB-based amount presets. Their displayed chip values continue to update from the selected big blind.

## Alternatives Considered

1. Add fixed 25, 50, 100, and 200 chip buttons. Rejected because the same chip amount represents different strategic sizes at different blind levels and would duplicate manual input.
2. Allow custom small-blind and big-blind inputs. Rejected for this lightweight project because it adds validation and interaction complexity.
3. Expand the curated blind selector. Selected because it adds useful coverage while preserving the existing interaction model.

## Opponent Cards

Do not add opponent hole-card inputs. The simulator continues to model opponents as unknown random hands, matching the information normally available at decision time.

## Validation

- Contract test confirms all seven blind levels exist.
- Amount conversion tests confirm presets scale correctly at the new 50, 100, and 200 big-blind values.
- Browser verification confirms the selector, displayed preset values, calculation flow, and responsive layout.
