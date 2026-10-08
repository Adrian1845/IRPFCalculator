export function isNumericDraft(value, kind) {
  if (kind === "integer") return /^[0-9]*$/.test(value);
  if (kind === "money") return /^[0-9.]*(?:,[0-9]*)?$/.test(value);
  if (kind === "signed-money") return /^[-−]?[0-9.]*(?:,[0-9]*)?$/.test(value);
  throw new RangeError(`Unknown numeric input kind: ${kind}`);
}

export function acceptsNumericInsertion(value, start, end, insertion, kind) {
  return isNumericDraft(value.slice(0, start) + insertion + value.slice(end), kind);
}
