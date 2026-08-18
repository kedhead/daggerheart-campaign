// Character record -> the values printed on the official Daggerheart sheet.
//
// PURE. No pdf-lib, no fetch, no DOM. The drawing half lives in
// exportCharacterSheetPdf.js; keeping the mapping separate is what lets the
// smoke test exercise it in node.
//
// Derived numbers are never read off the character document — Evasion, Armor
// Score and damage thresholds all come from computeDefenses(), the same
// calculator the on-screen sheet and the Player Portal use, so an exported PDF
// can never disagree with what the player sees.

import { CLASSES, SUBCLASSES, ANCESTRIES, COMMUNITIES, getEffectiveProficiency } from '../data/systems/daggerheart';
import { getCardByName } from '../data/daggerheartDomainCards';
import { computeDefenses, resolveArmorBases } from './daggerheartDefenses';
import { normalizeHopeSlots, scarCount, usableHopeMax } from './daggerheartHope';
import { getWeaponDamage, formatTraitValue } from './daggerheartRollUtils';
import { resolveFeature, featureNameList, hasFeatureName } from './itemFeatures';
import { TRAIT_ORDER, SLOT_TRACKS, RULED_LINES } from './daggerheartSheetLayout';

// Gold on the sheet is three denominations. The rulebook's conversion is
// 10 handfuls to a bag, 10 bags to a chest.
const HANDFULS_PER_BAG = 10;
const BAGS_PER_CHEST = 10;

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

/**
 * Resolve a character's stored equippedItems references against the campaign
 * item catalog. Mirrors DaggerheartCharacterSheet's own resolution so both
 * agree on what counts as equipped.
 */
export function resolveEquippedItems(character, items) {
  if (!Array.isArray(items) || !Array.isArray(character?.equippedItems)) return [];
  return character.equippedItems
    .filter(ei => ei.equipped !== false)
    .map(ei => {
      const item = items.find(i => i.id === ei.itemId);
      return item ? { ...item, ...ei } : null;
    })
    .filter(Boolean);
}

/**
 * How many armor slots the sheet should show as markable.
 *
 * Lifted from DaggerheartCharacterSheet so the PDF and the screen agree. Two
 * rules apply: items saved before `armorSlots` existed defaulted to 6, which is
 * corrected back to the armor's score; and Armor Score bonuses beyond the
 * armor's own base (shields with Protective, "+1 armor score" features, passive
 * ability bonuses) each grant an extra slot.
 */
export function armorSlotCount(character, equippedArmorItems, effectiveArmorScore) {
  const stored = Array.isArray(character?.armorSlots) ? character.armorSlots.length : 6;
  if (!equippedArmorItems || equippedArmorItems.length === 0) return stored;
  const sd = equippedArmorItems[0].systemData || {};
  let slots = sd.armorSlots ?? stored;
  if (slots === 6 && (sd.armorScore ?? 0) !== 6 && !hasFeatureName(sd.features, 'Fortified')) {
    slots = sd.armorScore || slots;
  }
  slots += Math.max(0, effectiveArmorScore - (sd.armorScore ?? slots));
  return slots > 0 ? slots : stored;
}

/**
 * Flatten a character's inventory into printable lines.
 *
 * `inventory` is dual-shaped legacy: DaggerheartCharacterSheet treats it as a
 * free-text string, while the Firestore helpers in useFirestoreCampaign write
 * it as an array of {itemId, quantity}. Both shapes are handled, then equipped
 * gear that isn't a weapon or armor is appended.
 */
