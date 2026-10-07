// Daggerheart Game System Definition
import { HF_CLASSES, HF_SUBCLASSES, HF_ANCESTRIES, HF_COMMUNITIES, HF_DOMAIN_CARDS } from '../hopeFear.js';
import { isSourceEnabled, HOPE_FEAR_SOURCE } from '../sources.js';
// Official Daggerheart RPG system by Darrington Press

const CLASSES = {
  'Bard': {
    domains: ['Grace', 'Codex'],
    baseEvasion: 10,
    baseHp: 5,
    description: 'Masters of performance and magic who inspire allies and manipulate the battlefield through music, words, and arcane arts.',
    features: 'Make a Scene, Rally',
    hopeFeature: { name: 'Make a Scene', description: 'Spend 3 Hope to temporarily Distract a target within Close range, giving them a -2 penalty to their Difficulty.' },
    classFeatures: [
      { name: 'Rally', description: 'Once per session, describe how you rally the party and give yourself and each of your allies a Rally Die. At level 1, your Rally Die is a d6. A PC can spend their Rally Die to roll it, adding the result to their action roll, reaction roll, damage roll, or to clear a number of Stress equal to the result. At the end of each session, clear all unspent Rally Dice.\nAt level 5, your Rally Die increases to a d8.' }
    ]
  },
  'Druid': {
    domains: ['Sage', 'Arcana'],
    baseEvasion: 10,
    baseHp: 6,
    description: 'Nature-bound spellcasters who can shapeshift into beasts and command the primal forces of the natural world.',
    features: 'Evolution, Beastform, Wildtouch',
    hopeFeature: { name: 'Evolution', description: 'Spend 3 Hope to transform into a Beastform without marking a Stress. When you do, choose one trait to raise by +1 until you drop out of that Beastform.' },
    classFeatures: [
      { name: 'Beastform', description: 'Mark a Stress to magically transform into a creature of your tier or lower from the Beastform list. You can drop out of this form at any time. While transformed, you can\'t use weapons or cast spells from domain cards, but you can still use other features or abilities you have access to. Spells you cast before you transform stay active and last for their normal duration, and you can talk and communicate as normal. Additionally, you gain the Beastform\'s features, add their Evasion bonus to your Evasion, and use the trait specified in their statistics for your attack. While you\'re in a Beastform, your armor becomes part of your body and you mark Armor Slots as usual; when you drop out of a Beastform, those marked Armor Slots remain marked. If you mark your last Hit Point, you automatically drop out of this form.' },
      { name: 'Wildtouch', description: 'You can perform harmless, subtle effects that involve nature—such as causing a flower to rapidly grow, summoning a slight gust of wind, or starting a campfire—at will.' }
    ]
  },
  'Guardian': {
    domains: ['Valor', 'Blade'],
    baseEvasion: 9,
    baseHp: 7,
    description: 'Stalwart defenders who protect their allies and control the battlefield through martial prowess and protective abilities.',
    features: 'Frontline Tank, Unstoppable',
    hopeFeature: { name: 'Frontline Tank', description: 'Spend 3 Hope to clear 2 Armor Slots.' },
    classFeatures: [
      { name: 'Unstoppable', description: 'Once per long rest, you can become Unstoppable. You gain an Unstoppable Die. At level 1, your Unstoppable Die is a d4. Place it on your character sheet in the space provided, starting with the 1 value facing up. After you make a damage roll that deals 1 or more Hit Points to a target, increase the Unstoppable Die value by one. When the die\'s value would exceed its maximum value or when the scene ends, remove the die and drop out of Unstoppable. At level 5, your Unstoppable Die increases to a d6.\nWhile Unstoppable, you gain the following benefits:\n• You reduce the severity of physical damage by one threshold (Severe to Major, Major to Minor, Minor to None).\n• You add the current value of the Unstoppable Die to your damage roll.\n• You can\'t be Restrained or Vulnerable.' }
    ]
  },
  'Ranger': {
    domains: ['Bone', 'Sage'],
    baseEvasion: 12,
    baseHp: 6,
    description: 'Wilderness experts who excel at tracking, survival, and ranged combat while forging bonds with animal companions.',
    features: 'Hold Them Off, Ranger\'s Focus',
    hopeFeature: { name: 'Hold Them Off', description: 'Spend 3 Hope when you succeed on an attack with a weapon to use that same roll against two additional adversaries within range of the attack.' },
    classFeatures: [
      { name: 'Ranger\'s Focus', description: 'Spend a Hope and make an attack against a target. On a success, deal your attack\'s normal damage and temporarily make the attack\'s target your Focus. Until this feature ends or you make a different creature your Focus, you gain the following benefits against your Focus:\n• You know precisely what direction they are in.\n• When you deal damage to them, they must mark a Stress.\n• When you fail an attack against them, you can end your Ranger\'s Focus feature to reroll your Duality Dice.' }
    ]
  },
  'Rogue': {
    domains: ['Midnight', 'Grace'],
    baseEvasion: 12,
    baseHp: 6,
    description: 'Cunning and agile specialists in stealth, deception, and precision strikes who excel at exploiting enemy weaknesses.',
    features: 'Rogue\'s Dodge, Cloaked, Sneak Attack',
    hopeFeature: { name: 'Rogue\'s Dodge', description: 'Spend 3 Hope to gain a +2 bonus to your Evasion until the next time an attack succeeds against you. Otherwise, this bonus lasts until your next rest.' },
    classFeatures: [
      { name: 'Cloaked', description: 'Any time you would be Hidden, you are instead Cloaked. In addition to the benefits of the Hidden condition, while Cloaked you remain unseen if you are stationary when an adversary moves to where they would normally see you. After you make an attack or end a move within line of sight of an adversary, you are no longer Cloaked.' },
      { name: 'Sneak Attack', description: 'When you succeed on an attack while Cloaked or while an ally is within Melee range of your target, add a number of d6s equal to your tier to your damage roll.' }
    ]
  },
  'Seraph': {
    domains: ['Splendor', 'Valor'],
    baseEvasion: 9,
    baseHp: 7,
    description: 'Divine warriors who channel celestial power to heal allies and smite foes with radiant energy.',
    features: 'Life Support, Prayer Dice',
    hopeFeature: { name: 'Life Support', description: 'Spend 3 Hope to clear a Hit Point on an ally within Close range.' },
    classFeatures: [
      { name: 'Prayer Dice', description: 'At the beginning of each session, roll a number of d4s equal to your subclass\'s Spellcast trait and place them on your character sheet in the space provided. These are your Prayer Dice. You can spend any number of Prayer Dice to aid yourself or an ally within Far range. You can use a spent die\'s value to reduce incoming damage, add to a roll\'s result after the roll is made, or gain Hope equal to the result. At the end of each session, clear all unspent Prayer Dice.' }
    ]
  },
  'Sorcerer': {
    domains: ['Arcana', 'Midnight'],
    baseEvasion: 10,
    baseHp: 6,
    description: 'Innate spellcasters whose magic flows from within, allowing them to bend and shape magical energy in unique ways.',
    features: 'Volatile Magic, Arcane Sense, Minor Illusion, Channel Raw Power',
    hopeFeature: { name: 'Volatile Magic', description: 'Spend 3 Hope to reroll any number of your damage dice on an attack that deals magic damage.' },
    classFeatures: [
      { name: 'Arcane Sense', description: 'You can sense the presence of magical people and objects within Close range.' },
      { name: 'Minor Illusion', description: 'Make a Spellcast Roll (10). On a success, you create a minor visual illusion no larger than yourself within Close range. This illusion is convincing to anyone at Close range or farther.' },
      { name: 'Channel Raw Power', description: 'Once per long rest, you can place a domain card from your loadout into your vault and choose to either:\n• Gain Hope equal to the level of the card.\n• Enhance a spell that deals damage, gaining a bonus to your damage roll equal to twice the level of the card.' }
    ]
  },
  'Warrior': {
    domains: ['Blade', 'Bone'],
    baseEvasion: 11,
    baseHp: 6,
    description: 'Masters of combat who excel in both offense and defense through superior weapon skills and battle tactics.',
    features: 'No Mercy, Attack of Opportunity, Combat Training',
    hopeFeature: { name: 'No Mercy', description: 'Spend 3 Hope to gain a +1 bonus to your attack rolls until your next rest.' },
    classFeatures: [
      { name: 'Attack of Opportunity', description: 'If an adversary within Melee range attempts to leave that range, make a reaction roll using a trait of your choice against their Difficulty. Choose one effect on a success, or two if you critically succeed:\n• They can\'t move from where they are.\n• You deal damage to them equal to your primary weapon\'s damage.\n• You move with them.' },
      { name: 'Combat Training', description: 'You ignore burden when equipping weapons. When you deal physical damage, you gain a bonus to your damage roll equal to your level.' }
    ]
  },
  'Wizard': {
    domains: ['Codex', 'Splendor'],
    baseEvasion: 11,
    baseHp: 5,
    description: 'Scholarly mages who study the arcane arts and command a vast repertoire of spells through knowledge and preparation.',
    features: 'Not This Time, Prestidigitation, Strange Patterns',
    hopeFeature: { name: 'Not This Time', description: 'Spend 3 Hope to force an adversary within Far range to reroll an attack or damage roll.' },
    classFeatures: [
      { name: 'Prestidigitation', description: 'You can perform harmless, subtle magical effects at will. For example, you can change an object\'s color, create a smell, light a candle, cause a tiny object to float, illuminate a room, or repair a small object.' },
      { name: 'Strange Patterns', description: 'Choose a number between 1 and 12. When you roll that number on a Duality Die, gain a Hope or clear a Stress. You can change this number when you take a long rest.' }
    ]
  }
};

