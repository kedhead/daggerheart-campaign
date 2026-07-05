import { aiService } from './aiService';

const ROLE_DESCRIPTIONS = {
  minion: 'Weak and disposable. Always exactly 1 HP, NO damage thresholds (0/0), deals small FLAT damage. Must include a "Minion (X)" passive and a Group Attack action.',
  horde: 'Attacks simultaneously as one unit. HP 4-8. Must include a "Horde (XdY+Z)" passive: once half its HP is marked, its standard attack deals the reduced flat damage instead.',
  standard: 'The baseline adversary. HP 3-6.',
  bruiser: 'Tanky heavy hitter, slower and less tricky. HP 5-10, damage at the high end for its tier.',
  skulk: 'Evasive and cunning. HP 3-6, hit-and-run tactics, stealth, flanking.',
  ranged: 'Attacks from distance. Low HP (3-5). Prefers to stay at range.',
  support: 'Buffs allies or debuffs enemies. HP 3-6. Low direct damage. Enables other adversaries.',
  social: 'Narrative/dialogue adversary. HP 3-5, low combat stats, strong personality.',
  leader: 'Commands other adversaries. HP 6-9. Features that buff, summon, or spotlight allied adversaries.',
  solo: 'Designed to fight an entire party alone. HP 7-12 (NOT higher — durability comes from thresholds and Relentless). Has Relentless(X) and multiple powerful abilities.'
};

// Stat benchmarks derived from the 129 official SRD adversaries. HP is driven
// by ROLE; difficulty, attack, stress, thresholds, and damage scale with TIER.
// Threshold field names are legacy: `minor` = Major threshold, `major` = Severe.
export const TIER_BENCHMARKS = {
  1: { difficulty: [9, 14], attack: [-1, 3], stress: [2, 3], major: [5, 8], severe: [9, 15], damage: '1d6+2 to 1d12+3 (avg 5-10)', minionDamage: '1 to 3 flat (e.g. "2 phy")', minionGroup: '3-5' },
  2: { difficulty: [13, 16], attack: [1, 4], stress: [3, 4], major: [8, 13], severe: [17, 25], damage: '2d6+3 to 2d10+4 (avg 10-16)', minionDamage: '4 to 6 flat (e.g. "5 phy")', minionGroup: '6-7' },
  3: { difficulty: [15, 18], attack: [2, 5], stress: [4, 6], major: [15, 22], severe: [28, 40], damage: '3d6+3 to 3d10+5 (avg 13-22)', minionDamage: '7 to 9 flat (e.g. "8 phy")', minionGroup: '8-10' },
  4: { difficulty: [17, 21], attack: [5, 9], stress: [4, 8], major: [25, 37], severe: [45, 70], damage: '4d8+7 to 4d12+13 (avg 25-40)', minionDamage: '10 to 12 flat (e.g. "11 phy")', minionGroup: '12-13' },
};

const ROLE_HP = {
  minion: [1, 1], social: [3, 5], ranged: [3, 5], standard: [3, 6], skulk: [3, 6],
  support: [3, 6], horde: [4, 8], leader: [6, 9], bruiser: [5, 10], solo: [7, 12]
};

const mid = ([a, b]) => Math.round((a + b) / 2);

/** SRD-calibrated fallback stats when AI output is missing/invalid. */
export function fallbackAdversaryStats(tier, role) {
  const t = Math.min(4, Math.max(1, Number(tier) || 1));
  const b = TIER_BENCHMARKS[t];
  const isMinion = role === 'minion';
  return {
    difficulty: mid(b.difficulty),
    hp: isMinion ? 1 : mid(ROLE_HP[role] || ROLE_HP.standard),
    stress: b.stress[0],
    attack: Math.max(0, mid(b.attack)),
    attackDamage: isMinion
      ? `${[2, 5, 8, 11][t - 1]} phy`
      : ['1d8+2 phy', '2d8+3 phy', '3d8+4 phy', '4d10+9 phy'][t - 1],
    thresholds: isMinion
      ? { minor: 0, major: 0 }
      : { minor: mid(b.major), major: mid(b.severe) },
  };
}

