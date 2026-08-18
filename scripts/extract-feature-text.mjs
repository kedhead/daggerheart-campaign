#!/usr/bin/env node
/**
 * Re-derive src/data/daggerheartFeatures.js from the rulebook text.
 *
 *   node scripts/extract-feature-text.mjs [path/to/dh-rulebook.txt] > src/data/daggerheartFeatures.js
 *
 * Item features are printed in the rulebook as "Name: effect" runs inside the
 * gear tables. Extraction is mechanical but NOT trustworthy on its own, so this
 * script encodes the review decisions that were made by hand:
 *
 *  - CATEGORY comes from the app's own catalog (which items actually carry the
 *    feature), not from guessing.
 *  - OVERRIDES fix the cases the regex gets wrong or can't decide:
 *      · names that collide across contexts — "Bonded" and "Resilient" also name
 *        Beastbound companion upgrades, whose text the regex prefers because it
 *        occurs more often;
 *      · values that scale with item tier — Protective/Barrier/Paired print
 *        +1..+5 depending on the shield, so the glossary states the base and
 *        says it varies;
 *      · per-item text — "Versatile" lists each weapon's alternate statline;
 *      · names the app ships that the rulebook never defines (Precise, Thrown,
 *        Ammunition, Reach) — these are PARAPHRASE, flagged as such.
 *
 * Re-running this will not reproduce those judgements unless the tables below
 * are kept, which is why they live here rather than in a scratch file.
 */
import fs from 'fs';

const RULEBOOK = process.argv[2] || 'dh-rulebook.txt';
// Hope & Fear expansion gear isn't in the core rulebook, but each item spells its
// feature out in its own description field ("Aimed: Your attack has disadvantage
// ..."), which is the same "Name: text" shape — so it's a second source.
const EXPANSION = 'src/data/hopeFear.js';

// Which kind of gear carries each feature, derived from src/data/daggerheartItems.js.
const CATEGORY = {
  weapon: `accelerator aimed barrier bolstering bonded bouncing braced brave brutal catalytic charged
    concussive curse deadly deflecting destructive devastating disturbing double-duty doubled-up draining
    dueling entangling eruptive ethereal extending focused follow-up freezing grappling greedy healing
    hooked hot incendiary inverted invigorating lifestealing locked-on long lucky magnetic massive
    nonlethal omnipresent otherworldly padded paired parry persuasive piercing poisonous pompous powerful
    protective quick rebounding recursive reliable reloading resonant retractable returning ricochet scary
    scattershot self-correcting serrated sharpwing sheltering startling stockpiled targeted timebending
    trusty venomous versatile volleyed precise thrown ammunition reach`,
  armor: `absorbing accursed aquatic attuned blessed bloodthirsty bulky channeling divine enchanted
    flexible fortified fortune-favored ghostwalker gilded gliding lined magic magnificent mnemonic physical
    quick-striding quiet resplendent self-healing sharp shifting splintering stellar timeslowing
    truthseeking very-heavy vigilant vitreous wall-crawling warded resilient`,
  both: `burning cumbersome heavy painful`,
};

// Human-reviewed text. Anything here wins over the extractor.
const OVERRIDES = {
  // Collides with the Beastbound companion upgrade of the same name.
  bonded: 'Gain a bonus to your damage rolls equal to your level.',
  resilient: 'Before you mark your last Armor Slot, roll a d6. On a result of 6, reduce the severity by one threshold without marking a slot.',
  // Values scale with the item's tier; state the base and say so.
  protective: '+1 to Armor Score. Higher-tier shields grant a larger bonus.',
  barrier: '+2 to Armor Score; -1 to Evasion. Higher-tier shields grant a larger bonus.',
  paired: '+2 to primary weapon damage to targets within Melee range. Higher-tier off-hand weapons grant a larger bonus.',
  // The rulebook prints each weapon's own alternate statline.
  versatile: 'This weapon can also be used with a second set of statistics, printed on the weapon itself.',
  // Multi-word names the boundary regex splits badly.
  'very-heavy': '-2 to Evasion; -1 to Agility',
  'double-duty': '+1 to Armor Score; +1 to primary weapon damage within Melee range',
  'doubled-up': 'When you make an attack with your primary weapon, you can deal damage to another target within Melee range.',
  'locked-on': 'On a successful attack, your next attack against the same target with your primary weapon automatically succeeds.',
  gilded: '+1 to Presence',
  // Lady Lavender's Longsword stores this as 'curse', but its own text names the
  // feature "Curse Breaker" — the key is a truncation in the expansion data.
  curse: 'This weapon clears all magical curses on a creature it touches.',
  // Same name, different effect on weapons vs armor.
  burning: 'On a weapon: when you roll a 6 on a damage die, the target must mark a Stress. On armor: when an adversary attacks you within Melee range, they mark a Stress.',
};