const SUBCLASSES = {
  'Bard': [
    {
      name: 'Troubadour',
      description: 'Play the Troubadour if you want to play music to bolster your allies.',
      spellcastTrait: 'Presence',
      foundation: { name: 'Gifted Performer', description: 'Describe how you perform for others. You can play each song once per long rest:\n• Relaxing Song: You and all allies within Close range clear a Hit Point.\n• Epic Song: Make a target within Close range temporarily Vulnerable.\n• Heartbreaking Song: You and all allies within Close range gain a Hope.' },
      specialization: { name: 'Maestro', description: 'Your rallying songs steel the courage of those who listen. When you give a Rally Die to an ally, they can gain a Hope or clear a Stress.' },
      mastery: { name: 'Virtuoso', description: 'You are among the greatest of your craft and your skill is boundless. You can perform each of your "Gifted Performer" feature\'s songs twice instead of once per long rest.' }
    },
    {
      name: 'Wordsmith',
      description: 'Play the Wordsmith if you want to use clever wordplay and captivate crowds.',
      spellcastTrait: 'Presence',
      foundation: { name: 'Rousing Speech / Heart of a Poet', description: 'Rousing Speech: Once per long rest, you can give a heartfelt, inspiring speech. All allies within Far range clear 2 Stress.\nHeart of a Poet: After you make an action roll to impress, persuade, or offend someone, you can spend a Hope to add a d4 to the roll.' },
      specialization: { name: 'Eloquent', description: 'Your moving words boost morale. Once per session, when you encourage an ally, you can do one of the following:\n• Allow them to find a mundane object or tool they need.\n• Help an Ally without spending Hope.\n• Give them an additional downtime move during their next rest.' },
      mastery: { name: 'Epic Poetry', description: 'Your Rally Die increases to a d10. Additionally, when you Help an Ally, you can narrate the moment as if you were writing the tale of their heroism in a memoir. When you do, roll a d10 as your advantage die.' }
    }
  ],
  'Druid': [
    {
      name: 'Warden of the Elements',
      description: 'Play the Warden of the Elements if you want to embody the natural elements of the wild.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Elemental Incarnation', description: 'Mark a Stress to Channel one of the following elements until you take Severe damage or until your next rest:\n• Fire: When an adversary within Melee range deals damage to you, they take 1d10 magic damage.\n• Earth: Gain a bonus to your damage thresholds equal to your Proficiency.\n• Water: When you deal damage to an adversary within Melee range, all other adversaries within Very Close range must mark a Stress.\n• Air: You can hover, gaining advantage on Agility Rolls.' },
      specialization: { name: 'Elemental Aura', description: 'Once per rest while Channeling, you can assume an aura matching your element. The aura affects targets within Close range until your Channeling ends.\n• Fire: When an adversary marks 1 or more Hit Points, they must also mark a Stress.\n• Earth: Your allies gain a +1 bonus to Strength.\n• Water: When an adversary deals damage to you, you can mark a Stress to move them anywhere within Very Close range of where they are.\n• Air: When you or an ally takes damage from an attack beyond Melee range, reduce the damage by 1d8.' },
      mastery: { name: 'Elemental Dominion', description: 'You further embody your element. While Channeling, you gain the following benefit:\n• Fire: You gain a +1 bonus to your Proficiency for attacks and spells that deal damage.\n• Earth: When you would mark Hit Points, roll a d6 per Hit Point marked. For each result of 6, reduce the number of Hit Points you mark by 1.\n• Water: When an attack against you succeeds, you can mark a Stress to make the attacker temporarily Vulnerable.\n• Air: You gain a +1 bonus to your Evasion and can fly.' }
    },
    {
      name: 'Warden of Renewal',
      description: 'Play the Warden of Renewal if you want to use powerful magic to heal your party.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Clarity of Nature / Regeneration', description: 'Clarity of Nature: Once per long rest, you can create a space of natural serenity within Close range. When you spend a few minutes resting within the space, clear Stress equal to your Instinct, distributed as you choose between you and your allies.\nRegeneration: Touch a creature and spend 3 Hope. That creature clears 1d4 Hit Points.' },
      specialization: { name: 'Regenerative Reach / Warden\'s Protection', description: 'Regenerative Reach: You can target creatures within Very Close range with your "Regeneration" feature.\nWarden\'s Protection: Once per long rest, spend 2 Hope to clear 2 Hit Points on 1d4 allies within Close range.' },
      mastery: { name: 'Defender', description: 'Your animal transformation embodies a healing guardian spirit. When you\'re in Beastform and an ally within Close range marks 2 or more Hit Points, you can mark a Stress to reduce the number of Hit Points they mark by 1.' }
    }
  ],
  'Guardian': [
    {
      name: 'Stalwart',
      description: 'Play the Stalwart if you want to take heavy blows and keep fighting.',
      foundation: { name: 'Unwavering / Iron Will', description: 'Unwavering: Gain a permanent +1 bonus to your damage thresholds.\nIron Will: When you take physical damage, you can mark an additional Armor Slot to reduce the severity.' },
      specialization: { name: 'Unrelenting / Partners-in-Arms', description: 'Unrelenting: Gain a permanent +2 bonus to your damage thresholds.\nPartners-in-Arms: When an ally within Very Close range takes damage, you can mark an Armor Slot to reduce the severity by one threshold.' },
      mastery: { name: 'Undaunted / Loyal Protector', description: 'Undaunted: Gain a permanent +3 bonus to your damage thresholds.\nLoyal Protector: When an ally within Close range has 2 or fewer Hit Points and would take damage, you can mark a Stress to sprint to their side and take the damage instead.' }
    },
    {
      name: 'Vengeance',
      description: 'Play the Vengeance if you want to strike down enemies who harm you or your allies.',
      foundation: { name: 'At Ease / Revenge', description: 'At Ease: Gain an additional Stress slot.\nRevenge: When an adversary within Melee range succeeds on an attack against you, you can mark 2 Stress to force the attacker to mark a Hit Point.' },
      specialization: { name: 'Act of Reprisal', description: 'When an adversary damages an ally within Melee range, you gain a +1 bonus to your Proficiency for the next successful attack you make against that adversary.' },
      mastery: { name: 'Nemesis', description: 'Spend 2 Hope to Prioritize an adversary until your next rest. When you make an attack against your Prioritized adversary, you can swap the results of your Hope and Fear Dice. You can only Prioritize one adversary at a time.' }
    }
  ],
  'Ranger': [
    {
      name: 'Beastbound',
      description: 'Play the Beastbound if you want to form a deep bond with an animal ally.',
      spellcastTrait: 'Agility',
      foundation: { name: 'Companion', description: 'You have an animal companion of your choice (at the GM\'s discretion). They stay by your side unless you tell them otherwise.\nTake the Ranger Companion sheet. When you level up your character, choose a level-up option for your companion from this sheet as well.' },
      specialization: { name: 'Expert Training / Battle-Bonded', description: 'Expert Training: Choose an additional level-up option for your companion.\nBattle-Bonded: When an adversary attacks you while they\'re within your companion\'s Melee range, you gain a +2 bonus to your Evasion against the attack.' },
      mastery: { name: 'Advanced Training / Loyal Friend', description: 'Advanced Training: Choose two additional level-up options for your companion.\nLoyal Friend: Once per long rest, when the damage from an attack would mark your companion\'s last Stress or your last Hit Point and you\'re within Close range of each other, you or your companion can rush to the other\'s side and take that damage instead.' }
    },
    {
      name: 'Wayfinder',
      description: 'Play the Wayfinder if you want to hunt your prey and strike with deadly force.',
      spellcastTrait: 'Agility',
      foundation: { name: 'Ruthless Predator / Path Forward', description: 'Ruthless Predator: When you make a damage roll, you can mark a Stress to gain a +1 bonus to your Proficiency. Additionally, when you deal Severe damage to an adversary, they must mark a Stress.\nPath Forward: When you\'re traveling to a place you\'ve previously visited or you carry an object that has been at the location before, you can identify the shortest, most direct path to your destination.' },
      specialization: { name: 'Elusive Predator', description: 'When your Focus makes an attack against you, you gain a +2 bonus to your Evasion against the attack.' },
      mastery: { name: 'Apex Predator', description: 'Before you make an attack roll against your Focus, you can spend a Hope. On a successful attack, you remove a Fear from the GM\'s Fear pool.' }
    }
  ],
  'Rogue': [
    {
      name: 'Nightwalker',
      description: 'Play the Nightwalker if you want to manipulate shadows to maneuver through the environment.',
      spellcastTrait: 'Finesse',
      foundation: { name: 'Shadow Stepper', description: 'You can move from shadow to shadow. When you move into an area of darkness or a shadow cast by another creature or object, you can mark a Stress to disappear from where you are and reappear inside another shadow within Far range. When you reappear, you are Cloaked.' },
      specialization: { name: 'Dark Cloud / Adrenaline', description: 'Dark Cloud: Make a Spellcast Roll (15). On a success, create a temporary dark cloud that covers any area within Close range. Anyone in this cloud can\'t see outside of it, and anyone outside of it can\'t see in. You\'re considered Cloaked from any adversary for whom the cloud blocks line of sight.\nAdrenaline: While you\'re Vulnerable, add your level to your damage rolls.' },
      mastery: { name: 'Fleeting Shadow / Vanishing Act', description: 'Fleeting Shadow: Gain a permanent +1 bonus to your Evasion. You can use your "Shadow Stepper" feature to move within Very Far range.\nVanishing Act: Mark a Stress to become Cloaked at any time. When Cloaked from this feature, you automatically clear the Restrained condition if you have it. You remain Cloaked in this way until you roll with Fear or until your next rest.' }
    },
    {
      name: 'Syndicate',
      description: 'Play the Syndicate if you want to have a web of contacts everywhere you go.',
      spellcastTrait: 'Finesse',
      foundation: { name: 'Well-Connected', description: 'When you arrive in a prominent town or environment, you know somebody who calls this place home. Give them a name, note how you think they could be useful, and choose one fact from the following list:\n• They owe me a favor, but they\'ll be hard to find.\n• They\'re going to ask for something in exchange.\n• They\'re always in a great deal of trouble.\n• We used to be together. It\'s a long story.\n• We didn\'t part on great terms.' },
      specialization: { name: 'Contacts Everywhere', description: 'Once per session, you can briefly call on a shady contact. Choose one of the following benefits and describe what brought them here to help you in this moment:\n• They provide 1 handful of gold, a unique tool, or a mundane object that the situation requires.\n• On your next action roll, their help provides a +3 bonus to the result of your Hope or Fear Die.\n• The next time you deal damage, they snipe from the shadows, adding 2d8 to your damage roll.' },
      mastery: { name: 'Reliable Backup', description: 'You can use your "Contacts Everywhere" feature three times per session. The following options are added to the list of benefits you can choose from when you use that feature:\n• When you mark 1 or more Hit Points, they can rush out to shield you, reducing the Hit Points marked by 1.\n• When you make a Presence Roll in conversation, they back you up. You can roll a d20 as your Hope Die.' }
    }
  ],
  'Seraph': [
    {
      name: 'Divine Wielder',
      description: 'Play the Divine Wielder if you want to dominate the battlefield with a legendary weapon.',
      spellcastTrait: 'Strength',
      foundation: { name: 'Spirit Weapon / Sparing Touch', description: 'Spirit Weapon: When you have an equipped weapon with a range of Melee or Very Close, it can fly from your hand to attack an adversary within Close range and then return to you. You can mark a Stress to target an additional adversary within range with the same attack roll.\nSparing Touch: Once per long rest, touch a creature and clear 2 Hit Points or 2 Stress from them.' },
      specialization: { name: 'Devout', description: 'When you roll your Prayer Dice, you can roll an additional die and discard the lowest result. Additionally, you can use your "Sparing Touch" feature twice instead of once per long rest.' },
      mastery: { name: 'Sacred Resonance', description: 'When you roll damage for your "Spirit Weapon" feature, if any of the die results match, double the value of each matching die. For example, if you roll two 5s, they count as two 10s.' }
    },
    {
      name: 'Winged Sentinel',
      description: 'Play the Winged Sentinel if you want to take flight and strike crushing blows from the sky.',
      spellcastTrait: 'Strength',
      foundation: { name: 'Wings of Light', description: 'You can fly. While flying, you can do the following:\n• Mark a Stress to pick up and carry another willing creature approximately your size or smaller.\n• Spend a Hope to deal an extra 1d8 damage on a successful attack.' },
      specialization: { name: 'Ethereal Visage', description: 'Your supernatural visage strikes awe and fear. While flying, you have advantage on Presence Rolls. When you succeed with Hope on a Presence Roll, you can remove a Fear from the GM\'s Fear pool instead of gaining Hope.' },
      mastery: { name: 'Ascendant / Power of the Gods', description: 'Ascendant: Gain a permanent +4 bonus to your Severe damage threshold.\nPower of the Gods: While flying, you deal an extra 1d12 damage instead of 1d8 from your "Wings of Light" feature.' }
    }
  ],
  'Sorcerer': [
    {
      name: 'Elemental Origin',
      description: 'Play the Elemental Origin if you want to channel raw magic to take the shape of a particular element.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Elementalist', description: 'Choose one of the following elements at character creation: air, earth, fire, lightning, water.\nYou can shape this element into harmless effects. Additionally, spend a Hope and describe how your control over this element helps an action roll you\'re about to make, then either gain a +2 bonus to the roll or a +3 bonus to the roll\'s damage.' },
      specialization: { name: 'Natural Evasion', description: 'You can call forth your element to protect you from harm. When an attack roll against you succeeds, you can mark a Stress and describe how you use your element to defend you. When you do, roll a d6 and add its result to your Evasion against the attack.' },
      mastery: { name: 'Transcendence', description: 'Once per long rest, you can transform into a physical manifestation of your element. When you do, describe your transformation and choose two of the following benefits to gain until your next rest:\n• +4 bonus to your Severe threshold\n• +1 bonus to a character trait of your choice\n• +1 bonus to your Proficiency\n• +2 bonus to your Evasion' }
    },
    {
      name: 'Primal Origin',
      description: 'Play the Primal Origin if you want to extend the versatility of your spells in powerful ways.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Manipulate Magic', description: 'Your primal origin allows you to modify the essence of magic itself. After you cast a spell or make an attack using a weapon that deals magic damage, you can mark a Stress to do one of the following:\n• Extend the spell or attack\'s reach by one range\n• Gain a +2 bonus to the action roll\'s result\n• Double a damage die of your choice\n• Hit an additional target within range' },
      specialization: { name: 'Enchanted Aid', description: 'You can enhance the magic of others with your essence. When you Help an Ally with a Spellcast Roll, you can roll a d8 as your advantage die. Once per long rest, after an ally has made a Spellcast Roll with your help, you can swap the results of their Duality Dice.' },
      mastery: { name: 'Arcane Charge', description: 'You can gather magical energy to enhance your capabilities. When you take magic damage, you become Charged. Alternatively, you can spend 2 Hope to become Charged. When you successfully make an attack that deals magic damage while Charged, you can clear your Charge to either gain a +10 bonus to the damage roll or gain a +3 bonus to the Difficulty of a reaction roll the spell causes the target to make. You stop being Charged at your next long rest.' }
    }
  ],
  'Warrior': [
    {
      name: 'Call of the Brave',
      description: 'Play the Call of the Brave if you want to use the might of your enemies to fuel your own power.',
      foundation: { name: 'Courage / Battle Ritual', description: 'Courage: When you fail a roll with Fear, you gain a Hope.\nBattle Ritual: Once per long rest, before you attempt something incredibly dangerous or face off against a foe who clearly outmatches you, describe what ritual you perform or preparations you make. When you do, clear 2 Stress and gain 2 Hope.' },
      specialization: { name: 'Rise to the Challenge', description: 'You are vigilant in the face of mounting danger. While you have 2 or fewer Hit Points unmarked, you can roll a d20 as your Hope Die.' },
      mastery: { name: 'Camaraderie', description: 'Your unwavering bravery is a rallying point for your allies. You can initiate a Tag Team Roll one additional time per session. Additionally, when an ally initiates a Tag Team Roll with you, they only need to spend 2 Hope to do so.' }
    },
    {
      name: 'Call of the Slayer',
      description: 'Play the Call of the Slayer if you want to strike down adversaries with immense force.',
      foundation: { name: 'Slayer', description: 'You gain a pool of dice called Slayer Dice. On a roll with Hope, you can place a d6 on this card instead of gaining a Hope, adding the die to the pool. You can store a number of Slayer Dice equal to your Proficiency. When you make an attack roll or damage roll, you can spend any number of these Slayer Dice, rolling them and adding their result to the roll. At the end of each session, clear any unspent Slayer Dice on this card and gain a Hope per die cleared.' },
      specialization: { name: 'Weapon Specialist', description: 'You can wield multiple weapons with dangerous ease. When you succeed on an attack, you can spend a Hope to add one of the damage dice from your secondary weapon to the damage roll. Additionally, once per long rest when you roll your Slayer Dice, reroll any 1s.' },
      mastery: { name: 'Martial Preparation', description: 'You\'re an inspirational warrior to all who travel with you. Your party gains access to the Martial Preparation downtime move. To use this move during a rest, describe how you instruct and train with your party. You and each ally who chooses this downtime move gain a d6 Slayer Die. A PC with a Slayer Die can spend it to roll the die and add the result to an attack or damage roll of their choice.' }
    }
  ],
  'Wizard': [
    {
      name: 'School of Knowledge',
      description: 'Play the School of Knowledge if you want a keen understanding of the world around you.',
      spellcastTrait: 'Knowledge',
      foundation: { name: 'Prepared / Adept', description: 'Prepared: Take an additional domain card of your level or lower from a domain you have access to.\nAdept: When you Utilize an Experience, you can mark a Stress instead of spending a Hope. If you do, double your Experience modifier for that roll.' },
      specialization: { name: 'Accomplished / Perfect Recall', description: 'Accomplished: Take an additional domain card of your level or lower from a domain you have access to.\nPerfect Recall: Once per rest, when you recall a domain card in your vault, you can reduce its Recall Cost by 1.' },
      mastery: { name: 'Brilliant / Honed Expertise', description: 'Brilliant: Take an additional domain card of your level or lower from a domain you have access to.\nHoned Expertise: When you use an Experience, roll a d6. On a result of 5 or higher, you can use it without spending Hope.' }
    },
    {
      name: 'School of War',
      description: 'Play the School of War if you want to utilize trained magic for violence.',
      spellcastTrait: 'Knowledge',
      foundation: { name: 'Battlemage / Face Your Fear', description: 'Battlemage: You\'ve focused your studies on becoming an unconquerable force on the battlefield. Gain an additional Hit Point slot.\nFace Your Fear: When you succeed with Fear on an attack roll, you deal an extra 1d10 magic damage.' },
      specialization: { name: 'Conjure Shield / Fueled by Fear', description: 'Conjure Shield: You can maintain a protective barrier of magic. While you have at least 2 Hope, you add your Proficiency to your Evasion.\nFueled by Fear: The extra magic damage from your "Face Your Fear" feature increases to 2d10.' },
      mastery: { name: 'Thrive in Chaos / Have No Fear', description: 'Thrive in Chaos: When you succeed on an attack, you can mark a Stress after rolling damage to force the target to mark an additional Hit Point.\nHave No Fear: The extra magic damage from your "Face Your Fear" feature increases to 3d10.' }
    }
  ]
};

