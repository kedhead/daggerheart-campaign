// Daggerheart Game System Definition
// Official Daggerheart RPG system by Darrington Press

const CLASSES = {
  'Bard': {
    domains: ['Grace', 'Codex'],
    baseEvasion: 10,
    baseHp: 5,
    description: 'Masters of performance and magic who inspire allies and manipulate the battlefield through music, words, and arcane arts.',
    features: 'Bardic Inspiration, versatile magic, social expertise',
    hopeFeature: { name: 'Rally', description: 'Spend 3 Hope to give an ally within Far range a Rally Die (d6). They can add it to any action roll before their next rest.' },
    classFeatures: [
      { name: 'Inspiring Leader', description: 'After a long rest, you can give a Rally Die (d6) to an ally. At level 5, your Rally Die increases to a d8.' },
      { name: 'Versatile Performance', description: 'You can use your Presence trait for attack rolls with weapons that deal magic damage.' }
    ]
  },
  'Druid': {
    domains: ['Sage', 'Arcana'],
    baseEvasion: 10,
    baseHp: 6,
    description: 'Nature-bound spellcasters who can shapeshift into beasts and command the primal forces of the natural world.',
    features: 'Wild Shape, nature magic, environmental control',
    hopeFeature: { name: 'Evolution', description: 'Spend 3 Hope to transform into a Beastform without marking a Stress. When you do, choose one trait to raise by +1 until you drop out of that Beastform.' },
    classFeatures: [
      { name: 'Beastform', description: 'Mark a Stress to magically transform into a creature of your tier or lower from the Beastform list. You can drop out of this form at any time. While transformed, you can\'t use weapons or cast spells from domain cards, but you can still use other features. You gain the Beastform\'s features, add their Evasion bonus to your Evasion, and use the trait specified in their statistics for your attack.' },
      { name: 'Wildtouch', description: 'You can perform harmless, subtle effects that involve nature — such as causing a flower to rapidly grow, summoning a slight gust of wind, or starting a campfire — at will.' }
    ]
  },
  'Guardian': {
    domains: ['Valor', 'Blade'],
    baseEvasion: 9,
    baseHp: 7,
    description: 'Stalwart defenders who protect their allies and control the battlefield through martial prowess and protective abilities.',
    features: 'Tank role, protective abilities, high armor',
    hopeFeature: { name: 'Frontline Tank', description: 'Spend 3 Hope to clear 2 Armor Slots.' },
    classFeatures: [
      { name: 'Unstoppable', description: 'Once per long rest, you can become Unstoppable. You gain an Unstoppable Die (d4 at level 1, d6 at level 5). After you deal 1+ Hit Points to a target, increase the die value by one. While Unstoppable: reduce severity of physical damage by one threshold, add the die\'s current value to your damage roll, and you can\'t be Restrained or Vulnerable.' }
    ]
  },
  'Ranger': {
    domains: ['Bone', 'Sage'],
    baseEvasion: 12,
    baseHp: 6,
    description: 'Wilderness experts who excel at tracking, survival, and ranged combat while forging bonds with animal companions.',
    features: 'Ranged expertise, tracking, animal companion',
    hopeFeature: { name: 'Hold Them Off', description: 'Spend 3 Hope when you succeed on an attack with a weapon to use that same roll against two additional adversaries within range of the attack.' },
    classFeatures: [
      { name: 'Ranger\'s Focus', description: 'Spend a Hope and make an attack against a target. On a success, deal your attack\'s normal damage and temporarily make them your Focus. Until this ends or you pick a new Focus: you know their direction, they mark a Stress when you deal damage, and you can end Focus to reroll on a failed attack.' }
    ]
  },
  'Rogue': {
    domains: ['Midnight', 'Grace'],
    baseEvasion: 12,
    baseHp: 6,
    description: 'Cunning and agile specialists in stealth, deception, and precision strikes who excel at exploiting enemy weaknesses.',
    features: 'Sneak attack, stealth, skills and tricks',
    hopeFeature: { name: 'Rogue\'s Dodge', description: 'Spend 3 Hope to gain a +2 bonus to your Evasion until the next time an attack succeeds against you. Otherwise, this bonus lasts until your next rest.' },
    classFeatures: [
      { name: 'Cloaked', description: 'Any time you would be Hidden, you are instead Cloaked. While Cloaked you remain unseen if stationary when an adversary moves to where they would normally see you. After you attack or end a move within line of sight of an adversary, you are no longer Cloaked.' },
      { name: 'Sneak Attack', description: 'When you succeed on an attack while Cloaked or while an ally is within Melee range of your target, add a number of d6s equal to your tier to your damage roll.' }
    ]
  },
  'Seraph': {
    domains: ['Splendor', 'Valor'],
    baseEvasion: 9,
    baseHp: 7,
    description: 'Divine warriors who channel celestial power to heal allies and smite foes with radiant energy.',
    features: 'Healing magic, divine power, support abilities',
    hopeFeature: { name: 'Life Support', description: 'Spend 3 Hope to clear a Hit Point on an ally within Close range.' },
    classFeatures: [
      { name: 'Prayer Dice', description: 'At the beginning of each session, roll a number of d4s equal to your Spellcast trait and place them on your sheet. You can spend any number to aid yourself or an ally within Far range: reduce incoming damage, add to a roll\'s result after rolling, or gain Hope equal to the result. Clear unspent dice at end of session.' }
    ]
  },
  'Sorcerer': {
    domains: ['Arcana', 'Midnight'],
    baseEvasion: 10,
    baseHp: 6,
    description: 'Innate spellcasters whose magic flows from within, allowing them to bend and shape magical energy in unique ways.',
    features: 'Raw magical power, metamagic, spontaneous casting',
    hopeFeature: { name: 'Volatile Magic', description: 'Spend 3 Hope to reroll any number of your damage dice on an attack that deals magic damage.' },
    classFeatures: [
      { name: 'Arcane Sense', description: 'You can sense the presence of magical people and objects within Close range.' },
      { name: 'Minor Illusion', description: 'Make a Spellcast Roll (10). On a success, create a minor visual illusion no larger than yourself within Close range. Convincing to anyone at Close range or farther.' },
      { name: 'Channel Raw Power', description: 'Once per long rest, place a domain card from your loadout into your vault and either: gain Hope equal to the card\'s level, or enhance a spell that deals damage gaining a bonus equal to twice the card\'s level.' }
    ]
  },
  'Warrior': {
    domains: ['Blade', 'Bone'],
    baseEvasion: 11,
    baseHp: 6,
    description: 'Masters of combat who excel in both offense and defense through superior weapon skills and battle tactics.',
    features: 'Martial superiority, weapon mastery, combat tactics',
    hopeFeature: { name: 'No Mercy', description: 'Spend 3 Hope to gain a +1 bonus to your attack rolls until your next rest.' },
    classFeatures: [
      { name: 'Attack of Opportunity', description: 'If an adversary within Melee range attempts to leave, make a reaction roll against their Difficulty. On success choose one (two on crit): they can\'t move, deal primary weapon damage, or move with them.' },
      { name: 'Combat Training', description: 'You ignore burden when equipping weapons. When you deal physical damage, gain a bonus to your damage roll equal to your level.' }
    ]
  },
  'Wizard': {
    domains: ['Codex', 'Splendor'],
    baseEvasion: 11,
    baseHp: 5,
    description: 'Scholarly mages who study the arcane arts and command a vast repertoire of spells through knowledge and preparation.',
    features: 'Versatile spellcasting, ritual magic, knowledge',
    hopeFeature: { name: 'Not This Time', description: 'Spend 3 Hope to force an adversary within Far range to reroll an attack or damage roll.' },
    classFeatures: [
      { name: 'Prestidigitation', description: 'You can perform harmless, subtle magical effects at will — change an object\'s color, create a smell, light a candle, cause a tiny object to float, illuminate a room, or repair a small object.' },
      { name: 'Strange Patterns', description: 'Choose a number between 1 and 12. When you roll that number on a Duality Die, gain a Hope or clear a Stress. You can change this number on a long rest.' }
    ]
  }
};