// Names the app offers that the rulebook never defines. Paraphrase, not SRD text.
const PARAPHRASE = {
  precise: '+1 to attack rolls.',
  thrown: 'This weapon can be thrown at a target within its range.',
  ammunition: 'This weapon requires ammunition to fire.',
  reach: 'This weapon can strike targets at an extended melee distance.',
};

const display = (n) => n.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('-');
const spaced = (n) => n.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

function extract(text, name) {
  // Stop at the next "Name:" (optionally hyphenated or two words) so one
  // feature's text doesn't swallow the next one's.
  const bound = '(?=\\s+(?:[A-Z][a-z]+(?:[- ][A-Z][a-z]+)?):|\\s+--|$)';
  const counts = new Map();
  for (const spelling of new Set([display(name), spaced(name)])) {
    const re = new RegExp(spelling.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s+(.*?)' + bound, 'g');
    let m;
    while ((m = re.exec(text))) {
      const d = m[1].replace(/\s+/g, ' ').trim();
      if (d.length > 5 && d.length < 300) counts.set(d, (counts.get(d) || 0) + 1);
    }
  }
  if (!counts.size) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

let text = fs.readFileSync(RULEBOOK, 'utf8').replace(/\s+/g, ' ');
if (fs.existsSync(EXPANSION)) {
  // Pull just the description strings, so item names and code don't add noise.
  const descs = [...fs.readFileSync(EXPANSION, 'utf8').matchAll(/description:\s*'((?:[^'\\]|\\.)*)'/g)]
    .map(m => m[1].replace(/\\'/g, "'"))
    .filter(d => /^[A-Z][A-Za-z-]*:/.test(d.trim()));
  text += ' ' + descs.join(' -- ');
}
const names = {};
for (const [cat, list] of Object.entries(CATEGORY)) {
  for (const n of list.trim().split(/\s+/)) names[n] = cat;
}

const rows = [];
const unresolved = [];
for (const name of Object.keys(names).sort()) {
  const description = OVERRIDES[name] ?? PARAPHRASE[name] ?? extract(text, name);
  if (!description) { unresolved.push(name); continue; }
  rows.push({
    key: name,
    label: spaced(name),
    category: names[name],
    description,
    paraphrase: name in PARAPHRASE,
  });
}
if (unresolved.length) {
  console.error(`WARNING unresolved: ${unresolved.join(', ')}`);
}

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
console.log(`// Daggerheart item feature glossary — what each feature actually does.
//
// GENERATED by scripts/extract-feature-text.mjs from dh-rulebook.txt, with the
// hand-review decisions recorded in that script. Re-run it rather than editing
// entries here, so the corrections aren't silently lost on the next derivation.
//
// Keys are lowercase because that is how the item catalog stores feature names
// ('reliable'), while the pickers use title case ('Reliable') — every lookup
// goes through a lowercase key so both shapes resolve.
//
// \`paraphrase: true\` marks the handful of names the app offers that the
// rulebook never defines; that wording is ours, not SRD text.

export const DAGGERHEART_FEATURES = {`);
for (const r of rows) {
  console.log(`  '${r.key}': { label: '${esc(r.label)}', category: '${r.category}',${r.paraphrase ? ' paraphrase: true,' : ''}`);
  console.log(`    description: '${esc(r.description)}' },`);
}
console.log(`};

/** Look up a feature's glossary entry by name, case- and spacing-insensitive. */
export function getFeatureEntry(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase().replace(/\\s+/g, '-');
  return DAGGERHEART_FEATURES[key] || null;
}

export default DAGGERHEART_FEATURES;`);
