// Daggerheart Game System Definition
// Official Daggerheart RPG system by Darrington Press

const CLASSES = {
  'Bard': {
    domains: ['Codex', 'Grace', 'Midnight', 'Splendor'],
    description: 'Masters of performance and magic who inspire allies and manipulate the battlefield through music, words, and arcane arts.',
    features: 'Bardic Inspiration, versatile magic, social expertise'
  },
  'Druid': {
    domains: ['Arcana', 'Sage', 'Blade', 'Bone'],
    description: 'Nature-bound spellcasters who can shapeshift into beasts and command the primal forces of the natural world.',
    features: 'Wild Shape, nature magic, environmental control'
  },
  'Guardian': {
    domains: ['Blade', 'Bone', 'Grace', 'Valor'],
    description: 'Stalwart defenders who protect their allies and control the battlefield through martial prowess and protective abilities.',
    features: 'Tank role, protective abilities, high armor'
  },
  'Ranger': {
    domains: ['Sage', 'Blade', 'Grace', 'Midnight'],
    description: 'Wilderness experts who excel at tracking, survival, and ranged combat while forging bonds with animal companions.',
    features: 'Ranged expertise, tracking, animal companion'
  },
  'Rogue': {
    domains: ['Midnight', 'Blade', 'Grace', 'Splendor'],
    description: 'Cunning and agile specialists in stealth, deception, and precision strikes who excel at exploiting enemy weaknesses.',
    features: 'Sneak attack, stealth, skills and tricks'
  },
  'Seraph': {
    domains: ['Codex', 'Grace', 'Splendor', 'Valor'],
    description: 'Divine warriors who channel celestial power to heal allies and smite foes with radiant energy.',
    features: 'Healing magic, divine power, support abilities'
  },
  'Sorcerer': {
    domains: ['Arcana', 'Midnight', 'Bone', 'Codex'],
    description: 'Innate spellcasters whose magic flows from within, allowing them to bend and shape magical energy in unique ways.',
    features: 'Raw magical power, metamagic, spontaneous casting'
  },
  'Warrior': {
    domains: ['Blade', 'Bone', 'Grace', 'Valor'],
    description: 'Masters of combat who excel in both offense and defense through superior weapon skills and battle tactics.',
    features: 'Martial superiority, weapon mastery, combat tactics'
  },
  'Wizard': {
    domains: ['Arcana', 'Codex', 'Sage', 'Splendor'],
    description: 'Scholarly mages who study the arcane arts and command a vast repertoire of spells through knowledge and preparation.',
    features: 'Versatile spellcasting, ritual magic, knowledge'
  }
};

