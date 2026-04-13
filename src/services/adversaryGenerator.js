import { aiService } from './aiService';

const ROLE_DESCRIPTIONS = {
  minion: 'Weak and disposable. Low HP (tier×1-2). Dangerous only in groups. Simple abilities.',
  horde: 'Attacks simultaneously as one unit. Very low individual HP, overwhelming in numbers. Group mechanics.',
  standard: 'The baseline adversary. Balanced HP (tier×2-3) and stats.',
  bruiser: 'High HP (tier×3-5) and damage output, slower and less tricky. Hits hard.',
  skulk: 'Evasive and cunning. Lower HP but hit-and-run tactics, stealth, flanking.',
  ranged: 'Attacks from distance. Moderate HP (tier×2-3). Prefers to stay at range.',
  support: 'Buffs allies or debuffs enemies. Low direct damage. Enables other adversaries.',
  social: 'Narrative/dialogue adversary. Low combat stats, strong personality.',
  leader: 'Commands other adversaries. HP tier×3-4. Features that buff allied adversaries.',
  solo: 'Designed to fight an entire party alone. Very high HP (tier×5-8). Has Relentless(X) and multiple powerful abilities.'
};

function buildPrompt(concept, tier, role, templateContext, campaignContext) {
  return `You are an expert Daggerheart TTRPG game master creating a mechanically accurate adversary statblock.

CONCEPT: ${concept}
TIER: ${tier} (1=novice threats, 2=seasoned, 3=formidable, 4=legendary/world-shaking)
ROLE: ${role} — ${ROLE_DESCRIPTIONS[role] || 'Standard adversary.'}

${campaignContext ? `=== CAMPAIGN CONTEXT ===\n${campaignContext}\n\nUse the campaign context to:\n- Name the adversary to fit the campaign's world and themes\n- Reference campaign locations, factions, or lore where appropriate\n- Avoid duplicating names of existing adversaries listed above\n- Match the tone and feel of the campaign\n=== END CAMPAIGN CONTEXT ===\n` : ''}${templateContext ? `TEMPLATE TO ADAPT (modify to fit the new concept while keeping role/tier appropriate stats):\n${templateContext}\n` : ''}

=== DAGGERHEART ADVERSARY RULES ===

STATS:
- difficulty: The DC players must beat on reaction rolls (T1: 10-14, T2: 12-16, T3: 14-18, T4: 16-20). Bruiser/solo lean higher within range.
- hp: Hit points. minion/horde: tier×1-2 | standard/ranged/skulk: tier×2-3 | bruiser/leader: tier×3-5 | solo: tier×5-8
- stress: Stress slots the GM spends for special actions (most roles: 2-3, leader/solo: 3-5)
- attack: The modifier added to attack rolls (T1: +1-2, T2: +2-3, T3: +3-5, T4: +4-6). Bruiser/solo lean higher.
- thresholds.minor: Minor damage threshold — damage below this does 1 HP. Roughly HP × 1.3 (rounded up).
- thresholds.major: Major damage threshold — damage above this does 3 HP. Roughly HP × 2.5 (rounded up).

ATTACK DAMAGE FORMAT: "XdY+Z type"
Examples: "1d8+3 phy", "2d6+4 mag", "1d10+5 fire", "2d8+6 phy"
Damage types: phy (physical), mag (magical), fire, ice, lightning, poison, psychic

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

OFFICIAL SRD EXAMPLES (for calibration):
Bear (T1 bruiser): DC 14, HP 7, stress 2, atk +1 "Claws" Melee "1d8+3 phy", thresh 9/17, exp "Ambusher +3, Keen Senses +2"
  • Overwhelming Force (passive): Targets who mark HP from the standard attack are knocked back to Very Close range.
  • Bite (action): Mark a Stress — deal 3d4+10 physical damage + target is Restrained.
  • Momentum (reaction): When the Bear makes a successful attack, gain a Fear.

Archer Guard (T1 ranged): DC 10, HP 3, stress 2, atk +1 "Longbow" Far "1d8+3 phy", thresh 4/8, exp "Local Knowledge +3"
  • Hobbling Shot (action): Mark a Stress — deal 1d12+3 physical damage, target has disadvantage on Agility until they clear HP.

Acid Burrower (T1 solo): DC 14, HP 8, stress 3, thresh 8/15, exp "Tremor Sense +2"
  • Relentless(3) (passive): Can be spotlighted up to 3 times per GM turn. Spend Fear as usual.
  • Earth Eruption (action): Mark a Stress — creatures within Very Close must succeed on Agility Reaction Roll or become Vulnerable.
  • Spit Acid (action): Attack all targets in Close range — targets marked take 2d6 phy and must mark an Armor Slot.
  • Acid Bath (reaction): When the Burrower takes Severe damage, creatures within Close take 1d10 phy.

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

  const hp = Number(parsed.hp) || (tier * 2);

  return {
    name: parsed.name || 'Unnamed Adversary',
    tier: Number(parsed.tier) || tier,
    role: parsed.role || role,
    description: parsed.description || '',
    motives: parsed.motives || '',
    difficulty: Number(parsed.difficulty) || 12,
    hp,
    stress: Number(parsed.stress) || 2,
    attack: Number(parsed.attack) || 1,
    attackName: parsed.attackName || '',
    attackRange: parsed.attackRange || 'Melee',
    attackDamage: parsed.attackDamage || `1d${tier <= 1 ? 6 : tier === 2 ? 8 : 10}+${tier + 1} phy`,
    experience: parsed.experience || '',
    thresholds: {
      minor: Number(parsed.thresholds?.minor) || Math.ceil(hp * 1.3),
      major: Number(parsed.thresholds?.major) || Math.ceil(hp * 2.5)
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
