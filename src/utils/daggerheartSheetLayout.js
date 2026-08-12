// Coordinate map for the official Daggerheart character sheet.
//
// PURE DATA — no logic, no pdf-lib import. Keeping it dependency-free means
// importing it costs nothing, and every coordinate lives in one place so the
// sheet can be re-calibrated without touching the renderer.
//
// CONVENTIONS
//   · Units are PDF points. Origin is BOTTOM-LEFT. Page is 612 x 792.
//   · Every `y` on a text field is a TEXT BASELINE, not a box top.
//   · Slot tracks give the CENTER of the first slot plus a pitch.
//
// PROVENANCE
//   Label positions come from the PDF's own text layer (exact). Slot and rule
//   positions were measured off a scale-4 raster render by
//   scripts/calibrate-sheet-slots.py — re-run it if the sheet is republished.
//   Pixel -> point at render scale S:  x = px / S,  y = 792 - py / S
//
//   Where a value is offset from its printed label, the label position is noted
//   so it's clear which numbers are measured and which are hand-tuned.

export const PAGE = { width: 612, height: 792 };

export const CALIBRATION = {
  sourceLabel: 'Character Sheets and Guides — Daggerheart, May 21 2025',
  renderScale: 4,
};

// Single-line values drawn into the sheet's printed boxes and rules.
export const TEXT_FIELDS = {
  // Header. Boxes measured at x 206.5–395.5 (name), 400–533 (pronouns),
  // 196–365.8 (heritage), 370–533 (class & subclass); labels sit at the top-left
  // of each box on the y=778 / y=758 baselines, so values go below them.
  name: { x: 216, y: 767, size: 11, maxWidth: 174 },
  pronouns: { x: 407, y: 769, size: 9, maxWidth: 120 },
  heritage: { x: 203, y: 749, size: 9.5, maxWidth: 158 },
  classSubclass: { x: 377, y: 749, size: 9.5, maxWidth: 152 },
  // LEVEL shield, far right. Its interior walls measure x 554.5–588.2, so the
  // number centers on 571.4; the black LEVEL bar caps it at y=745.
  level: { x: 571.4, y: 757, size: 16, align: 'center' },

  // Defense shields. Labels EVASION (x=21) / ARMOR (x=90) at y=667; the shield
  // bodies rise above them.
  evasion: { x: 38.5, y: 684, size: 17, align: 'center' },
  armorScore: { x: 105, y: 684, size: 17, align: 'center' },

  // Damage threshold numbers sit in the white chevron notches BETWEEN the three
  // damage bands (MINOR / MAJOR / SEVERE). The notches measure x 81.5–105.8 and
  // 169.5–193.8, so the numbers center on 93.6 and 181.6.
  majorThreshold: { x: 93.6, y: 592, size: 11, maxWidth: 23, align: 'center' },
  severeThreshold: { x: 181.6, y: 592, size: 11, maxWidth: 23, align: 'center' },

  // Trait values, centered in each shield body. Label bar centers measured at
  // 224.5 / 292.6 / 359.1 / 425.6 / 493.9 / 560.5 (pitch ~67.2).
  traitAgility: { x: 224.5, y: 696, size: 15, align: 'center' },
  traitStrength: { x: 292.6, y: 696, size: 15, align: 'center' },
  traitFinesse: { x: 359.1, y: 696, size: 15, align: 'center' },
  traitInstinct: { x: 425.6, y: 696, size: 15, align: 'center' },
  traitPresence: { x: 493.9, y: 696, size: 15, align: 'center' },
  traitKnowledge: { x: 560.5, y: 696, size: 15, align: 'center' },

  // Active weapons. Rules measured at y=580 (primary name row) and y=486.75
  // (secondary name row); text sits on the rule. Rules span x 292.2–593.2, with
  // dotted column dividers near x=410 and x=500.
  primaryWeaponName: { x: 297, y: 582, size: 9, maxWidth: 108 },
  primaryWeaponTraitRange: { x: 416, y: 582, size: 8, maxWidth: 80 },
  primaryWeaponDamage: { x: 505, y: 582, size: 8, maxWidth: 85 },
  secondaryWeaponName: { x: 297, y: 488.75, size: 9, maxWidth: 108 },
  secondaryWeaponTraitRange: { x: 416, y: 488.75, size: 8, maxWidth: 80 },
  secondaryWeaponDamage: { x: 505, y: 488.75, size: 8, maxWidth: 85 },

  // Active armor. Rule at y=382.75.
  armorName: { x: 297, y: 384.75, size: 9, maxWidth: 145 },
  armorBaseThresholds: { x: 500, y: 384.75, size: 8, maxWidth: 70, align: 'center' },
  armorBaseScore: { x: 568, y: 384.75, size: 8, maxWidth: 45, align: 'center' },
};

