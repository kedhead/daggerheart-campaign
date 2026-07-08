// Domain-card descriptions pack several named abilities into one string:
//   "Power Push: … . Tava's Armor: … . Ice Spike: … ."
// splitCardFeatures breaks that into [{ name, text }] so the UI can render each
// ability as its own block instead of a run-on wall of text. A description with
// no "Name:" pattern comes back as a single { name: null, text } entry, so
// callers can treat prose-only cards and multi-feature cards the same way.
export function splitCardFeatures(description) {
  if (!description || typeof description !== 'string') return [];

  // Split on ". " immediately before a short Title-Case label ending in a colon.
  const parts = description.split(/\.\s+(?=[A-Z][A-Za-z0-9 '’\-]{1,28}:)/);

  return parts
    .map((part) => {
      const colon = part.indexOf(':');
      // Treat the prefix as a feature name only when the colon comes early and
      // the label itself has no sentence punctuation (guards against a stray
      // mid-sentence colon splitting prose incorrectly).
      if (colon > 0 && colon <= 30) {
        const name = part.slice(0, colon).trim();
        if (name && !/[.!?]/.test(name)) {
          return { name, text: part.slice(colon + 1).trim().replace(/\.$/, '') };
        }
      }
      return { name: null, text: part.trim().replace(/\.$/, '') };
    })
    .filter((p) => p.text);
}