const SUBCLASSES = {
  'Bard': [
    {
      name: 'Troubadour',
      description: 'Play the Troubadour if you want to play music to bolster your allies.',
      spellcastTrait: 'Presence',
      foundation: { name: 'Gifted Performer', description: 'Describe how you perform for others. You can play each song once per long rest: Relaxing Song (you and allies within Close range clear a Hit Point), Epic Song (make a target within Close range temporarily Vulnerable), Heartbreaking Song (you and allies within Close range gain a Hope).' },
      specialization: { name: 'Maestro', description: 'Your rallying songs steel the courage of those who listen. When you give a Rally Die to an ally, they can gain a Hope or clear a Stress.' },
      mastery: { name: 'Virtuoso', description: 'You are among the greatest of your craft and your skill is boundless. You can perform each of your "Gifted Performer" feature\'s songs twice instead of once per long rest.' }
    },
    {
      name: 'Wordsmith',
      description: 'Play the Wordsmith if you want to use clever wordplay and captivate crowds.',
      spellcastTrait: 'Presence',
      foundation: { name: 'Rousing Speech / Heart of a Poet', description: 'Rousing Speech: Once per long rest, give an inspiring speech. All allies within Far range clear 2 Stress. Heart of a Poet: After you make an action roll to impress, persuade, or offend someone, you can spend a Hope to add a d4 to the roll.' },
      specialization: { name: 'Eloquent', description: 'Your moving words boost morale. Once per session, when you encourage an ally, you can do one of the following: allow them to find a mundane object or tool they need, Help an Ally without spending Hope, or give them an additional downtime move during their next rest.' },
      mastery: { name: 'Epic Poetry', description: 'Your Rally Die increases to a d10. Additionally, when you Help an Ally, you can narrate the moment as if writing their tale in a memoir. When you do, roll a d10 as your advantage die.' }
    }
  ],
  'Druid': [
    {
      name: 'Warden of the Elements',
      description: 'Play the Warden of the Elements if you want to embody the natural elements of the wild.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Elemental Incarnation', description: 'Mark a Stress to Channel one of the following elements until you take Severe damage or until your next rest: Fire (adversaries within Melee range that damage you take 1d10 magic damage), Earth (bonus to damage thresholds equal to your Proficiency), Water (when you damage an adversary within Melee range, all others within Very Close range mark a Stress), Air (you can hover, gaining advantage on Agility Rolls).' },
      specialization: { name: 'Elemental Aura', description: 'Once per rest while Channeling, assume an aura matching your element affecting targets within Close range: Fire (adversaries marking HP also mark Stress), Earth (allies gain +1 Strength), Water (mark Stress to move attacking adversary within Very Close range), Air (reduce damage from attacks beyond Melee by 1d8).' },
      mastery: { name: 'Elemental Dominion', description: 'While Channeling, gain: Fire (+1 Proficiency for damage attacks/spells), Earth (roll d6 per HP marked, each 6 reduces by 1), Water (mark Stress to make attacker temporarily Vulnerable), Air (+1 Evasion and you can fly).' }
    },
    {
      name: 'Warden of Renewal',
      description: 'Play the Warden of Renewal if you want to use powerful magic to heal your party.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Clarity of Nature / Regeneration', description: 'Clarity of Nature: Once per long rest, create a space of natural serenity within Close range. Resting within it clears Stress equal to your Instinct, distributed between you and allies. Regeneration: Touch a creature and spend 3 Hope. That creature clears 1d4 Hit Points.' },
      specialization: { name: 'Regenerative Reach / Warden\'s Protection', description: 'Regenerative Reach: You can target creatures within Very Close range with your "Regeneration" feature. Warden\'s Protection: Once per long rest, spend 2 Hope to clear 2 Hit Points on 1d4 allies within Close range.' },
      mastery: { name: 'Defender', description: 'Your animal transformation embodies a healing guardian spirit. When you\'re in Beastform and an ally within Close range marks 2 or more Hit Points, you can mark a Stress to reduce the number of Hit Points they mark by 1.' }
    }
  ],
  'Guardian': [
    {
      name: 'Stalwart',
      description: 'Play the Stalwart if you want to take heavy blows and keep fighting.',
      foundation: { name: 'Unwavering / Iron Will', description: 'Unwavering: Gain a permanent +1 bonus to your damage thresholds. Iron Will: When you take physical damage, you can mark an additional Armor Slot to reduce the severity.' },
      specialization: { name: 'Unrelenting / Partners-in-Arms', description: 'Unrelenting: Gain a permanent +2 bonus to your damage thresholds. Partners-in-Arms: When an ally within Very Close range takes damage, you can mark an Armor Slot to reduce the severity by one threshold.' },
      mastery: { name: 'Undaunted / Loyal Protector', description: 'Undaunted: Gain a permanent +3 bonus to your damage thresholds. Loyal Protector: When an ally within Close range has 2 or fewer Hit Points and would take damage, you can mark a Stress to sprint to their side and take the damage instead.' }
    },
    {
      name: 'Vengeance',
      description: 'Play the Vengeance if you want to strike down enemies who harm you or your allies.',
      foundation: { name: 'At Ease / Revenge', description: 'At Ease: Gain an additional Stress slot. Revenge: When an adversary within Melee range succeeds on an attack against you, you can mark 2 Stress to force the attacker to mark a Hit Point.' },
      specialization: { name: 'Act of Reprisal', description: 'When an adversary damages an ally within Melee range, you gain a +1 bonus to your Proficiency for the next successful attack you make against that adversary.' },
      mastery: { name: 'Nemesis', description: 'Spend 2 Hope to Prioritize an adversary until your next rest. When you make an attack against your Prioritized adversary, you can swap the results of your Hope and Fear Dice. You can only Prioritize one adversary at a time.' }
    }
  ],
  'Ranger': [
    {
      name: 'Beastbound',
      description: 'Play the Beastbound if you want to form a deep bond with an animal ally.',
      spellcastTrait: 'Agility',
      foundation: { name: 'Companion', description: 'You have an animal companion of your choice (at the GM\'s discretion). They stay by your side unless you tell them otherwise. Take the Ranger Companion sheet. When you level up, choose a level-up option for your companion as well.' },
      specialization: { name: 'Expert Training / Battle-Bonded', description: 'Expert Training: Choose an additional level-up option for your companion. Battle-Bonded: When an adversary attacks you while they\'re within your companion\'s Melee range, you gain a +2 bonus to your Evasion against the attack.' },
      mastery: { name: 'Advanced Training / Loyal Friend', description: 'Advanced Training: Choose two additional level-up options for your companion. Loyal Friend: Once per long rest, when damage would mark your companion\'s last Stress or your last Hit Point and you\'re within Close range of each other, you or your companion can rush to the other\'s side and take that damage instead.' }
    },
    {
      name: 'Wayfinder',
      description: 'Play the Wayfinder if you want to hunt your prey and strike with deadly force.',
      spellcastTrait: 'Agility',
      foundation: { name: 'Ruthless Predator / Path Forward', description: 'Ruthless Predator: When you make a damage roll, you can mark a Stress to gain a +1 bonus to your Proficiency. When you deal Severe damage to an adversary, they must mark a Stress. Path Forward: When traveling to a previously visited place or carrying an object from that location, you can identify the shortest path to your destination.' },
      specialization: { name: 'Elusive Predator', description: 'When your Focus makes an attack against you, you gain a +2 bonus to your Evasion against the attack.' },
      mastery: { name: 'Apex Predator', description: 'Before you make an attack roll against your Focus, you can spend a Hope. On a successful attack, you remove a Fear from the GM\'s Fear pool.' }
    }
  ],
  'Rogue': [
    {
      name: 'Nightwalker',
      description: 'Play the Nightwalker if you want to manipulate shadows to maneuver through the environment.',
      spellcastTrait: 'Finesse',
      foundation: { name: 'Shadow Stepper', description: 'You can move from shadow to shadow. When you move into an area of darkness or a shadow cast by another creature or object, you can mark a Stress to disappear and reappear inside another shadow within Far range. When you reappear, you are Cloaked.' },
      specialization: { name: 'Dark Cloud / Adrenaline', description: 'Dark Cloud: Make a Spellcast Roll (15). On success, create a temporary dark cloud covering any area within Close range. Anyone inside can\'t see out, anyone outside can\'t see in. You\'re Cloaked from adversaries blocked by the cloud. Adrenaline: While Vulnerable, add your level to your damage rolls.' },
      mastery: { name: 'Fleeting Shadow / Vanishing Act', description: 'Fleeting Shadow: Gain +1 Evasion permanently. You can use Shadow Stepper to move within Very Far range. Vanishing Act: Mark a Stress to become Cloaked at any time, automatically clearing Restrained. Remain Cloaked until you roll with Fear or until your next rest.' }
    },
    {
      name: 'Syndicate',
      description: 'Play the Syndicate if you want to have a web of contacts everywhere you go.',
      spellcastTrait: 'Finesse',
      foundation: { name: 'Well-Connected', description: 'When you arrive in a prominent town or environment, you know somebody who calls this place home. Give them a name, note how you think they could be useful, and choose one fact: they owe you a favor but are hard to find, they\'ll ask for something in exchange, they\'re always in trouble, you used to be together, or you didn\'t part on great terms.' },
      specialization: { name: 'Contacts Everywhere', description: 'Once per session, call on a shady contact. Choose one: they provide 1 handful of gold/a tool/a needed object; +3 bonus to your next Hope or Fear Die; their sniper adds 2d8 to your next damage roll.' },
      mastery: { name: 'Reliable Backup', description: 'Use "Contacts Everywhere" three times per session. Additional options: when you mark 1+ HP, contact shields you reducing HP marked by 1; when making a Presence Roll in conversation, they back you up and you roll a d20 as your Hope Die.' }
    }
  ],
  'Seraph': [
    {
      name: 'Divine Wielder',
      description: 'Play the Divine Wielder if you want to dominate the battlefield with a legendary weapon.',
      spellcastTrait: 'Strength',
      foundation: { name: 'Spirit Weapon / Sparing Touch', description: 'Spirit Weapon: When you have an equipped weapon with Melee or Very Close range, it can fly from your hand to attack an adversary within Close range and return. Mark a Stress to target an additional adversary within range with the same attack roll. Sparing Touch: Once per long rest, touch a creature and clear 2 Hit Points or 2 Stress from them.' },
      specialization: { name: 'Devout', description: 'When you roll your Prayer Dice, you can roll an additional die and discard the lowest result. Additionally, you can use your "Sparing Touch" feature twice instead of once per long rest.' },
      mastery: { name: 'Sacred Resonance', description: 'When you roll damage for your "Spirit Weapon" feature, if any of the die results match, double the value of each matching die. For example, if you roll two 5s, they count as two 10s.' }
    },
    {
      name: 'Winged Sentinel',
      description: 'Play the Winged Sentinel if you want to take flight and strike crushing blows from the sky.',
      spellcastTrait: 'Strength',
      foundation: { name: 'Wings of Light', description: 'You can fly. While flying: mark a Stress to pick up and carry another willing creature approximately your size or smaller; spend a Hope to deal an extra 1d8 damage on a successful attack.' },
      specialization: { name: 'Ethereal Visage', description: 'Your supernatural visage strikes awe and fear. While flying, you have advantage on Presence Rolls. When you succeed with Hope on a Presence Roll, you can remove a Fear from the GM\'s Fear pool instead of gaining Hope.' },
      mastery: { name: 'Ascendant / Power of the Gods', description: 'Ascendant: Gain a permanent +4 bonus to your Severe damage threshold. Power of the Gods: While flying, you deal an extra 1d12 damage instead of 1d8 from your "Wings of Light" feature.' }
    }
  ],
  'Sorcerer': [
    {
      name: 'Elemental Origin',
      description: 'Play the Elemental Origin if you want to channel raw magic to take the shape of a particular element.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Elementalist', description: 'Choose one element at character creation: air, earth, fire, lightning, or water. You can shape this element into harmless effects. Spend a Hope and describe how your control over this element helps an action roll, then gain a +2 bonus to the roll or a +3 bonus to the roll\'s damage.' },
      specialization: { name: 'Natural Evasion', description: 'You can call forth your element to protect you from harm. When an attack roll against you succeeds, you can mark a Stress and describe how you use your element to defend you. Roll a d6 and add its result to your Evasion against the attack.' },
      mastery: { name: 'Transcendence', description: 'Once per long rest, transform into a physical manifestation of your element. Choose two benefits until your next rest: +4 to Severe threshold, +1 to a trait of your choice, +1 to Proficiency, or +2 to Evasion.' }
    },
    {
      name: 'Primal Origin',
      description: 'Play the Primal Origin if you want to extend the versatility of your spells in powerful ways.',
      spellcastTrait: 'Instinct',
      foundation: { name: 'Manipulate Magic', description: 'After you cast a spell or make an attack using a weapon that deals magic damage, you can mark a Stress to do one of the following: extend the reach by one range, gain a +2 bonus to the action roll\'s result, double a damage die of your choice, or hit an additional target within range.' },
      specialization: { name: 'Enchanted Aid', description: 'You can enhance the magic of others. When you Help an Ally with a Spellcast Roll, roll a d8 as your advantage die. Once per long rest, after an ally has made a Spellcast Roll with your help, you can swap the results of their Duality Dice.' },
      mastery: { name: 'Arcane Charge', description: 'You can gather magical energy. When you take magic damage, you become Charged (or spend 2 Hope). When you successfully attack with magic damage while Charged, clear your Charge to either gain +10 to the damage roll or +3 to the Difficulty of a reaction roll the spell causes. Stops at long rest.' }
    }
  ],
  'Warrior': [
    {
      name: 'Call of the Brave',
      description: 'Play the Call of the Brave if you want to use the might of your enemies to fuel your own power.',
      foundation: { name: 'Courage / Battle Ritual', description: 'Courage: When you fail a roll with Fear, you gain a Hope. Battle Ritual: Once per long rest, before attempting something incredibly dangerous or facing a foe who outmatches you, describe your ritual or preparations. Clear 2 Stress and gain 2 Hope.' },
      specialization: { name: 'Rise to the Challenge', description: 'You are vigilant in the face of mounting danger. While you have 2 or fewer Hit Points unmarked, you can roll a d20 as your Hope Die.' },
      mastery: { name: 'Camaraderie', description: 'Your unwavering bravery is a rallying point for your allies. You can initiate a Tag Team Roll one additional time per session. When an ally initiates a Tag Team Roll with you, they only need to spend 2 Hope to do so.' }
    },
    {
      name: 'Call of the Slayer',
      description: 'Play the Call of the Slayer if you want to strike down adversaries with immense force.',
      foundation: { name: 'Slayer', description: 'You gain a pool of Slayer Dice. On a roll with Hope, you can place a d6 on this card instead of gaining a Hope. You can store a number of Slayer Dice equal to your Proficiency. When you make an attack or damage roll, spend any number of Slayer Dice, rolling them and adding the result. At end of session, clear unspent dice and gain a Hope per die cleared.' },
      specialization: { name: 'Weapon Specialist', description: 'You can wield multiple weapons with dangerous ease. When you succeed on an attack, spend a Hope to add one of the damage dice from your secondary weapon to the damage roll. Once per long rest when you roll your Slayer Dice, reroll any 1s.' },
      mastery: { name: 'Martial Preparation', description: 'Your party gains access to the Martial Preparation downtime move. Describe how you instruct and train with your party. You and each ally who chooses this downtime move gain a d6 Slayer Die that can be spent to add to an attack or damage roll.' }
    }
  ],
  'Wizard': [
    {
      name: 'School of Knowledge',
      description: 'Play the School of Knowledge if you want a keen understanding of the world around you.',
      spellcastTrait: 'Knowledge',
      foundation: { name: 'Prepared / Adept', description: 'Prepared: Take an additional domain card of your level or lower from a domain you have access to. Adept: When you Utilize an Experience, you can mark a Stress instead of spending a Hope. If you do, double your Experience modifier for that roll.' },
      specialization: { name: 'Accomplished / Perfect Recall', description: 'Accomplished: Take an additional domain card of your level or lower from a domain you have access to. Perfect Recall: Once per rest, when you recall a domain card in your vault, you can reduce its Recall Cost by 1.' },
      mastery: { name: 'Brilliant / Honed Expertise', description: 'Brilliant: Take an additional domain card of your level or lower from a domain you have access to. Honed Expertise: When you use an Experience, roll a d6. On a result of 5 or higher, you can use it without spending Hope.' }
    },
    {
      name: 'School of War',
      description: 'Play the School of War if you want to utilize trained magic for violence.',
      spellcastTrait: 'Knowledge',
      foundation: { name: 'Battlemage / Face Your Fear', description: 'Battlemage: Gain an additional Hit Point slot. Face Your Fear: When you succeed with Fear on an attack roll, you deal an extra 1d10 magic damage.' },
      specialization: { name: 'Conjure Shield / Fueled by Fear', description: 'Conjure Shield: You can maintain a protective barrier of magic. While you have at least 2 Hope, you add your Proficiency to your Evasion. Fueled by Fear: The extra magic damage from "Face Your Fear" increases to 2d10.' },
      mastery: { name: 'Thrive in Chaos / Have No Fear', description: 'Thrive in Chaos: When you succeed on an attack, mark a Stress after rolling damage to force the target to mark an additional Hit Point. Have No Fear: The extra magic damage from "Face Your Fear" increases to 3d10.' }
    }
  ]
};

