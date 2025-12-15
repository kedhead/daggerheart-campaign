// Star Wars D6 Campaign Frame Templates
// Classic Star Wars campaign structures and themes

export const STARWARSD6_CAMPAIGN_FRAMES = [
  {
    id: 'rebellion-heroes',
    name: 'Heroes of the Rebellion',
    complexity: 2,
    theme: 'Rebellion & Heroism',
    description: 'Join the Rebel Alliance in their fight against the tyrannical Galactic Empire. Undertake dangerous missions, rescue prisoners, and strike at Imperial targets.',
    structure: {
      acts: 4,
      focus: 'Heroic Action and Espionage',
      pacing: 'Fast-Paced'
    },
    hooks: [
      'The party intercepts Imperial transmissions about a secret weapon',
      'Rebel command assigns the group to rescue a captured Alliance leader',
      'A defecting Imperial officer has critical intelligence to share'
    ],
    mechanics: 'Balance combat missions with espionage and social encounters. Empire forces should feel overwhelming, encouraging clever tactics over direct confrontation. Award bonus Character Points for heroic actions.'
  },
  {
    id: 'scoundrels-edge',
    name: 'Scoundrels on the Edge',
    complexity: 1,
    description: 'Life on the fringes of galactic society. Smuggle cargo, avoid Imperial entanglements, hustle for credits, and try to stay one step ahead of bounty hunters and crime lords.',
    structure: {
      acts: 3,
      focus: 'High-Stakes Deals and Narrow Escapes',
      pacing: 'Episodic'
    },
    hooks: [
      'A lucrative but dangerous smuggling job from a mysterious client',
      'The party\'s ship is impounded and they need credits fast',
      'A powerful Hutt puts a bounty on one of the characters'
    ],
    mechanics: 'Focus on deals, negotiations, and quick thinking. Make consequences matter - failed smuggling runs lead to debt, enemies, and complications. Let the characters build a reputation (good or bad).'
  },
  {
    id: 'jedi-legacy',
    name: 'Legacy of the Jedi',
    complexity: 3,
    description: 'Force-sensitive characters discover their connection to the Force and the ancient Jedi traditions, while evading Imperial Inquisitors and uncovering lost Jedi knowledge.',
    structure: {
      acts: 5,
      focus: 'Force Development and Philosophy',
      pacing: 'Epic and Mystical'
    },
    hooks: [
      'Characters discover a Jedi holocron with fragmentary training',
      'A vision in the Force leads to the ruins of a Jedi Temple',
      'An old hermit reveals they were once a Jedi Knight'
    ],
    mechanics: 'Track Force Point use carefully. Empire should actively hunt Force users. Discovery of Jedi lore should be gradual and meaningful. Include moral choices about using the Dark Side.'
  },
  {
    id: 'bounty-hunters',
    name: 'Bounty Hunter\'s Guild',
    complexity: 2,
    description: 'Professional bounty hunters taking contracts across the galaxy. Track dangerous targets, navigate the underworld, and compete with rival hunters.',
    structure: {
      acts: 3,
      focus: 'Tracking and Combat',
      pacing: 'Mission-Based'
    },
    hooks: [
      'A high-value bounty is posted by a mysterious employer',
      'The Guild assigns a team contract for a particularly dangerous mark',
      'A rival hunter tries to steal your bounty'
    ],
    mechanics: 'Each session can be a new bounty or part of a larger hunt. Emphasize investigation, tracking, and non-lethal capture when possible. Build relationships with Bounty Hunters Guild.'
  },
  {
    id: 'imperial-agents',
    name: 'Imperial Operatives',
    complexity: 2,
    description: 'Serve the Galactic Empire as elite operatives. Hunt Rebels, maintain order, root out corruption, and enforce Imperial law across the galaxy.',
    structure: {
      acts: 4,
      focus: 'Military Operations and Intelligence',
      pacing: 'Structured'
    },
    hooks: [
      'Imperial Intelligence assigns a mission to infiltrate a Rebel cell',
      'Investigate suspected corruption within Imperial ranks',
      'Track down a Jedi survivor hiding in the Outer Rim'
    ],
    mechanics: 'Characters have Imperial resources but also oversight. Include moral complexity - not all Imperial characters are evil. Show the Empire\'s perspective on maintaining order.'
  },
  {
    id: 'sector-rangers',
    name: 'Sector Rangers',
    complexity: 1,
    description: 'Maintain law and order as independent peacekeepers in the Outer Rim, dealing with pirates, protecting colonists, and solving frontier disputes.',
    structure: {
      acts: 3,
      focus: 'Law Enforcement and Frontier Justice',
      pacing: 'Western-Style Episodic'
    },
    hooks: [
      'Pirates are raiding shipping lanes in your sector',
      'A distress call comes from a remote colony under attack',
      'Two rival mining companies are on the brink of war'
    ],
    mechanics: 'Emphasize frontier justice themes. Rangers have limited resources and support. Focus on protecting the innocent and maintaining order in lawless space.'
  },
  {
    id: 'unknown-regions',
    name: 'Exploring the Unknown',
    complexity: 2,
    description: 'Chart the Unknown Regions, discover lost civilizations, encounter strange alien species, and uncover ancient mysteries beyond the galactic rim.',
    structure: {
      acts: 4,
      focus: 'Discovery and Survival',
      pacing: 'Exploratory'
    },
    hooks: [
      'An ancient star map points to uncharted territories',
      'Your ship is pulled through a mysterious hyperspace anomaly',
      'A wealthy patron funds an expedition to find a legendary world'
    ],
    mechanics: 'Create unique alien species and lost civilizations. Navigation hazards and supply management matter. Discovery should feel wondrous and dangerous.'
  },
  {
    id: 'clone-wars',
    name: 'Clone Wars Heroes',
    complexity: 3,
    description: 'Fight in the Clone Wars alongside Jedi Generals and Clone Troopers, battling Separatist forces and uncovering conspiracies that threaten the Republic.',
    structure: {
      acts: 5,
      focus: 'Large-Scale Warfare and Heroism',
      pacing: 'War Epic'
    },
    hooks: [
      'The party is assigned to a critical battle that could turn the war',
      'Intelligence suggests a Separatist super-weapon is being developed',
      'A Republic Senator may be secretly aiding the enemy'
    ],
    mechanics: 'Large-scale battles, tactical decisions, and war drama. Jedi are more common but face difficult choices. Foreshadow the Empire\'s rise and the fall of the Republic.'
  },
  {
    id: 'old-republic',
    name: 'Tales of the Old Republic',
    complexity: 3,
    description: 'Adventure in the ancient days of the Jedi Order and Sith Empire, thousands of years before the Galactic Empire. Epic conflicts between Light and Dark.',
    structure: {
      acts: 5,
      focus: 'Force Politics and Ancient Conflicts',
      pacing: 'Mythic and Epic'
    },
    hooks: [
      'The Jedi Council sends you to investigate Sith activity',
      'An ancient Sith artifact is discovered and must be secured',
      'War breaks out between the Republic and a resurgent Sith Empire'
    ],
    mechanics: 'Force users are common. Include ancient technologies and lost Force knowledge. Moral choices between Jedi philosophy and practical necessities. Sith can be complex antagonists, not just evil.'
  },
  {
    id: 'corporate-sector',
    name: 'Corporate Sector Intrigue',
    complexity: 2,
    description: 'Navigate the cutthroat world of mega-corporations in the Corporate Sector Authority, where credits rule and ethics are negotiable.',
    structure: {
      acts: 3,
      focus: 'Corporate Espionage and Economics',
      pacing: 'Tense Thriller'
    },
    hooks: [
      'Hired to steal industrial secrets from a rival corporation',
      'Investigate worker uprisings on a corporate mining colony',
      'A corporate executive is assassinated and the party are suspects'
    ],
    mechanics: 'Focus on intrigue, corporate politics, and moral compromises. Credits and connections matter more than Force powers. Include economic and social consequences.'
  },
  {
    id: 'hutt-cartel',
    name: 'Hutt Cartel Operations',
    complexity: 2,
    description: 'Work for (or against) the powerful Hutt crime families. Navigate the galactic underworld, manage criminal enterprises, and survive cartel politics.',
    structure: {
      acts: 4,
      focus: 'Criminal Empire and Survival',
      pacing: 'Dangerous and Gritty'
    },
    hooks: [
      'A Hutt crime lord recruits the party for a major operation',
      'Rival cartels are going to war and everyone must choose sides',
      'The party accidentally crosses a powerful Hutt and must make amends'
    ],
    mechanics: 'Underworld connections and reputation are crucial. Betrayal is common. Include moral complexity - some criminals have codes of honor. Show consequences of crossing the Hutts.'
  },
  {
    id: 'new-republic',
    name: 'Building the New Republic',
    complexity: 2,
    description: 'After the Empire\'s fall, help establish the New Republic. Combat Imperial remnants, mediate political disputes, and forge a new government from the ashes.',
    structure: {
      acts: 4,
      focus: 'Nation-Building and Peacekeeping',
      pacing: 'Hopeful but Challenging'
    },
    hooks: [
      'Imperial Warlords refuse to surrender and threaten border worlds',
      'Former enemies must work together to build a new government',
      'Corruption threatens to undermine the fledgling Republic'
    ],
    mechanics: 'Balance military operations with diplomacy. Show the challenges of transitioning from rebellion to governance. Not everyone welcomes the New Republic.'
  }
];

export default STARWARSD6_CAMPAIGN_FRAMES;
