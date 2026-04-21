/**
 * Star Wars D6 (West End Games) adversary templates.
 *
 * Each adversary has:
 *  - classification:  'minion' | 'thug' | 'veteran' | 'elite' | 'legendary'
 *  - scale:           'character' | 'speeder' | 'walker' | 'starfighter' | 'capital'
 *  - affiliation:     faction the adversary belongs to (for filtering/flavor)
 *  - forceSensitive:  boolean
 *  - attributes:      D6 dice codes for the six attributes
 *  - skills:          [{ name, dice }]
 *  - weapons:         [{ name, skill, damage, range? }]
 *  - move:            tactical move rate (meters/round)
 *  - forcePoints / darkSidePoints / characterPoints
 *  - specialAbilities: [{ name, description }]
 *  - equipment:       string[]
 *  - motives:         short prose
 */

export const STARWARSD6_CLASSIFICATIONS = [
  { value: 'minion',    label: 'Minion',     hint: 'Weak, expendable — loses fights quickly' },
  { value: 'thug',      label: 'Thug',       hint: 'Rank-and-file soldier or henchman' },
  { value: 'veteran',   label: 'Veteran',    hint: 'Experienced operator — solid stats' },
  { value: 'elite',     label: 'Elite',      hint: 'Specialist — dangerous in their niche' },
  { value: 'legendary', label: 'Legendary',  hint: 'Iconic named foe — campaign threat' }
];

export const STARWARSD6_AFFILIATIONS = [
  'empire', 'rebellion', 'republic', 'separatist', 'sith', 'jedi',
  'hutt cartel', 'bounty hunters guild', 'criminal', 'fringe', 'creature', 'droid', 'neutral'
];

export const STARWARSD6_SCALES = [
  'character', 'speeder', 'walker', 'starfighter', 'capital'
];

