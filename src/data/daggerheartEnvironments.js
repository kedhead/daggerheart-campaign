/**
 * Official Daggerheart Environments from the SRD
 * Source: https://github.com/seansbox/daggerheart-srd/tree/main/environments
 *
 * Each environment has:
 * - name: Display name
 * - tier: 1-4 (difficulty tier)
 * - type: exploration | social | combat | traversal | event
 * - difficulty: Target number for rolls
 * - description: Brief overview
 * - impulses: GM guidance for running the environment
 * - features: Array of mechanical effects/hazards
 * - potentialAdversaries: Suggested enemies
 */
import { HF_ENVIRONMENTS } from './hopeFear.js';
import { withSource, HOPE_FEAR_SOURCE } from './sources.js';

export const DAGGERHEART_ENVIRONMENTS = [
  {
    name: "Abandoned Grove",
    tier: 1,
    type: "exploration",
    difficulty: 11,
    description: "A former druidic grove lying fallow and fully reclaimed by nature. The site draws in the curious and echoes with historical events.",
    impulses: ["Draw in the curious", "Echo historical events"],
    features: [
      {
        name: "Overgrown Battlefield",
        type: "passive",
        description: "Players can investigate to uncover battle history through Instinct rolls, with information rewards based on success."
      },
      {
        name: "Barbed Vines",
        type: "hazard",
        description: "Environmental hazard that damages and restrains targets within Close range, requiring Agility saves or Finesse/Strength checks to escape."
      },
      {
        name: "You Are Not Welcome Here",
        type: "encounter",
        description: "Guardian manifestation comprising one Dryad, two Soldiers, and Treants scaling to party size."
      },
      {
        name: "Defiler",
        type: "action",
        cost: "1 Fear",
        description: "Summons a Minor Chaos Elemental to introduce combat complications and atmospheric environmental effects."
      }
    ],
    potentialAdversaries: ["Bear", "Dire Wolf", "Glass Snake", "Minor Treant", "Sylvan Soldier", "Young Dryad"]
  },
  {
    name: "Ambushed",
    tier: 1,
    type: "event",
    difficulty: 0,
    description: "An ambush is set to catch an unsuspecting party off-guard. The difficulty scales to match the strongest adversary.",
    impulses: ["Overwhelm", "Scatter", "Surround"],
    features: [
      {
        name: "Relative Strength",
        type: "passive",
        description: "The Difficulty of this environment equals that of the adversary with the highest Difficulty."
      },
      {
        name: "Surprise!",
        type: "action",
        description: "When revealed, the party gains 2 Fear and control passes to an ambushing adversary."
      }
    ],
    potentialAdversaries: ["Any - scales to encounter"]
  },
  {
    name: "Ambushers",
    tier: 1,
    type: "event",
    difficulty: 0,
    description: "The party sets an ambush to catch enemies off-guard. Turn the tables on your foes.",
    impulses: ["Strike from shadows", "Coordinate attacks", "Control the battlefield"],
    features: [
      {
        name: "Element of Surprise",
        type: "passive",
        description: "The party acts first and enemies start with 2 Fear."
      },
      {
        name: "Tactical Advantage",
        type: "passive",
        description: "Characters gain advantage on their first attack from concealment."
      }
    ],
    potentialAdversaries: ["Any - player's choice of targets"]
  },
  {
    name: "Burning Heart of the Woods",
    tier: 3,
    type: "exploration",
    difficulty: 17,
    description: "A corrupted forest centered on an eternally burning moss-covered tree with blue flames. Chaos magic saturates the area.",
    impulses: ["Spread corruption", "Consume the pure", "Resist cleansing"],
    features: [
      {
        name: "Chaos Magic",
        type: "passive",
        description: "Spellcasters must roll Fear Dice twice and use the higher result."
      },
      {
        name: "Grasping Vines",
        type: "hazard",
        description: "Thorned vines restrain targets (escapable via Finesse/Strength or 10 damage), dealing 1d8+4 damage and Hope loss when escaping."
      },
      {
        name: "Charred Constructs",
        type: "encounter",
        description: "Flame-wreathed creatures deal 3d12+3 area damage (half on Agility save)."
      },
      {
        name: "Choking Ash",
        type: "countdown",
        description: "Triggers 4d6+5 direct damage on failed Strength/Instinct rolls. Protective gear grants advantage."
      }
    ],
    potentialAdversaries: ["Bear", "Glass Snake", "Elemental Spark", "Dryad", "Oak Treant", "Stag Knight"]
  },
  {
    name: "Bustling Marketplace",
    tier: 1,
    type: "social",
    difficulty: 11,
    description: "A crowded market full of merchants, shoppers, and opportunities. Commerce and chaos intermingle.",
    impulses: ["Make a profit", "Showcase wares", "Protect inventory"],
    features: [
      {
        name: "Haggling",
        type: "passive",
        description: "Presence rolls can reduce prices or improve deals. Critical success grants significant discounts."
      },
      {
        name: "Pickpockets",
        type: "hazard",
        description: "Spend Fear to have a thief attempt to steal from a PC. Instinct roll to notice."
      },
      {
        name: "Rare Goods",
        type: "passive",
        description: "Knowledge rolls can locate unusual items or information about rare merchandise."
      }
    ],
    potentialAdversaries: ["Thief", "Merchant Guard", "Rival Trader"]
  },
  {
    name: "Castle Siege",
    tier: 3,
    type: "combat",
    difficulty: 17,
    description: "An active military siege on a fortified castle. Walls crumble, siege weapons fire, and armies clash.",
    impulses: ["Breach the walls", "Defend the keep", "Seize victory"],
    features: [
      {
        name: "Siege Weapons",
        type: "countdown",
        description: "Environmental countdown that breaches fortifications and shifts to Pitched Battle, generating 2 Fear."
      },
      {
        name: "Reinforcements!",
        type: "action",
        description: "Summon a Knight of the Realm plus minions and chosen threats to maintain pressure."
      },
      {
        name: "Collateral Damage",
        type: "reaction",
        cost: "Fear",
        description: "Convert Fear into environmental hazards forcing Agility saves and inflicting stress."
      },
      {
        name: "Secret Entrance",
        type: "passive",
        description: "Rewards player cleverness with infiltration alternatives to frontal assault."
      }
    ],
    potentialAdversaries: ["Knight of the Realm", "Archer Guard", "Siege Engineer", "Mercenary"]
  },
  {
    name: "Chaos Realm",
    tier: 4,
    type: "exploration",
    difficulty: 20,
    description: "A plane of pure chaos where reality itself is unstable. Laws of nature do not apply.",
    impulses: ["Warp reality", "Consume order", "Spread madness"],
    features: [
      {
        name: "Reality Flux",
        type: "passive",
        description: "At the start of each round, roll to determine a random environmental effect."
      },
      {
        name: "Chaos Corruption",
        type: "hazard",
        description: "Characters mark Stress at the end of each scene spent in the realm."
      },
      {
        name: "Unstable Ground",
        type: "hazard",
        description: "Movement requires Agility checks. Failure causes teleportation to random location within Far range."
      }
    ],
    potentialAdversaries: ["Chaos Elemental", "Reality Shaper", "Void Creature"]
  },
  {
    name: "Cliffside Ascent",
    tier: 2,
    type: "traversal",
    difficulty: 13,
    description: "A treacherous climb up a sheer cliff face. One wrong move means a deadly fall.",
    impulses: ["Test endurance", "Punish carelessness", "Reward preparation"],
    features: [
      {
        name: "Climbing Challenge",
        type: "countdown",
        description: "Progress countdown requiring successful Agility or Strength rolls to advance."
      },
      {
        name: "Loose Rock",
        type: "hazard",
        description: "Failed rolls trigger rockfall dealing 2d6 damage to climber and anyone below."
      },
      {
        name: "Exhaustion",
        type: "passive",
        description: "Each failed climbing attempt costs 1 Stress."
      }
    ],
    potentialAdversaries: ["Mountain Goat", "Rock Elemental", "Cliff Dweller"]
  },
  {
    name: "Cult Ritual",
    tier: 2,
    type: "event",
    difficulty: 14,
    description: "Dark cultists perform a forbidden ritual. Time is running out to stop them.",
    impulses: ["Complete the ritual", "Protect the casters", "Summon the darkness"],
    features: [
      {
        name: "Ritual Progress",
        type: "countdown",
        description: "The ritual completes when the countdown ends. Each round, the GM advances it by 1."
      },
      {
        name: "Cultist Fervor",
        type: "passive",
        description: "Cultists fight to the death and cannot be reasoned with during the ritual."
      },
      {
        name: "Dark Summoning",
        type: "action",
        cost: "2 Fear",
        description: "If the ritual completes, summon a powerful demon or undead horror."
      }
    ],
    potentialAdversaries: ["Cultist", "Cult Leader", "Summoned Horror"]
  },
  {
    name: "Divine Usurpation",
    tier: 4,
    type: "combat",
    difficulty: 21,
    description: "A battle against a being attempting to claim divine power. The fate of the world hangs in the balance.",
    impulses: ["Ascend to godhood", "Crush all opposition", "Remake reality"],
    features: [
      {
        name: "Divine Power",
        type: "passive",
        description: "The usurper can spend Fear to negate any single action or effect once per round."
      },
      {
        name: "Reality Warp",
        type: "action",
        cost: "2 Fear",
        description: "Change a fundamental aspect of the battlefield (gravity, time, space)."
      },
      {
        name: "Faithful Intervention",
        type: "reaction",
        description: "When a PC would die, divine allies may intervene if the party has earned their favor."
      }
    ],
    potentialAdversaries: ["Ascending Mortal", "Divine Avatar", "Corrupted Angel"]
  },
  {
    name: "Hallowed Temple",
    tier: 2,
    type: "social",
    difficulty: 13,
    description: "A well-maintained temple functioning as both healing sanctuary and worship site, managed by devoted clergy.",
    impulses: ["Connect mortal and divine", "Provide aid to worshippers", "Maintain sacred traditions"],
    features: [
      {
        name: "A Place of Healing",
        type: "passive",
        description: "A PC who takes a rest in the Hallowed Temple automatically clears all HP."
      },
      {
        name: "Divine Guidance",
        type: "passive",
        description: "Characters can make Instinct Rolls while praying to receive divine answers. Rolls targeting unwelcome deities have disadvantage."
      },
      {
        name: "Relentless Hope",
        type: "reaction",
        description: "Once per scene, each PC may spend Stress to convert Fear results into Hope results."
      },
      {
        name: "Divine Censure",
        type: "reaction",
        cost: "Fear",
        description: "When transgressions occur, summon a High Seraph and 1d4 Bladed Guards near the senior priest."
      }
    ],
    potentialAdversaries: ["Archer Guard", "Bladed Guard", "Head Guard", "High Seraph"]
  },
  {
    name: "Haunted City",
    tier: 3,
    type: "exploration",
    difficulty: 16,
    description: "An abandoned city where the dead do not rest. Spirits and undead roam the empty streets.",
    impulses: ["Guard ancient secrets", "Punish the living", "Relive past tragedies"],
    features: [
      {
        name: "Restless Dead",
        type: "passive",
        description: "Undead encounters are twice as likely. Noise attracts spectral attention."
      },
      {
        name: "Ghostly Visions",
        type: "passive",
        description: "Characters may witness echoes of the past, gaining clues but potentially marking Stress."
      },
      {
        name: "Possession",
        type: "action",
        cost: "2 Fear",
        description: "A spirit attempts to possess a PC. Presence roll to resist or lose control for one round."
      }
    ],
    potentialAdversaries: ["Ghost", "Skeleton", "Zombie", "Wraith", "Spectral Knight"]
  },
  {
    name: "Imperial Court",
    tier: 2,
    type: "social",
    difficulty: 14,
    description: "The seat of political power where nobles scheme and alliances shift. Words are weapons here.",
    impulses: ["Accumulate power", "Undermine rivals", "Maintain appearances"],
    features: [
      {
        name: "Political Intrigue",
        type: "passive",
        description: "Presence and Knowledge rolls determine social success. Failure creates enemies."
      },
      {
        name: "Whispered Secrets",
        type: "passive",
        description: "Characters can gather information but risk being overheard themselves."
      },
      {
        name: "Royal Summons",
        type: "action",
        description: "The monarch demands an audience. Refusing has severe consequences."
      }
    ],
    potentialAdversaries: ["Noble", "Royal Guard", "Court Assassin", "Rival Noble"]
  },
  {
    name: "Local Tavern",
    tier: 1,
    type: "social",
    difficulty: 10,
    description: "A community gathering space for adventurers. Opportunities and rumors flow as freely as the ale.",
    impulses: ["Provide opportunities for adventurers", "Nurture community"],
    features: [
      {
        name: "Information Gathering",
        type: "passive",
        description: "Presence checks with staff and patrons can reveal rumors, job opportunities, folklore, or gossip."
      },
      {
        name: "Performance",
        type: "action",
        description: "A character may perform for patrons to earn 1d4 handfuls of gold (2d4 on critical success)."
      },
      {
        name: "Mysterious Stranger",
        type: "passive",
        description: "The tavern can introduce NPCs seeking to hire the party or connect with character backgrounds."
      },
      {
        name: "Bar Fight",
        type: "action",
        cost: "1 Fear",
        description: "A bar fight erupts, requiring Agility or Presence rolls to navigate safely."
      }
    ],
    potentialAdversaries: ["Drunkard", "Guard", "Mercenary", "Merchant"]
  },
  {
    name: "Mountain Pass",
    tier: 2,
    type: "traversal",
    difficulty: 13,
    description: "A narrow path through treacherous mountains. Weather and terrain conspire against travelers.",
    impulses: ["Test endurance", "Isolate travelers", "Guard ancient paths"],
    features: [
      {
        name: "Treacherous Footing",
        type: "passive",
        description: "Movement at more than normal pace requires Agility checks or risk falling."
      },
      {
        name: "Mountain Weather",
        type: "countdown",
        description: "A storm approaches. When complete, visibility drops and all checks have disadvantage."
      },
      {
        name: "Avalanche",
        type: "action",
        cost: "2 Fear",
        description: "Trigger an avalanche. All characters in the path make Agility saves or take 3d10 damage and are buried."
      }
    ],
    potentialAdversaries: ["Mountain Bandit", "Wolf Pack", "Ice Elemental", "Yeti"]
  },
  {
    name: "Necromancer's Ossuary",
    tier: 3,
    type: "exploration",
    difficulty: 17,
    description: "A bone-filled underground lair where a necromancer conducts dark experiments. Death magic permeates every surface.",
    impulses: ["Expand the undead army", "Protect dark secrets", "Harvest life force"],
    features: [
      {
        name: "Bone Constructs",
        type: "passive",
        description: "The walls and floor can animate. Undead can emerge from any surface."
      },
      {
        name: "Life Drain",
        type: "hazard",
        description: "Characters mark 1 Stress at the end of each scene. The necromancer heals equal HP."
      },
      {
        name: "Raise Dead",
        type: "action",
        cost: "1 Fear",
        description: "Animate fallen enemies or corpses in the area as undead minions."
      }
    ],
    potentialAdversaries: ["Skeleton", "Zombie", "Bone Golem", "Necromancer", "Death Knight"]
  },
  {
    name: "Outpost Town",
    tier: 1,
    type: "social",
    difficulty: 11,
    description: "A frontier settlement on the edge of civilization. Resources are scarce and dangers lurk beyond the walls.",
    impulses: ["Survive the frontier", "Protect the community", "Trade for necessities"],
    features: [
      {
        name: "Frontier Trade",
        type: "passive",
        description: "Basic supplies available but rare items cost double. Unique frontier goods may be found."
      },
      {
        name: "Local Troubles",
        type: "passive",
        description: "The town always has problems that need solving - monster attacks, bandit raids, missing persons."
      },
      {
        name: "Militia Call",
        type: "action",
        description: "In emergencies, the town can muster a militia of commoners to assist."
      }
    ],
    potentialAdversaries: ["Bandit", "Wild Beast", "Frontier Criminal"]
  },
  {
    name: "Pitched Battle",
    tier: 3,
    type: "combat",
    difficulty: 17,
    description: "A large-scale battle between two substantial armed forces. Chaos reigns and danger surrounds all who enter.",
    impulses: ["Seize people, land, and wealth", "Spill blood for greed and glory"],
    features: [
      {
        name: "Adrift on a Sea of Steel",
        type: "passive",
        description: "Movement requires Agility Rolls, limited to Close range. When adversaries are in Melee, spend Stress to attempt movement."
      },
      {
        name: "Raze and Pillage",
        type: "action",
        description: "Attackers escalate with destruction - arson, theft, kidnapping - forcing difficult choices."
      },
      {
        name: "War Magic",
        type: "action",
        cost: "1 Fear",
        description: "A mage targets an area within Very Far range. All in Close range make Agility saves or take 3d12+8 magic damage and mark Stress."
      },
      {
        name: "Reinforcements!",
        type: "action",
        description: "Summon one Knight of the Realm, Tier 3 Minions equal to PC count, and two chosen adversaries within Far range."
      }
    ],
    potentialAdversaries: ["Knight of the Realm", "Soldier", "War Mage", "Mercenary Captain"]
  },
  {
    name: "Raging River",
    tier: 1,
    type: "traversal",
    difficulty: 10,
    description: "A fast-moving river without bridge access, deep enough to overwhelm unprepared travelers.",
    impulses: ["Block crossing attempts", "Sweep away the unprepared", "Separate territories"],
    features: [
      {
        name: "Dangerous Crossing",
        type: "countdown",
        description: "Requires completing a 4-step Progress Countdown. Failed rolls with Fear trigger Undertow."
      },
      {
        name: "Undertow",
        type: "action",
        cost: "1 Fear",
        description: "Target makes Agility save. Failure: 1d6+1 physical damage, moved downriver Close distance, Vulnerable until escaping. Success: mark Stress."
      },
      {
        name: "Patient Hunter",
        type: "action",
        cost: "1 Fear",
        description: "Summon a Glass Snake within Close range of a PC. It immediately uses Spinning Serpent."
      }
    ],
    potentialAdversaries: ["Bear", "Glass Snake", "Jagged Knife Bandit", "River Creature"]
  }
];

// Helper functions for filtering
// Hope & Fear expansion environments.
DAGGERHEART_ENVIRONMENTS.push(...withSource(HF_ENVIRONMENTS, HOPE_FEAR_SOURCE));

export const getEnvironmentsByTier = (tier) =>
  DAGGERHEART_ENVIRONMENTS.filter(e => e.tier === tier);

export const getEnvironmentsByType = (type) =>
  DAGGERHEART_ENVIRONMENTS.filter(e => e.type === type);

export const ENVIRONMENT_TYPES = ['exploration', 'social', 'combat', 'traversal', 'event'];

export const ENVIRONMENT_TIERS = [1, 2, 3, 4];

export default DAGGERHEART_ENVIRONMENTS;
