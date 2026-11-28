// Building and changing the adversaries in a live fight. Pure, so the smoke
// tests cover it; hooks/useActiveEncounter.js does the saving.

/** One adversary as a fight participant. `name` is the name shown ("Goblin 2"). */
export function participantFor(adversary, { id, name, defaultHp = 10, defaultStress = 3 } = {}) {
  const hp = adversary.hp || defaultHp;
  const stress = adversary.stress || defaultStress;
  const participant = {
    id,
    type: 'adversary',
    sourceId: adversary.id,
    name: name || adversary.name,
    currentHP: hp,
    maxHP: hp,
    currentStress: 0,
    maxStress: stress,
    conditions: [],
    isDefeated: false,
    thresholds: {
      // Legacy field names: `minor` holds the Major threshold, `major` holds
      // Severe. Damage below Major marks 1 HP, Major–Severe marks 2 HP,
      // Severe or higher marks 3 HP.
      minor: adversary.thresholds?.minor || Math.ceil(hp * 1.3),
      major: adversary.thresholds?.major || Math.ceil(hp * 2.5)
    },
    features: adversary.features || [],
    role: adversary.role || 'standard',
    tier: adversary.tier || 1
  };
  // Only add optional fields if they have values (Firestore refuses undefined).
  if (adversary.difficulty !== undefined) participant.difficulty = adversary.difficulty;
  if (adversary.evasion !== undefined) participant.evasion = adversary.evasion;
  if (adversary.attack !== undefined) participant.attack = adversary.attack;
  if (adversary.attackDamage !== undefined) participant.damage = adversary.attackDamage;
  if (adversary.attackName !== undefined) participant.attackName = adversary.attackName;
  if (adversary.attackRange !== undefined) participant.attackRange = adversary.attackRange;
  if (adversary.description !== undefined) participant.description = adversary.description;
  if (adversary.motives !== undefined) participant.motives = adversary.motives;
  if (adversary.isBoss) {
    participant.isBoss = true;
    participant.bossPhases = JSON.parse(JSON.stringify(adversary.phases || []));
    participant.triggeredPhaseIds = [];
    participant.currentPhaseName = null;
    participant.currentFeatures = [...(adversary.features || [])];
  }
  return participant;
}

/**
 * Stress marked on an adversary. One that would mark Stress with none left
 * marks HP instead, so anything past full spills into HP.
 */
export function adversaryMarkStress({ currentStress = 0, maxStress = 0, currentHP = 0 }, amount) {
  const room = Math.max(0, maxStress - currentStress);
  const stress = Math.min(amount, room);
  const spill = Math.max(0, amount - room);
  const hp = Math.max(0, currentHP - spill);
  return { currentStress: currentStress + stress, currentHP: hp, spilled: spill, defeated: spill > 0 && hp <= 0 };
}
