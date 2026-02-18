// Daggerheart Ranger Companion Data — Official Rulebook Data

export const COMPANION_DEFAULTS = {
  evasion: 10,
  damageDie: 'd6',
  range: 'Melee',
  stressSlots: 6,
};

export const COMPANION_UPGRADES = [
  { id: 'intelligent', name: 'Intelligent', description: 'Your companion gains a permanent +1 bonus to a Companion Experience of your choice.', repeatable: true },
  { id: 'lightInTheDark', name: 'Light in the Dark', description: 'Use this as an additional Hope slot your character can mark.', repeatable: false },
  { id: 'creatureComfort', name: 'Creature Comfort', description: 'Once per rest, when you take time during a quiet moment to give your companion love and attention, you can gain a Hope or you can both clear a Stress.', repeatable: false },
  { id: 'armored', name: 'Armored', description: 'When your companion takes damage, you can mark one of your Armor Slots instead of marking one of their Stress.', repeatable: false },
  { id: 'vicious', name: 'Vicious', description: 'Increase your companion\'s damage dice or range by one step (d6 to d8, Close to Far, etc.).', repeatable: true },
  { id: 'resilient', name: 'Resilient', description: 'Your companion gains an additional Stress slot.', repeatable: true },
  { id: 'bonded', name: 'Bonded', description: 'When you mark your last Hit Point, your companion rushes to your side. Roll a number of d6s equal to their unmarked Stress slots and mark them. If any roll a 6, clear your last Hit Point and return to the scene.', repeatable: false },
  { id: 'aware', name: 'Aware', description: 'Your companion gains a permanent +2 bonus to their Evasion.', repeatable: true },
];

export const EXAMPLE_COMPANION_EXPERIENCES = [
  'Bold Distraction',
  'Expert Climber',
  'Fetch',
  'Friendly',
  'Guardian of the Forest',
  'Horrifying',
  'Intimidating',
  'Loyal Until the End',
  'Navigation',
  'Nimble',
  'Nobody Left Behind',
  'On High Alert',
  'Protective',
  'Royal Companion',
  'Scout',
  'Service Animal',
  'Trusted Mount',
  'Vigilant',
  'We Always Find Them',
  'You Can\'t Hit What You Can\'t Find'
];

export const DAMAGE_DIE_PROGRESSION = ['d6', 'd8', 'd10', 'd12'];
export const RANGE_PROGRESSION = ['Melee', 'Very Close', 'Close', 'Far', 'Very Far'];

export const getNextDamageDie = (current) => {
  const idx = DAMAGE_DIE_PROGRESSION.indexOf(current);
  if (idx < 0 || idx >= DAMAGE_DIE_PROGRESSION.length - 1) return current;
  return DAMAGE_DIE_PROGRESSION[idx + 1];
};

export const getNextRange = (current) => {
  const idx = RANGE_PROGRESSION.indexOf(current);
  if (idx < 0 || idx >= RANGE_PROGRESSION.length - 1) return current;
  return RANGE_PROGRESSION[idx + 1];
};
