// Schema validators for Daggerheart content — core AND expansion. Each
// returns an array of human-readable problems (empty = valid). The smoke
// tests run every entry of every merged catalog through these, so a typo in
// pasted Hope & Fear data fails `npm test` with a precise message instead of
// crashing a picker at the table.

const ROLES = new Set(['minion', 'horde', 'standard', 'bruiser', 'skulk', 'ranged', 'support', 'social', 'leader', 'solo']);
const CARD_TYPES = new Set(['Spell', 'Ability', 'Grimoire']);
const ENV_TYPES = new Set(['exploration', 'social', 'combat', 'traversal', 'event']);
const FEATURE_TYPES = new Set(['passive', 'action', 'reaction']);

const label = (entry, fallback) => entry?.name || entry?.id || fallback;

export function validateAdversary(a) {
  const errs = [];
  const who = label(a, 'adversary');
  if (!a?.name) errs.push('adversary missing name');
  if (![1, 2, 3, 4].includes(a?.tier)) errs.push(`${who}: tier must be 1-4 (got ${a?.tier})`);
  if (!ROLES.has(a?.role)) errs.push(`${who}: unknown role "${a?.role}"`);
  if (typeof a?.difficulty !== 'number') errs.push(`${who}: difficulty must be a number`);
  if (typeof a?.hp !== 'number' || a.hp < 1) errs.push(`${who}: hp must be ≥ 1`);
  if (typeof a?.stress !== 'number') errs.push(`${who}: stress must be a number`);
  if (!a?.thresholds || typeof a.thresholds.minor !== 'number' || typeof a.thresholds.major !== 'number') {
    errs.push(`${who}: thresholds {minor, major} required (legacy names: minor=Major value, major=Severe)`);
  }
  if (a?.role === 'minion' && (a?.hp !== 1 || a?.thresholds?.minor !== 0)) {
    errs.push(`${who}: minions must have hp 1 and no thresholds`);
  }
  if (!a?.attackDamage) errs.push(`${who}: attackDamage required (e.g. "1d12+2 phy")`);
  if (!Array.isArray(a?.features) || a.features.length === 0) errs.push(`${who}: features[] required`);
  (a?.features || []).forEach((f, i) => {
    if (!f?.name || !f?.description) errs.push(`${who}: feature ${i} needs name + description`);
    if (f?.type && !FEATURE_TYPES.has(f.type)) errs.push(`${who}: feature "${f?.name}" has unknown type "${f.type}"`);
  });
  return errs;
}

export function validateDomainCard(c) {
  const errs = [];
  const who = label(c, 'card');
  if (!c?.name) errs.push('domain card missing name');
  if (!c?.domain) errs.push(`${who}: domain required`);
  if (!Number.isInteger(c?.level) || c.level < 1 || c.level > 10) errs.push(`${who}: level must be 1-10`);
  if (!CARD_TYPES.has(c?.type)) errs.push(`${who}: type must be Spell/Ability/Grimoire (got "${c?.type}")`);
  if (!Number.isInteger(c?.recallCost) || c.recallCost < 0 || c.recallCost > 4) errs.push(`${who}: recallCost must be 0-4`);
  if (!c?.description) errs.push(`${who}: description required`);
  return errs;
}

export function validateClass(name, cls) {
  const errs = [];
  if (!Array.isArray(cls?.domains) || cls.domains.length !== 2) errs.push(`${name}: domains must list exactly 2 domains`);
  if (typeof cls?.baseEvasion !== 'number') errs.push(`${name}: baseEvasion required`);
  if (typeof cls?.baseHp !== 'number') errs.push(`${name}: baseHp required`);
  if (!cls?.hopeFeature?.name || !cls?.hopeFeature?.description) errs.push(`${name}: hopeFeature {name, description} required`);
  return errs;
}

export function validateSubclass(className, sc) {
  const errs = [];
  const who = `${className}/${sc?.name || 'subclass'}`;
  if (!sc?.name) errs.push(`${className}: subclass missing name`);
  for (const stage of ['foundation', 'specialization', 'mastery']) {
    if (!sc?.[stage]?.name || !sc?.[stage]?.description) errs.push(`${who}: ${stage} {name, description} required`);
  }
  return errs;
}

export function validateEnvironment(e) {
  const errs = [];
  const who = label(e, 'environment');
  if (!e?.name) errs.push('environment missing name');
  if (![1, 2, 3, 4].includes(e?.tier)) errs.push(`${who}: tier must be 1-4`);
  if (!ENV_TYPES.has(e?.type)) errs.push(`${who}: type must be one of ${[...ENV_TYPES].join('/')}`);
  if (typeof e?.difficulty !== 'number') errs.push(`${who}: difficulty must be a number`);
  return errs;
}

export function validateHeritage(name, h) {
  const errs = [];
  if (!h?.description) errs.push(`${name}: description required`);
  if (!Array.isArray(h?.features) || h.features.length === 0) errs.push(`${name}: features[] required`);
  (h?.features || []).forEach((f, i) => {
    if (!f?.name || !f?.description) errs.push(`${name}: feature ${i} needs name + description`);
  });
  return errs;
}

export function validateTransformation(t) {
  const errs = [];
  const who = label(t, 'transformation');
  if (!t?.key) errs.push(`${who}: key required (e.g. "vampire")`);
  if (!t?.name) errs.push('transformation missing name');
  if (!t?.description) errs.push(`${who}: description required`);
  if (!Array.isArray(t?.features) || t.features.length === 0) errs.push(`${who}: features[] required`);
  return errs;
}

export function validateCampaignFrame(f) {
  const errs = [];
  const who = label(f, 'frame');
  if (!f?.id) errs.push(`${who}: id required`);
  if (!f?.name) errs.push('campaign frame missing name');
  if (!f?.pitch && !f?.overview) errs.push(`${who}: pitch or overview required`);
  return errs;
}