const SUBCLASSES = {
  'Bard': [
    {
      name: 'Troubadour',
      description: 'Bards who weave magic through song and performance, inspiring allies with melodic enchantments.',
      foundation: { name: 'Song of Inspiration', description: 'When you spend Hope to support an ally, they gain an additional +1 to their action roll.' }
    },
    {
      name: 'Wordsmith',
      description: 'Bards who command the power of language, using words as weapons and shields.',
      foundation: { name: 'Power Word', description: 'Once per short rest, you can speak a word of power to grant an ally advantage on their next action roll or impose disadvantage on an enemy\'s next action.' }
    }
  ],
  'Druid': [
    {
      name: 'Warden of the Elements',
      description: 'Druids who channel the raw elemental forces of nature to devastate foes and reshape the battlefield.',
      foundation: { name: 'Elemental Fury', description: 'When you cast a spell that deals damage, you may choose to change its damage type to fire, cold, lightning, or force.' }
    },
    {
      name: 'Warden of Renewal',
      description: 'Druids focused on growth, healing, and the restorative cycle of nature.',
      foundation: { name: 'Nature\'s Balm', description: 'When you use an action to heal an ally, they may also clear one stress.' }
    }
  ],
  'Guardian': [
    {
      name: 'Stalwart',
      description: 'Guardians who specialize in immovable defense, absorbing punishment meant for their allies.',
      foundation: { name: 'Shield Wall', description: 'When an ally within close range is attacked, you may mark an armor slot to reduce the damage they take by your armor score.' }
    },
    {
      name: 'Vengeance',
      description: 'Guardians who turn defense into offense, punishing those who dare strike their allies.',
      foundation: { name: 'Retribution', description: 'When you or an adjacent ally takes damage from an attack, you may immediately make a melee attack against the attacker.' }
    }
  ],
  'Ranger': [
    {
      name: 'Beastbound',
      description: 'Rangers who forge deep bonds with animal companions, fighting as one.',
      foundation: { name: 'Animal Companion', description: 'You gain a loyal animal companion that fights alongside you. It can take one action per round on your turn.' }
    },
    {
      name: 'Wayfinder',
      description: 'Rangers who master the wilderness itself, using terrain and tracking to gain tactical advantages.',
      foundation: { name: 'Terrain Master', description: 'You always know true north and cannot become lost. You gain advantage on rolls to track, navigate, or survive in the wilderness.' }
    }
  ],
  'Rogue': [
    {
      name: 'Syndicate',
      description: 'Rogues connected to criminal networks, masters of deception and social manipulation.',
      foundation: { name: 'Underworld Contacts', description: 'In any settlement, you can find a contact who owes you a favor. Once per long rest, call in a favor for information, goods, or assistance.' }
    },
    {
      name: 'Nightwalker',
      description: 'Rogues who embrace the shadows, becoming one with darkness to strike unseen.',
      foundation: { name: 'Shadow Step', description: 'When you are in dim light or darkness, you may spend Hope to teleport to another point of darkness within far range.' }
    }
  ],
  'Seraph': [
    {
      name: 'Winged Sentinel',
      description: 'Seraphs who manifest radiant wings and serve as airborne protectors of the faithful.',
      foundation: { name: 'Radiant Wings', description: 'You can manifest spectral wings as an action, gaining flight until the end of your next turn. Enemies you fly over take radiant damage.' }
    },
    {
      name: 'Faithful',
      description: 'Seraphs devoted to healing and divine support, channeling celestial power to mend wounds.',
      foundation: { name: 'Divine Grace', description: 'When you heal an ally, you may spend additional Hope to also heal another ally within close range for half the amount.' }
    }
  ],
  'Sorcerer': [
    {
      name: 'Elemental Origin',
      description: 'Sorcerers whose power springs from a connection to the elemental planes.',
      foundation: { name: 'Elemental Affinity', description: 'Choose an element (fire, cold, lightning, or force). Spells of that element deal +1 damage and you have resistance to that damage type.' }
    },
    {
      name: 'Wild Magic',
      description: 'Sorcerers whose unstable power surges with chaotic and unpredictable magical effects.',
      foundation: { name: 'Chaos Surge', description: 'When you roll with Fear on a spellcast, you may trigger a wild magic surge: roll a d6 to determine a random bonus effect in addition to the spell.' }
    }
  ],
  'Warrior': [
    {
      name: 'Call of the Brave',
      description: 'Warriors who lead from the front, inspiring allies through acts of courage and martial prowess.',
      foundation: { name: 'Battle Cry', description: 'Once per short rest, you may shout a battle cry. All allies within close range gain +1 to their next attack roll.' }
    },
    {
      name: 'Call of the Slayer',
      description: 'Warriors focused on dealing maximum damage, hunting the most dangerous foes.',
      foundation: { name: 'Mark Prey', description: 'As a free action, mark an enemy you can see. You deal +2 damage to your marked prey. You may only have one prey marked at a time.' }
    }
  ],
  'Wizard': [
    {
      name: 'School of Knowledge',
      description: 'Wizards who pursue mastery through study, accumulating vast arcane knowledge.',
      foundation: { name: 'Arcane Repository', description: 'You maintain a spellbook with additional spells. Once per long rest, you may cast a spell you have studied but not prepared.' }
    },
    {
      name: 'School of War',
      description: 'Wizards who blend martial training with arcane power, becoming battlemages.',
      foundation: { name: 'Arcane Armor', description: 'You can wear light armor without penalty to spellcasting. When you cast a spell, you gain +1 to your armor score until the start of your next turn.' }
    }
  ]
};

const DOMAINS = [
  'Arcana',
  'Blade',
  'Bone',
  'Codex',
  'Grace',
  'Midnight',
  'Sage',
  'Splendor',
  'Valor'
];

