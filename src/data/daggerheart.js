// Daggerheart System Data

export const CLASSES = {
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

export const DOMAINS = [
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

export const ANCESTRIES = {
  'Clank': 'Mechanical beings of gears and magic, crafted with purpose and driven by logic.',
  'Daemon': 'Beings touched by otherworldly energies, walking between mortal and supernatural realms.',
  'Drakona': 'Dragonborn humanoids with scales, breath weapons, and draconic heritage.',
  'Dwarf': 'Sturdy folk of mountain and forge, known for craftsmanship and resilience.',
  'Elf': 'Graceful beings with deep connections to magic and the ancient world.',
  'Faerie': 'Tiny fey creatures brimming with mischief, magic, and wonder.',
  'Faun': 'Half-human, half-goat folk who embody the wild spirit of nature.',
  'Firbolg': 'Gentle giants with deep ties to nature and the forest.',
  'Fungril': 'Mushroom folk who thrive in darkness and decay, sprouting from the deep earth.',
  'Galapa': 'Turtle-like beings of wisdom, patience, and ancient knowledge.',
  'Giant': 'Towering folk whose size is matched only by their strength.',
  'Goblin': 'Small, scrappy creatures known for cunning, chaos, and surprising ingenuity.',
  'Halfling': 'Small folk with big hearts, known for luck, community, and courage.',
  'Human': 'Versatile and ambitious, adaptable to any role or challenge.',
  'Inferis': 'Beings born of infernal flame, carrying both power and temptation.',
  'Katari': 'Feline humanoids who embody grace, curiosity, and independence.',
  'Orc': 'Proud warriors with honor-bound cultures and fierce determination.',
  'Ribbet': 'Amphibious frog-folk who leap between land and water with ease.',
  'Simiah': 'Ape-like beings of strength, community, and primal wisdom.'
};

export const COMMUNITIES = {
  'Highborne': 'Raised in nobility, wealth, and privilege with connections to power and high society.',
  'Loreborne': 'Scholars and sages raised among books, seeking knowledge and understanding.',
  'Orderborne': 'Trained in discipline and structure, serving institutions of law, faith, or military.',
  'Ridgeborne': 'Mountain folk who endure harsh climates and value independence and resilience.',
  'Seaborne': 'Sailors and coastal dwellers who navigate the waters and embrace freedom.',
  'Slyborne': 'Street-smart survivors from urban underbellies, skilled in deception and cunning.',
  'Wanderborne': 'Nomads and travelers who roam the world, never settling in one place.',
  'Wildborne': 'Raised in untamed wilderness, connected to nature and its primal ways.',
  'Underborne': 'Dwellers of the deep earth, caves, and underground cities.'
};

export const LORE_TYPES = [
  'location',
  'npc',
  'faction',
  'item',
  'history',
  'quest',
  'other'
];

export const TRAIT_RANGE = [-1, 0, 1, 2, 3];

export const EXTERNAL_TOOLS = [
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