// Advancement options by tier
const ADVANCEMENT_OPTIONS = {
  tier2: [
    { id: 'traits', label: '+1 to two unmarked traits (mark them)', slots: 3, cost: 1 },
    { id: 'hp', label: '+1 Hit Point slot', slots: 3, cost: 1 },
    { id: 'stress', label: '+1 Stress slot', slots: 3, cost: 1 },
    { id: 'experiences', label: '+1 to two Experiences', slots: 3, cost: 1 },
    { id: 'domainCard', label: 'Additional domain card', slots: 3, cost: 1 },
    { id: 'evasion', label: '+1 Evasion', slots: 3, cost: 1 },
  ],
  tier3: [
    { id: 'traits', label: '+1 to two unmarked traits (mark them)', slots: 3, cost: 1 },
    { id: 'hp', label: '+1 Hit Point slot', slots: 3, cost: 1 },
    { id: 'stress', label: '+1 Stress slot', slots: 3, cost: 1 },
    { id: 'experiences', label: '+1 to two Experiences', slots: 3, cost: 1 },
    { id: 'domainCard', label: 'Additional domain card', slots: 3, cost: 1 },
    { id: 'evasion', label: '+1 Evasion', slots: 3, cost: 1 },
    { id: 'subclassUpgrade', label: 'Upgraded subclass card', slots: 1, cost: 1 },
    { id: 'proficiency', label: '+1 Proficiency', slots: 1, cost: 2 },
    { id: 'multiclass', label: 'Multiclass', slots: 1, cost: 2 },
  ],
  tier4: [
    { id: 'traits', label: '+1 to two unmarked traits (mark them)', slots: 3, cost: 1 },
    { id: 'hp', label: '+1 Hit Point slot', slots: 3, cost: 1 },
    { id: 'stress', label: '+1 Stress slot', slots: 3, cost: 1 },
    { id: 'experiences', label: '+1 to two Experiences', slots: 3, cost: 1 },
    { id: 'domainCard', label: 'Additional domain card', slots: 3, cost: 1 },
    { id: 'evasion', label: '+1 Evasion', slots: 3, cost: 1 },
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
    features: [
      { name: 'Amphibious', description: 'You can breathe underwater and have a swim speed equal to your movement speed. You can jump twice the normal distance.' },
      { name: 'Long Tongue', description: 'You can use your long tongue to grab onto things within Close range. Mark a Stress to use your tongue as a Finesse Close weapon that deals d12 physical damage using your Proficiency.' }
    ]
  },
  'Simiah': {
    description: 'Ape-like beings of strength, community, and primal wisdom.',
    features: [{ name: 'Primal Grip', description: 'You can climb at full speed and have advantage on rolls to grapple. You may use your feet to hold items or weapons.' }]
  }
};

