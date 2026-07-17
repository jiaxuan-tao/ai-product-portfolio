export function stepChipAmount(value, delta, minimum) {
  const numericValue = Number(value);
  const current = Number.isFinite(numericValue) ? Math.round(numericValue) : minimum;
  return Math.max(minimum, current + delta);
}

export function getPresetAmount(bigBlind, multiplier) {
  return Math.round(bigBlind * multiplier);
}

export function isWholeChipAmount(value, minimum) {
  return value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= minimum;
}
