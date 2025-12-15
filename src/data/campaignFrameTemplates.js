/**
 * Campaign Frame Templates
 * Based on official Daggerheart Campaign Frames
 */
import { getGameSystem } from './systems/index.js';

export const CAMPAIGN_FRAME_TEMPLATES = [
  {
    id: 'witherwild',
    name: 'The Witherwild',
    complexity: 1,
    pitch: 'When an invading nation attacks an ancient forest deity, a virulent overgrowth spreads throughout the land. Play unlikely heroes from humble beginnings reckoning with their duty to save Fanewick\'s people from dangerous corruption.',
    toneAndFeel: ['Adventurous', 'Dynamic', 'Epic', 'Heroic', 'Thrilling', 'Uncanny', 'Whimsical'],
    themes: ['Cultural Clash', 'Ends Justify Means', 'Grief', 'People vs. Nature', 'Transformation and Change', 'Survival'],
    touchstones: ['Princess Mononoke', 'The Legend of Zelda', 'The Dark Crystal', 'Nausicaä of the Valley of the Wind'],
    overview: 'Fanewick is a wild, untamed land with dark twisting woods and Faint Divinities. Haven, a once-powerful nation, hides behind walls made from the remains of a slain god. The Serpent\'s Sickness, a plague from ancient god\'s dust, causes victims to petrify. Only the rare Crimson Lady\'s Veil flower can cure it. The Great Owl Nikta, Shepherd of Seasons, had its Reaping Eye stolen, causing endless spring and week-long day/night cycles.',
    communities: {
      wildborne: {
        description: 'Forest dwellers of Fanewick who live in harmony with nature',
        questions: ['How do you honor the Faint Divinities?', 'What natural signs do you read in the Witherwild?']
      },
      wanderborne: {
        description: 'Nomads who travel between Fanewick and Haven',
        questions: ['How has the invasion changed your routes?', 'What stories do you carry between the lands?']
      }
    },
    playerPrinciples: ['Make the Invasion Personal', 'Treat Death with Importance', 'Embrace Vulnerability'],
    gmPrinciples: ['Paint the World in Contrast', 'Show Them True Danger', 'Offer Alternatives to Violence', 'Create Multidimensional Allies and Adversaries'],
    distinctions: [
      {
        name: 'The Witherwild',
        description: 'A virulent overgrowth spreading through Fanewick, corrupting everything it touches'
      },
      {
        name: 'Week-long Days and Nights',
        description: 'The sun rises and sets for entire weeks at a time due to Nikta\'s stolen Reaping Eye'
      },
      {
        name: 'Faint Divinities',
        description: 'Ancient nature spirits that inhabit Fanewick\'s wild places'
      }
    ],
    incitingIncident: 'A wave of petrification sweeps through your village. Someone you love has been turned to stone by the Serpent\'s Sickness. You must venture into the Witherwild to find the Crimson Lady\'s Veil - the only cure.',
    campaignMechanics: [
      {
        name: 'Wither Tokens',
        description: 'Track corruption from the Witherwild',
        rules: 'When you take Severe damage from a Withered source, gain a Wither token. Roll Fear Die; if result ≤ tokens, gain a scar and clear tokens. At session end, clear all Wither tokens and gain equal Fear. Death with Wither tokens = body taken by Witherwild.'
      }
    ],
    sessionZeroQuestions: [
      'What do you remember about Fanewick before the invasion?',
      'How has someone you love been affected by the Serpent\'s Sickness?',
      'What Faint Divinity do you feel connected to?',
      'What do you fear most about the Witherwild?',
      'How do you feel about the people of Haven?'
    ]
  },
  {
    id: 'five-banners',
    name: 'Five Banners Burning',
    complexity: 2,
    pitch: 'Long-brewing tensions between rival nations boil over, threatening all-out war. Navigate complex political allegiances, old grudges, and impossible choices in an emotionally intense campaign with a large cast and sweeping scope.',
    toneAndFeel: ['Emotionally Intense', 'Nuanced', 'Political', 'Dramatic', 'Complex', 'Tense'],
    themes: ['Loyalty vs. Ethics', 'Duty and Allegiance', 'Consequences of War', 'Political Intrigue'],
    touchstones: ['Game of Thrones', 'The Last Airbender', 'Fire Emblem', 'Critical Role Campaign 3'],
    overview: 'Althas is a mountainous continent divided among five rival nations, each with their own banner, culture, and grievances. Decades of uneasy peace are about to shatter. Old grudges resurface, new schemes unfold, and you stand at the crossroads of allegiances that will shape the future of the entire continent.',
    communities: {
      orderborne: {
        description: 'Those who serve codes of honor, military orders, or ancient oaths',
        questions: ['Which nation does your order serve?', 'What oath binds you?']
      },
      highborne: {
        description: 'Nobility and aristocrats caught in political webs',
        questions: ['What noble house do you belong to?', 'What political marriage or alliance affects you?']
      }
    },
    playerPrinciples: [
      'Make Your Actions Reflect or Refute Your Allegiances',
      'Stick to Your Principles or Break Them for Good Reasons',
      'Take Small Actions That Have Big Implications',
      'Grapple with the Impact of Your Actions on Everyday People'
    ],
    gmPrinciples: [
      'Force Them to Choose Between Their Loyalties',
      'Entangle Them in a Web of Old Grudges and New Schemes'
    ],
    distinctions: [
      {
        name: 'The Five Nations of Althas',
        description: 'Each nation has distinct culture, military strength, and political ambitions'
      },
      {
        name: 'Web of Allegiances',
        description: 'Complex relationships, treaties, and betrayals connect all major players'
      },
      {
        name: 'The Common Folk',
        description: 'Everyday people who suffer most when banners burn'
      }
    ],
    incitingIncident: 'An assassination at a peace summit. A noble from one of the five nations lies dead, and all evidence points to your group. As war drums sound, you must clear your names and uncover the true conspiracy before the continent erupts in flames.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'Which of the five nations do you have ties to?',
      'What relationship do you have with someone from a rival nation?',
      'What old grudge or betrayal haunts your people?',
      'Where do your loyalties truly lie?',
      'What would you sacrifice to prevent all-out war?'
    ]
  },
  {
    id: 'beast-feast',
    name: 'Beast Feast',
    complexity: 2,
    pitch: 'Descend into mysterious underground caverns where you hunt fantastical beasts and cook them into powerful meals. Build your cookbook together as you explore deeper, discovering stranger creatures and more exotic flavors.',
    toneAndFeel: ['Whimsical', 'Adventurous', 'Culinary', 'Mysterious', 'Lighthearted', 'Exploratory'],
    themes: ['Exploration and Discovery', 'Culinary Arts', 'Survival', 'Teamwork', 'Resource Management'],
    touchstones: ['Delicious in Dungeon', 'Monster Hunter', 'Toriko', 'The Legend of Zelda: Breath of the Wild'],
    overview: 'Deep beneath the surface lies an endless network of caverns filled with strange beasts and exotic blooms. You are culinary adventurers, seeking rare ingredients to create the ultimate feast. Each beast you hunt provides unique flavors - sweet, salty, bitter, sour, savory, and weird. Your growing cookbook is your greatest treasure.',
    communities: {
      underborne: {
        description: 'Those who dwell in the upper caverns and know the first depths',
        questions: ['What dish does your community celebrate with?', 'What ingredient is forbidden to harvest?']
      },
      wanderborne: {
        description: 'Traveling merchants who trade in rare ingredients',
        questions: ['What\'s the rarest ingredient you\'ve ever tasted?', 'Which cavern level is your favorite to explore?']
      }
    },
    playerPrinciples: [
      'Describe Your Meals in Detail',
      'Share Food to Build Bonds',
      'Experiment with New Ingredients',
      'Respect the Beasts You Hunt'
    ],
    gmPrinciples: [
      'Make Each Beast Unique and Memorable',
      'Describe Flavors Vividly',
      'Reward Culinary Creativity',
      'Balance Danger with Deliciousness'
    ],
    distinctions: [
      {
        name: 'The Cookbook',
        description: 'A physical book you maintain together, recording recipes and ingredient properties'
      },
      {
        name: 'Flavor Profiles',
        description: 'Six flavor types (Sweet, Salty, Bitter, Sour, Savory, Weird), each tied to different dice'
      },
      {
        name: 'Culinary Equipment',
        description: 'Weapons and armor themed around cooking (Large Fork, Baking Tray Breastplate, Whisk Wand)'
      }
    ],
    incitingIncident: 'Rumors spread of the Eternal Feast - a legendary banquet hall in the deepest caverns where every dish ever created waits to be tasted. Your culinary guild commissions you to verify the legend and, if true, bring back recipes worthy of the surface world.',
    campaignMechanics: [
      {
        name: 'The Cookbook System',
        description: 'Track discovered recipes and ingredient properties',
        rules: 'Ingredients have Flavor Profiles (Sweet d4, Salty d6, Bitter d8, Sour d10, Savory d12, Weird d20) and Strength (1-3). PCs can hold ingredients equal to highest trait. Harvest from beasts based on HP: 1-4 HP = 1 ingredient, 5-7 HP = 2, 8-10 HP = 3, 12+ HP = 4. Gather environmental blooms once per rest by spending Hope.'
      }
    ],
    sessionZeroQuestions: [
      'What\'s your signature dish?',
      'What beast ingredient are you most eager to discover?',
      'What cooking technique are you known for?',
      'What flavor do you crave most?',
      'What culinary disaster taught you an important lesson?'
    ]
  },
  {
    id: 'ageOfUmbra',
    name: 'The Age of Umbra',
    complexity: 3,
    pitch: 'In a dying world immersed in relentless shadow and nightmarish monsters, small communities hold fast to the light, hoping those who endure can find a way to save this broken realm before all is lost to darkness.',
    toneAndFeel: ['Ancient', 'Daunting', 'Epic', 'Grim', 'Ominous', 'Terrifying', 'Tragic'],
    themes: ['Apocalypse', 'Corruption', 'Darkness vs Light', 'Hope', 'Redemption', 'Survival'],
    touchstones: ['Dark Souls', 'Kingdom Death: Monster', 'Berserk', 'The Seventh Seal', 'Blasphemous'],
    overview: 'The Halcyon Domain rots after the gods\' abandonment. God-King Othedias betrayed the Pantheon, causing divine punishment known as The Apostasy. Now The Enduring survive among ruins, protected by Sacred Pyres from The Umbra - a dark mass of malevolent twisted souls. The Soul Blight ensures all dead rise as corrupted revenants. Ancient Aetherweave magic is blamed for the divine wrath.',
    communities: {
      enduring: {
        description: 'Survivors who rebuild among the ruins, protected by Sacred Pyres',
        questions: ['What did you lose in The Apostasy?', 'How do you keep hope alive in darkness?']
      }
    },
    playerPrinciples: [
      'Endure and Protect Your Allies',
      'Confront the Terror with Bravery',
      'Seek Compassion Amid Corruption',
      'Embrace Epic, Memorable Character Deaths'
    ],
    gmPrinciples: [
      'Create Dread and Despair, Then Contrast with Hope',
      'Make Death Meaningful and Frequent',
      'Show the Horror of Corruption',
      'Reward Bravery and Sacrifice'
    ],
    distinctions: [
      {
        name: 'The Umbra',
        description: 'Dark ethereal mass of malevolent twisted souls that consumes the world'
      },
      {
        name: 'Sacred Pyres',
        description: 'Hallowed fires that repel the Umbra\'s horrors and protect The Enduring'
      },
      {
        name: 'Soul Blight',
        description: 'Curse ensuring all dead rise as corrupted revenants seeking to kill those they loved'
      }
    ],
    incitingIncident: 'A Sacred Pyre protecting your settlement is dying. You must venture into the darkness to find a Blessed Branch to reignite it, or your entire community will be consumed by The Umbra.',
    campaignMechanics: [
      {
        name: 'The Strength of Hate',
        description: 'Umbra-Touched adversaries and scarred heroes grow more dangerous',
        rules: 'Umbra-Touched adversaries crit on 19-20. PCs deal extra damage equal to their number of scars. When PC marks last Hope slot with scar, they succumb to Umbra (not retire).'
      },
      {
        name: 'Lurking Darkness',
        description: 'Rest outside Sacred Pyres is perilous',
        rules: 'Roll d12 when resting: 1-2 monster attack, 3-5 stalked (+2 Fear), 6-9 darkness (+1 Fear), 10-11 undisturbed, 12 hopeful omen (+1 Hope each).'
      },
      {
        name: 'Soul Blight',
        description: 'Dead rise as zombies seeking vengeance on loved ones',
        rules: 'When humanoid dies, GM can spend 1-2 Fear to raise as zombie. Zombies seek to kill everyone they cared for. When destroyed, soul joins Umbra.'
      }
    ],
    sessionZeroQuestions: [
      'What keeps you fighting in this dying world?',
      'Who have you lost to The Umbra?',
      'What Sacred Pyre do you protect?',
      'What forbidden knowledge of Aetherweave do you possess?',
      'What horror have you witnessed that others wouldn\'t believe?',
      'How do you honor those lost to Soul Blight?',
      'What desperate hope drives you forward?'
    ]
  },
  {
    id: 'motherboard',
    name: 'Motherboard',
    complexity: 3,
    pitch: 'In a world where magic takes the form of technology left behind by a long-fallen civilization, a new threat rises as a malicious virus spreads through the machines that wander the Wastes.',
    toneAndFeel: ['Adventurous', 'Epic', 'Innovative', 'Mysterious', 'Post-Post-Apocalyptic', 'Technological'],
    themes: ['Artificial Intelligence', 'Identity & Personhood', 'Innovation', 'Technology vs. Humanity'],
    touchstones: ['Horizon Zero Dawn', 'Mortal Engines', 'Mad Max: Fury Road', 'Final Fantasy', 'Fullmetal Alchemist', 'Slugblaster'],
    overview: 'Echo Vale thrives among ruins of a fallen civilization, powered by The Network - a dense web of glimmering wire emanating from The Motherboard spire. Autonomous machines called Remnants roam as tame companions or wild hunters. But The Remnant\'s Fury virus now causes machines to attack violently. Cities can be walled or wandering. Quantum currency flows through black discs, and ancient Kohd programming language holds secrets of the past.',
    communities: {
      valeborn: {
        description: 'Citizens of Echo Vale\'s cities, living among the ancient technology',
        questions: ['What walled or wandering city do you call home?', 'How do you view the Remnants?']
      },
      wastelanders: {
        description: 'Scavengers who hunt for scrap and relics in the ruins',
        questions: ['What relic are you searching for?', 'What danger of the Wastes haunts you?']
      }
    },
    playerPrinciples: [
      'Question the Nature of Consciousness',
      'Embrace Innovation Over Tradition',
      'Protect the Innocent Remnants',
      'Uncover the Secrets of the Past'
    ],
    gmPrinciples: [
      'Make Technology Wondrous and Mysterious',
      'Show Both Beauty and Danger in Remnants',
      'Reward Creative Problem Solving',
      'Reveal the Fall Gradually'
    ],
    distinctions: [
      {
        name: 'The Network',
        description: 'Web of glimmering wire carrying data and power throughout Echo Vale'
      },
      {
        name: 'Remnants',
        description: 'Autonomous machines of the fallen world, either tame or wild'
      },
      {
        name: 'The Remnant\'s Fury',
        description: 'Virus causing remnants to attack violently and unpredictably'
      },
      {
        name: 'Ikonis Weapons',
        description: 'Personalized weapons that grow with their wielder, modified with scrap'
      }
    ],
    incitingIncident: 'A beloved tame Remnant in your city suddenly goes berserk, infected by The Remnant\'s Fury. You must track the virus to its source before the entire Network is compromised and all Remnants turn hostile.',
    campaignMechanics: [
      {
        name: 'Ikonis System',
        description: 'Personalized bonded weapons with augment slots',
        rules: 'Two-handed weapon with +damage equal to level. Has 2 augment slots at Tier 1, +1 per tier. Augments crafted from scrap and swapped during downtime.'
      },
      {
        name: 'Scrap & Crafting',
        description: 'Economy based on Quantum currency and scrap materials',
        rules: 'Shards (d6), Metals (d8), Components (d10). Loot varies by fight difficulty. Relics worth 20 quantum. No standard gold.'
      },
      {
        name: 'Tech Damage',
        description: 'Magic reflavored as technology',
        rules: 'All magic damage is tech damage from technomancy, plasma beams, nanobots, drones, etc.'
      }
    ],
    sessionZeroQuestions: [
      'What Remnant companion do you dream of bonding with?',
      'What piece of ancient technology fascinates you?',
      'How did you acquire your Ikonis weapon?',
      'What do you believe caused the fall of the old civilization?',
      'What wandering city would you most want to visit?',
      'What scrap component are you desperately seeking?',
      'Do you believe Remnants have souls?'
    ]
  },
  {
    id: 'colossus',
    name: 'Colossus of the Drylands',
    complexity: 3,
    pitch: 'Hunt massive Colossus creatures across a desert wasteland to prevent the rise of an ancient evil. Climb atop towering beasts, strike at their vital segments, and level up with each victory. But beware - each fallen Colossus brings Kudamat closer to emergence.',
    toneAndFeel: ['Epic', 'Tense', 'Melancholic', 'Atmospheric', 'Boss-Focused', 'High-Stakes'],
    themes: ['Necessary Evil', 'Sacrifice', 'Power and Consequence', 'Isolation', 'Determination'],
    touchstones: ['Shadow of the Colossus', 'Attack on Titan', 'Monster Hunter', 'Dark Souls'],
    overview: 'The Drylands stretch endlessly - a harsh desert wasteland where nine massive Colossi wander. These ancient beings hold Kudamat imprisoned with their lives. A cult seeks to slay all nine and release Kudamat. You must hunt the Colossi first, knowing each death brings the world closer to doom. It\'s a race against time where victory and defeat blur together.',
    communities: {
      wanderborne: {
        description: 'Nomadic hunters who track the Colossi\'s movements',
        questions: ['Why did you join the hunt?', 'Which Colossus have you seen from afar?']
      },
      orderborne: {
        description: 'Members of the Order sworn to prevent Kudamat\'s return',
        questions: ['What oath binds you to this quest?', 'What did you sacrifice to join the Order?']
      }
    },
    playerPrinciples: [
      'Question Whether Your Quest is Just',
      'Find Beauty in the Colossi',
      'Bond Through Shared Hardship',
      'Make Each Victory Feel Heavy'
    ],
    gmPrinciples: [
      'Make Each Colossus Unforgettable',
      'Show the Weight of Their Deaths',
      'Track Kudamat\'s Growing Power',
      'Balance Awe with Dread'
    ],
    distinctions: [
      {
        name: 'The Nine Colossi',
        description: 'Massive wandering creatures, each 100-300 feet tall with segmented bodies'
      },
      {
        name: 'Kudamat Emergence Tracker',
        description: 'Tracks how close Kudamat is to breaking free (0-100 power, increases with each Colossus death)'
      },
      {
        name: 'The Drylands',
        description: 'An endless desert wasteland with ruins of ancient civilizations'
      }
    ],
    incitingIncident: 'You discover a cult performing a dark ritual to slay the first Colossus. You stop them, but the creature is mortally wounded. In its dying moments, it shows you visions - all nine must die to release Kudamat, but if you don\'t reach them first, the cult will. The only choice is to hunt them yourself.',
    campaignMechanics: [
      {
        name: 'Colossus Combat',
        description: 'Fight against segmented boss monsters',
        rules: 'Each Colossus has multiple Segments (Head, Body, Limbs) with individual HP, difficulty, and features. PCs must climb and attack specific segments. Some segments are Fatal (defeating them kills the Colossus), Armored (immune to certain damage), or have Cascade effects.'
      },
      {
        name: 'Kudamat Emergence Tracker',
        description: 'Track progress toward final confrontation',
        rules: 'Siphoning Track: mark when PCs rest (1 for short, 2 for long). When track fills OR Colossus dies, roll d12 and add to Kudamat\'s Power (starts at 0). When all 9 Colossi die OR Power reaches 100, Kudamat emerges. Kudamat\'s Severe threshold = Power value.'
      },
      {
        name: 'Rapid Leveling',
        description: 'Level up after each Colossus',
        rules: 'PCs level up immediately upon defeating each Colossus (reach level 10 after all nine).'
      }
    ],
    sessionZeroQuestions: [
      'Why do you hunt the Colossi?',
      'What do you hope to prevent by slaying them?',
      'What makes you doubt your quest?',
      'Which Colossus do you fear most?',
      'What will you do if Kudamat emerges anyway?'
    ]
  },
  {
    id: 'blank',
    name: 'Blank Template',
    complexity: 1,
    pitch: '',
    toneAndFeel: [],
    themes: [],
    touchstones: [],
    overview: '',
    communities: {},
    playerPrinciples: [],
    gmPrinciples: [],
    distinctions: [],
    incitingIncident: '',
    campaignMechanics: [],
    sessionZeroQuestions: []
  }
];

