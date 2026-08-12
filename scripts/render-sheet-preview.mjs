#!/usr/bin/env node
/**
 * Render filled character sheets for a set of fixture characters, so the
 * coordinate map in src/utils/daggerheartSheetLayout.js can be checked by eye.
 *
 *   node scripts/render-sheet-preview.mjs [--debug] [--out DIR] [--only NAME]
 *
 * --debug strokes every field box and slot origin, which is the fast way to
 * find a misaligned coordinate: one render shows every offset at once.
 *
 * Writes PDFs to the output dir (default .preview/). Rasterize them with
 * scripts/calibrate-sheet-slots.py's renderer or any PDF viewer.
 *
 * This runs the real browser code path — exportCharacterSheetPdf accepts
 * injected template bytes precisely so node needs no fetch.
 */
import fs from 'fs';
import path from 'path';

import { exportCharacterSheetPdf } from '../src/utils/exportCharacterSheetPdf';

// Bundled by esbuild (see "npm run sheet:preview"), so this resolves against
// the repo root rather than the bundle's location.
const ROOT = process.cwd();

const TEMPLATE = path.join(ROOT, 'public', 'assets', 'daggerheart-sheet-template.pdf');
const MANIFEST = path.join(ROOT, 'public', 'assets', 'daggerheart-sheet-template.json');

const args = process.argv.slice(2);
const debug = args.includes('--debug');
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(ROOT, '.preview');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

// A campaign item catalog the fixtures equip from.
const ITEMS = [
  {
    id: 'w-rapier',
    name: 'Rapier',
    type: 'weapon',
    systemData: {
      trait: 'presence', range: 'melee', damageType: 'phy', burden: 'One-Handed',
      damageTier1Dice: 'd8', tier: 1,
      features: [{ name: 'Quick', description: 'Mark a Stress to target another creature within range.' }],
    },
  },
  {
    id: 'w-dagger',
    name: 'Small Dagger',
    type: 'weapon',
    systemData: {
      trait: 'finesse', range: 'melee', damageType: 'phy', burden: 'One-Handed',
      damageTier1Dice: 'd8', tier: 1, features: ['Paired'],
    },
  },
  {
    id: 'w-greatsword',
    name: 'Improved Greatsword',
    type: 'weapon',
    systemData: {
      trait: 'strength', range: 'melee', damageType: 'phy', burden: 'Two-Handed',
      damageTier1Dice: 'd10', damageTier1Modifier: 3,
      damageTier3Dice: 'd10', damageTier3Modifier: 6,
      damageTier4Dice: 'd10', damageTier4Modifier: 9,
      tier: 3, features: ['Massive'],
    },
  },
  {
    id: 'w-shortbow',
    name: 'Shortbow',
    type: 'weapon',
    systemData: { trait: 'agility', range: 'far', damageType: 'phy', damageTier1Dice: 'd6', tier: 1, features: [] },
  },
  {
    id: 'a-gambeson',
    name: 'Gambeson Armor',
    type: 'armor',
    systemData: { armorScore: 3, armorSlots: 3, thresholds: { minor: 5, major: 11 }, tier: 1, features: ['Flexible'] },
  },
  {
    id: 'a-full-plate',
    name: 'Improved Full Plate',
    type: 'armor',
    systemData: { armorScore: 6, armorSlots: 6, thresholds: { minor: 9, major: 20 }, tier: 3, features: ['Very Heavy'] },
  },
  { id: 'e-torch', name: 'Torch', type: 'equipment', systemData: {} },
  { id: 'e-rope', name: '50 feet of rope', type: 'equipment', systemData: {} },
  { id: 'c-potion', name: 'Minor Health Potion', type: 'consumable', systemData: {} },
];

