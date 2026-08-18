import { aiService } from './aiService';
import { getFeatureEntry } from '../data/daggerheartFeatures';

const TYPE_GUIDANCE = {
  weapon: `A weapon with tiered damage dice. Return systemData fields:
  classification: "primary" or "secondary"
  damageType: "physical" or "magical"
  trait: "agility" | "strength" | "finesse" | "instinct" | "presence" | "knowledge"
  range: "melee" | "close" | "far" | "very far"
  burden: "one-handed" or "two-handed"
  damageTier1Dice..damageTier4Dice: one of "d4","d6","d8","d10","d12"
  damageTier1Modifier..damageTier4Modifier: integer (tier 1 ~0, tier 2 ~3, tier 3 ~6, tier 4 ~9)
  tier: 1-4 (power tier)
  rarity: "" | "common" | "uncommon" | "rare" | "legendary" | "relic"
  features: array (see below)`,

  armor: `Armor with score/slots and damage thresholds. Return systemData fields:
  armorScore: 2-12 (damage reduced when marking a slot)
  armorSlots: 2-12 (typically equal to armorScore unless Fortified)
  tier: 1-4 (T1 ~3, T2 ~5, T3 ~7, T4 ~9 armor score as a rough guide)
  rarity: "" | "common" | "uncommon" | "rare" | "legendary" | "relic"
  thresholds: { "minor": <Major base>, "major": <Severe base> } — sheet adds character level
     (legacy field naming: minor stores Major base, major stores Severe base)
     T1 armor: ~6-8 / 13-17. T2: ~9-11 / 19-23. T3: ~12-14 / 25-30. T4: ~15-17 / 31-37.
  features: array (see below)`,

  equipment: `A utility, consumable, relic, or enhancement item. Return systemData fields:
  category: "utility" | "magical" | "consumable" | "enhancement" | "relic"
  rarity: "" | "common" | "uncommon" | "rare" | "legendary" | "relic"
  activation: short string like "Action", "Reaction", "Once per long rest", "Passive"
  uses: integer (use -1 for unlimited)
  hopeCost: 0-3 (Hope spent to activate)
  stressCost: 0-3 (Stress marked to activate)
  mechanicalEffect: one-sentence primary effect
  features: array of additional abilities (see below)`
};

const STANDARD_FEATURES = {
  weapon: ['Powerful', 'Returning', 'Massive', 'Quick', 'Scary', 'Hooked', 'Reliable', 'Brutal', 'Precise', 'Versatile', 'Reach', 'Thrown', 'Ammunition'],
  armor: ['Deflecting', 'Sheltering', 'Barrier', 'Resilient', 'Fortified'],
  equipment: []
};

function buildPrompt({ concept, type, tier, rarity, campaignContext }) {
  const std = STANDARD_FEATURES[type];
  return `You are an expert Daggerheart TTRPG game master creating a mechanically accurate ${type}.

CONCEPT: ${concept}
TYPE: ${type}
${tier ? `POWER TIER: ${tier} (1=novice, 2=seasoned, 3=formidable, 4=legendary)` : ''}
${rarity ? `RARITY: ${rarity}` : ''}

${campaignContext ? `=== CAMPAIGN CONTEXT ===\n${campaignContext}\n=== END CAMPAIGN CONTEXT ===\n\nUse the campaign context to name and theme the item consistent with the world. Avoid duplicating existing item names.\n` : ''}

=== ${type.toUpperCase()} RULES ===
${TYPE_GUIDANCE[type]}

FEATURES format:
  features is an array. Each element is EITHER:
    - A plain string ONLY if it exactly matches an SRD feature from this list
      (its rules text is already known, so no description is needed):
        ${std.length ? std.join(', ') : '(none — equipment uses custom features only)'}
    - OR a custom feature object: { "name": "Feature Name", "description": "Mechanical effect in 1-2 sentences using Daggerheart terms." }
  Any name NOT on that list MUST be an object with a description. A bare string
  that isn't an SRD feature leaves the reader with no idea what it does.

Prefer 0-2 SRD strings (if any) + 1-3 custom features for flavor. Relics/legendary items should lean heavily on flavorful custom features.

Custom feature examples (good patterns):
  { "name": "Ever-Damp", "description": "+1 Evasion vs. fire or physical grabs." }
  { "name": "The Choir's Croak", "description": "Once per long rest, block triggers a subsonic push (DC 13 Instinct)." }
  { "name": "Harmonic Connection", "description": "+1 Hope max when within Close range of a fellow Seraph." }
  { "name": "Bloodsinger", "description": "On a successful attack with Hope, deal +1d6 magical damage." }

Daggerheart mechanical terms to use: Melee / Very Close / Close / Far / Very Far; Hope, Stress, Fear; Mark a Stress, Mark an Armor Slot, Gain a Fear; conditions Vulnerable / Restrained / Frightened / Slowed; Reaction Roll (DC 10-18 depending on tier).

=== OUTPUT FORMAT ===
Return ONLY a raw JSON object. No markdown fences, no commentary.

{
  "name": "Evocative Item Name",
  "description": "2-3 sentence appearance and history paragraph.",
  "systemData": { /* type-appropriate fields from above */ }
}`;
}