// Advancement options by tier. Slot counts per the SRD level-up sheets:
// traits ×3, HP ×2, Stress ×2, Experiences ×1, domain card ×1, Evasion ×1
// (+ subclass ×1 and the double-cost Proficiency/Multiclass boxes in tiers 3-4).
const ADVANCEMENT_OPTIONS = {
  tier2: [
    { id: 'traits', label: '+1 to two unmarked traits (mark them)', slots: 3, cost: 1 },
    { id: 'hp', label: '+1 Hit Point slot', slots: 2, cost: 1 },
    { id: 'stress', label: '+1 Stress slot', slots: 2, cost: 1 },
    { id: 'experiences', label: '+1 to two Experiences', slots: 1, cost: 1 },
    { id: 'domainCard', label: 'Additional domain card', slots: 1, cost: 1, maxCardLevel: 4 },
    { id: 'evasion', label: '+1 Evasion', slots: 1, cost: 1 },
  ],
  tier3: [
    { id: 'traits', label: '+1 to two unmarked traits (mark them)', slots: 3, cost: 1 },
    { id: 'hp', label: '+1 Hit Point slot', slots: 2, cost: 1 },
    { id: 'stress', label: '+1 Stress slot', slots: 2, cost: 1 },
    { id: 'experiences', label: '+1 to two Experiences', slots: 1, cost: 1 },
    { id: 'domainCard', label: 'Additional domain card', slots: 1, cost: 1, maxCardLevel: 7 },
    { id: 'evasion', label: '+1 Evasion', slots: 1, cost: 1 },
    { id: 'subclassUpgrade', label: 'Upgraded subclass card', slots: 1, cost: 1 },
    { id: 'proficiency', label: '+1 Proficiency', slots: 1, cost: 2 },
    { id: 'multiclass', label: 'Multiclass', slots: 1, cost: 2 },
  ],
  tier4: [
    { id: 'traits', label: '+1 to two unmarked traits (mark them)', slots: 3, cost: 1 },
    { id: 'hp', label: '+1 Hit Point slot', slots: 2, cost: 1 },
    { id: 'stress', label: '+1 Stress slot', slots: 2, cost: 1 },
    { id: 'experiences', label: '+1 to two Experiences', slots: 1, cost: 1 },
    { id: 'domainCard', label: 'Additional domain card', slots: 1, cost: 1, maxCardLevel: null },
    { id: 'evasion', label: '+1 Evasion', slots: 1, cost: 1 },
    { id: 'subclassUpgrade', label: 'Upgraded subclass card', slots: 1, cost: 1 },
    { id: 'proficiency', label: '+1 Proficiency', slots: 1, cost: 2 },
    { id: 'multiclass', label: 'Multiclass', slots: 1, cost: 2 },
  ],
};

