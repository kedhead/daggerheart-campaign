// Fuzzy adversary-name matching, used when reusing an existing stat block for a
// named enemy. Tolerates case, punctuation, accents, partial names, and
// misspellings so "matu palu" still resolves to a saved "Matu Palu, the
// Tide-Witch". Dependency-free so it can be unit-tested in isolation.

// Normalize: lowercase, strip accents/punctuation, collapse whitespace.
const _normName = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function _levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// A name is "distinctive" if it's unlikely to collide by accident — multi-word
// or reasonably long — so the concept-fallback path won't reuse an adversary
// just because a generic word ("troll", "orc") appears in the concept.
const _isDistinctive = (norm) => norm.includes(' ') || norm.length >= 6;

/**
 * Best fuzzy match for `name` among `adversaries`, or null.
 * Match tiers (best first): exact-normalized → whole-word containment →
 * edit-distance within ~1/3 of the longer string (catches misspellings).
 * @param {string} name
 * @param {Array}  adversaries
 * @param {{distinctiveOnly?: boolean}} [opts]
 */
export function fuzzyMatchAdversary(name, adversaries, opts = {}) {
  const target = _normName(name);
  if (!target || target.length < 2) return null;
  const list = Array.isArray(adversaries) ? adversaries : [];
  let best = null;
  let bestRank = [9, Infinity]; // [tier, tiebreak], lower is better

  for (const a of list) {
    if (!a?.name) continue;
    const cand = _normName(a.name);
    if (!cand) continue;
    if (opts.distinctiveOnly && !_isDistinctive(cand)) continue;

    let rank = null;
    if (cand === target) {
      rank = [0, 0];
    } else {
      // Whole-word containment either direction (target "matu palu" ⊂
      // "matu palu the tide witch").
      const padC = ` ${cand} `, padT = ` ${target} `;
      const contains = padC.includes(padT) || padT.includes(padC) ||
        cand.startsWith(target + ' ') || target.startsWith(cand + ' ');
      if (contains) {
        rank = [1, Math.abs(cand.length - target.length)];
      } else {
        // Compare equal-length token prefixes so a short (possibly misspelled)
        // partial name matches a longer full name:
        // "matu pallu" ~ "matu palu the tide witch".
        const tCand = cand.split(' '), tTgt = target.split(' ');
        const k = Math.min(tCand.length, tTgt.length);
        const cP = tCand.slice(0, k).join(' ');
        const tP = tTgt.slice(0, k).join(' ');
        const dist = _levenshtein(cP, tP);
        const ratio = dist / Math.max(cP.length, tP.length);
        if (ratio <= 0.34) rank = [2, dist];
      }
    }
    if (rank && (rank[0] < bestRank[0] || (rank[0] === bestRank[0] && rank[1] < bestRank[1]))) {
      best = a;
      bestRank = rank;
    }
  }
  return best;
}