function buildPrompt(concept, tier, role, templateContext, campaignContext) {
  const b = TIER_BENCHMARKS[Math.min(4, Math.max(1, Number(tier) || 1))];
  const hpRange = ROLE_HP[role] || ROLE_HP.standard;
  return `You are an expert Daggerheart TTRPG game master creating a mechanically accurate adversary statblock.

CONCEPT: ${concept}
TIER: ${tier} (1=novice threats, 2=seasoned, 3=formidable, 4=legendary/world-shaking)
ROLE: ${role} — ${ROLE_DESCRIPTIONS[role] || 'Standard adversary.'}

${campaignContext ? `=== CAMPAIGN CONTEXT ===\n${campaignContext}\n\nUse the campaign context to:\n- Name the adversary to fit the campaign's world and themes\n- Reference campaign locations, factions, or lore where appropriate\n- Avoid duplicating names of existing adversaries listed above\n- Match the tone and feel of the campaign\n=== END CAMPAIGN CONTEXT ===\n` : ''}${templateContext ? `TEMPLATE TO ADAPT (modify to fit the new concept while keeping role/tier appropriate stats):\n${templateContext}\n` : ''}

=== DAGGERHEART ADVERSARY RULES ===

STATS — calibrated to the official SRD adversaries for Tier ${tier}:
- difficulty: ${b.difficulty[0]}-${b.difficulty[1]} (median ${mid(b.difficulty)}). Bruiser/solo lean high, social/support lean low.
- hp: driven by ROLE, not tier. For a ${role}: ${hpRange[0] === hpRange[1] ? `exactly ${hpRange[0]}` : `${hpRange[0]}-${hpRange[1]}`}. Do NOT inflate HP at high tiers — durability comes from thresholds.
- stress: ${b.stress[0]}-${b.stress[1]} (leader/solo can go a bit higher)
- attack: modifier added to attack rolls: ${b.attack[0] >= 0 ? '+' : ''}${b.attack[0]} to +${b.attack[1]}. Bruiser/solo lean higher, minions lean lower.
- thresholds scale with TIER (they gate incoming PC damage), NOT with HP:
  - thresholds.minor: the MAJOR threshold (legacy field name) — damage below marks 1 HP, at or above marks 2 HP. Tier ${tier}: ${b.major[0]}-${b.major[1]}.
  - thresholds.major: the SEVERE threshold (legacy field name) — damage at or above marks 3 HP. Tier ${tier}: ${b.severe[0]}-${b.severe[1]}.
  ${role === 'minion' ? '- EXCEPTION: minions have NO thresholds — set both to 0. Any damage defeats a minion.' : ''}

ATTACK DAMAGE FORMAT: "XdY+Z type" — scale dice count with tier.
Tier ${tier} standard attack damage: ${role === 'minion' ? b.minionDamage + ' — minions always deal small FLAT damage, no dice' : b.damage}.
Examples: "1d8+3 phy" (T1), "2d8+4 mag" (T2), "3d8+3 phy" (T3), "4d10+10 phy" (T4)
Damage types: phy (physical), mag (magical), fire, ice, lightning, poison, psychic${role === 'minion' ? `

MINION REQUIREMENTS (Tier ${tier}):
- hp: 1, thresholds: 0/0, small flat damage (${b.minionDamage})
- MUST include feature "Minion (${b.minionGroup})" (passive): "The [name] is defeated when they take any damage. For every ${b.minionGroup} damage a PC deals, defeat an additional Minion within range."
- MUST include "Group Attack" (action): Spend a Fear to spotlight all [name]s within Close range of a target for one shared attack roll, combining their flat damage.` : ''}${role === 'horde' ? `

HORDE REQUIREMENTS:
- MUST include feature "Horde (XdY+Z)" (passive): "When the Horde has marked half or more of their HP, their standard attack deals XdY+Z damage instead." Use roughly half the standard attack's average.` : ''}

ATTACK RANGES: Melee, Very Close, Close, Far, Very Far

EXPERIENCE: Optional passive skill bonus the adversary has, e.g. "Tracking +3" or "Arcane Lore +2, Intimidation +3"

FEATURES — 2 to 4 features, mix of types:
- passive: Always active, no cost. Describe an ongoing effect.
- action: GM spends a spotlight. Powerful ones add "Mark a Stress" as a cost for extra effect.
- reaction: Triggered by a specific event (e.g., "When this adversary takes Major damage...")

Common Daggerheart feature patterns:
- Relentless(X): Solo/bruiser only. Can be spotlighted up to X times per GM turn (spend Fear as normal).
- Group Attack: Horde/minion. All enemies in an area must make a Reaction Roll.
- Mobile Strike: Skulk. Reposition after attacking, hard to pin down.
- Pack Tactics: Minion/horde. Bonus when attacking alongside allies.
- Command: Leader. Allied adversaries within range gain bonuses or extra actions.
- Aura: Passive ongoing area effect near the adversary.
- Counter/Retaliation: Reaction that punishes attackers.

DAGGERHEART MECHANICAL TERMS (use these exactly):
- Ranges: Melee / Very Close / Close / Far / Very Far
- Conditions: Vulnerable, Restrained, Frightened, Slowed
- "Mark a Stress" — adversary uses one of its stress slots for a powerful effect
- "Mark HP" — adversary loses a hit point
- "Gain a Fear" — the GM gains a Fear token (good for GM)
- "Give Hope" — a player gains a Hope token
- Dice damage: "deal 2d8+4 physical damage"
- Player saves: "must succeed on an Agility Reaction Roll (${tier === 1 ? 12 : tier === 2 ? 14 : tier === 3 ? 16 : 18}) or..."

OFFICIAL SRD EXAMPLES (for calibration — note how thresholds and damage scale with tier while HP stays role-sized):
T1: Bear (bruiser): DC 14, HP 7, stress 2, atk +1 "Claws" Melee "1d8+3 phy", thresh 9/17
T1: Archer Guard (ranged): DC 10, HP 3, stress 2, atk +1 "Longbow" Far "1d8+3 phy", thresh 4/8
T2: Minotaur Wrecker (bruiser): DC 16, HP 7, stress 5, atk +2 "Battleaxe" Very Close "2d8+5 phy", thresh 14/27
T2: Elite Soldier (standard): DC 15, HP 4, stress 3, atk +1 "Spear" Very Close "2d8+4 phy", thresh 9/18
T3: Oak Treant (bruiser): DC 17, HP 7, stress 4, atk +2 "Branch" Very Close "3d8+2 phy", thresh 22/40
T3: Demon of Avarice (support): DC 17, HP 6, stress 5, atk +2 "Hungry Maw" Melee "3d6+5 mag", thresh 15/29
T4: Kraken (solo): DC 20, HP 11, stress 8, atk +7 "Tentacles" Close "4d12+10 phy", thresh 35/70
T4: Arch-Necromancer (leader): DC 21, HP 9, stress 8, atk +6 "Necrotic Blast" Far "4d12+8 mag", thresh 33/66
T4: Hallowed Soldier (minion): DC 18, HP 1, stress 2, atk +2 "Sword and Shield" Melee "10 phy" (flat), thresh 0/0

Example feature shapes:
  • Relentless(3) (passive, solo/boss): Can be spotlighted up to 3 times per GM turn. Spend Fear as usual.
  • Overwhelming Force (passive): Targets who mark HP from the standard attack are knocked back to Very Close range.
  • Earth Eruption (action): Mark a Stress — creatures within Very Close must succeed on an Agility Reaction Roll or become Vulnerable.
  • Acid Bath (reaction): When this adversary takes Severe damage, creatures within Close range take 1d10 phy.

=== OUTPUT FORMAT ===
Return ONLY a raw JSON object. No markdown code blocks, no explanation, no commentary — just the JSON.

{
  "name": "Adversary Name",
  "tier": ${tier},
  "role": "${role}",
  "description": "One vivid sentence describing physical appearance and feel.",
  "motives": "Action verb phrase, action verb phrase, action verb phrase, action verb phrase",
  "difficulty": <number>,
  "hp": <number>,
  "stress": <number>,
  "attack": <number>,
  "attackName": "Weapon or attack name",
  "attackRange": "Melee",
  "attackDamage": "1d6+2 phy",
  "experience": "Optional Skill +X",
  "thresholds": { "minor": <number>, "major": <number> },
  "features": [
    { "name": "Feature Name", "type": "passive", "description": "Feature description using Daggerheart mechanical terms." },
    { "name": "Feature Name", "type": "action", "description": "Feature description." }
  ]
}`;
}

function buildBossPrompt(concept, tier, campaignContext) {
  return `You are an expert Daggerheart TTRPG game master creating a mechanically accurate BOSS statblock with multiple phases.

CONCEPT: ${concept}
TIER: ${tier} (1=novice threats, 2=seasoned, 3=formidable, 4=legendary/world-shaking)
ROLE: boss — The climactic threat of a session or arc. Very high HP. Multiple powerful features. Defines the encounter.

${campaignContext ? `=== CAMPAIGN CONTEXT ===\n${campaignContext}\n=== END CAMPAIGN CONTEXT ===\n` : ''}

=== DAGGERHEART BOSS RULES ===

STATS:
- difficulty: T1=14, T2=16, T3=18, T4=20
- hp: Boss HP = tier × 8-12. (T1:10-14, T2:16-22, T3:26-34, T4:36-48) — intentionally higher than SRD solos to fuel phase transitions.
- stress: 4-6 stress slots
- attack: Hits hard — T1:+2-3, T2:+3-5, T3:+5-7, T4:+6-9.
- attackDamage scales dice with tier: T1 "2d8+4", T2 "2d10+6", T3 "3d10+8", T4 "4d12+12"
- thresholds scale with TIER, not HP (they gate incoming PC damage). thresholds.minor = MAJOR threshold, thresholds.major = SEVERE threshold (legacy field names):
  T1: 8/15 | T2: 13/25 | T3: 22/40 | T4: 35/70

ATTACK DAMAGE FORMAT: "XdY+Z type" — e.g. "2d8+5 phy", "2d10+7 fire"

FEATURES: 4–5 base features. MUST include Relentless(3+) or Relentless(4).
Feature types: passive, action, reaction. Use Daggerheart mechanical terms.

PHASES: Generate exactly 2 phases, triggered at 66% and 33% HP remaining (descending order).
Each phase:
- Thematic name + one-sentence dramatic description
- 1–2 new abilities (same feature schema as base features)
- May override attackDamage in later phases for escalation (null = keep current)
- Do NOT include summons (GM will add those manually)
- replaceFeatures: false for phase 2, may be true for final phase if thematically appropriate
- healPercent: 0 unless the concept strongly implies it (e.g. a regenerator)

=== OUTPUT FORMAT ===
Return ONLY a raw JSON object. No markdown, no explanation.

{
  "name": "Boss Name",
  "tier": ${tier},
  "role": "boss",
  "description": "One vivid sentence describing appearance and feel.",
  "motives": "Action verb phrase, action verb phrase, action verb phrase",
  "difficulty": <number>,
  "hp": <number>,
  "stress": <number>,
  "attack": <number>,
  "attackName": "Attack name",
  "attackRange": "Melee",
  "attackDamage": "2d8+4 phy",
  "experience": "Optional Skill +X",
  "thresholds": { "minor": <number>, "major": <number> },
  "features": [
    { "name": "Relentless(3)", "type": "passive", "description": "Can be spotlighted up to 3 times per GM turn. Spend Fear as usual." },
    { "name": "Feature Name", "type": "action", "description": "..." }
  ],
  "phases": [
    {
      "id": "phase-2",
      "name": "Phase 2 Name",
      "description": "One-sentence dramatic flavor shown on transition.",
      "triggerPercent": 66,
      "attackName": null,
      "attackDamage": null,
      "attack": null,
      "newFeatures": [
        { "name": "New Ability", "type": "action", "description": "..." }
      ],
      "replaceFeatures": false,
      "summons": [],
      "healPercent": 0
    },
    {
      "id": "phase-3",
      "name": "Final Form Name",
      "description": "One-sentence dramatic flavor shown on transition.",
      "triggerPercent": 33,
      "attackName": null,
      "attackDamage": "2d10+6 phy",
      "attack": null,
      "newFeatures": [
        { "name": "Desperate Strike", "type": "action", "description": "..." }
      ],
      "replaceFeatures": false,
      "summons": [],
      "healPercent": 0
    }
  ]
}`;
}

export async function generateBossStatblock({
  concept,
  tier,
  apiKey,
  provider = 'anthropic',
  campaignContext = ''
}) {
  if (!concept?.trim()) throw new Error('Please describe the boss concept.');

  const raw = await aiService.generate(
    buildBossPrompt(concept, tier, campaignContext),
    apiKey,
    provider
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned an unexpected format. Please try again.');

  const parsed = JSON.parse(jsonMatch[0]);
  const hp = Number(parsed.hp) || (tier * 10);
  const t = Math.min(4, Math.max(1, Number(tier) || 1));
  const bossThr = { 1: [8, 15], 2: [13, 25], 3: [22, 40], 4: [35, 70] }[t];
  const bossDmg = ['2d8+4 phy', '2d10+6 phy', '3d10+8 phy', '4d12+12 phy'][t - 1];

  const cleanPhases = Array.isArray(parsed.phases)
    ? parsed.phases.map((ph, i) => ({
        id: ph.id || `phase-${i + 2}`,
        name: ph.name || `Phase ${i + 2}`,
        description: ph.description || '',
        triggerPercent: Number(ph.triggerPercent) || (i === 0 ? 66 : 33),
        attackName: ph.attackName || '',
        attackDamage: ph.attackDamage || '',
        attack: ph.attack ?? null,
        newFeatures: Array.isArray(ph.newFeatures)
          ? ph.newFeatures.map(f => ({
              name: f.name || '',
              type: ['passive', 'action', 'reaction'].includes(f.type) ? f.type : 'passive',
              description: f.description || ''
            }))
          : [],
        replaceFeatures: !!ph.replaceFeatures,
        summons: [],
        healPercent: Number(ph.healPercent) || 0
      }))
    : [];

  return {
    name: parsed.name || 'Unnamed Boss',
    tier: Number(parsed.tier) || tier,
    role: 'boss',
    isBoss: true,
    description: parsed.description || '',
    motives: parsed.motives || '',
    difficulty: Number(parsed.difficulty) || 14,
    hp,
    stress: Number(parsed.stress) || 4,
    attack: Number(parsed.attack) || 2,
    attackName: parsed.attackName || '',
    attackRange: parsed.attackRange || 'Melee',
    attackDamage: parsed.attackDamage || bossDmg,
    experience: parsed.experience || '',
    thresholds: {
      minor: Number(parsed.thresholds?.minor) || bossThr[0],
      major: Number(parsed.thresholds?.major) || bossThr[1]
    },
    features: Array.isArray(parsed.features)
      ? parsed.features.map(f => ({
          name: f.name || '',
          type: ['passive', 'action', 'reaction'].includes(f.type) ? f.type : 'passive',
          description: f.description || ''
        }))
      : [],
    phases: cleanPhases,
    hidden: false
  };
}

export async function generateAdversaryStatblock({
  concept,
  tier,
  role,
  apiKey,
  provider = 'anthropic',
  templateAdversary = null,
  campaignContext = ''
}) {
  if (!concept?.trim()) throw new Error('Please describe the adversary concept.');

  const templateContext = templateAdversary
    ? JSON.stringify({
        name: templateAdversary.name,
        difficulty: templateAdversary.difficulty,
        hp: templateAdversary.hp,
        stress: templateAdversary.stress,
        attack: templateAdversary.attack,
        attackName: templateAdversary.attackName,
        attackRange: templateAdversary.attackRange,
        attackDamage: templateAdversary.attackDamage,
        experience: templateAdversary.experience,
        thresholds: templateAdversary.thresholds,
        features: templateAdversary.features
      }, null, 2)
    : '';

  const raw = await aiService.generate(
    buildPrompt(concept, tier, role, templateContext, campaignContext),
    apiKey,
    provider
  );

  // Strip markdown code fences if AI wrapped response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned an unexpected format. Please try again.');

  const parsed = JSON.parse(jsonMatch[0]);

  const finalRole = parsed.role || role;
  const fb = fallbackAdversaryStats(tier, finalRole);
  const isMinion = finalRole === 'minion';
  const numOr = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : d);

  const hp = isMinion ? 1 : (Number(parsed.hp) || fb.hp);

  return {
    name: parsed.name || 'Unnamed Adversary',
    tier: Number(parsed.tier) || tier,
    role: finalRole,
    description: parsed.description || '',
    motives: parsed.motives || '',
    difficulty: Number(parsed.difficulty) || fb.difficulty,
    hp,
    stress: Number(parsed.stress) || fb.stress,
    attack: numOr(parsed.attack, fb.attack),
    attackName: parsed.attackName || '',
    attackRange: parsed.attackRange || 'Melee',
    attackDamage: parsed.attackDamage || fb.attackDamage,
    experience: parsed.experience || '',
    // Minions have no thresholds per the SRD — any damage defeats them.
    thresholds: isMinion
      ? { minor: 0, major: 0 }
      : {
          minor: Number(parsed.thresholds?.minor) || fb.thresholds.minor,
          major: Number(parsed.thresholds?.major) || fb.thresholds.major
        },
    features: Array.isArray(parsed.features)
      ? parsed.features.map(f => ({
          name: f.name || '',
          type: ['passive', 'action', 'reaction'].includes(f.type) ? f.type : 'passive',
          description: f.description || ''
        }))
      : []
  };
}