const ANCESTRIES = {
  'Clank': {
    description: 'Mechanical beings of gears and magic, crafted with purpose and driven by logic.',
    features: [{ name: 'Constructed Resilience', description: 'You do not need to eat, drink, or breathe. You are immune to poison and disease.' }]
  },
  'Daemon': {
    description: 'Beings touched by otherworldly energies, walking between mortal and supernatural realms.',
    features: [{ name: 'Otherworldly Presence', description: 'You can see in magical darkness. Once per long rest, you may sense the presence of supernatural creatures within far range.' }]
  },
  'Drakona': {
    description: 'Dragonborn humanoids with scales, breath weapons, and draconic heritage.',
    features: [{ name: 'Breath Weapon', description: 'Once per short rest, you may use your breath weapon to deal damage in a close-range cone. Choose fire, cold, or lightning when you create your character.' }]
  },
  'Dwarf': {
    description: 'Sturdy folk of mountain and forge, known for craftsmanship and resilience.',
    features: [{ name: 'Tough as Stone', description: 'When you mark your last armor slot, roll a d6. On a 4+, the slot is not marked.' }]
  },
  'Elf': {
    description: 'Graceful beings with deep connections to magic and the ancient world.',
    features: [{ name: 'Ancient Memory', description: 'You have advantage on Knowledge rolls related to history, arcana, and ancient lore.' }]
  },
  'Faerie': {
    description: 'Tiny fey creatures brimming with mischief, magic, and wonder.',
    features: [{ name: 'Fey Flight', description: 'You have wings and can fly. You are Small-sized, which grants you advantage on stealth but limits your carrying capacity.' }]
  },
  'Faun': {
    description: 'Half-human, half-goat folk who embody the wild spirit of nature.',
    features: [{ name: 'Sure-Footed', description: 'You can move across difficult terrain without penalty and have advantage on rolls to keep your balance or resist being pushed.' }]
  },
  'Firbolg': {
    description: 'Gentle giants with deep ties to nature and the forest.',
    features: [{ name: 'Nature\'s Veil', description: 'Once per short rest, you may turn invisible until the start of your next turn or until you attack or cast a spell.' }]
  },
  'Fungril': {
    description: 'Mushroom folk who thrive in darkness and decay, sprouting from the deep earth.',
    features: [{ name: 'Spore Cloud', description: 'Once per short rest, you may release a cloud of spores. Creatures within melee range must mark a stress or become disoriented.' }]
  },
  'Galapa': {
    description: 'Turtle-like beings of wisdom, patience, and ancient knowledge.',
    features: [{ name: 'Shell Defense', description: 'You can retreat into your shell as an action, gaining +2 to your armor score but becoming unable to move until the start of your next turn.' }]
  },
  'Giant': {
    description: 'Towering folk whose size is matched only by their strength.',
    features: [{ name: 'Towering Might', description: 'You count as Large-sized. You have advantage on Strength rolls and can wield heavy weapons without penalty.' }]
  },
  'Goblin': {
    description: 'Small, scrappy creatures known for cunning, chaos, and surprising ingenuity.',
    features: [{ name: 'Nimble Escape', description: 'Once per short rest, when you would take damage, you may use your reaction to move to an adjacent space and take half damage.' }]
  },
  'Halfling': {
    description: 'Small folk with big hearts, known for luck, community, and courage.',
    features: [{ name: 'Lucky', description: 'Once per session, when you or an ally within close range rolls with Fear, you may reroll and take the new result.' }]
  },
  'Human': {
    description: 'Versatile and ambitious, adaptable to any role or challenge.',
    features: [{ name: 'Adaptable', description: 'You gain one additional Experience at character creation. Once per long rest, you may add +1 to any roll.' }]
  },
  'Inferis': {
    description: 'Beings born of infernal flame, carrying both power and temptation.',
    features: [{ name: 'Infernal Legacy', description: 'You have resistance to fire damage. Once per long rest, you may cast a fire spell without spending Hope.' }]
  },
  'Katari': {
    description: 'Feline humanoids who embody grace, curiosity, and independence.',
    features: [{ name: 'Cat\'s Grace', description: 'You always land on your feet and take reduced fall damage. You have advantage on Agility rolls for climbing and jumping.' }]
  },
  'Orc': {
    description: 'Proud warriors with honor-bound cultures and fierce determination.',
    features: [{ name: 'Relentless', description: 'Once per long rest, when you would mark your last HP slot, you may instead remain at one HP.' }]
  },
  'Ribbet': {
    description: 'Amphibious frog-folk who leap between land and water with ease.',
    features: [{ name: 'Amphibious', description: 'You can breathe underwater and have a swim speed equal to your movement speed. You can jump twice the normal distance.' }]
  },
  'Simiah': {
    description: 'Ape-like beings of strength, community, and primal wisdom.',
    features: [{ name: 'Primal Grip', description: 'You can climb at full speed and have advantage on rolls to grapple. You may use your feet to hold items or weapons.' }]
  }
};

