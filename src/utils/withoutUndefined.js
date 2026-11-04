// Firestore refuses a write with undefined anywhere in it ("Unsupported field
// value: undefined"), and the whole write fails. Live-encounter writes copy
// adversary and phase data that may carry one, so they go through this.

/** A copy with every undefined value removed. Non-plain objects (server timestamps) are kept as they are. */
export function withoutUndefined(value) {
  if (Array.isArray(value)) return value.filter(v => v !== undefined).map(withoutUndefined);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, withoutUndefined(v)]));
  }
  return value;
}
