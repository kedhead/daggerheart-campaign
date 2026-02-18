// Daggerheart Beastform Options — Official Rulebook Data
// All beastform stat blocks organized by tier for the Druid class

export const BEASTFORMS = [
  // ===== TIER 1 =====
  {
    name: 'Agile Scout',
    tier: 1,
    examples: 'Fox, Mouse, Weasel',
    trait: 'agility',
    traitBonus: 1,
    evasionBonus: 2,
    range: 'Melee',
    damageDie: 'd4',
    damageType: 'phy',
    advantages: ['deceive', 'locate', 'sneak'],
    features: [
      { name: 'Agile', description: 'Your movement is silent, and you can spend a Hope to move up to Far range without rolling.' },
      { name: 'Fragile', description: 'When you take Major or greater damage, you drop out of Beastform.' }
    ]
  },
  {
    name: 'Household Friend',
    tier: 1,
    examples: 'Cat, Dog, Rabbit',
    trait: 'instinct',
    traitBonus: 1,
    evasionBonus: 2,
    range: 'Melee',
    damageDie: 'd6',
    damageType: 'phy',
    advantages: ['climb', 'locate', 'protect'],
    features: [
      { name: 'Companion', description: 'When you Help an Ally, you can roll a d8 as your advantage die.' },
      { name: 'Fragile', description: 'When you take Major or greater damage, you drop out of Beastform.' }
    ]
  },
  {
    name: 'Nimble Grazer',
    tier: 1,
    examples: 'Deer, Gazelle, Goat',
    trait: 'agility',
    traitBonus: 1,
    evasionBonus: 3,
    range: 'Melee',
    damageDie: 'd6',
    damageType: 'phy',
    advantages: ['leap', 'sneak', 'sprint'],
    features: [
      { name: 'Elusive Prey', description: 'When an attack roll against you would succeed, you can mark a Stress and roll a d4. Add the result to your Evasion against this attack.' },
      { name: 'Fragile', description: 'When you take Major or greater damage, you drop out of Beastform.' }
    ]
  },
  {
    name: 'Pack Predator',
    tier: 1,
    examples: 'Coyote, Hyena, Wolf',
    trait: 'strength',
    traitBonus: 2,
    evasionBonus: 1,
    range: 'Melee',
    damageDie: 'd8+2',
    damageType: 'phy',
    advantages: ['attack', 'sprint', 'track'],
    features: [
      { name: 'Hobbling Strike', description: 'When you succeed on an attack against a target within Melee range, you can mark a Stress to make the target temporarily Vulnerable.' },
      { name: 'Pack Hunting', description: 'When you succeed on an attack against the same target as an ally who acts immediately before you, add a d8 to your damage roll.' }
    ]
  },
  {
    name: 'Aquatic Scout',
    tier: 1,
    examples: 'Eel, Fish, Octopus',
    trait: 'agility',
    traitBonus: 1,
    evasionBonus: 2,
    range: 'Melee',
    damageDie: 'd4',
    damageType: 'phy',
    advantages: ['navigate', 'sneak', 'swim'],
    features: [
      { name: 'Aquatic', description: 'You can breathe and move naturally underwater.' },
      { name: 'Fragile', description: 'When you take Major or greater damage, you drop out of Beastform.' }
    ]
  },
  {
    name: 'Stalking Arachnid',
    tier: 1,
    examples: 'Tarantula, Wolf Spider',
    trait: 'finesse',
    traitBonus: 1,
    evasionBonus: 2,
    range: 'Melee',
    damageDie: 'd6+1',
    damageType: 'phy',
    advantages: ['attack', 'climb', 'sneak'],
    features: [
      { name: 'Venomous Bite', description: 'When you succeed on an attack against a target within Melee range, the target becomes temporarily Poisoned. A Poisoned creature takes 1d10 direct physical damage each time they act.' },
      { name: 'Webslinger', description: 'You can create strong web material useful for adventuring and battle. The web supports one creature. You can temporarily Restrain a target within Close range by succeeding on a Finesse Roll against them.' }
    ]
  },

  // ===== TIER 2 =====
  {
    name: 'Armored Sentry',
    tier: 2,
    examples: 'Armadillo, Pangolin, Turtle',
    trait: 'strength',
    traitBonus: 1,
    evasionBonus: 1,
    range: 'Melee',
    damageDie: 'd8+2',
    damageType: 'phy',
    advantages: ['dig', 'locate', 'protect'],
    features: [
      { name: 'Armored Shell', description: 'You have resistance to physical damage. Mark an Armor Slot to retract into your shell. While in your shell, physical damage is reduced by your Armor Score (after resistance), but you can\'t perform other actions.' },
      { name: 'Cannonball', description: 'Mark a Stress to allow an ally to throw or launch you at an adversary. The ally makes an Agility or Strength attack against a target within Close range. On success, deal d12+2 physical damage. Spend a Hope to target an additional adversary within Very Close range for half damage.' }
    ]
  },
  {
    name: 'Powerful Beast',
    tier: 2,
    examples: 'Bear, Bull, Moose',
    trait: 'strength',
    traitBonus: 1,
    evasionBonus: 3,
    range: 'Melee',
    damageDie: 'd10+4',
    damageType: 'phy',
    advantages: ['navigate', 'protect', 'scare'],
    features: [
      { name: 'Rampage', description: 'When you roll a 1 on a damage die, roll a d10 and add the result. Before an attack roll, you can mark a Stress to gain +1 Proficiency for that attack.' },
      { name: 'Thick Hide', description: 'You gain a +2 bonus to your damage thresholds.' }
    ]
  },
  {
    name: 'Mighty Strider',
    tier: 2,
    examples: 'Camel, Horse, Zebra',
    trait: 'agility',
    traitBonus: 1,
    evasionBonus: 2,
    range: 'Melee',
    damageDie: 'd8+1',
    damageType: 'phy',
    advantages: ['leap', 'navigate', 'sprint'],
    features: [
      { name: 'Carrier', description: 'You can carry up to two willing allies with you when you move.' },
      { name: 'Trample', description: 'Mark a Stress to move up to Close range in a straight line and attack all targets within Melee range of the line. Targets you succeed against take d8+1 physical damage and are temporarily Vulnerable.' }
    ]
  },
  {
    name: 'Striking Serpent',
    tier: 2,
    examples: 'Cobra, Rattlesnake, Viper',
    trait: 'finesse',
    traitBonus: 1,
    evasionBonus: 2,
    range: 'Very Close',
    damageDie: 'd8+4',
    damageType: 'phy',
    advantages: ['climb', 'deceive', 'sprint'],
    features: [
      { name: 'Venomous Strike', description: 'Make an attack against any number of targets within Very Close range. On success, a target is temporarily Poisoned. A Poisoned creature takes 1d10 physical direct damage each time they act.' },
      { name: 'Warning Hiss', description: 'Mark a Stress to force any number of targets within Melee range to move back to Very Close range.' }
    ]
  },
  {
    name: 'Pouncing Predator',
    tier: 2,
    examples: 'Cheetah, Lion, Panther',
    trait: 'instinct',
    traitBonus: 1,
    evasionBonus: 3,
    range: 'Melee',
    damageDie: 'd8+6',
    damageType: 'phy',
    advantages: ['attack', 'climb', 'sneak'],
    features: [
      { name: 'Fleet', description: 'Spend a Hope to move up to Far range without rolling.' },
      { name: 'Takedown', description: 'Mark a Stress to move into Melee range of a target and attack. On success, gain +2 Proficiency for this attack and the target must mark a Stress.' }
    ]
  },
  {
    name: 'Winged Beast',
    tier: 2,
    examples: 'Hawk, Owl, Raven',
    trait: 'finesse',
    traitBonus: 1,
    evasionBonus: 3,
    range: 'Melee',
    damageDie: 'd4+2',
    damageType: 'phy',
    advantages: ['deceive', 'locate', 'scare'],
    features: [
      { name: 'Bird\'s-Eye View', description: 'You can fly at will. Once per rest while airborne, ask the GM a question about the scene below without rolling. The first character to act on this info gains advantage.' },
      { name: 'Hollow Bones', description: 'You gain a -2 penalty to your damage thresholds.' }
    ]
  },

  // ===== TIER 3 =====
  {
    name: 'Great Predator',
    tier: 3,
    examples: 'Dire Wolf, Velociraptor, Sabertooth Tiger',
    trait: 'strength',
    traitBonus: 2,
    evasionBonus: 2,
    range: 'Melee',
    damageDie: 'd12+8',
    damageType: 'phy',
    advantages: ['attack', 'sneak', 'sprint'],
    features: [
      { name: 'Carrier', description: 'You can carry up to two willing allies with you when you move.' },
      { name: 'Vicious Maul', description: 'When you succeed on an attack, spend a Hope to make them temporarily Vulnerable and gain +1 Proficiency for this attack.' }
    ]
  },
  {
    name: 'Mighty Lizard',
    tier: 3,
    examples: 'Alligator, Crocodile, Gila Monster',
    trait: 'instinct',
    traitBonus: 2,
    evasionBonus: 1,
    range: 'Melee',
    damageDie: 'd10+7',
    damageType: 'phy',
    advantages: ['attack', 'sneak', 'track'],
    features: [
      { name: 'Physical Defense', description: 'You gain a +3 bonus to your damage thresholds.' },
      { name: 'Snapping Strike', description: 'When you succeed on an attack against a target within Melee range, spend a Hope to clamp them in your jaws, making them temporarily Restrained and Vulnerable.' }
    ]
  },
  {
    name: 'Great Winged Beast',
    tier: 3,
    examples: 'Giant Eagle, Falcon',
    trait: 'finesse',
    traitBonus: 2,
    evasionBonus: 3,
    range: 'Melee',
    damageDie: 'd8+6',
    damageType: 'phy',
    advantages: ['deceive', 'distract', 'locate'],
    features: [
      { name: 'Bird\'s-Eye View', description: 'You can fly at will. Once per rest while airborne, ask the GM a question about the scene below without rolling. The first character to act on this info gains advantage.' },
      { name: 'Carrier', description: 'You can carry up to two willing allies with you when you move.' }
    ]
  },
  {
    name: 'Aquatic Predator',
    tier: 3,
    examples: 'Dolphin, Orca, Shark',
    trait: 'agility',
    traitBonus: 2,
    evasionBonus: 4,
    range: 'Melee',
    damageDie: 'd10+6',
    damageType: 'phy',
    advantages: ['attack', 'swim', 'track'],
    features: [
      { name: 'Aquatic', description: 'You can breathe and move naturally underwater.' },
      { name: 'Vicious Maul', description: 'When you succeed on an attack, spend a Hope to make them Vulnerable and gain +1 Proficiency for this attack.' }
    ]
  },
  {
    name: 'Legendary Beast',
    tier: 3,
    examples: 'Upgraded Tier 1 Options',
    trait: 'varies',
    traitBonus: 0,
    evasionBonus: 0,
    range: 'Melee',
    damageDie: 'varies',
    damageType: 'phy',
    advantages: [],
    features: [
      { name: 'Evolved', description: 'Pick a Tier 1 Beastform and become a larger, more powerful version. Retain all traits and features from the original form and gain: +6 bonus to damage rolls, +1 to the trait used by this form, +2 to Evasion.' }
    ]
  },
  {
    name: 'Legendary Hybrid',
    tier: 3,
    examples: 'Griffon, Sphinx',
    trait: 'strength',
    traitBonus: 2,
    evasionBonus: 3,
    range: 'Melee',
    damageDie: 'd10+8',
    damageType: 'phy',
    advantages: [],
    features: [
      { name: 'Hybrid Features', description: 'To transform into this creature, mark an additional Stress. Choose any two Beastform options from Tiers 1-2. Choose a total of four advantages and two features from those options.' }
    ]
  },

  // ===== TIER 4 =====
  {
    name: 'Massive Behemoth',
    tier: 4,
    examples: 'Elephant, Mammoth, Rhinoceros',
    trait: 'strength',
    traitBonus: 3,
    evasionBonus: 1,
    range: 'Melee',
    damageDie: 'd12+12',
    damageType: 'phy',
    advantages: ['locate', 'protect', 'scare', 'sprint'],
    features: [
      { name: 'Carrier', description: 'You can carry up to four willing allies with you when you move.' },
      { name: 'Demolish', description: 'Spend a Hope to move up to Far range in a straight line and attack all targets within Melee range of the line. Targets you succeed against take d8+10 physical damage and are temporarily Vulnerable.' },
      { name: 'Undaunted', description: 'You gain a +2 bonus to all your damage thresholds.' }
    ]
  },
  {
    name: 'Terrible Lizard',
    tier: 4,
    examples: 'Brachiosaurus, Tyrannosaurus',
    trait: 'strength',
    traitBonus: 3,
    evasionBonus: 2,
    range: 'Melee',
    damageDie: 'd12+10',
    damageType: 'phy',
    advantages: ['attack', 'deceive', 'scare', 'track'],
    features: [
      { name: 'Devastating Strikes', description: 'When you deal Severe damage to a target within Melee range, mark a Stress to force them to mark an additional Hit Point.' },
      { name: 'Massive Stride', description: 'You can move up to Far range without rolling. You ignore rough terrain due to your size.' }
    ]
  },
  {
    name: 'Mythic Aerial Hunter',
    tier: 4,
    examples: 'Dragon, Pterodactyl, Roc, Wyvern',
    trait: 'finesse',
    traitBonus: 3,
    evasionBonus: 4,
    range: 'Melee',
    damageDie: 'd10+11',
    damageType: 'phy',
    advantages: ['attack', 'deceive', 'locate', 'navigate'],
    features: [
      { name: 'Carrier', description: 'You can carry up to three willing allies with you when you move.' },
      { name: 'Deadly Raptor', description: 'You can fly at will and move up to Far range as part of your action. When you move in a straight line into Melee range from at least Close range and attack, you can reroll all damage dice that rolled lower than your Proficiency.' }
    ]
  },
  {
    name: 'Epic Aquatic Beast',
    tier: 4,
    examples: 'Giant Squid, Whale',
    trait: 'agility',
    traitBonus: 3,
    evasionBonus: 3,
    range: 'Melee',
    damageDie: 'd10+10',
    damageType: 'phy',
    advantages: ['locate', 'protect', 'scare', 'track'],
    features: [
      { name: 'Ocean Master', description: 'You can breathe and move naturally underwater. When you succeed on an attack against a target within Melee range, you can temporarily Restrain them.' },
      { name: 'Unyielding', description: 'When you would mark an Armor Slot, roll a d6. On a 5 or higher, reduce severity by one threshold without marking an Armor Slot.' }
    ]
  },
  {
    name: 'Mythic Beast',
    tier: 4,
    examples: 'Upgraded Tier 1 or Tier 2 Options',
    trait: 'varies',
    traitBonus: 0,
    evasionBonus: 0,
    range: 'Melee',
    damageDie: 'varies',
    damageType: 'phy',
    advantages: [],
    features: [
      { name: 'Evolved', description: 'Pick a Tier 1 or Tier 2 Beastform and become a larger, more powerful version. Retain all traits and features and gain: +9 to damage rolls, +2 to the trait used, +3 to Evasion, and your damage die increases by one size.' }
    ]
  },
  {
    name: 'Mythic Hybrid',
    tier: 4,
    examples: 'Chimera, Cockatrice, Manticore',
    trait: 'strength',
    traitBonus: 3,
    evasionBonus: 2,
    range: 'Melee',
    damageDie: 'd12+10',
    damageType: 'phy',
    advantages: [],
    features: [
      { name: 'Hybrid Features', description: 'To transform into this creature, mark 2 additional Stress. Choose any three Beastform options from Tiers 1-3. Choose a total of five advantages and three features from those options.' }
    ]
  }
];

export const getBeastformsByTier = (tier) => BEASTFORMS.filter(b => b.tier <= tier);

export const getBeastformByName = (name) => BEASTFORMS.find(b => b.name === name);