const COMMUNITIES = {
  'Highborne': {
    description: 'Raised in nobility, wealth, and privilege with connections to power and high society.',
    features: [{ name: 'Noble Bearing', description: 'You have advantage on Presence rolls when interacting with nobility or high society. You begin with an additional 10 gold.' }]
  },
  'Loreborne': {
    description: 'Scholars and sages raised among books, seeking knowledge and understanding.',
    features: [{ name: 'Well-Read', description: 'You have advantage on Knowledge rolls to recall lore, identify magical items, or decipher texts.' }]
  },
  'Orderborne': {
    description: 'Trained in discipline and structure, serving institutions of law, faith, or military.',
    features: [{ name: 'Disciplined', description: 'Once per short rest, when you would mark stress, you may instead choose not to mark it.' }]
  },
  'Ridgeborne': {
    description: 'Mountain folk who endure harsh climates and value independence and resilience.',
    features: [{ name: 'Mountain Endurance', description: 'You have advantage on rolls to resist extreme weather and exhaustion. You can carry more equipment than normal.' }]
  },
  'Seaborne': {
    description: 'Sailors and coastal dwellers who navigate the waters and embrace freedom.',
    features: [{ name: 'Sea Legs', description: 'You have advantage on Agility rolls while on boats or in water. You can hold your breath twice as long as normal.' }]
  },
  'Slyborne': {
    description: 'Street-smart survivors from urban underbellies, skilled in deception and cunning.',
    features: [{ name: 'Street Smarts', description: 'You have advantage on Instinct rolls to detect lies, spot danger in urban settings, or find black market goods.' }]
  },
  'Wanderborne': {
    description: 'Nomads and travelers who roam the world, never settling in one place.',
    features: [{ name: 'Worldly', description: 'You speak one additional language. You have advantage on rolls to navigate, find shelter, or make contacts in new places.' }]
  },
  'Wildborne': {
    description: 'Raised in untamed wilderness, connected to nature and its primal ways.',
    features: [{ name: 'Nature\'s Child', description: 'You have advantage on Instinct rolls for tracking, foraging, and surviving in the wild. Animals are not hostile to you by default.' }]
  },
  'Underborne': {
    description: 'Dwellers of the deep earth, caves, and underground cities.',
    features: [{ name: 'Darkvision', description: 'You can see in complete darkness up to far range. You have advantage on rolls to navigate underground or detect subterranean hazards.' }]
  }
};

const LORE_TYPES = [
  'location',
  'npc',
  'faction',
  'item',
  'history',
  'quest',
  'other'
];

const TRAIT_RANGE = [-1, 0, 1, 2, 3];

// Weapon features from Daggerheart SRD
const WEAPON_FEATURES = [
  'Powerful',      // Roll additional damage die, discard lowest
  'Returning',     // Returns to hand after thrown
  'Massive',       // -1 Evasion, roll additional damage die
  'Quick',         // Mark stress to target another creature
  'Scary',         // Target marks stress on hit
  'Hooked',        // Pull target into melee range on hit
  'Reliable',      // +1 to attack rolls
  'Brutal',        // Extra damage on critical
  'Precise',       // +1 to hit
  'Versatile',     // Can be used one or two-handed
  'Reach',         // Extended melee range
  'Thrown',        // Can be thrown
  'Ammunition'     // Requires ammunition
];

// Armor features from Daggerheart SRD
const ARMOR_FEATURES = [
  'Deflecting',    // Mark armor slot for Evasion bonus
  'Sheltering',    // Armor reduces damage for nearby allies too
  'Barrier',       // +5 Armor Score, -1 Evasion
  'Resilient',     // Chance to avoid marking last armor slot
  'Fortified'      // Extra armor slots
];

// Equipment categories
const EQUIPMENT_CATEGORIES = [
  { value: 'utility', label: 'Utility' },
  { value: 'magical', label: 'Magical Equipment' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'enhancement', label: 'Enhancement (Gems/Stones)' },
  { value: 'relic', label: 'Relic' }
];