function coerceFeatures(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(f => {
    if (typeof f === 'string') {
      const name = f.trim();
      if (!name) return null;
      // A bare string only carries meaning if it names a known feature — the
      // rules text then comes from the glossary. An invented name kept as a
      // string has nowhere to put its effect and shows as a chip that explains
      // nothing, so promote it to an object the editor can fill in.
      return getFeatureEntry(name) ? name : { name, description: '' };
    }
    if (f && typeof f === 'object') {
      return {
        name: String(f.name || '').trim(),
        description: String(f.description || '').trim()
      };
    }
    return null;
  }).filter(Boolean).filter(f => typeof f === 'string' || f.name);
}

function normalizeWeapon(sd = {}, tier = 1) {
  return {
    classification: sd.classification === 'secondary' ? 'secondary' : 'primary',
    damageType: sd.damageType === 'magical' ? 'magical' : 'physical',
    trait: sd.trait || 'strength',
    range: sd.range || 'melee',
    burden: sd.burden === 'two-handed' ? 'two-handed' : 'one-handed',
    damageTier1Dice: sd.damageTier1Dice || 'd8',
    damageTier1Modifier: Number(sd.damageTier1Modifier) || 0,
    damageTier2Dice: sd.damageTier2Dice || 'd8',
    damageTier2Modifier: Number(sd.damageTier2Modifier) || 3,
    damageTier3Dice: sd.damageTier3Dice || 'd8',
    damageTier3Modifier: Number(sd.damageTier3Modifier) || 6,
    damageTier4Dice: sd.damageTier4Dice || 'd8',
    damageTier4Modifier: Number(sd.damageTier4Modifier) || 9,
    tier: Number(sd.tier) || tier || 1,
    rarity: sd.rarity || '',
    features: coerceFeatures(sd.features)
  };
}

function normalizeArmor(sd = {}, tier = 1) {
  const score = Number(sd.armorScore) || 3;
  return {
    armorScore: score,
    armorSlots: Number(sd.armorSlots) || score,
    tier: Number(sd.tier) || tier || 1,
    rarity: sd.rarity || '',
    thresholds: {
      minor: Number(sd.thresholds?.minor) || 0,
      major: Number(sd.thresholds?.major) || 0
    },
    features: coerceFeatures(sd.features)
  };
}

function normalizeEquipment(sd = {}) {
  return {
    category: sd.category || 'utility',
    rarity: sd.rarity || '',
    activation: sd.activation || '',
    uses: sd.uses === undefined || sd.uses === null ? -1 : Number(sd.uses),
    hopeCost: Number(sd.hopeCost) || 0,
    stressCost: Number(sd.stressCost) || 0,
    mechanicalEffect: sd.mechanicalEffect || '',
    features: coerceFeatures(sd.features)
  };
}

export async function generateItem({ concept, type, tier = 1, rarity = '', apiKey, provider = 'anthropic', campaignContext = '' }) {
  if (!concept?.trim()) throw new Error('Please describe the item concept.');
  if (!['weapon', 'armor', 'equipment'].includes(type)) throw new Error('Invalid item type.');

  const raw = await aiService.generate(
    buildPrompt({ concept, type, tier, rarity, campaignContext }),
    apiKey,
    provider
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned an unexpected format. Please try again.');

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON. Please try again.');
  }

  const normalizers = {
    weapon: normalizeWeapon,
    armor: normalizeArmor,
    equipment: normalizeEquipment
  };

  const systemData = normalizers[type](parsed.systemData || {}, tier);

  return {
    name: parsed.name || 'Unnamed Item',
    type,
    description: parsed.description || '',
    hidden: false,
    systemData
  };
}