// Base proficiency from level (before bonus advancement choices)
const getBaseProficiency = (level) => {
  if (level < 2) return 1;
  if (level < 5) return 2;
  if (level < 8) return 3;
  return 4;
};

// Get tier for a given level
const getTierForLevel = (level) => {
  if (level <= 1) return 1;
  if (level <= 4) return 2;
  if (level <= 7) return 3;
  return 4;
};

// ── Proficiency ──────────────────────────────────────────────────────────────
//
// Proficiency has two sources: the automatic bump on entering tiers 2/5/8
// (getBaseProficiency), and the optional "Increase your Proficiency by +1"
// advancement available in tiers 3 and 4.
//
// The advancement bonus is DERIVED from levelHistory rather than stored. It used
// to be folded into a stored absolute, which every subsequent level-up then
// overwrote with the tier base — silently deleting a purchased advancement, and
// with it a damage die (Proficiency is the weapon damage dice count). Deriving
// it means the number cannot drift, and characters who already lost the bonus
// get it back as soon as they're read.

/** How many "+1 Proficiency" advancements a character has bought. */
const getProficiencyBonus = (character) => {
  const history = character?.levelHistory;
  if (!Array.isArray(history)) return 0;
  return history.reduce((n, entry) => (
    n + (entry?.advancements || []).filter(a => a?.id === 'proficiency').length
  ), 0);
};