// Item Templates for Daggerheart
const ITEM_TEMPLATES = {
  weapon: {
    label: 'Weapon',
    icon: 'sword',
    fields: {
      classification: {
        type: 'select',
        label: 'Classification',
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' }
        ],
        required: true
      },
      damageType: {
        type: 'select',
        label: 'Damage Type',
        options: [
          { value: 'physical', label: 'Physical' },
          { value: 'magical', label: 'Magical' }
        ],
        required: true
      },
      trait: {
        type: 'select',
        label: 'Attack Trait',
        options: [
          { value: 'agility', label: 'Agility' },
          { value: 'strength', label: 'Strength' },
          { value: 'finesse', label: 'Finesse' },
          { value: 'instinct', label: 'Instinct' },
          { value: 'presence', label: 'Presence' },
          { value: 'knowledge', label: 'Knowledge' }
        ],
        required: true
      },
      range: {
        type: 'select',
        label: 'Range',
        options: [
          { value: 'melee', label: 'Melee' },
          { value: 'close', label: 'Close' },
          { value: 'far', label: 'Far' },
          { value: 'very far', label: 'Very Far' }
        ],
        required: true
      },
      burden: {
        type: 'select',
        label: 'Burden',
        options: [
          { value: 'one-handed', label: 'One-Handed' },
          { value: 'two-handed', label: 'Two-Handed' }
        ],
        required: true
      },
      damageTier1Dice: {
        type: 'select',
        label: 'Tier 1 Dice',
        options: ['d4', 'd6', 'd8', 'd10', 'd12'],
        required: true
      },
      damageTier1Modifier: {
        type: 'number',
        label: 'Tier 1 Modifier',
        min: 0,
        max: 20,
        default: 0
      },
      damageTier2Dice: {
        type: 'select',
        label: 'Tier 2 Dice',
        options: ['d4', 'd6', 'd8', 'd10', 'd12'],
        required: false
      },
      damageTier2Modifier: {
        type: 'number',
        label: 'Tier 2 Modifier',
        min: 0,
        max: 20,
        default: 3
      },
      damageTier3Dice: {
        type: 'select',
        label: 'Tier 3 Dice',
        options: ['d4', 'd6', 'd8', 'd10', 'd12'],
        required: false
      },
      damageTier3Modifier: {
        type: 'number',
        label: 'Tier 3 Modifier',
        min: 0,
        max: 20,
        default: 6
      },
      damageTier4Dice: {
        type: 'select',
        label: 'Tier 4 Dice',
        options: ['d4', 'd6', 'd8', 'd10', 'd12'],
        required: false
      },
      damageTier4Modifier: {
        type: 'number',
        label: 'Tier 4 Modifier',
        min: 0,
        max: 20,
        default: 9
      },
      features: {
        type: 'multiselect',
        label: 'Features',
        options: WEAPON_FEATURES
      }
    }
  },
  armor: {
    label: 'Armor',
    icon: 'shield',
    fields: {
      armorScore: {
        type: 'number',
        label: 'Armor Score',
        min: 0,
        max: 15,
        required: true,
        default: 2
      },
      armorSlots: {
        type: 'number',
        label: 'Armor Slots',
        min: 1,
        max: 12,
        required: true,
        default: 6
      },
      tier: {
        type: 'select',
        label: 'Tier',
        options: [
          { value: 1, label: 'Tier 1' },
          { value: 2, label: 'Tier 2' },
          { value: 3, label: 'Tier 3' },
          { value: 4, label: 'Tier 4' }
        ],
        required: true
      },
      features: {
        type: 'multiselect',
        label: 'Features',
        options: ARMOR_FEATURES
      }
    }
  },
  equipment: {
    label: 'Equipment',
    icon: 'backpack',
    fields: {
      category: {
        type: 'select',
        label: 'Category',
        options: EQUIPMENT_CATEGORIES,
        required: true
      },
      mechanicalEffect: {
        type: 'textarea',
        label: 'Mechanical Effect',
        placeholder: 'Describe what this item does mechanically...',
        required: false
      },
      activation: {
        type: 'text',
        label: 'Activation',
        placeholder: 'e.g., "Action", "Once per long rest", "Passive"',
        required: false
      },
      uses: {
        type: 'number',
        label: 'Uses',
        min: -1,
        max: 99,
        default: -1,
        helpText: '-1 for unlimited uses'
      },
      hopeCost: {
        type: 'number',
        label: 'Hope Cost',
        min: 0,
        max: 10,
        default: 0
      },
      stressCost: {
        type: 'number',
        label: 'Stress Cost',
        min: 0,
        max: 10,
        default: 0
      }
    }
  }
};