/**
 * Get a template by ID
 * @param {string} id - Template ID
 * @returns {object|null} Template object or null if not found
 */
export function getTemplateById(id) {
  return CAMPAIGN_FRAME_TEMPLATES.find(template => template.id === id) || null;
}

/**
 * Get all templates except blank, optionally filtered by game system
 * @param {string} gameSystem - Optional game system ID (e.g., 'daggerheart', 'dnd5e')
 * @returns {array} Array of template objects
 */
export function getAvailableTemplates(gameSystem = 'daggerheart') {
  // If game system is daggerheart or not specified, return Daggerheart templates
  if (!gameSystem || gameSystem === 'daggerheart') {
    return CAMPAIGN_FRAME_TEMPLATES.filter(template => template.id !== 'blank');
  }

  // For other game systems, try to load templates from the game system definition
  try {
    const system = getGameSystem(gameSystem);

    if (system?.campaignFrameTemplates && Array.isArray(system.campaignFrameTemplates)) {
      return system.campaignFrameTemplates;
    }
  } catch (error) {
    console.warn(`Could not load campaign frame templates for game system '${gameSystem}', falling back to Daggerheart templates`, error);
  }

  // Fallback to Daggerheart templates if game system templates not found
  return CAMPAIGN_FRAME_TEMPLATES.filter(template => template.id !== 'blank');
}

/**
 * Get the blank template
 * @returns {object} Blank template object
 */
export function getBlankTemplate() {
  return CAMPAIGN_FRAME_TEMPLATES.find(template => template.id === 'blank');
}
