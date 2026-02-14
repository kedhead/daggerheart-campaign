/**
 * Scan text for known entity names and wrap them in [[...]].
 *
 * - Preserves existing [[...]] links (no double-wrapping)
 * - Matches longest names first to avoid partial matches
 * - Skips names shorter than 3 characters
 * - Case-insensitive whole-word matching
 *
 * @param {string} text - The text to process
 * @param {string[]} entityNames - Array of canonical entity names
 * @returns {string} Text with entity names wrapped in [[...]]
 */
export function autoLinkText(text, entityNames) {
  if (!text || !entityNames || entityNames.length === 0) return text;

  // 1. Protect existing [[...]] links with placeholders
  const existingLinks = [];
  let result = text.replace(/\[\[[^\]]*\]\]/g, (match) => {
    existingLinks.push(match);
    return `\x00LINK${existingLinks.length - 1}\x00`;
  });

  // 2. Dedupe and sort longest first
  const seen = new Set();
  const names = entityNames
    .filter(name => {
      if (!name || name.length < 3) return false;
      const lower = name.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    .sort((a, b) => b.length - a.length);

  // 3. Replace whole-word matches (case-insensitive) with [[CanonicalName]]
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    result = result.replace(regex, `[[${name}]]`);
  }

  // 4. Restore original links
  result = result.replace(/\x00LINK(\d+)\x00/g, (_, i) => existingLinks[Number(i)]);

  return result;
}