const COMMUNITIES = {
  'Duneborne': {
    description: 'Those from arid, desert climates who have adapted to harsh, shifting landscapes.',
    features: [{ name: 'Oasis', description: 'During a short rest, you or an ally can reroll a die used for a downtime action.' }]
  },
  'Freeborne': {
    description: 'People from a society that was once under tyrannical rule but is now liberated.',
    features: [{ name: 'Unbound', description: 'Once per session, when you roll with Fear, you can change it to a roll with Hope instead.' }]
  },
  'Frostborne': {
    description: 'Hardy folk from frozen tundras or high-altitude glacial regions.',
    features: [{ name: 'Hardy', description: 'Once per rest, you can Help an Ally traverse difficult terrain without spending a Hope.' }]
  },
  'Hearthborne': {
    description: 'Those raised in small villages or tight-knit rural communities.',
    features: [{ name: 'Close-Knit', description: 'Once per long rest, you can spend any number of Hope to give an ally the same number of Hope.' }]
  },
  'Highborne': {
    description: 'Characters raised in opulence, elegance, and high-society prestige.',
    features: [{ name: 'Privilege', description: 'You have Advantage on rolls to consort with nobles, negotiate prices, or leverage your reputation to get what you want.' }]
  },
  'Loreborne': {
    description: 'Raised in academic or political centers where knowledge and history are highly valued.',
    features: [{ name: 'Well-Read', description: 'You have Advantage on rolls that involve the history, culture, or politics of a prominent person or place.' }]
  },
  'Orderborne': {
    description: 'Those raised in disciplined, religious, or militaristic institutions.',
    features: [{ name: 'Dedicated', description: 'Once per rest, when acting on one of your three chosen Values, you may use a d20 as your Hope Die instead of a d12.' }]
  },
  'Ridgeborne': {
    description: 'Those who grew up among rocky peaks, sharp cliffs, and mountain environments.',
    features: [{ name: 'Steady', description: 'You have Advantage on rolls to traverse dangerous cliffs and ledges and navigate harsh mountain environments.' }]
  },
  'Seaborne': {
    description: 'People from coastal towns, islands, or life on the open water.',
    features: [{ name: 'Know the Tide', description: 'You can sense the ebb and flow of life. When you roll with Fear, place a token on your community card. You can hold a number of tokens equal to your level. Before you make an action roll, you can spend any number of these tokens to gain a +1 bonus to the roll for each token spent. At the end of each session, clear all unspent tokens.' }]
  },
  'Slyborne': {
    description: 'Those raised in the criminal underworld or urban underbellies.',
    features: [{ name: 'Scoundrel', description: 'You have Advantage on rolls to negotiate with criminals, detect lies, or find a safe place to hide.' }]
  },
  'Underborne': {
    description: 'Citizens of subterranean cities or deep cavern systems.',
    features: [{ name: 'Low-Light Living', description: 'When you\'re in an area with low light or heavy shadow, you have Advantage on rolls to hide, investigate, or perceive details within that area.' }]
  },
  'Wanderborne': {
    description: 'Nomads who have traveled extensively, experiencing a wide variety of cultures.',
    features: [{ name: 'Nomadic Pack', description: 'Once per session, you can spend 1 Hope to reach into your pack and pull out a mundane item (rope, tool, etc.) perfectly suited to your current situation.' }]
  },
  'Wildborne': {
    description: 'Those who lived deep within untamed forests or wilderness.',
    features: [{ name: 'Lightfoot', description: 'Your movement is naturally silent. You can spend 1 Hope to give a nearby ally Advantage on a Stealth or Agility roll.' }]
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
  STANDARD_ARRAY,
  EXTERNAL_TOOLS,
  ITEM_TEMPLATES,
  WEAPON_FEATURES,
  ARMOR_FEATURES,
  EQUIPMENT_CATEGORIES,
  ADVANCEMENT_OPTIONS,
  getBaseProficiency,
  getTierForLevel,
  getAdvancementTier
};
