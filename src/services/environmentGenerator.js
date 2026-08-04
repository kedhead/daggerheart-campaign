import { aiService } from './aiService';
import { sanitizeDaggerheartText } from './adversaryGenerator';
import { calculateBPBudget, calculateUsedBP, getSlotBPCost } from '../components/Encounters/BPCalculator';
import {
  DAGGERHEART_ENVIRONMENTS,
  ENVIRONMENT_TYPES,
  ENVIRONMENT_FEATURE_TYPES,
} from '../data/daggerheartEnvironments';

/**
 * Environment generator.
 *
 * Mirrors adversaryGenerator: benchmarks measured from the official SRD content
 * shipped in this repo rather than invented, the same D&D-ism sanitizer applied
 * to every generated description, and a deterministic fallback whenever the
 * model returns something unusable.
 */

const TYPE_DESCRIPTIONS = {
  exploration: 'A place the party investigates and moves through. Features reward curiosity and reveal history or secrets.',
  social: 'A place defined by the people in it. Features are about influence, reputation and consequence rather than damage.',
  combat: 'A place built to fight in. Features shape the battlefield — cover, elevation, moving hazards.',
  traversal: 'A place that resists being crossed. Features obstruct movement and punish carelessness.',
  event: 'Not a place but a situation — an ambush, a collapse, a ritual. Difficulty may scale to the adversaries present rather than being fixed.',
};

// Measured from the 47 official environments in daggerheartEnvironments.js.
// Difficulty is the environment's target number; features/impulses counts are
// the observed range, with the SRD average noted for calibration.
export const ENVIRONMENT_TIER_BENCHMARKS = {
  1: { difficulty: [10, 11] },
  2: { difficulty: [10, 14] },
  3: { difficulty: [16, 17] },
  4: { difficulty: [20, 21] },
};

export const SRD_FEATURE_AVG = 4;   // observed 2-5, avg 3.8
export const SRD_IMPULSE_AVG = 3;   // observed 2-6, avg 3.3

const mid = ([a, b]) => Math.round((a + b) / 2);
const clampTier = (t) => Math.min(4, Math.max(1, Number(t) || 1));

/** SRD-calibrated fallback when AI output is missing or invalid. */
export function fallbackEnvironmentStats(tier, type) {
  const t = clampTier(tier);
  // Event environments legitimately carry difficulty 0 — theirs scales to
  // whichever adversaries turn up, and two official tier 1 entries do exactly
  // this. Coercing them to a number would be wrong, not safe.
  return {
    difficulty: type === 'event' ? 0 : mid(ENVIRONMENT_TIER_BENCHMARKS[t].difficulty),
    tier: t,
    type: ENVIRONMENT_TYPES.includes(type) ? type : 'exploration',
  };
}

/** Normalise one generated feature, rejecting invented types. */
function cleanFeature(feature) {
  const type = ENVIRONMENT_FEATURE_TYPES.includes(feature?.type) ? feature.type : 'passive';
  const cleaned = {
    name: feature?.name || '',
    type,
    description: sanitizeDaggerheartText(feature?.description || ''),
  };
  // Only action features normally carry a Fear cost — 12 of 180 SRD features
  // have one — so an empty cost is dropped rather than stored as ''.
  const cost = typeof feature?.cost === 'string' ? feature.cost.trim() : '';
  if (cost) cleaned.cost = cost;
  return cleaned;
}

/** A couple of real SRD environments at this tier, as few-shot calibration. */
function srdExamplesFor(tier, type) {
  const t = clampTier(tier);
  const pool = DAGGERHEART_ENVIRONMENTS.filter(e => e.tier === t);
  const sameType = pool.filter(e => e.type === type);
  const picked = [...sameType.slice(0, 1), ...pool.filter(e => e.type !== type).slice(0, 1)]
    .filter(Boolean)
    .slice(0, 2);

  return picked.map(e => JSON.stringify({
    name: e.name,
    tier: e.tier,
    type: e.type,
    difficulty: e.difficulty,
    description: e.description,
    impulses: e.impulses,
    features: e.features,
    potentialAdversaries: e.potentialAdversaries,
  }, null, 2)).join('\n\n');
}

