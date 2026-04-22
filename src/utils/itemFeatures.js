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

export function splitFeatures(features) {
  const standard = [];
  const custom = [];
  if (!Array.isArray(features)) return { standard, custom };
  for (const f of features) {
    if (isCustomFeature(f)) custom.push(f);
    else if (typeof f === 'string' && f) standard.push(f);
  }
  return { standard, custom };
}

export function toggleStandardFeature(features, name) {
  const arr = Array.isArray(features) ? [...features] : [];
  const lower = name.toLowerCase();
  const idx = arr.findIndex(f => typeof f === 'string' && f.toLowerCase() === lower);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(name);
  return arr;
}