// Multi-line boxes. `width`/`height` bound the wrap; text flows down from `y`.
export const MULTILINE_BOXES = {
  // Rules at y=554.5 and 531.25 (primary), 461.25 and ~438 (secondary).
  primaryWeaponFeature: { x: 297, y: 556.5, width: 292, size: 7.5, lineHeight: 9, maxLines: 2 },
  secondaryWeaponFeature: { x: 297, y: 463.25, width: 292, size: 7.5, lineHeight: 9, maxLines: 2 },
  // Rules at y=356.25 and 333.25.
  armorFeature: { x: 297, y: 358.25, width: 292, size: 7.5, lineHeight: 9, maxLines: 2 },
  // Only drawn on the generic page — class pages have these preprinted.
  // HOPE FEATURE label baseline y=440.
  hopeFeature: { x: 22, y: 434, width: 240, size: 7, lineHeight: 8.5, maxLines: 4 },
  // CLASS FEATURE banner at y=236; the box runs down to roughly y=40.
  classFeature: { x: 22, y: 222, width: 245, size: 8, lineHeight: 9.75, maxLines: 18 },
};

// Repeating single-line writing rules. Text sits ~2pt above each rule.
export const RULED_LINES = {
  // Writing rules measured at 394.5, 374.75, 355.25, 335.5, 315.75; text sits
  // ~2pt above each. (A sixth rule at 416.5 is the EXPERIENCE banner's bottom
  // edge, not a writing line — drawing on it overlaps the banner.) The grey tab
  // at the right end of each line, x ~218–258, is where the modifier goes.
  experiences: {
    x: 30,
    ys: [396.5, 376.75, 357.25, 337.5, 317.75],
    size: 9,
    maxWidth: 182,
    modX: 248,
    modSize: 9,
    modAlign: 'center',
  },
  // Measured rules: 285.5, 265.25, 245.0, 225.0, 204.75.
  inventory: {
    x: 306,
    ys: [287.5, 267.25, 247, 227, 206.75],
    size: 8.5,
    maxWidth: 282,
  },
};

// The two INVENTORY WEAPON blocks in the lower-right column.
// Rules: 158.75 / 133.25 (block 1), 68.25 / 42.75 (block 2).
export const INVENTORY_WEAPONS = [
  {
    name: { x: 297, y: 160.75, size: 9, maxWidth: 108 },
    traitRange: { x: 416, y: 160.75, size: 8, maxWidth: 80 },
    damage: { x: 505, y: 160.75, size: 8, maxWidth: 85 },
    feature: { x: 297, y: 135.25, width: 292, size: 7.5, lineHeight: 9, maxLines: 2 },
    primaryCheck: { x: 496.5, y: 176.5 },
    secondaryCheck: { x: 570, y: 176.5 },
  },
  {
    name: { x: 297, y: 70.25, size: 9, maxWidth: 108 },
    traitRange: { x: 416, y: 70.25, size: 8, maxWidth: 80 },
    damage: { x: 505, y: 70.25, size: 8, maxWidth: 85 },
    feature: { x: 297, y: 44.75, width: 292, size: 7.5, lineHeight: 9, maxLines: 2 },
    primaryCheck: { x: 496.5, y: 86 },
    secondaryCheck: { x: 570, y: 86 },
  },
];

// Slot artwork. `count` is how many the sheet actually prints — anything beyond
// it has to reach the appendix rather than being dropped.
//
// HP and Stress each print a run of solid boxes followed by dashed level-up
// boxes, 12 in total at one uniform pitch. How many are solid varies by class
// page (Bard 6, Guardian 8, Wizard 6, ...) because it tracks that class's base
// HP — so no single count belongs here. Marks are placed by index against the
// pitch, which is identical on every page, and drawn the same way whether the
// printed box is solid or dashed.
export const SLOT_TRACKS = {
  hp: { shape: 'box', x: 44.5, y: 557.75, pitch: 18.78, count: 12, w: 15, h: 8.5 },
  stress: { shape: 'box', x: 69.5, y: 535.75, pitch: 16.5, count: 12, w: 12.25, h: 8.5 },
  hope: { shape: 'diamond', x: 47, y: 482.6, pitch: 35.45, count: 6, r: 7 },
  proficiency: { shape: 'circle', x: 443.75, y: 616, pitch: 11.45, count: 6, r: 3.4 },
  // 3 wide x 4 tall = 12 shield pips, filled left-to-right then top-to-bottom.
  armor: {
    shape: 'circle',
    xs: [141, 154, 167.1],
    ys: [707, 692.5, 678.25, 663.75],
    count: 12,
    r: 3.2,
  },
  gold: {
    handfuls: { shape: 'circle', x: 20.25, y: 274.5, pitch: 12.47, count: 9, r: 3.6 },
    bags: { shape: 'circle', x: 138.9, y: 274, pitch: 11.25, count: 9, r: 3.6 },
    chest: { shape: 'box', x: 251.1, y: 274, w: 10, h: 10, count: 1 },
  },
  // The small circle at the top-right of each trait shield: a marked trait.
  traitMarks: {
    shape: 'circle',
    r: 4,
    y: 719.5,
    xs: {
      agility: 253.2,
      strength: 321.3,
      finesse: 387.8,
      instinct: 454.3,
      presence: 522.6,
      knowledge: 589.2,
    },
  },
};

// Order matters: this is the order values are written into the sheet's trait
// shields, left to right.
export const TRAIT_ORDER = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];