/**
 * A character's actual Proficiency.
 *
 * Characters with a levelHistory get tier base + purchased advancements.
 * Characters without one (Demiplane imports, hand-built sheets) have no
 * advancement record to derive from, so their stored value is authoritative.
 */
const getEffectiveProficiency = (character) => {
  const level = character?.level || 1;
  if (!Array.isArray(character?.levelHistory)) {
    return character?.proficiency ?? getBaseProficiency(level);
  }
  return getBaseProficiency(level) + getProficiencyBonus(character);
};

// Get the advancement tier key for a given level
const getAdvancementTier = (level) => {
  const tier = getTierForLevel(level);
  if (tier <= 1) return null; // No advancements at tier 1
  return `tier${tier}`;
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
    features: [
      { name: 'Purposeful Design', description: 'Decide who made you and for what purpose. At character creation, choose one of your Experiences that best aligns with this purpose and gain a permanent +1 bonus to it.' },
      { name: 'Efficient', description: 'When you take a short rest, you can choose a long rest move instead of a short rest move.' }
    ]
  },
  'Drakona': {
    description: 'Dragonborn humanoids with scales, breath weapons, and draconic heritage.',
    features: [
      { name: 'Scales', description: 'Your scales act as natural protection. When you would take Severe damage, you can mark a Stress to mark 1 fewer Hit Points.' },
      { name: 'Elemental Breath', description: 'Choose an element for your breath (such as electricity, fire, or ice). You can use this breath against a target or group of targets within Very Close range, treating it as an Instinct weapon that deals d8 magic damage using your Proficiency.' }
    ]
  },
  'Dwarf': {
    description: 'Sturdy folk of mountain and forge, known for craftsmanship and resilience.',
    features: [
      { name: 'Thick Skin', description: 'When you take Minor damage, you can mark 2 Stress instead of marking a Hit Point.' },
      { name: 'Increased Fortitude', description: 'Spend 3 Hope to halve incoming physical damage.' }
    ]
  },
  'Elf': {
    description: 'Graceful beings with deep connections to magic and the ancient world.',
    features: [
      { name: 'Quick Reactions', description: 'Mark a Stress to gain advantage on a reaction roll.' },
      { name: 'Celestial Trance', description: 'During a rest, you can drop into a trance to choose an additional downtime move.' }
    ]
  },
  'Faerie': {
    description: 'Tiny fey creatures brimming with mischief, magic, and wonder.',
    features: [
      { name: 'Luckbender', description: 'Once per session, after you or a willing ally within Close range makes an action roll, you can spend 3 Hope to reroll the Duality Dice.' },
      { name: 'Wings', description: 'You can fly. While flying, you can mark a Stress after an adversary makes an attack against you to gain a +2 bonus to your Evasion against that attack.' }
    ]
  },
  'Faun': {
    description: 'Half-human, half-goat folk who embody the wild spirit of nature.',
    features: [
      { name: 'Caprine Leap', description: 'You can leap anywhere within Close range as though you were using normal movement, allowing you to vault obstacles, jump across gaps, or scale barriers with ease.' },
      { name: 'Kick', description: 'When you succeed on an attack against a target within Melee range, you can mark a Stress to kick yourself off them, dealing an extra 2d6 damage and knocking back either yourself or the target to Very Close range.' }
    ]
  },
  'Firbolg': {
    description: 'Gentle giants with deep ties to nature and the forest.',
    features: [
      { name: 'Charge', description: 'When you succeed on an Agility Roll to move from Far or Very Far range into Melee range with one or more targets, you can mark a Stress to deal 1d12 physical damage to all targets within Melee range.' },
      { name: 'Unshakable', description: 'When you would mark a Stress, roll a d6. On a result of 6, don\'t mark it.' }
    ]
  },
  'Fungril': {
    description: 'Mushroom folk who thrive in darkness and decay, sprouting from the deep earth.',
    features: [
      { name: 'Fungril Network', description: 'Make an Instinct Roll (12) to use your mycelial array to speak with others of your ancestry. On a success, you can communicate across any distance.' },
      { name: 'Death Connection', description: 'While touching a corpse that died recently, you can mark a Stress to extract one memory from the corpse related to a specific emotion or sensation of your choice.' }
    ]
  },
  'Galapa': {
    description: 'Turtle-like beings of wisdom, patience, and ancient knowledge.',
    features: [
      { name: 'Shell', description: 'Gain a bonus to your damage thresholds equal to your Proficiency.' },
      { name: 'Retract', description: 'Mark a Stress to retract into your shell. While in your shell, you have resistance to physical damage, you have disadvantage on action rolls, and you can\'t move.' }
    ]
  },
  'Giant': {
    description: 'Towering folk whose size is matched only by their strength.',
    features: [
      { name: 'Endurance', description: 'Gain an additional Hit Point slot at character creation.' },
      { name: 'Reach', description: 'Treat any weapon, ability, spell, or other feature that has a Melee range as though it has a Very Close range instead.' }
    ]
  },
  'Goblin': {
    description: 'Small, scrappy creatures known for cunning, chaos, and surprising ingenuity.',
    features: [
      { name: 'Surefooted', description: 'You ignore disadvantage on Agility Rolls.' },
      { name: 'Danger Sense', description: 'Once per rest, mark a Stress to force an adversary to reroll an attack against you or an ally within Very Close range.' }
    ]
  },
  'Halfling': {
    description: 'Small folk with big hearts, known for luck, community, and courage.',
    features: [
      { name: 'Luckbringer', description: 'At the start of each session, everyone in your party gains a Hope.' },
      { name: 'Internal Compass', description: 'When you roll a 1 on your Hope Die, you can reroll it.' }
    ]
  },
  'Human': {
    description: 'Versatile and ambitious, adaptable to any role or challenge.',
    features: [
      { name: 'High Stamina', description: 'Gain an additional Stress slot at character creation.' },
      { name: 'Adaptability', description: 'When you fail a roll that utilized one of your Experiences, you can mark a Stress to reroll.' }
    ]
  },
  'Infernis': {
    description: 'Beings born of infernal flame, carrying both power and temptation.',
    features: [
      { name: 'Fearless', description: 'When you roll with Fear, you can mark 2 Stress to change it into a roll with Hope instead.' },
      { name: 'Dread Visage', description: 'You have advantage on rolls to intimidate hostile creatures.' }
    ]
  },
  'Katari': {
    description: 'Feline humanoids who embody grace, curiosity, and independence.',
    features: [
      { name: 'Feline Instincts', description: 'When you make an Agility Roll, you can spend 2 Hope to reroll your Hope Die.' },
      { name: 'Retracting Claws', description: 'Make an Agility Roll to scratch a target within Melee range. On a success, they become temporarily Vulnerable.' }
    ]
  },
  'Orc': {
    description: 'Proud warriors with honor-bound cultures and fierce determination.',
    features: [
      { name: 'Sturdy', description: 'When you have 1 Hit Point remaining, attacks against you have disadvantage.' },
      { name: 'Tusks', description: 'When you succeed on an attack against a target within Melee range, you can spend a Hope to gore the target with your tusks, dealing an extra 1d6 damage.' }
    ]
  },
  'Ribbet': {
    description: 'Amphibious frog-folk who leap between land and water with ease.',
    features: [
      { name: 'Amphibious', description: 'You can breathe and move naturally underwater.' },
      { name: 'Long Tongue', description: 'You can use your long tongue to grab onto things within Close range. Mark a Stress to use your tongue as a Finesse Close weapon that deals d12 physical damage using your Proficiency.' }
    ]
  },
  'Simiah': {
    description: 'Ape-like beings of strength, community, and primal wisdom.',
    features: [
      { name: 'Natural Climber', description: 'You have advantage on Agility Rolls that involve balancing and climbing.' },
      { name: 'Nimble', description: 'Gain a permanent +1 bonus to your Evasion at character creation.' }
    ]
  }
};