const EXTERNAL_TOOLS = [
  {
    name: 'FreshCutGrass Encounter Manager',
    url: 'https://freshcutgrass.app/encounter',
    description: 'Build and manage encounters',
    icon: 'sword'
  },
  {
    name: 'FreshCutGrass Homebrew',
    url: 'https://freshcutgrass.app/homebrew',
    description: 'Create custom content',
    icon: 'sparkles'
  },
  {
    name: 'Demiplane Character Builder',
    url: 'https://app.demiplane.com/nexus/daggerheart',
    description: 'Official character builder',
    icon: 'user-circle'
  },
  {
    name: 'Daggerheart Official Site',
    url: 'https://www.daggerheart.com',
    description: 'Official website',
    icon: 'home'
  },
  {
    name: 'Daggerheart SRD',
    url: 'https://www.daggerheart.com/wp-content/uploads/2025/05/DH-SRD-May202025.pdf',
    description: 'System Reference Document',
    icon: 'book-open'
  }
];

// Game System Definition
export default {
  // System metadata
  id: 'daggerheart',
  name: 'Daggerheart',
  description: 'Official Daggerheart RPG system by Darrington Press',
  version: '1.0.0',

  // Character schema definition
  characterSchema: {
    class: {
      type: 'select',
      required: true,
      options: Object.keys(CLASSES)
    },
    subclass: {
      type: 'text',
      required: false
    },
    ancestry: {
      type: 'select',
      required: true,
      options: Object.keys(ANCESTRIES)
    },
    community: {
      type: 'select',
      required: true,
      options: Object.keys(COMMUNITIES)
    },
    traits: {
      type: 'object',
      fields: {
        agility: { type: 'number', min: -1, max: 3 },
        strength: { type: 'number', min: -1, max: 3 },
        finesse: { type: 'number', min: -1, max: 3 },
        instinct: { type: 'number', min: -1, max: 3 },
        presence: { type: 'number', min: -1, max: 3 },
        knowledge: { type: 'number', min: -1, max: 3 }
      }
    },
    hpSlots: {
      type: 'slots',
      count: 6,
      default: [true, true, true, true, true, true]
    },
    stressSlots: {
      type: 'slots',
      count: 6,
      default: [false, false, false, false, false, false]
    },
    evasion: {
      type: 'number',
      min: 0,
      default: 10
    },
    armor: {
      type: 'number',
      min: 0,
      default: 0
    },
    primaryDomain: {
      type: 'select',
      required: true,
      options: DOMAINS
    },
    experiences: {
      type: 'array',
      itemType: 'string',
      default: []
    }
  },

  // Dice roller configuration
  diceRoller: {
    type: 'duality',
    dice: [
      {
        name: 'Hope Die',
        sides: 12,
        icon: 'sun',
        color: '#fbbf24' // gold
      },
      {
        name: 'Fear Die',
        sides: 12,
        icon: 'moon',
        color: '#7c3aed' // purple
      }
    ],
    mechanics: {
      type: 'take-higher',
      tiebreaker: 'hope',
      outcomeLabels: {
        higher: 'Hope Result',
        lower: 'Fear Result'
      }
    }
  },

  // Game data
  classes: CLASSES,
  subclasses: SUBCLASSES,
  domains: DOMAINS,
  ancestries: ANCESTRIES,
  communities: COMMUNITIES,
  loreTypes: LORE_TYPES,
  traitRange: TRAIT_RANGE,

  // Item system
  itemTemplates: ITEM_TEMPLATES,
  weaponFeatures: WEAPON_FEATURES,
  armorFeatures: ARMOR_FEATURES,
  equipmentCategories: EQUIPMENT_CATEGORIES,

  // External tools
  externalTools: EXTERNAL_TOOLS,

  // UI theme customization
  theme: {
    primary: '#7c3aed', // purple
    secondary: '#fbbf24', // gold
    iconSet: 'fantasy'
  }
};

// Also export individual constants for backwards compatibility
export {
  CLASSES,
  SUBCLASSES,
  DOMAINS,
  ANCESTRIES,
  COMMUNITIES,
  LORE_TYPES,
  TRAIT_RANGE,
  EXTERNAL_TOOLS,
  ITEM_TEMPLATES,
  WEAPON_FEATURES,
  ARMOR_FEATURES,
  EQUIPMENT_CATEGORIES
};