export function normalizeInventory(character, items = []) {
  const lines = [];
  const raw = character?.inventory;

  if (typeof raw === 'string') {
    raw.split(/\r?\n|;/).map(s => s.trim()).filter(Boolean).forEach(s => lines.push(s));
  } else if (Array.isArray(raw)) {
    raw.forEach(entry => {
      if (typeof entry === 'string') { if (entry.trim()) lines.push(entry.trim()); return; }
      if (!entry) return;
      const item = Array.isArray(items) ? items.find(i => i.id === entry.itemId) : null;
      const name = item?.name || entry.name;
      if (!name) return;
      const qty = entry.quantity || 1;
      lines.push(qty > 1 ? `${qty}x ${name}` : name);
    });
  }

  // Equipped consumables and general equipment belong on the inventory list;
  // weapons and armor have their own boxes on the sheet.
  resolveEquippedItems(character, items)
    .filter(i => i.type !== 'weapon' && i.type !== 'armor')
    .forEach(i => {
      const qty = i.quantity || 1;
      lines.push(qty > 1 ? `${qty}x ${i.name}` : i.name);
    });

  const seen = new Set();
  return lines.filter(l => {
    const k = l.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Split a gold total into the sheet's handfuls / bags / chests. */
export function splitGold(gold) {
  const total = Math.max(0, Math.floor(Number(gold) || 0));
  const chests = Math.floor(total / (HANDFULS_PER_BAG * BAGS_PER_CHEST));
  const bags = Math.floor((total % (HANDFULS_PER_BAG * BAGS_PER_CHEST)) / HANDFULS_PER_BAG);
  const handfuls = total % HANDFULS_PER_BAG;
  return { total, chests, bags, handfuls };
}

/** Describe a weapon in the three columns the sheet prints. */
function describeWeapon(weapon, level, proficiency) {
  if (!weapon) return null;
  const sd = weapon.systemData || {};
  const traitRange = [cap(sd.trait), cap(sd.range)].filter(Boolean).join(' ');
  const damage = [getWeaponDamage(weapon, level, proficiency), sd.damageType].filter(Boolean).join(' ');
  // Prefer real rules text (authored or from the glossary); fall back to bare
  // names. The printed FEATURE box is two lines, so drawFitted truncates.
  const standard = featureNameList(sd.features);
  const custom = (sd.features || [])
    .map(resolveFeature)
    .filter(r => r.name && r.description)
    .map(r => `${r.name}: ${r.description}`);
  return {
    name: weapon.name || '',
    traitRange,
    damage,
    burden: sd.burden || '',
    feature: custom.length ? custom.join(' · ') : standard.join(', '),
  };
}

/** Fall back to the plain strings a Demiplane import leaves behind. */
function weaponFromString(str) {
  return str ? { name: String(str), traitRange: '', damage: '', burden: '', feature: '' } : null;
}

/**
 * Build every value the renderer draws.
 *
 * @param {object} character
 * @param {{items?: Array, includeDmNotes?: boolean}} opts
 * @returns {object} flat model, plus an `overflow` bag for anything the
 *          one-page sheet has no room for.
 */
export function buildSheetFields(character, { items = [], includeDmNotes = false } = {}) {
  const c = character || {};
  const level = c.level || 1;
  const proficiency = getEffectiveProficiency(c);
  const charClass = c.class || '';
  const classData = charClass ? CLASSES[charClass] : null;

  const equippedItems = resolveEquippedItems(c, items);
  const equippedWeapons = equippedItems.filter(i => i.type === 'weapon');
  const equippedArmorItems = equippedItems.filter(i => i.type === 'armor');

  const defenses = computeDefenses(c, equippedItems);

  // ── Identity ──────────────────────────────────────────────────────────────
  // The sheet's HERITAGE slot has no matching field: it's ancestry + community.
  const ancestry = c.ancestry || (c.customAncestryData && c.customAncestryData.name) || '';
  const community = c.community || (c.customCommunityData && c.customCommunityData.name) || '';
  const heritage = [ancestry, community].filter(Boolean).join(' / ');

  // The header slot is labeled "CLASS & SUBCLASS" on the generic sheet but just
  // "SUBCLASS" on a class page, which already prints the class in its banner.
  // Provide both so the renderer can pick by page.
  const multiclassSuffix = c.multiclass?.class ? ` / ${c.multiclass.class}` : '';
  const classSubclass = [charClass, c.subclass].filter(Boolean).join(' ') + multiclassSuffix;
  const subclassOnly = (c.subclass || '') + multiclassSuffix;

  // ── Vital tracks ──────────────────────────────────────────────────────────
  // hpSlots stores REMAINING Hit Points (true = unharmed); stress and armor
  // store MARKS (true = marked). The sheet marks damage taken in every case, so
  // HP is inverted here and the other two are not. See RestModal.jsx.
  const hpSlots = Array.isArray(c.hpSlots) ? c.hpSlots : [];
  const stressSlots = Array.isArray(c.stressSlots) ? c.stressSlots : [];
  const hpMarked = hpSlots.map(s => !s);
  const stressMarked = stressSlots.map(Boolean);

  const hopeSlots = normalizeHopeSlots(c.hopeSlots);
  const scars = scarCount(c);
  const usableHope = usableHopeMax(c, hopeSlots);
  const hope = hopeSlots.map((filled, i) => ({
    filled: i < usableHope && !!filled,
    scarred: i >= usableHope,
  }));

  const armorSlotsTotal = armorSlotCount(c, equippedArmorItems, defenses.armorScore);
  const rawArmorSlots = Array.isArray(c.armorSlots) ? c.armorSlots : [];
  const armorMarked = Array.from({ length: armorSlotsTotal }, (_, i) => !!rawArmorSlots[i]);

  // ── Traits ────────────────────────────────────────────────────────────────
  const markedTraits = (c.markedTraits || []).map(t => String(t).toLowerCase());
  const traits = TRAIT_ORDER.map(key => ({
    key,
    label: cap(key),
    value: formatTraitValue(c.traits?.[key] ?? 0),
    marked: markedTraits.includes(key),
  }));

  // ── Weapons ───────────────────────────────────────────────────────────────
  // equippedItems carries no slot field (nothing in the app writes one), so
  // primary/secondary is array order, with ei.slot honored if it ever appears.
  const bySlot = (slot) => equippedWeapons.find(w => String(w.slot || '').toLowerCase() === slot);
  const primarySrc = bySlot('primary') || equippedWeapons[0] || null;
  const secondarySrc = bySlot('secondary') || equippedWeapons.find(w => w !== primarySrc) || null;

  const primaryWeapon =
    describeWeapon(primarySrc, level, proficiency) || weaponFromString(c.primaryWeapon);
  const secondaryWeapon =
    describeWeapon(secondarySrc, level, proficiency) || weaponFromString(c.secondaryWeapon);

  const carried = equippedWeapons.filter(w => w !== primarySrc && w !== secondarySrc);
  const inventoryWeapons = carried
    .slice(0, 2)
    .map(w => describeWeapon(w, level, proficiency))
    .filter(Boolean);

  // ── Armor ─────────────────────────────────────────────────────────────────
  const armorItem = equippedArmorItems[0] || null;
  const armorBases = resolveArmorBases(armorItem);
  const armorSd = armorItem?.systemData || {};
  const armorCustom = (armorSd.features || [])
    .map(resolveFeature)
    .filter(r => r.name && r.description)
    .map(r => `${r.name}: ${r.description}`);
  const activeArmor = {
    name: armorItem?.name || c.armorName || c.equippedArmor || '',
    baseThresholds: armorBases ? `${armorBases.major} / ${armorBases.severe}` : '',
    baseScore: armorSd.armorScore != null ? String(armorSd.armorScore) : '',
    feature: armorCustom.length ? armorCustom.join(' · ') : featureNameList(armorSd.features).join(', '),
  };

  // ── Experiences ───────────────────────────────────────────────────────────
  // Experiences start at +2; experienceBoosts records level-up increases.
  const boosts = c.experienceBoosts || {};
  const allExperiences = (c.experiences || []).map(name => ({
    name: String(name),
    mod: `+${2 + (boosts[name] || 0)}`,
  }));
  const expCapacity = RULED_LINES.experiences.ys.length;

  // ── Inventory ─────────────────────────────────────────────────────────────
  const allInventory = normalizeInventory(c, items);
  const invCapacity = RULED_LINES.inventory.ys.length;

  // ── Gold ──────────────────────────────────────────────────────────────────
  const gold = splitGold(c.gold);
  const goldTrack = SLOT_TRACKS.gold;

  // ── Domain cards ──────────────────────────────────────────────────────────
  const cardNames = c.domainCards || [];
  const vaultNames = c.vaultCards || [];
  const resolveCard = (name) => getCardByName(name) || { name, domain: '', level: null, text: '' };
  const loadoutCards = cardNames.filter(n => !vaultNames.includes(n)).map(resolveCard);
  const vaultCards = cardNames.filter(n => vaultNames.includes(n)).map(resolveCard);

  // ── Features that never fit on the sheet ──────────────────────────────────
  const subclassInfo =
    charClass && c.subclass && SUBCLASSES[charClass]
      ? SUBCLASSES[charClass].find(s => s.name === c.subclass)
      : null;
  const ancestryData = (c.ancestry && ANCESTRIES[c.ancestry]) || c.customAncestryData || null;
  const communityData = (c.community && COMMUNITIES[c.community]) || c.customCommunityData || null;

  return {
    // identity
    name: c.name || '',
    pronouns: c.pronouns || '',
    heritage,
    classSubclass,
    subclassOnly,
    className: charClass,
    level: String(level),

    // defenses
    evasion: String(defenses.evasion),
    armorScore: String(defenses.armorScore),
    majorThreshold: defenses.majorThreshold ? String(defenses.majorThreshold) : '',
    severeThreshold: defenses.severeThreshold ? String(defenses.severeThreshold) : '',
    massiveThreshold: defenses.massiveThreshold,
    proficiency,

    traits,

    // vital tracks
    hp: { marked: hpMarked, total: hpSlots.length },
    stress: { marked: stressMarked, total: stressSlots.length },
    hope,
    armorSlots: { marked: armorMarked, total: armorSlotsTotal },
    scars,

    // gear
    primaryWeapon,
    secondaryWeapon,
    inventoryWeapons,
    activeArmor,

    experiences: allExperiences.slice(0, expCapacity),
    inventoryLines: allInventory.slice(0, invCapacity),
    gold: {
      ...gold,
      // The printed track is finite; anything past it goes to the appendix.
      handfulsShown: Math.min(gold.handfuls, goldTrack.handfuls.count),
      bagsShown: Math.min(gold.bags, goldTrack.bags.count),
      chestsShown: Math.min(gold.chests, goldTrack.chest.count),
    },

    // Only drawn on the generic fallback page — class pages preprint these.
    hopeFeature: classData?.hopeFeature || null,
    classFeatures: classData?.classFeatures || [],

    overflow: {
      experiences: allExperiences.slice(expCapacity),
      inventoryLines: allInventory.slice(invCapacity),
      weapons: carried.slice(2).map(w => describeWeapon(w, level, proficiency)).filter(Boolean),
      loadoutCards,
      vaultCards,
      subclass: subclassInfo || null,
      subclassLevel: c.subclassLevel || 'foundation',
      ancestry: ancestryData && typeof ancestryData === 'object' ? { name: ancestry, ...ancestryData } : null,
      community: communityData && typeof communityData === 'object' ? { name: community, ...communityData } : null,
      companion: c.companion || null,
      knownBeastforms: c.knownBeastforms || [],
      backstory: c.backstory || '',
      appearance: c.appearanceDescription || '',
      playerNotes: c.playerNotes || '',
      // Never leak GM notes into a player's export unless explicitly asked for.
      dmNotes: includeDmNotes ? c.dmNotes || '' : '',
      goldRemainder:
        gold.handfuls > goldTrack.handfuls.count ||
        gold.bags > goldTrack.bags.count ||
        gold.chests > goldTrack.chest.count
          ? gold
          : null,
      playerName: c.playerName || '',
      domainNotes: c.domainNotes || '',
    },
  };
}