// Names an earlier version of this list used. Kept so characters saved with
// them still resolve, but non-enumerable so pickers don't offer them: "Inferis"
// was a misspelling of Infernis, and "Daemon" is not a Daggerheart ancestry.
Object.defineProperty(ANCESTRIES, 'Inferis', { value: ANCESTRIES.Infernis, enumerable: false });
Object.defineProperty(ANCESTRIES, 'Daemon', {
  value: {
    description: 'Not an ancestry in the Daggerheart rulebook. Kept for characters created with it; choose a rulebook ancestry or a custom one instead.',
    features: [{ name: 'Otherworldly Presence', description: 'You can see in magical darkness. Once per long rest, you may sense the presence of supernatural creatures within far range.' }],
  },
  enumerable: false,
});

// Duneborne, Freeborne, Frostborne and Hearthborne come from the Hope & Fear
// supplement (hopeFear.js), merged in below.
const COMMUNITIES = {
  'Highborne': {
    description: 'Characters raised in opulence, elegance, and high-society prestige.',
    features: [
      { name: 'Privilege', description: 'You have advantage on rolls to consort with nobles, negotiate prices, or leverage your reputation to get what you want.' }
    ]
  },
  'Loreborne': {
    description: 'Raised in academic or political centers where knowledge and history are highly valued.',
    features: [
      { name: 'Well-Read', description: 'You have advantage on rolls that involve the history, culture, or politics of a prominent person or place.' }
    ]
  },
  'Orderborne': {
    description: 'Those raised in disciplined, religious, or militaristic institutions.',
    features: [
      { name: 'Dedicated', description: 'Record three sayings or values your upbringing instilled in you. Once per rest, when you describe how you\'re embodying one of these principles through your current action, you can roll a d20 as your Hope Die.' }
    ]
  },
  'Ridgeborne': {
    description: 'Those who grew up among rocky peaks, sharp cliffs, and mountain environments.',
    features: [
      { name: 'Steady', description: 'You have advantage on rolls to traverse dangerous cliffs and ledges, navigate harsh environments, and use your survival knowledge.' }
    ]
  },
  'Seaborne': {
    description: 'People from coastal towns, islands, or life on the open water.',
    features: [
      { name: 'Know the Tide', description: 'You can sense the ebb and flow of life. When you roll with Fear, place a token on your community card. You can hold a number of tokens equal to your level. Before you make an action roll, you can spend any number of these tokens to gain a +1 bonus to the roll for each token spent. At the end of each session, clear all unspent tokens.' }
    ]
  },
  'Slyborne': {
    description: 'Those raised in the criminal underworld or urban underbellies.',
    features: [
      { name: 'Scoundrel', description: 'You have advantage on rolls to negotiate with criminals, detect lies, or find a safe place to hide.' }
    ]
  },
  'Underborne': {
    description: 'Citizens of subterranean cities or deep cavern systems.',
    features: [
      { name: 'Low-Light Living', description: 'When you\'re in an area with low light or heavy shadow, you have advantage on rolls to hide, investigate, or perceive details within that area.' }
    ]
  },
  'Wanderborne': {
    description: 'Nomads who have traveled extensively, experiencing a wide variety of cultures.',
    features: [
      { name: 'Nomadic Pack', description: 'Add a Nomadic Pack to your inventory. Once per session, you can spend a Hope to reach into this pack and pull out a mundane item that\'s useful to your situation. Work with the GM to figure out what item you take out.' }
    ]
  },
  'Wildborne': {
    description: 'Those who lived deep within untamed forests or wilderness.',
    features: [
      { name: 'Lightfoot', description: 'Your movement is naturally silent. You have advantage on rolls to move without being heard.' }
    ]
  }
};

