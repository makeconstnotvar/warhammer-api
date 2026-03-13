export function deepCopy(input) {
  if (input === null) return null;
  if (Array.isArray(input)) return input.map(deepCopy);
  if (typeof input === "object") {
    const copy = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        copy[key] = deepCopy(input[key]);
      }
    }
    return copy;
  }
  return input;
}