const FIXTURES = {
  // Sparse: defaults only. Catches null-handling on every field.
  'bard-level1': {
    name: 'Lyric Vale',
    pronouns: 'they/them',
    class: 'Bard',
    subclass: 'Wordsmith',
    ancestry: 'Elf',
    community: 'Loreborne',
    level: 1,
    traits: { agility: 0, strength: -1, finesse: 1, instinct: 0, presence: 2, knowledge: 1 },
    hpSlots: [true, true, true, true, true],
    stressSlots: [false, false, false, false, false, false],
    armorSlots: [false, false, false, false, false, false],
    hopeSlots: [true, true, false, false, false, false],
    evasion: 10,
    armor: 0,
    gold: 7,
    experiences: ['Silver Tongue', 'Tavern Regular'],
    inventory: 'A torch\n50 feet of rope\nA romance novel',
  },

  // Everything at once: full kit, overflow in every direction.
  'guardian-level10': {
    name: 'Thorne Ironhold',
    pronouns: 'he/him',
    class: 'Guardian',
    subclass: 'Stalwart',
    subclassLevel: 'mastery',
    multiclass: { class: 'Warrior', subclass: 'Call of the Brave', domain: 'Blade' },
    ancestry: 'Dwarf',
    community: 'Ridgeborne',
    level: 10,
    proficiency: 4,
    traits: { agility: 1, strength: 3, finesse: 0, instinct: 2, presence: 1, knowledge: 0 },
    markedTraits: ['strength', 'instinct'],
    hpSlots: [false, false, false, true, true, true, true, true],
    stressSlots: [true, true, true, false, false, false, false],
    armorSlots: [true, true, false, false, false, false],
    hopeSlots: [true, true, true, false, false, false],
    scars: 2,
    evasion: 9,
    armor: 6,
    gold: 247,
    equippedItems: [
      { itemId: 'w-greatsword', equipped: true },
      { itemId: 'w-shortbow', equipped: true },
      { itemId: 'w-dagger', equipped: true },
      { itemId: 'a-full-plate', equipped: true },
      { itemId: 'e-torch', equipped: true },
      { itemId: 'c-potion', equipped: true, quantity: 3 },
    ],
    experiences: ['Shield of the Pass', 'Old Soldier', 'Reads the Room', 'Mountain Born', 'Duelist', 'Quartermaster'],
    experienceBoosts: { 'Shield of the Pass': 2, 'Old Soldier': 1 },
    domainCards: ['Whirlwind', 'Get Back Up', 'Bare Bones', 'Deft Maneuvers', 'I Am Your Shield', 'Body Basher'],
    vaultCards: ['Body Basher'],
    inventory: 'Signal horn\nWhetstone\nRations (5 days)\nLetter of passage\nBroken shield boss\nOld war medal',
    backstory:
      'Thorne held the pass at Ridgefall for three days while the caravans went south. He does not talk about the fourth day.',
    playerNotes: 'Looking for the smith who forged the plate.',
    dmNotes: 'The smith is dead. Thorne will find out in session 12.',
  },

  // Homebrew class: must land on the generic page AND draw the class/hope
  // feature text that a class page would have preprinted.
  'homebrew-class': {
    name: 'Sable Quill',
    class: 'Chronomancer',
    subclass: 'Hourkeeper',
    ancestry: 'Human',
    community: 'Wildborne',
    level: 4,
    traits: { agility: 1, strength: 0, finesse: 2, instinct: 1, presence: 0, knowledge: 2 },
    hpSlots: [true, true, false, true, true, true],
    stressSlots: [true, false, false, false, false, false],
    hopeSlots: [true, true, true, true, false, false],
    gold: 34,
    experiences: ['Clockwork Tinker'],
    inventory: 'Pocket watch that runs backwards',
  },

  // WinAnsi hazard: curly quotes, em dashes, accents.
  'unicode-hazard': {
    name: 'Émile — O’Rourke’s “Ghost”',
    pronouns: 'she/her',
    class: 'Rogue',
    subclass: 'Nightwalker',
    ancestry: 'Faun',
    community: 'Underborne',
    level: 3,
    traits: { agility: 2, strength: 0, finesse: 2, instinct: 1, presence: 1, knowledge: 0 },
    hpSlots: [true, true, true, true, true, true],
    stressSlots: [false, false, false, false, false, false],
    hopeSlots: [true, true, false, false, false, false],
    gold: 12,
    experiences: ['Rooftop Runner — Ashfall', 'Knows a Guy…'],
    inventory: 'Thieves’ tools—fine set\nA letter, never opened…',
    backstory: 'Born in Ashfall’s undercity — she calls it “home”, nobody else does.',
  },

  // Legacy array-shaped inventory (the useFirestoreCampaign helpers write this).
  'legacy-inventory': {
    name: 'Marrow Tide',
    class: 'Druid',
    subclass: 'Warden of the Elements',
    ancestry: 'Simiah',
    community: 'Wanderborne',
    level: 2,
    traits: { agility: 1, strength: 0, finesse: 1, instinct: 2, presence: 0, knowledge: 1 },
    hpSlots: [true, true, true, true, true, true],
    stressSlots: [false, false, false, false, false, false],
    hopeSlots: [true, false, false, false, false, false],
    gold: 3,
    inventory: [
      { itemId: 'e-torch', quantity: 2 },
      { itemId: 'e-rope', quantity: 1 },
      { itemId: 'c-potion', quantity: 4 },
    ],
    equippedItems: [
      { itemId: 'w-shortbow', equipped: true },
      { itemId: 'a-gambeson', equipped: true },
    ],
  },
};

async function main() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error(`Template missing: ${TEMPLATE}\nRun scripts/extract-sheet-template.mjs first.`);
    process.exit(1);
  }

  const templateBytes = fs.readFileSync(TEMPLATE);
  const templateManifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

  fs.mkdirSync(outDir, { recursive: true });

  const names = only ? [only] : Object.keys(FIXTURES);
  for (const key of names) {
    const character = FIXTURES[key];
    if (!character) {
      console.error(`Unknown fixture: ${key}`);
      process.exit(1);
    }
    const blob = await exportCharacterSheetPdf(character, {
      items: ITEMS,
      includeDmNotes: true,
      templateBytes: templateBytes.buffer.slice(
        templateBytes.byteOffset,
        templateBytes.byteOffset + templateBytes.byteLength
      ),
      templateManifest,
      debug,
    });
    const buf = Buffer.from(await blob.arrayBuffer());
    const file = path.join(outDir, `${key}${debug ? '.debug' : ''}.pdf`);
    fs.writeFileSync(file, buf);
    console.log(`${path.relative(ROOT, file)}  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