export const STARWARSD6_ADVERSARIES = [
  // ── Imperial ────────────────────────────────────────────────────────────────
  {
    name: 'Stormtrooper',
    classification: 'thug',
    scale: 'character',
    affiliation: 'empire',
    description: 'Armor-clad Imperial shock soldier. Effective in squads, mediocre in isolation.',
    motives: 'Enforce Imperial order, eliminate Rebels, obey without question.',
    attributes: { dexterity: '3D', knowledge: '2D', mechanical: '2D', perception: '2D', strength: '3D', technical: '2D' },
    skills: [
      { name: 'Blaster', dice: '4D' },
      { name: 'Dodge', dice: '4D' },
      { name: 'Brawling', dice: '3D+2' },
      { name: 'Search', dice: '3D' }
    ],
    weapons: [
      { name: 'Blaster Rifle', skill: 'Blaster', damage: '5D', range: '3-25/50/250' },
      { name: 'Blaster Pistol', skill: 'Blaster', damage: '4D', range: '3-10/30/120' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 2,
    specialAbilities: [],
    equipment: ['Stormtrooper armor (+1D Physical / +1 Energy)', 'Comlink', 'Utility belt', '2 thermal detonators']
  },
  {
    name: 'Imperial Officer',
    classification: 'veteran',
    scale: 'character',
    affiliation: 'empire',
    description: 'Uniformed Imperial officer — a competent leader far more dangerous with troops at his back.',
    motives: 'Advance his career, crush dissent, impress his superiors.',
    attributes: { dexterity: '2D', knowledge: '3D', mechanical: '3D', perception: '3D', strength: '2D', technical: '3D' },
    skills: [
      { name: 'Blaster', dice: '3D+2' },
      { name: 'Command', dice: '5D' },
      { name: 'Bureaucracy', dice: '4D' },
      { name: 'Tactics', dice: '4D+1' },
      { name: 'Intimidation', dice: '4D' }
    ],
    weapons: [
      { name: 'Blaster Pistol', skill: 'Blaster', damage: '4D', range: '3-10/30/120' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 5,
    specialAbilities: [
      { name: 'Rally Troops', description: 'Once per scene, grant a +1D bonus to up to three subordinate troopers\' next action.' }
    ],
    equipment: ['Imperial uniform', 'Comlink', 'Code cylinder', 'Datapad']
  },
  {
    name: 'TIE Fighter Pilot',
    classification: 'thug',
    scale: 'character',
    affiliation: 'empire',
    description: 'Elite Imperial pilot in distinctive black flight suit. At home in the cockpit, unremarkable on foot.',
    motives: 'Log another kill, prove their skill, serve the Empire.',
    attributes: { dexterity: '3D', knowledge: '2D', mechanical: '3D+2', perception: '2D+1', strength: '2D', technical: '3D' },
    skills: [
      { name: 'Blaster', dice: '3D+2' },
      { name: 'Starfighter Piloting', dice: '5D' },
      { name: 'Starship Gunnery', dice: '4D+2' },
      { name: 'Astrogation', dice: '3D+1' }
    ],
    weapons: [
      { name: 'Blaster Pistol', skill: 'Blaster', damage: '4D', range: '3-10/30/120' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 3,
    specialAbilities: [],
    equipment: ['TIE flight suit & helmet', 'Comlink']
  },
  {
    name: 'Imperial Royal Guard',
    classification: 'elite',
    scale: 'character',
    affiliation: 'empire',
    description: 'Crimson-robed silent sentinel. The Emperor\'s personal guard — hand-picked from the Stormtrooper Corps.',
    motives: 'Protect the Emperor at all costs, maintain absolute discipline.',
    attributes: { dexterity: '4D', knowledge: '2D', mechanical: '2D', perception: '3D', strength: '4D', technical: '2D' },
    skills: [
      { name: 'Blaster', dice: '5D' },
      { name: 'Dodge', dice: '5D+2' },
      { name: 'Melee Combat', dice: '6D' },
      { name: 'Melee Parry', dice: '5D+2' },
      { name: 'Brawling', dice: '5D' }
    ],
    weapons: [
      { name: 'Force Pike', skill: 'Melee Combat', damage: 'STR+2D', range: 'reach' },
      { name: 'Hold-out Blaster', skill: 'Blaster', damage: '3D+1', range: '3-4/8/12' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 1,
    characterPoints: 8,
    specialAbilities: [
      { name: 'Undying Vigilance', description: 'Immune to Intimidation. May make a free reaction to intercept attacks targeting their protectee once per round.' }
    ],
    equipment: ['Royal Guard crimson armor (+1D Physical / +1D Energy)', 'Scarlet robe']
  },
  {
    name: 'AT-ST Scout Walker',
    classification: 'elite',
    scale: 'walker',
    affiliation: 'empire',
    description: 'Bipedal armored Imperial walker — fast and nasty on rough terrain.',
    motives: 'Patrol, overwhelm infantry, intimidate the populace.',
    attributes: { dexterity: '2D', knowledge: '—', mechanical: '—', perception: '—', strength: '—', technical: '—' },
    skills: [
      { name: 'Walker Operation', dice: '4D' },
      { name: 'Vehicle Blasters', dice: '4D' }
    ],
    weapons: [
      { name: 'Twin Blaster Cannons', skill: 'Vehicle Blasters', damage: '4D (Walker scale)', range: '50-200/500/1km' },
      { name: 'Concussion Grenade Launcher', skill: 'Vehicle Blasters', damage: '6D/4D/2D blast', range: '50-100/200/500' }
    ],
    move: 30,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 0,
    specialAbilities: [
      { name: 'Walker Scale', description: 'Add +4D to resist character-scale damage. Character-scale attackers subtract 4D when attacking.' },
      { name: 'Crew', description: 'Requires 2 crew (pilot + gunner). Crew destroyed = walker disabled.' }
    ],
    equipment: ['Armored hull (+2D hull)', 'Sensors 1 km']
  },

  // ── Rebel / Resistance ──────────────────────────────────────────────────────
  {
    name: 'Rebel Trooper',
    classification: 'thug',
    scale: 'character',
    affiliation: 'rebellion',
    description: 'Volunteer fighter for the Alliance. Outnumbered and under-equipped, but committed.',
    motives: 'Free the galaxy, protect their squad, honor the fallen.',
    attributes: { dexterity: '3D', knowledge: '2D', mechanical: '2D', perception: '3D', strength: '2D+2', technical: '2D' },
    skills: [
      { name: 'Blaster', dice: '4D' },
      { name: 'Dodge', dice: '4D' },
      { name: 'Brawling', dice: '3D+1' },
      { name: 'Hide', dice: '3D+2' }
    ],
    weapons: [
      { name: 'Blaster Rifle', skill: 'Blaster', damage: '5D', range: '3-25/50/250' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 3,
    specialAbilities: [],
    equipment: ['Rebel fatigues', 'Comlink', '3 power packs']
  },

  // ── Fringe / Criminal ───────────────────────────────────────────────────────
  {
    name: 'Bounty Hunter',
    classification: 'veteran',
    scale: 'character',
    affiliation: 'bounty hunters guild',
    description: 'Independent tracker who works for the highest bidder. Well-armed and dangerously patient.',
    motives: 'Collect the bounty, protect their reputation, stay alive.',
    attributes: { dexterity: '3D+1', knowledge: '2D+2', mechanical: '3D', perception: '3D+2', strength: '3D', technical: '2D+2' },
    skills: [
      { name: 'Blaster', dice: '5D+1' },
      { name: 'Dodge', dice: '4D+2' },
      { name: 'Brawling', dice: '4D' },
      { name: 'Tracking', dice: '5D' },
      { name: 'Streetwise', dice: '4D+1' },
      { name: 'Intimidation', dice: '4D' }
    ],
    weapons: [
      { name: 'Heavy Blaster Pistol', skill: 'Blaster', damage: '5D', range: '3-7/25/50' },
      { name: 'Vibroblade', skill: 'Melee Combat', damage: 'STR+2D', range: 'reach' },
      { name: 'Hold-out Blaster', skill: 'Blaster', damage: '3D+1', range: '3-4/8/12' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 1,
    characterPoints: 10,
    specialAbilities: [
      { name: 'Hunter\'s Eye', description: 'Add +1D to any roll made to find or anticipate a specific target they\'ve been hired to hunt.' }
    ],
    equipment: ['Armored jumpsuit (+1 Physical/Energy)', 'Comlink', 'Macrobinoculars', 'Restraints', 'Tracking tag kit']
  },
  {
    name: 'Pirate Thug',
    classification: 'thug',
    scale: 'character',
    affiliation: 'criminal',
    description: 'Opportunistic voidfarer armed with whatever they can steal. Rarely loyal.',
    motives: 'Take the loot, skim off the top, survive the boss.',
    attributes: { dexterity: '3D', knowledge: '2D', mechanical: '2D+1', perception: '2D+2', strength: '3D', technical: '2D' },
    skills: [
      { name: 'Blaster', dice: '3D+2' },
      { name: 'Dodge', dice: '3D+1' },
      { name: 'Brawling', dice: '4D' },
      { name: 'Melee Combat', dice: '3D+2' },
      { name: 'Streetwise', dice: '3D+1' }
    ],
    weapons: [
      { name: 'Blaster Pistol', skill: 'Blaster', damage: '4D', range: '3-10/30/120' },
      { name: 'Vibroknife', skill: 'Melee Combat', damage: 'STR+1D+2', range: 'reach' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 2,
    specialAbilities: [],
    equipment: ['Mismatched flak vest', 'Pocketful of credits', 'Glow rod']
  },
  {
    name: 'Gamorrean Guard',
    classification: 'thug',
    scale: 'character',
    affiliation: 'criminal',
    description: 'Porcine brute hired for muscle. Slow of wit, fast with an axe.',
    motives: 'Protect his master, eat, fight.',
    attributes: { dexterity: '2D+1', knowledge: '1D+1', mechanical: '1D+2', perception: '2D', strength: '4D+1', technical: '1D+1' },
    skills: [
      { name: 'Melee Combat', dice: '5D' },
      { name: 'Brawling', dice: '5D+2' },
      { name: 'Intimidation', dice: '3D+2' }
    ],
    weapons: [
      { name: 'Vibro-axe', skill: 'Melee Combat', damage: 'STR+2D+1', range: 'reach' }
    ],
    move: 8,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 1,
    specialAbilities: [
      { name: 'Thick Hide', description: 'Natural armor grants +1D to resist Physical damage.' }
    ],
    equipment: ['Crude leather harness', 'Horn whistle']
  },

  // ── Force users ─────────────────────────────────────────────────────────────
  {
    name: 'Dark Jedi',
    classification: 'elite',
    scale: 'character',
    affiliation: 'sith',
    description: 'Fallen Force-user consumed by rage and hunger. Dangerous in melee, terrifying up close.',
    motives: 'Seize power, exact revenge, drag others into darkness.',
    forceSensitive: true,
    attributes: { dexterity: '3D+2', knowledge: '3D', mechanical: '2D', perception: '3D+1', strength: '3D+1', technical: '2D+2' },
    skills: [
      { name: 'Lightsaber', dice: '6D' },
      { name: 'Dodge', dice: '5D' },
      { name: 'Intimidation', dice: '5D+2' },
      { name: 'Melee Parry', dice: '5D+1' }
    ],
    forceSkills: [
      { name: 'Control', dice: '4D+1' },
      { name: 'Sense', dice: '4D' },
      { name: 'Alter', dice: '4D+2' }
    ],
    weapons: [
      { name: 'Lightsaber', skill: 'Lightsaber', damage: '5D', range: 'reach' }
    ],
    move: 10,
    forcePoints: 1,
    darkSidePoints: 4,
    characterPoints: 10,
    specialAbilities: [
      { name: 'Force Powers', description: 'Knows Telekinesis, Affect Mind, Force Push, Combat Sense, Lightsaber Combat.' },
      { name: 'Dark Rage', description: 'Spend a Force Point (dark side) to add +2D to all physical actions for one round.' }
    ],
    equipment: ['Lightsaber', 'Dark robes']
  },
  {
    name: 'Sith Lord',
    classification: 'legendary',
    scale: 'character',
    affiliation: 'sith',
    description: 'A master of the dark side — decades of hate and training given flesh. A campaign-defining threat.',
    motives: 'Rule through fear, corrupt the galaxy, break the heroes\' spirits.',
    forceSensitive: true,
    attributes: { dexterity: '4D', knowledge: '4D', mechanical: '2D', perception: '4D', strength: '4D', technical: '3D' },
    skills: [
      { name: 'Lightsaber', dice: '10D' },
      { name: 'Dodge', dice: '8D' },
      { name: 'Intimidation', dice: '8D' },
      { name: 'Melee Parry', dice: '8D' },
      { name: 'Alien Species', dice: '6D' }
    ],
    forceSkills: [
      { name: 'Control', dice: '9D' },
      { name: 'Sense', dice: '8D' },
      { name: 'Alter', dice: '9D' }
    ],
    weapons: [
      { name: 'Lightsaber', skill: 'Lightsaber', damage: '5D', range: 'reach' }
    ],
    move: 10,
    forcePoints: 4,
    darkSidePoints: 12,
    characterPoints: 25,
    specialAbilities: [
      { name: 'Mastery of the Dark Side', description: 'Knows Force Lightning, Force Choke, Telekinesis, Affect Mind, Combat Sense, Absorb/Dissipate Energy, and Life Detection.' },
      { name: 'Unyielding Will', description: 'Immune to Intimidation and mind-influencing powers unless the attacker rolls 5+ over the DC.' }
    ],
    equipment: ['Lightsaber', 'Ceremonial robes']
  },

  // ── Creatures ───────────────────────────────────────────────────────────────
  {
    name: 'Wampa',
    classification: 'veteran',
    scale: 'character',
    affiliation: 'creature',
    description: 'Predatory ice beast of Hoth. Massive, clawed, and patient.',
    motives: 'Hunt, feed, drag prey back to the lair.',
    attributes: { dexterity: '2D', knowledge: '1D', mechanical: '—', perception: '3D', strength: '5D', technical: '—' },
    skills: [
      { name: 'Brawling', dice: '6D+2' },
      { name: 'Search', dice: '4D' },
      { name: 'Sneak', dice: '4D (snow terrain)' }
    ],
    weapons: [
      { name: 'Claws', skill: 'Brawling', damage: 'STR+2D', range: 'reach' },
      { name: 'Bite', skill: 'Brawling', damage: 'STR+1D', range: 'reach' }
    ],
    move: 12,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 0,
    specialAbilities: [
      { name: 'Thick Fur', description: '+2D to resist cold and +1D to resist Physical damage.' },
      { name: 'Grab and Drag', description: 'On a successful Brawling attack, may forgo damage to grapple and drag the target half its Move.' }
    ],
    equipment: []
  },
  {
    name: 'Rancor',
    classification: 'legendary',
    scale: 'character',
    affiliation: 'creature',
    description: 'Hulking nightmare from Dathomir. A wall of muscle, teeth, and territorial fury.',
    motives: 'Defend territory, eat, crush anything smaller.',
    attributes: { dexterity: '2D', knowledge: '1D', mechanical: '—', perception: '2D', strength: '8D', technical: '—' },
    skills: [
      { name: 'Brawling', dice: '10D' },
      { name: 'Intimidation', dice: '6D' }
    ],
    weapons: [
      { name: 'Massive Claws', skill: 'Brawling', damage: 'STR+2D', range: 'reach' },
      { name: 'Devouring Bite', skill: 'Brawling', damage: 'STR+3D', range: 'reach' }
    ],
    move: 15,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 0,
    specialAbilities: [
      { name: 'Armored Hide', description: '+2D to resist Physical damage, +1D to resist Energy.' },
      { name: 'Terrifying Presence', description: 'All creatures smaller than the rancor must roll Willpower vs. 15 on first sighting or act with -1D for one round.' },
      { name: 'Swallow Whole', description: 'On a Brawling roll that exceeds the defender\'s Dodge by 10+, the rancor may swallow a character-scale target whole.' }
    ],
    equipment: []
  },
  {
    name: 'Tusken Raider',
    classification: 'thug',
    scale: 'character',
    affiliation: 'fringe',
    description: 'Desert nomad of Tatooine. Fiercely territorial and silent until the attack begins.',
    motives: 'Drive off outsiders, defend the clan, claim scavenged gear.',
    attributes: { dexterity: '3D+1', knowledge: '2D', mechanical: '2D', perception: '3D', strength: '3D', technical: '2D' },
    skills: [
      { name: 'Missile Weapons', dice: '5D' },
      { name: 'Melee Combat', dice: '4D+2' },
      { name: 'Sneak', dice: '4D+1' },
      { name: 'Survival', dice: '5D (desert)' }
    ],
    weapons: [
      { name: 'Gaderffii Stick', skill: 'Melee Combat', damage: 'STR+2D', range: 'reach' },
      { name: 'Slugthrower Rifle', skill: 'Missile Weapons', damage: '4D', range: '3-15/30/100' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 2,
    specialAbilities: [
      { name: 'Desert Born', description: '+2D to Survival and Sneak in desert terrain; ignore penalties for extreme heat.' }
    ],
    equipment: ['Heavy robes', 'Breathing mask', 'Scavenged tools']
  },

  // ── Droids ──────────────────────────────────────────────────────────────────
  {
    name: 'Battle Droid (B1)',
    classification: 'minion',
    scale: 'character',
    affiliation: 'separatist',
    description: 'Mass-produced infantry droid. Weak alone, only dangerous in massed formations.',
    motives: 'Follow orders from central command, hold the line, attack on command.',
    attributes: { dexterity: '2D', knowledge: '1D', mechanical: '2D', perception: '1D', strength: '2D', technical: '1D' },
    skills: [
      { name: 'Blaster', dice: '3D' },
      { name: 'Dodge', dice: '2D+2' }
    ],
    weapons: [
      { name: 'E-5 Blaster Rifle', skill: 'Blaster', damage: '4D+2', range: '3-25/50/250' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 0,
    specialAbilities: [
      { name: 'Droid', description: 'Immune to Force-based mind powers, poisons, and suffocation. Disabled at 0 wounds, not unconscious.' },
      { name: 'Command-Linked', description: 'If the central command signal is jammed or destroyed, all Skill rolls are at -2D.' }
    ],
    equipment: ['Standard comm-link']
  },
  {
    name: 'Assassin Droid (IG-Series)',
    classification: 'elite',
    scale: 'character',
    affiliation: 'droid',
    description: 'Skeletal combat droid with no empathy and overlapping targeting arrays. A precision killer.',
    motives: 'Complete the contract, eliminate the target, evade pursuit.',
    attributes: { dexterity: '4D', knowledge: '3D', mechanical: '3D', perception: '4D', strength: '3D+2', technical: '3D' },
    skills: [
      { name: 'Blaster', dice: '6D' },
      { name: 'Dodge', dice: '5D+2' },
      { name: 'Melee Combat', dice: '5D' },
      { name: 'Tracking', dice: '5D+1' },
      { name: 'Demolitions', dice: '4D+2' }
    ],
    weapons: [
      { name: 'Heavy Blaster Rifle', skill: 'Blaster', damage: '5D+2', range: '3-30/75/300' },
      { name: 'Wrist-mounted Blade', skill: 'Melee Combat', damage: 'STR+1D+2', range: 'reach' },
      { name: 'Concussion Grenade', skill: 'Grenade', damage: '5D/3D/2D blast', range: '3-7/20/40' }
    ],
    move: 10,
    forcePoints: 0,
    darkSidePoints: 0,
    characterPoints: 12,
    specialAbilities: [
      { name: 'Droid', description: 'Immune to Force mind powers, poisons, and suffocation.' },
      { name: '360° Optics', description: 'Cannot be flanked. Sensors grant +1D to Perception checks in darkness.' }
    ],
    equipment: ['Armored plating (+1D Physical / +1D Energy)', 'Integrated sensors', 'Self-repair kit']
  }
];

export const STARWARSD6_ADVERSARIES_BY_CLASSIFICATION = STARWARSD6_ADVERSARIES.reduce((acc, adv) => {
  const key = adv.classification || 'thug';
  if (!acc[key]) acc[key] = [];
  acc[key].push(adv);
  return acc;
}, {});

export const STARWARSD6_ADVERSARIES_BY_AFFILIATION = STARWARSD6_ADVERSARIES.reduce((acc, adv) => {
  const key = adv.affiliation || 'neutral';
  if (!acc[key]) acc[key] = [];
  acc[key].push(adv);
  return acc;
}, {});
