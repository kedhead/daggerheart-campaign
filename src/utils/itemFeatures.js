import { getFeatureEntry } from '../data/daggerheartFeatures';

/**
 * Helpers for mixed item features arrays.
 *
 * An item's `systemData.features` may contain either:
 *  - strings: standard SRD features like "Brutal", "Deflecting"
 *  - objects: custom features like { name: "Ever-Damp", description: "+1 Evasion vs. fire" }
 *
 * Everything here must tolerate either shape so legacy data and AI/custom
 * output both render correctly.
 */

export function isCustomFeature(f) {
  return f && typeof f === 'object' && !Array.isArray(f);
}

export function getFeatureName(f) {
  if (typeof f === 'string') return f;
  if (isCustomFeature(f)) return f.name || '';
  return '';
}

export function getFeatureDescription(f) {
  if (isCustomFeature(f)) return f.description || '';
  return '';
}

export function hasFeatureName(features, name) {
  if (!Array.isArray(features)) return false;
  const lower = name.toLowerCase();
  return features.some(f => getFeatureName(f).toLowerCase() === lower);
}

export function featureNameList(features) {
  if (!Array.isArray(features)) return [];
  return features.map(getFeatureName).filter(Boolean);
}

/**
 * Resolve a feature to something displayable.
 *
 * A bare string like 'reliable' carries no text of its own — the rules live in
 * the glossary, keyed case-insensitively because the item catalog stores
 * lowercase names while the pickers use title case.
 *
 * @returns {{name: string, description: string, source: 'custom'|'glossary'|'unknown', paraphrase: boolean}}
 */
export function resolveFeature(feature) {
  const name = getFeatureName(feature);
  if (!name) return { name: '', description: '', source: 'unknown', paraphrase: false };

  // An author's own wording always wins — they wrote it for this item.
  const authored = getFeatureDescription(feature);
  if (authored) return { name, description: authored, source: 'custom', paraphrase: false };

  const entry = getFeatureEntry(name);
  if (entry) {
    return { name: entry.label || name, description: entry.description, source: 'glossary', paraphrase: !!entry.paraphrase };
  }
  // A name nobody has defined: an AI invention, or a typo. Say so rather than
  // rendering a chip that silently explains nothing.
  return { name, description: '', source: 'unknown', paraphrase: false };
}

/** True when a feature has no text from either its author or the glossary. */
export function isUndescribedFeature(feature) {
  return resolveFeature(feature).source === 'unknown';
}

/**
 * Bucket an item's features for editing.
 *
 * `unknown` is the important one: a string that names no glossary feature used
 * to fall through every bucket the forms render, so it appeared on the item card
 * but nowhere in the editor — impossible to fix or delete.
 */
export function splitFeatures(features) {
  const standard = [];
  const custom = [];
  const unknown = [];
  if (!Array.isArray(features)) return { standard, custom, unknown };
  for (const f of features) {
    if (isCustomFeature(f)) custom.push(f);
    else if (typeof f === 'string' && f) {
      (getFeatureEntry(f) ? standard : unknown).push(f);
    }
  }
  return { standard, custom, unknown };
}

export function toggleStandardFeature(features, name) {
  const arr = Array.isArray(features) ? [...features] : [];
  const lower = name.toLowerCase();
  const idx = arr.findIndex(f => typeof f === 'string' && f.toLowerCase() === lower);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(name);
  return arr;
}

/**
 * Promote features that name nothing in the glossary into editable objects.
 *
 * The item forms render standard features as checkboxes over a fixed list and
 * custom features from the object bucket, so a string naming neither — an AI
 * invention, or a typo — appeared on the item card but nowhere in the editor,
 * leaving no way to describe, correct or delete it. Converting it to
 * `{name, description: ''}` puts it in the Custom Features list, where the
 * existing edit and remove handlers already work.
 *
 * Applied when a form seeds its state, so the shape is only persisted if the
 * user actually saves.
 */
export function promoteUnknownFeatures(features) {
  if (!Array.isArray(features)) return [];
  return features.map(f => (
    typeof f === 'string' && f && !getFeatureEntry(f) ? { name: f, description: '' } : f
  ));
}