function buildPrompt(concept, tier, type, templateContext, campaignContext, adversaryNames) {
  const t = clampTier(tier);
  const b = ENVIRONMENT_TIER_BENCHMARKS[t];

  return `You are an expert Daggerheart TTRPG game master creating a mechanically accurate ENVIRONMENT.

CONCEPT: ${concept}
TIER: ${t} (1=novice threats, 2=seasoned, 3=formidable, 4=legendary/world-shaking)
TYPE: ${type} — ${TYPE_DESCRIPTIONS[type] || TYPE_DESCRIPTIONS.exploration}

${campaignContext ? `=== CAMPAIGN CONTEXT ===\n${campaignContext}\n\nUse the campaign context to:\n- Name the environment to fit the campaign's world and themes\n- Reference campaign locations, factions, or lore where appropriate\n- Avoid duplicating names of environments the campaign already has\n- Match the tone and feel of the campaign\n=== END CAMPAIGN CONTEXT ===\n` : ''}${templateContext ? `TEMPLATE TO ADAPT (reskin to fit the new concept, keeping the tier-appropriate difficulty and a similar shape of features):\n${templateContext}\n` : ''}
=== DAGGERHEART ENVIRONMENT RULES ===

An environment is a place or situation the GM runs like an adversary: it has a
difficulty, impulses that tell the GM how to play it, and features the GM
spends the spotlight and Fear on. It is NOT a stat block for a creature — it
has no HP, no stress, no attack, and no damage thresholds.

DIFFICULTY — calibrated to the official SRD environments for Tier ${t}:
- difficulty: ${b.difficulty[0]}-${b.difficulty[1]}${type === 'event' ? '\n- EXCEPTION: this is an EVENT. If its difficulty should scale to whichever adversaries are present rather than being fixed, set difficulty to 0.' : ''}

IMPULSES — ${SRD_IMPULSE_AVG} or so short verb phrases telling the GM what this place *wants*.
Examples: "Draw in the curious", "Echo historical events", "Overwhelm", "Scatter", "Surround".
Write them as terse imperatives, not sentences.

FEATURES — ${SRD_FEATURE_AVG} or so, mixing these types:
- passive: always active, no cost. An ongoing truth about the place.
- action: the GM spends the spotlight. Powerful ones cost Fear — set "cost": "1 Fear".
- reaction: triggered by something the players do. Very common in official content.
- hazard: environmental damage or a condition the place inflicts.
- countdown: a clock that advances toward something bad.
- encounter: adversaries arriving, described as a group that scales to party size.

POTENTIAL ADVERSARIES — ${adversaryNames?.length
    ? `choose 2 to 5 from the campaign's existing adversaries, by exact name:\n${adversaryNames.map(n => `  - ${n}`).join('\n')}`
    : 'suggest 2 to 5 adversary names that would fit this place.'}

DAGGERHEART MECHANICAL TERMS (use these exactly):
- Ranges: Melee / Very Close / Close / Far / Very Far
- Conditions: Vulnerable, Restrained, Frightened, Slowed
- "Mark a Stress", "Mark HP", "Gain a Fear", "Give Hope"
- The SIX character traits are ONLY: Agility, Strength, Finesse, Instinct, Presence, Knowledge. There is NO Spirit, Constitution, Dexterity, Wisdom, Charisma, Intelligence, Wits, or Willpower in Daggerheart.
- Players never make "saves", "saving throws", "ability checks", or roll against a "DC". When a feature forces a player to resist, they make a **Reaction Roll** using ONE of the six traits, phrased exactly like: "must succeed on a <Trait> Reaction Roll (${b.difficulty[1]}) or ...". Pick the trait that fits (dodge → Agility; endure force → Strength; steady nerves/perceive → Instinct; resist fear/charm → Presence; recall/see through illusion → Knowledge; precise movement → Finesse).
- NEVER invent stats, traits, or dice mechanics that aren't listed here.

OFFICIAL SRD EXAMPLES (for calibration — match this voice and level of mechanical detail):
${srdExamplesFor(t, type)}

=== OUTPUT FORMAT ===
Return ONLY a raw JSON object. No markdown code blocks, no explanation, no commentary — just the JSON.

{
  "name": "Environment Name",
  "tier": ${t},
  "type": "${type}",
  "difficulty": <number>,
  "description": "One or two vivid sentences describing the place and what makes it dangerous or interesting.",
  "impulses": ["Terse verb phrase", "Terse verb phrase", "Terse verb phrase"],
  "features": [
    { "name": "Feature Name", "type": "passive", "description": "What is always true here." },
    { "name": "Feature Name", "type": "action", "cost": "1 Fear", "description": "What the GM can spend the spotlight on." },
    { "name": "Feature Name", "type": "reaction", "description": "Triggered when the players do something specific." }
  ],
  "potentialAdversaries": ["Adversary Name", "Adversary Name"]
}`;
}

/**
 * Generate a full environment from a concept.
 *
 * @returns {Promise<Object>} an environment matching EnvironmentForm's shape
 */
export async function generateEnvironment({
  concept,
  tier = 1,
  type = 'exploration',
  apiKey,
  provider = 'anthropic',
  templateEnvironment = null,
  campaignContext = '',
  campaignAdversaries = [],
}) {
  if (!concept?.trim()) throw new Error('Please describe the environment concept.');

  const templateContext = templateEnvironment
    ? JSON.stringify({
        name: templateEnvironment.name,
        tier: templateEnvironment.tier,
        type: templateEnvironment.type,
        difficulty: templateEnvironment.difficulty,
        description: templateEnvironment.description,
        impulses: templateEnvironment.impulses,
        features: templateEnvironment.features,
        potentialAdversaries: templateEnvironment.potentialAdversaries,
      }, null, 2)
    : '';

  const adversaryNames = campaignAdversaries.map(a => a?.name).filter(Boolean).slice(0, 40);

  const raw = await aiService.generate(
    buildPrompt(concept, tier, type, templateContext, campaignContext, adversaryNames),
    apiKey,
    provider
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned an unexpected format. Please try again.');
  const parsed = JSON.parse(jsonMatch[0]);

  return normalizeGeneratedEnvironment(parsed, { tier, type });
}

/**
 * Coerce raw model output into a valid environment. Exported so it can be
 * tested without an API key — the parsing and validation is where the bugs
 * live, not in the network call.
 */
export function normalizeGeneratedEnvironment(parsed, { tier = 1, type = 'exploration' } = {}) {
  const finalType = ENVIRONMENT_TYPES.includes(parsed?.type) ? parsed.type : type;
  const fb = fallbackEnvironmentStats(tier, finalType);

  // `difficulty: 0` is meaningful for events, so a plain `|| fallback` would
  // silently overwrite a correct answer. Only fall back on genuinely absent or
  // non-numeric values.
  const rawDifficulty = Number(parsed?.difficulty);
  const difficulty = Number.isFinite(rawDifficulty) && rawDifficulty >= 0
    ? rawDifficulty
    : fb.difficulty;

  return {
    name: parsed?.name || 'Unnamed Environment',
    tier: clampTier(parsed?.tier || tier),
    type: finalType,
    difficulty,
    description: sanitizeDaggerheartText(parsed?.description || ''),
    impulses: Array.isArray(parsed?.impulses)
      ? parsed.impulses.filter(i => typeof i === 'string' && i.trim()).map(i => i.trim())
      : [],
    features: Array.isArray(parsed?.features) ? parsed.features.map(cleanFeature) : [],
    potentialAdversaries: Array.isArray(parsed?.potentialAdversaries)
      ? parsed.potentialAdversaries.filter(a => typeof a === 'string' && a.trim()).map(a => a.trim())
      : [],
    hidden: false,
    isOfficial: false,
  };
}

// ── Environment encounters ───────────────────────────────────────────────────

/**
 * Turn adversary NAMES chosen by the model into real `adversarySlots`.
 *
 * The model is never asked for an `adversaryId` — it cannot know them, and a
 * hallucinated id would save as a dangling reference that the encounter tracker
 * would silently skip. It picks by name; the mapping happens here, and anything
 * that does not match a real campaign adversary is dropped.
 *
 * @returns {Object} { slots, unmatched }
 */
export function resolveAdversarySlots(proposed, adversaries) {
  const byName = new Map();
  (adversaries || []).forEach(a => {
    if (a?.name) byName.set(a.name.trim().toLowerCase(), a);
  });

  const slots = [];
  const unmatched = [];

  (Array.isArray(proposed) ? proposed : []).forEach(entry => {
    const name = (typeof entry === 'string' ? entry : entry?.name || '').trim();
    if (!name) return;

    const match = byName.get(name.toLowerCase());
    if (!match) {
      unmatched.push(name);
      return;
    }

    const quantity = Math.max(1, Math.round(Number(entry?.quantity) || 1));
    const existing = slots.find(s => s.adversaryId === match.id);
    if (existing) existing.quantity += quantity;
    else slots.push({ adversaryId: match.id, quantity });
  });

  return { slots, unmatched };
}

/**
 * Trim a roster until it fits the Battle Points budget.
 *
 * The budget is computed here with the same functions the encounter builder
 * uses, never taken from the model. Language models are not reliable at
 * arithmetic and the formula is one import away, so asking for a costed roster
 * and believing the total would be a choice to be wrong occasionally for no
 * benefit. Most expensive slots are reduced first, so a trimmed encounter keeps
 * its variety rather than collapsing to one adversary type.
 *
 * @returns {Object} { slots, usedBP, budget, trimmed }
 */
export function fitRosterToBudget(slots, adversaries, partySize, adjustment = 0) {
  const budget = calculateBPBudget(partySize) + (Number(adjustment) || 0);
  const working = (slots || []).map(s => ({ ...s }));
  let trimmed = 0;

  const roleOf = (id) => (adversaries || []).find(a => a.id === id)?.role || 'standard';

  // Guarded rather than `while (true)`: every pass removes at least one unit,
  // so it terminates, but a bad input should degrade to an empty roster instead
  // of hanging the UI.
  for (let guard = 0; guard < 200; guard++) {
    const used = calculateUsedBP(working, adversaries, partySize);
    if (used <= budget) break;

    let worstIndex = -1;
    let worstCost = -Infinity;
    working.forEach((slot, i) => {
      if (slot.quantity <= 0) return;
      const cost = getSlotBPCost(roleOf(slot.adversaryId), slot.quantity, partySize);
      if (cost > worstCost) { worstCost = cost; worstIndex = i; }
    });

    if (worstIndex === -1) break;
    working[worstIndex].quantity -= 1;
    trimmed += 1;
    if (working[worstIndex].quantity <= 0) working.splice(worstIndex, 1);
  }

  return {
    slots: working,
    usedBP: calculateUsedBP(working, adversaries, partySize),
    budget,
    trimmed,
  };
}

function buildEncounterPrompt(environment, adversaries, partySize, budget, campaignContext) {
  const roster = adversaries
    .map(a => `  - ${a.name} (role: ${a.role || 'standard'}, tier ${a.tier || 1})`)
    .join('\n');

  return `You are an expert Daggerheart TTRPG game master building a combat encounter set in a specific environment.

=== THE ENVIRONMENT ===
${JSON.stringify({
    name: environment.name,
    tier: environment.tier,
    type: environment.type,
    difficulty: environment.difficulty,
    description: environment.description,
    impulses: environment.impulses,
    features: environment.features,
  }, null, 2)}

${campaignContext ? `=== CAMPAIGN CONTEXT ===\n${campaignContext}\n=== END CAMPAIGN CONTEXT ===\n` : ''}
=== AVAILABLE ADVERSARIES ===
Choose ONLY from this list, by exact name. Do not invent adversaries.
${roster}

=== BATTLE POINTS ===
The party has ${partySize} PCs, giving a budget of ${budget} Battle Points.
Costs: 1 BP per Social or Support, 1 BP per group of Minions equal to party size,
2 BP per Horde/Ranged/Skulk/Standard, 3 BP per Leader, 4 BP per Bruiser, 5 BP per Solo.
Aim to spend close to the budget without exceeding it. Prefer a mix of roles over
several copies of one adversary.

=== OUTPUT FORMAT ===
Return ONLY a raw JSON object. No markdown, no commentary.

{
  "name": "Encounter name that fits the environment",
  "description": "Two or three sentences setting the scene and the stakes.",
  "tactics": "How the adversaries fight here, referencing the environment's features.",
  "rewards": "What the party gains — loot, information, or a change in the situation.",
  "adversaries": [
    { "name": "Exact Adversary Name", "quantity": 2 }
  ]
}`;
}

/**
 * Build a runnable encounter set in a generated environment.
 *
 * The returned object matches what EncounterBuilder stores, so it can be opened
 * for review rather than saved blind.
 */
export async function generateEnvironmentEncounter({
  environment,
  adversaries = [],
  partySize = 4,
  apiKey,
  provider = 'anthropic',
  campaignContext = '',
}) {
  if (!environment?.name) throw new Error('Generate or select an environment first.');

  const budget = calculateBPBudget(partySize);

  // No adversaries to choose from means no roster is possible. Say so with the
  // environment's own suggestions rather than returning a silently empty
  // encounter that looks like a generation failure.
  if (!adversaries.length) {
    return {
      name: `${environment.name}`,
      description: environment.description || '',
      tactics: '',
      rewards: '',
      environmentId: environment.id || '',
      adversarySlots: [],
      partySize,
      calculatedBP: budget,
      usedBP: 0,
      suggestedAdversaries: environment.potentialAdversaries || [],
      unmatched: [],
    };
  }

  const raw = await aiService.generate(
    buildEncounterPrompt(environment, adversaries, partySize, budget, campaignContext),
    apiKey,
    provider
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned an unexpected format. Please try again.');
  const parsed = JSON.parse(jsonMatch[0]);

  const { slots, unmatched } = resolveAdversarySlots(parsed.adversaries, adversaries);
  const fitted = fitRosterToBudget(slots, adversaries, partySize);

  return {
    name: parsed.name || `${environment.name} Encounter`,
    description: sanitizeDaggerheartText(parsed.description || ''),
    tactics: sanitizeDaggerheartText(parsed.tactics || ''),
    rewards: parsed.rewards || '',
    environmentId: environment.id || '',
    adversarySlots: fitted.slots,
    partySize,
    calculatedBP: fitted.budget,
    usedBP: fitted.usedBP,
    bpAdjustments: { easier: false, harder: false, damageBoost: false, lowerTier: 0 },
    hidden: false,
    // Surfaced so the UI can tell the user what the model asked for that the
    // campaign does not have, instead of dropping it in silence.
    unmatched,
    suggestedAdversaries: environment.potentialAdversaries || [],
  };
}
