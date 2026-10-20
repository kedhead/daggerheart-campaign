// A character's current state, for the story and its art.
//
// Portraits are drawn once and the image model is told to preserve them, so a
// character who has since become a ghost kept being painted alive. The state
// here — the Hope & Fear transformation on the sheet, plus anything the
// player writes as their current look (a lost arm, a curse, a scar) — is told
// to the model as an override of the reference portrait.
//
// PURE, like storybookPrompt.js, so the smoke tests can import it.

// What each transformation looks like. The rules text in hopeFear.js says
// what a transformation does; the art needs what it looks like.
export const TRANSFORMATION_LOOKS = {
  ghost: 'a ghost: translucent, pale blue-white spectral body with a faint glow, edges thinning into mist, casting no shadow',
  vampire: 'a vampire: bloodless ashen skin, faintly red eyes, the tips of fangs, an unnatural stillness',
  werewolf: 'touched by the wolf: coarse fur along the jaw and forearms, amber wolf eyes, lengthened canines and clawed hands',
  demigod: 'a demigod: a subtle golden luminosity beneath the skin and in the eyes',
  reanimated: 'reanimated undead: grey, waxy skin, stitched wounds, clouded sunken eyes',
  shapeshifter: 'a shapeshifter: their usual form, with an uncanny shimmer at the edges as if it might slip'
};

const TRANSFORMATION_NAMES = {
  ghost: 'Ghost', vampire: 'Vampire', werewolf: 'Werewolf',
  demigod: 'Demigod', reanimated: 'Reanimated', shapeshifter: 'Shapeshifter'
};

const clip = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
};

/**
 * How the character looks right now, as one phrase — '' when they look as
 * their portrait does.
 */
export function currentLook(entity) {
  if (!entity) return '';
  const parts = [];
  const tf = entity.activeTransformation;
  if (tf && TRANSFORMATION_LOOKS[tf]) parts.push(TRANSFORMATION_LOOKS[tf]);
  if (typeof entity.currentLook === 'string' && entity.currentLook.trim()) parts.push(clip(entity.currentLook, 300));
  return parts.join('; ');
}

/** A short label for the story writer: "a Ghost", or the player's own words. */
export function currentStateLabel(entity) {
  if (!entity) return '';
  const tf = entity.activeTransformation && TRANSFORMATION_NAMES[entity.activeTransformation];
  const own = typeof entity.currentLook === 'string' ? clip(entity.currentLook, 200) : '';
  return [tf ? `transformed: ${tf}` : '', own].filter(Boolean).join('; ');
}

/**
 * The current look of each featured entity, keyed by id, as recorded when a
 * chapter was written. Entities with no special state are recorded as '' so a
 * later redraw knows they looked normal then, even if they don't now.
 */
export function snapshotStates(entities = []) {
  const out = {};
  entities.forEach(e => { if (e?.id) out[e.id] = currentLook(e); });
  return out;
}

/**
 * The look to draw: the chapter's snapshot when it has one for this entity
 * (the story happened then), otherwise how they look now.
 */
export function lookForScene(entity, chapterStates) {
  if (chapterStates && entity?.id && Object.prototype.hasOwnProperty.call(chapterStates, entity.id)) {
    return chapterStates[entity.id] || '';
  }
  return currentLook(entity);
}