// ── Hope & Fear expansion merges ──
// Classes/subclasses/heritages extend the core maps in place. Each merged
// entry is tagged `source: 'hope-fear'` so pickers can hide expansion options
// in campaigns that disable the source (see HOPE_FEAR_HERITAGES /
// HOPE_FEAR_CLASSES below). The Dread domain only appears in pickers once its
// cards actually exist, so nobody can select a domain with zero cards.
Object.assign(CLASSES, HF_CLASSES);
Object.assign(SUBCLASSES, HF_SUBCLASSES);
Object.assign(ANCESTRIES, HF_ANCESTRIES);
Object.assign(COMMUNITIES, HF_COMMUNITIES);
// Re-tag just the expansion keys (Object.assign copied them untagged).
for (const k of Object.keys(HF_CLASSES)) CLASSES[k] = { ...CLASSES[k], source: HOPE_FEAR_SOURCE };
for (const k of Object.keys(HF_ANCESTRIES)) ANCESTRIES[k] = { ...ANCESTRIES[k], source: HOPE_FEAR_SOURCE };
for (const k of Object.keys(HF_COMMUNITIES)) COMMUNITIES[k] = { ...COMMUNITIES[k], source: HOPE_FEAR_SOURCE };

/** Class/heritage keys that belong to the Hope & Fear expansion. */
export const HOPE_FEAR_CLASSES = Object.keys(HF_CLASSES);
export const HOPE_FEAR_ANCESTRIES = Object.keys(HF_ANCESTRIES);
export const HOPE_FEAR_COMMUNITIES = Object.keys(HF_COMMUNITIES);

