// D&D 5e Campaign Frame Templates
// Classic D&D campaign structures and themes

export const DND5E_CAMPAIGN_FRAMES = [
  {
    id: 'classic-dungeon-delve',
    name: 'Classic Dungeon Delve',
    theme: 'Exploration & Combat',
    description: 'A traditional dungeon crawl where heroes explore ancient ruins, battle monsters, and seek legendary treasures.',
    structure: {
      acts: 3,
      focus: 'Combat and Exploration',
      pacing: 'Medium'
    },
    hooks: [
      'An ancient map reveals the location of a forgotten dungeon',
      'A local noble hires the party to clear out a monster-infested keep',
      'Strange disappearances lead to a network of underground tunnels'
    ],
    mechanics: 'Emphasize combat encounters, traps, puzzles, and treasure hunting. Use dungeon-based exploration with room-by-room discoveries.'
  },
  {
    id: 'political-intrigue',
    name: 'Political Intrigue',
    theme: 'Social & Investigation',
    description: 'Navigate the dangerous world of nobles, guilds, and power struggles in a city-state or kingdom.',
    structure: {
      acts: 4,
      focus: 'Social Interaction and Investigation',
      pacing: 'Slow Burn'
    },
    hooks: [
      'The party is hired as bodyguards and witnesses a political assassination',
      'A trusted ally is accused of treason and needs help proving innocence',
      'The party inherits a noble title and must navigate court politics'
    ],
    mechanics: 'Focus on social encounters, skill challenges, information gathering, and faction relationships. Combat is secondary to intrigue and deception.'
  },
  {
    id: 'planar-adventure',
    name: 'Planar Adventure',
    theme: 'High Magic & Cosmic Stakes',
    description: 'Travel across multiple planes of existence, dealing with cosmic threats and otherworldly beings.',
    structure: {
      acts: 5,
      focus: 'High-Level Play and Planar Travel',
      pacing: 'Epic'
    },
    hooks: [
      'A breach in reality threatens to merge the Material Plane with the Abyss',
      'The gods task the party with retrieving a powerful artifact from the Nine Hells',
      'Reality-warping magic is causing planes to collide'
    ],
    mechanics: 'Best for high-level characters (11+). Each act takes place on a different plane. Incorporate planar-specific challenges and creatures.'
  },
  {
    id: 'dragon-hunt',
    name: 'Dragon Hunt',
    theme: 'Epic Quest',
    description: 'A classic quest to hunt down and defeat a dragon terrorizing the land.',
    structure: {
      acts: 3,
      focus: 'Build-up to Epic Confrontation',
      pacing: 'Escalating'
    },
    hooks: [
      'A dragon has claimed the local mountain and demands tribute',
      'Dragon attacks are becoming more frequent and coordinated',
      'The party discovers a dragon is manipulating local politics'
    ],
    mechanics: 'Build tension through investigating the dragon\'s lair, gathering information, acquiring dragon-slaying weapons, and recruiting allies before the final confrontation.'
  },
  {
    id: 'mystery-murder',
    name: 'Mystery & Murder',
    theme: 'Investigation',
    description: 'Solve a complex mystery involving murder, conspiracy, and hidden secrets.',
    structure: {
      acts: 3,
      focus: 'Investigation and Revelation',
      pacing: 'Methodical'
    },
    hooks: [
      'A series of ritual murders points to a dark cult',
      'A locked-room mystery in a noble\'s mansion',
      'The party must solve their own murder (they wake up dead in the afterlife)'
    ],
    mechanics: 'Focus on clue gathering, NPC interrogation, skill checks (Investigation, Insight, Perception), and red herrings. Reveal the truth in stages.'
  },
  {
    id: 'wilderness-survival',
    name: 'Wilderness Survival',
    theme: 'Survival & Exploration',
    description: 'Survive in harsh, untamed wilderness while pursuing a goal or escaping danger.',
    structure: {
      acts: 2,
      focus: 'Survival Mechanics',
      pacing: 'Tense'
    },
    hooks: [
      'The party\'s ship crashes on an uncharted island',
      'A desperate trek through a cursed forest to reach sanctuary',
      'Survive a harsh winter while being hunted by a supernatural predator'
    ],
    mechanics: 'Emphasize survival checks (food, water, shelter), environmental hazards, navigation challenges, and resource management.'
  },
  {
    id: 'undead-uprising',
    name: 'Undead Uprising',
    theme: 'Horror & Combat',
    description: 'Fight against a rising tide of undead and discover the necromancer behind it all.',
    structure: {
      acts: 4,
      focus: 'Horror and Mounting Threat',
      pacing: 'Escalating Tension'
    },
    hooks: [
      'Dead are rising from their graves across the region',
      'A lich is building an army to conquer the living',
      'A cursed artifact is turning people into undead'
    ],
    mechanics: 'Start with isolated undead encounters, escalate to hordes, reveal the mastermind. Use horror elements like dread, limited resources, and moral choices.'
  },
  {
    id: 'heist-caper',
    name: 'Heist & Caper',
    theme: 'Planning & Execution',
    description: 'Plan and execute an elaborate heist to steal a valuable item or rescue someone.',
    structure: {
      acts: 3,
      focus: 'Planning, Preparation, Execution',
      pacing: 'Tense and Fast'
    },
    hooks: [
      'Steal a magical artifact from a heavily guarded museum',
      'Break someone out of an inescapable prison',
      'Infiltrate a crime lord\'s mansion during a gala'
    ],
    mechanics: 'Allow extensive planning phase. Reward clever ideas. Have backup plans ready. Include skill challenges, stealth, and contingencies for when plans go wrong.'
  },
  {
    id: 'war-campaign',
    name: 'War Campaign',
    theme: 'Large-Scale Conflict',
    description: 'Navigate a kingdom at war, with the party playing a crucial role in the conflict\'s outcome.',
    structure: {
      acts: 5,
      focus: 'Military Strategy and Heroic Moments',
      pacing: 'Epic and Long-Term'
    },
    hooks: [
      'Two kingdoms go to war and the party must choose a side',
      'The party leads a mercenary company through the war',
      'Civil war erupts and the party must restore order'
    ],
    mechanics: 'Use mass combat rules, strategic decisions affecting war progress, morale mechanics, and epic battlefield moments where the party turns the tide.'
  },
  {
    id: 'lost-civilization',
    name: 'Lost Civilization',
    theme: 'Discovery & History',
    description: 'Discover the ruins of an ancient civilization and uncover its secrets and treasures.',
    structure: {
      acts: 4,
      focus: 'Exploration and Revelation',
      pacing: 'Mystery-Driven'
    },
    hooks: [
      'An earthquake reveals entrance to a buried city',
      'Ancient texts point to a legendary lost empire',
      'Artifacts from a vanished culture are appearing in markets'
    ],
    mechanics: 'Gradual discovery of lore, environmental storytelling, ancient traps and guardians, piecing together what happened to the civilization.'
  },
  {
    id: 'guild-rise',
    name: 'Guild/Organization Rise',
    theme: 'Building & Management',
    description: 'Build and manage an adventuring guild, thieves\' guild, or similar organization.',
    structure: {
      acts: 'Ongoing',
      focus: 'Management and Growth',
      pacing: 'Player-Driven'
    },
    hooks: [
      'The party inherits a failing adventurer\'s guild',
      'Start a thieves\' guild from scratch in a new city',
      'Build a mercenary company and compete for contracts'
    ],
    mechanics: 'Downtime activities, recruiting NPCs, managing resources, dealing with rival organizations, and taking on jobs to fund growth.'
  },
  {
    id: 'prophecy-destiny',
    name: 'Prophecy & Destiny',
    theme: 'Epic Fantasy',
    description: 'The party is central to an ancient prophecy that will determine the fate of the world.',
    structure: {
      acts: 5,
      focus: 'Chosen One(s) Narrative',
      pacing: 'Epic and Escalating'
    },
    hooks: [
      'A prophecy names the party as the only ones who can stop an apocalypse',
      'The stars align, marking the return of an ancient evil',
      'Each party member was marked at birth for a great destiny'
    ],
    mechanics: 'Reveal prophecy elements gradually, include moral choices about destiny vs free will, and build toward a world-shaking climax.'
  }
];

export default DND5E_CAMPAIGN_FRAMES;
