/**
 * Empty stand-in for src/data/hopeFear.js, used by the mobile build only.
 *
 * The mobile app ships to the Apple App Store and Google Play, where the
 * binary is a redistributed artifact rather than a page served to a browser.
 * The Daggerheart SRD is Creative Commons licensed and fine to ship that way;
 * the Hope & Fear expansion is commercial product content and is not. Rather
 * than filter it at runtime (which would still bake the text into the binary),
 * the mobile Vite config aliases every `./hopeFear.js` import to this file, so
 * the real module is never pulled into the mobile bundle at all.
 *
 * Export names and shapes must stay in lockstep with hopeFear.js — the seven
 * data modules that merge these in destructure them at module load, so a
 * missing name is a hard boot failure rather than a missing-content warning.
 * `npm run build:mobile` is the check that keeps them honest.
 */

export const HF_CLASSES = {};
export const HF_SUBCLASSES = {};
export const HF_DOMAIN_CARDS = [];
export const HF_ANCESTRIES = {};
export const HF_COMMUNITIES = {};
export const HF_ADVERSARIES = [];
export const HF_ENVIRONMENTS = [];
export const HF_WEAPONS = [];
export const HF_ARMOR = [];
export const HF_EQUIPMENT = [];
export const HF_CONSUMABLES = [];
export const HF_CAMPAIGN_FRAMES = [];
export const HF_TRANSFORMATIONS = [];

// Dread is the expansion's domain accent. Nothing in the core-only build
// renders it, but TransformationPanel imports the constants unconditionally.
export const DREAD_COLOR = '#7f1d1d';
export const DREAD_GLYPH = '🕯';