/** Filter a list of class/ancestry/community names to those a campaign allows. */
export function filterNamesBySource(names, map, campaign) {
  return (names || []).filter(n => isSourceEnabled(campaign, map[n]?.source));
}

if (HF_DOMAIN_CARDS.length > 0 && !DOMAINS.includes('Dread')) {
  DOMAINS.push('Dread');
}

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

// Standard array for level 1 trait assignment: exactly -1, 0, 0, +1, +1, +2
const STANDARD_ARRAY = [-1, 0, 0, 1, 1, 2];

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
  'Ammunition',    // Requires ammunition
  // Secondary-weapon / shield defensive features
  'Protective',    // +Proficiency to Armor Score while wielding
  'Barrier',       // +Proficiency+1 to Armor Score, -1 Evasion while wielding
  'Double Duty',   // +1 Armor Score (armor-replacement secondary)
];

// Armor features from Daggerheart SRD
const ARMOR_FEATURES = [
  'Deflecting',    // Mark armor slot for Evasion bonus
  'Sheltering',    // Armor reduces damage for nearby allies too
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
  STANDARD_ARRAY,
  EXTERNAL_TOOLS,
  ITEM_TEMPLATES,
  WEAPON_FEATURES,
  ARMOR_FEATURES,
  EQUIPMENT_CATEGORIES,
  ADVANCEMENT_OPTIONS,
  getBaseProficiency,
  getProficiencyBonus,
  getEffectiveProficiency,
  getTierForLevel,
  getAdvancementTier
};
