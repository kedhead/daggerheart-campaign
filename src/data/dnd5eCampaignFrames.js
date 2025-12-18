// D&D 5e Campaign Frame Templates
// Classic D&D campaign structures adapted to campaign frame format

export const DND5E_CAMPAIGN_FRAMES = [
  {
    id: 'classic-dungeon-delve',
    name: 'Classic Dungeon Delve',
    complexity: 1,
    pitch: 'A traditional dungeon crawl where heroes explore ancient ruins, battle monsters, and seek legendary treasures in the depths below.',
    toneAndFeel: ['Adventurous', 'Dangerous', 'Exploratory', 'Tactical', 'Classic', 'Exciting'],
    themes: ['Exploration and Discovery', 'Combat and Tactics', 'Greed and Glory', 'Survival', 'Teamwork'],
    touchstones: ['The Tomb of Horrors', 'Keep on the Borderlands', 'Temple of Elemental Evil', 'The Mines of Moria'],
    overview: 'Ancient dungeons dot the landscape, filled with forgotten treasures, deadly traps, and terrifying monsters. These ruins hold the secrets of lost civilizations and the wealth of ancient kings. Adventurers brave enough to descend into the darkness must rely on their wits, weapons, and each other to survive the perils within and claim the legendary treasures that await.',
    playerPrinciples: ['Work Together to Survive', 'Think Before You Act', 'Map Your Progress', 'Respect the Danger'],
    gmPrinciples: ['Make the Dungeon Feel Alive', 'Reward Clever Problem Solving', 'Balance Challenge with Fairness', 'Create Memorable Encounters'],
    incitingIncident: 'An ancient map surfaces in a local tavern, revealing the location of a long-forgotten dungeon said to contain a legendary artifact. But the map is incomplete, and other adventurers are racing to find it first. Time to delve into the darkness.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'What drives you to risk your life for treasure?',
      'What dungeoneering skill are you known for?',
      'Have you explored dungeons before? What happened?',
      'What creature type do you fear most?',
      'What legendary treasure would be worth any risk?',
      'How do you handle traps and ambushes?',
      'What will you do with your share of the loot?'
    ]
  },
  {
    id: 'political-intrigue',
    name: 'Political Intrigue',
    complexity: 2,
    pitch: 'Navigate the dangerous world of nobles, guilds, and power struggles in a city-state or kingdom where words are as deadly as swords.',
    toneAndFeel: ['Political', 'Tense', 'Sophisticated', 'Dangerous', 'Social', 'Nuanced'],
    themes: ['Power and Corruption', 'Loyalty and Betrayal', 'Secrets and Lies', 'Justice vs. Law', 'Ambition'],
    touchstones: ['Game of Thrones', 'House of Cards', 'The Count of Monte Cristo', 'Succession'],
    overview: 'In the grand halls of power, noble houses vie for influence while guilds control the city\'s economy. Every word is calculated, every alliance temporary, and betrayal lurks behind every smile. Assassinations are disguised as accidents, fortunes change overnight, and those who play the game poorly often don\'t survive. The party finds themselves caught in a web of intrigue where information is more valuable than gold.',
    playerPrinciples: ['Choose Your Allies Carefully', 'Gather Information Before Acting', 'Consider the Consequences', 'Build Your Reputation'],
    gmPrinciples: ['Make Every NPC Have Agendas', 'Reward Social Skills and Planning', 'Create Complex Moral Choices', 'Show Consequences of Actions'],
    incitingIncident: 'While serving as hired bodyguards at a grand ball, you witness the assassination of a prominent noble. The assassin escapes, but evidence is planted framing your employer. As guards close in, you must decide - flee and investigate, or stay and face trial in a rigged court.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'What noble house or guild are you connected to?',
      'What political scandal haunts your family?',
      'Who in power do you trust? Who do you fear?',
      'What would you sacrifice for power or influence?',
      'What secret do you keep from the other party members?',
      'How do you feel about playing political games?',
      'What injustice drives you to act?'
    ]
  },
  {
    id: 'planar-adventure',
    name: 'Planar Adventure',
    complexity: 3,
    pitch: 'Travel across multiple planes of existence, dealing with cosmic threats and otherworldly beings in a multiverse-spanning epic.',
    toneAndFeel: ['Epic', 'Otherworldly', 'Cosmic', 'High Magic', 'Mind-Bending', 'Grand'],
    themes: ['Cosmic Horror and Wonder', 'Reality and Illusion', 'Power Beyond Mortal Ken', 'Multiversal Stakes', 'Divinity'],
    touchstones: ['Planescape', 'Doctor Who', 'Interstellar', 'The Sandman', 'Dungeon of the Mad Mage'],
    overview: 'The Material Plane is but one layer of existence in a vast multiverse. The Nine Hells burn with infernal schemes, the Abyss churns with demonic chaos, the Feywild shimmers with alien beauty, and the Far Realm defies comprehension. Powerful beings - devils, demons, archfey, and worse - play games that span realities. Heroes must navigate these alien realms and prevent cosmic catastrophes that threaten all of existence.',
    playerPrinciples: ['Embrace the Strange and Impossible', 'Question Reality', 'Make Allies Across Planes', 'Think Beyond Mortal Limits'],
    gmPrinciples: ['Make Each Plane Unique and Memorable', 'Challenge High-Level Abilities', 'Show the Scope of Planar Politics', 'Balance Wonder with Danger'],
    incitingIncident: 'A tear in reality opens above the city, and creatures from the Abyss pour through. As you fight them back, a celestial being appears with a dire warning - the planes are colliding, and unless you can repair the fundamental laws of reality, all existence will unravel.',
    campaignMechanics: [
      {
        name: 'Planar Attunement',
        description: 'Track connection to different planes',
        rules: 'Spending time on a plane grants attunement bonuses (advantage on certain checks, resistance to planar effects) but makes you vulnerable to opposing planes. Each plane has unique properties that affect magic, rest, and abilities.'
      }
    ],
    sessionZeroQuestions: [
      'Have you traveled the planes before?',
      'Which plane fascinates or terrifies you most?',
      'What powerful entity might you have dealings with?',
      'What mortal concern still matters to you?',
      'What planar secret do you seek?',
      'Would you accept immortality if offered?',
      'What defines you when reality is fluid?'
    ]
  },
  {
    id: 'dragon-hunt',
    name: 'Dragon Hunt',
    complexity: 2,
    pitch: 'A classic quest to hunt down and defeat a dragon terrorizing the land - the ultimate test of courage and skill.',
    toneAndFeel: ['Epic', 'Dangerous', 'Heroic', 'Escalating', 'Legendary', 'Tense'],
    themes: ['Courage vs. Fear', 'David vs. Goliath', 'Legendary Heroism', 'Preparation and Strategy', 'Glory and Greed'],
    touchstones: ['The Hobbit', 'Beowulf', 'Dragonslayer', 'How to Train Your Dragon', 'Reign of Fire'],
    overview: 'A dragon has taken up residence in the mountains, demanding tribute from nearby settlements. Its hoard contains legendary treasures, but countless heroes have perished attempting to claim them. The wyrm\'s cunning matches its strength - it has spies, minions, and contingencies. Hunting a dragon requires more than sharp swords; it demands careful preparation, gathering intelligence, acquiring specialized equipment, and recruiting allies.',
    playerPrinciples: ['Prepare Thoroughly', 'Respect Your Enemy\'s Power', 'Work as a Team', 'Be Ready to Adapt'],
    gmPrinciples: ['Make the Dragon Feel Intelligent and Dangerous', 'Build Tension Through Investigation', 'Reward Preparation', 'Create an Epic Final Battle'],
    incitingIncident: 'A red dragon has claimed the Ironpeak Mountains, burning villages that refuse tribute. The local lord offers a legendary reward to anyone who can slay the beast, but previous adventuring parties have disappeared without a trace. You discover one survivor who whispers a terrible truth - the dragon is hunting dragonslayers.',
    campaignMechanics: [
      {
        name: 'Dragon Intelligence',
        description: 'The dragon learns and adapts',
        rules: 'Each failed attempt to harm or scout the dragon teaches it about the party\'s tactics and abilities. It prepares counters, sets traps, and targets weaknesses. Investigation and stealth determine how much it knows about you.'
      }
    ],
    sessionZeroQuestions: [
      'Why do you hunt this dragon?',
      'What do you know about dragonkind?',
      'What dragon-related trauma haunts you?',
      'Are you motivated by glory, gold, or justice?',
      'What makes you think you can succeed where others failed?',
      'Would you negotiate with the dragon, or must it die?',
      'What will you do with the dragon\'s hoard?'
    ]
  },
  {
    id: 'mystery-murder',
    name: 'Mystery & Murder',
    complexity: 2,
    pitch: 'Solve a complex mystery involving murder, conspiracy, and hidden secrets where the truth is buried beneath layers of deception.',
    toneAndFeel: ['Mysterious', 'Methodical', 'Tense', 'Investigative', 'Noir', 'Cerebral'],
    themes: ['Truth vs. Lies', 'Justice and Vengeance', 'Secrets and Revelation', 'Trust and Betrayal', 'Hidden Motives'],
    touchstones: ['Knives Out', 'Murder on the Orient Express', 'Sherlock Holmes', 'True Detective', 'Clue'],
    overview: 'A murder has been committed, but nothing is as it seems. Every witness has something to hide, every clue leads to more questions, and the killer is always one step ahead. The party must piece together evidence, interrogate suspects, and unravel a conspiracy that goes deeper than a simple murder. Time is of the essence - if they don\'t solve it soon, more will die.',
    playerPrinciples: ['Document Everything', 'Trust No One Completely', 'Look for Patterns', 'Question Your Assumptions'],
    gmPrinciples: ['Plant Clues Fairly', 'Make NPCs Three-Dimensional', 'Use Red Herrings Sparingly', 'Reveal Truth in Satisfying Stages'],
    incitingIncident: 'A prominent merchant is found dead in a locked room, with no obvious means of entry or escape. The local authorities are baffled, and the merchant\'s family hires you to investigate. But as you dig deeper, you discover the victim had enemies in high places, and someone powerful wants this case to go unsolved.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'What investigative skill are you known for?',
      'Have you solved mysteries before?',
      'What unsolved case haunts you?',
      'How do you feel about bending the law for justice?',
      'Who do you trust to tell the truth?',
      'What would you do if your ally was the killer?',
      'What motivates you to seek the truth?'
    ]
  },
  {
    id: 'wilderness-survival',
    name: 'Wilderness Survival',
    complexity: 1,
    pitch: 'Survive in harsh, untamed wilderness while pursuing a goal or escaping danger - a test of endurance, resourcefulness, and will.',
    toneAndFeel: ['Tense', 'Isolating', 'Primal', 'Desperate', 'Raw', 'Unforgiving'],
    themes: ['Survival', 'Nature vs. Civilization', 'Resourcefulness', 'Endurance', 'Isolation'],
    touchstones: ['The Revenant', 'Into the Wild', 'Hatchet', 'The Grey', '127 Hours'],
    overview: 'Far from civilization, the wilderness is deadly. No shops sell supplies, no temples offer healing, and rescue isn\'t coming. Every day brings new challenges - finding food and water, navigating treacherous terrain, avoiding predators, and surviving extreme weather. The party must use every skill and resource to survive long enough to reach their goal or escape the wild.',
    playerPrinciples: ['Conserve Resources', 'Adapt to Nature', 'Support Your Team', 'Keep Moving Forward'],
    gmPrinciples: ['Make Survival Choices Matter', 'Show Nature as Beautiful and Deadly', 'Track Resources Carefully', 'Balance Hardship with Hope'],
    incitingIncident: 'Your expedition ship crashes on an uncharted island during a storm. Half the crew is dead, supplies are scattered in the jungle, and the wreckage is sinking fast. You must salvage what you can and trek across the island to reach the only known settlement - but the jungle is filled with dangers both natural and unnatural.',
    campaignMechanics: [
      {
        name: 'Survival Tracking',
        description: 'Track food, water, and exhaustion',
        rules: 'Characters need food and water daily or suffer exhaustion. Hunting, foraging, and finding water sources require skill checks. Weather, terrain, and injuries add additional challenges. Resource management is crucial.'
      }
    ],
    sessionZeroQuestions: [
      'What survival skills do you have?',
      'What wilderness experience do you bring?',
      'What would you sacrifice to survive?',
      'How do you handle isolation and hardship?',
      'What keeps you going when things look hopeless?',
      'Would you abandon the weak to save yourself?',
      'What do you fear most in the wild?'
    ]
  },
  {
    id: 'undead-uprising',
    name: 'Undead Uprising',
    complexity: 2,
    pitch: 'Fight against a rising tide of undead and discover the necromancer behind it all before the living world falls to death itself.',
    toneAndFeel: ['Horror', 'Dark', 'Desperate', 'Tense', 'Grim', 'Apocalyptic'],
    themes: ['Life vs. Death', 'Hope in Darkness', 'Corruption', 'Fear and Courage', 'The Unnatural'],
    touchstones: ['Night of the Living Dead', 'The Walking Dead', 'Evil Dead', 'World War Z', 'Diablo'],
    overview: 'The dead are rising. At first, isolated incidents - a few graves disturbed, shambling corpses quickly dispatched. But the undead multiply, becoming a tide of rotting flesh and bone. Entire villages fall, their populations joining the horde. Behind it all, a powerful necromancer or lich orchestrates the apocalypse. The party must fight through undead legions, protect survivors, and stop the source before the world of the living ends.',
    playerPrinciples: ['Protect the Living', 'Face Your Fear', 'Conserve Resources', 'Find Hope in Darkness'],
    gmPrinciples: ['Escalate the Threat Gradually', 'Use Horror and Dread', 'Make Death Feel Real', 'Show Moments of Hope'],
    incitingIncident: 'The dead begin rising from their graves across the region. A few at first, then dozens, then hundreds. The local temple\'s clerics struggle to contain them. You discover a pattern - all the undead are moving in the same direction, toward an ancient crypt that was recently excavated. Whatever was unleashed must be stopped.',
    campaignMechanics: [
      {
        name: 'Undead Tide',
        description: 'Track the spread of undead corruption',
        rules: 'Each day/week the undead threat grows. Settlements fall, adding to the horde. Party can slow the spread by destroying necromantic foci, protecting survivors, and disrupting the necromancer\'s plans. Final confrontation difficulty scales with how much the threat has grown.'
      }
    ],
    sessionZeroQuestions: [
      'What experience do you have fighting undead?',
      'Who have you lost to death?',
      'What terrifies you about the undead?',
      'Would you become undead to gain power to stop this?',
      'What holy symbol or belief protects you?',
      'How do you honor the dead?',
      'What would you sacrifice to save the living?'
    ]
  },
  {
    id: 'heist-caper',
    name: 'Heist & Caper',
    complexity: 2,
    pitch: 'Plan and execute an elaborate heist to steal a valuable item or rescue someone from an impossible-to-breach location.',
    toneAndFeel: ['Tense', 'Clever', 'Fast-Paced', 'Thrilling', 'Stylish', 'High-Stakes'],
    themes: ['Planning vs. Improvisation', 'Risk and Reward', 'Trust and Teamwork', 'Cleverness', 'Greed'],
    touchstones: ['Ocean\'s Eleven', 'The Italian Job', 'Inside Man', 'Leverage', 'The Sting'],
    overview: 'The target is heavily guarded - magical wards, skilled guards, complex locks, and deadly traps. A frontal assault would be suicide. Success requires meticulous planning, gathering intelligence, recruiting specialists, and executing a complex plan where everyone plays their part perfectly. But no plan survives contact with reality - when things go wrong, quick thinking and improvisation are essential.',
    playerPrinciples: ['Plan Thoroughly, Adapt Quickly', 'Use Your Unique Skills', 'Trust Your Team', 'Have a Backup Plan'],
    gmPrinciples: ['Reward Clever Planning', 'Let Plans Partially Fail', 'Make Security Logical and Beatable', 'Keep Tension High'],
    incitingIncident: 'A mysterious benefactor offers the party an enormous sum to steal a magical artifact from the Grand Museum of Antiquities - one of the most secure locations in the city. The artifact is displayed in a vault with magical wards, guard patrols, and arcane sentries. You have one week to plan, and one night to execute. The clock is ticking.',
    campaignMechanics: [
      {
        name: 'Heist Planning',
        description: 'Track preparation and contingencies',
        rules: 'Party spends downtime gathering intelligence (building layout, guard schedules, security measures). Each piece of intel can be used during the heist for advantage or to bypass obstacles. Preparation determines number of "backup plan" points usable when things go wrong.'
      }
    ],
    sessionZeroQuestions: [
      'What criminal skill do you bring to the crew?',
      'What\'s the craziest job you\'ve ever pulled?',
      'Who betrayed you in the past?',
      'What would you refuse to steal, no matter the price?',
      'How do you handle plans falling apart?',
      'What\'s your "tell" when you\'re nervous?',
      'What will you do with your cut of the score?'
    ]
  },
  {
    id: 'war-campaign',
    name: 'War Campaign',
    complexity: 3,
    pitch: 'Navigate a kingdom at war, with the party playing a crucial role in the conflict\'s outcome through battlefield heroics and strategic decisions.',
    toneAndFeel: ['Epic', 'Grim', 'Heroic', 'Large-Scale', 'Strategic', 'Intense'],
    themes: ['War and Peace', 'Duty and Sacrifice', 'Leadership', 'The Cost of Victory', 'Unity vs. Division'],
    touchstones: ['The Lord of the Rings', 'Game of Thrones', 'The Last Kingdom', 'Kingdom Come', 'Total War'],
    overview: 'Two kingdoms stand on the brink of war, and when it comes, the conflict will consume the land. Armies march, cities burn, and heroes rise or fall on the battlefield. The party finds themselves thrust into the war - whether as soldiers, mercenaries, or leaders. Their choices on and off the battlefield will determine the war\'s outcome and the fate of nations.',
    playerPrinciples: ['Lead from the Front', 'Protect Your Soldiers', 'Make Hard Choices', 'Fight for Something Worth Dying For'],
    gmPrinciples: ['Show War\'s Human Cost', 'Give Them Meaningful Strategic Choices', 'Create Epic Battlefield Moments', 'Make Victory Feel Earned'],
    incitingIncident: 'The King\'s son is assassinated on the border, and both kingdoms blame each other. Diplomacy fails, and war is declared. The party is recruited (or conscripted) into military service. Your first mission: a raid on an enemy supply depot. But as the war unfolds, you discover the assassination was orchestrated by a third party seeking to weaken both kingdoms.',
    campaignMechanics: [
      {
        name: 'War Progress Tracker',
        description: 'Track the war\'s momentum',
        rules: 'Party\'s mission successes and failures affect overall war progress. Winning key battles, completing strategic objectives, and maintaining troop morale shift momentum. Track using a progress clock or point system. Final outcome depends on accumulated victories.'
      }
    ],
    sessionZeroQuestions: [
      'Which kingdom do you fight for, and why?',
      'What military experience do you have?',
      'Who have you lost to war?',
      'What would make you question your side?',
      'How do you feel about killing enemy soldiers?',
      'What are you fighting to protect or achieve?',
      'What line won\'t you cross, even in war?'
    ]
  },
  {
    id: 'lost-civilization',
    name: 'Lost Civilization',
    complexity: 2,
    pitch: 'Discover the ruins of an ancient civilization and uncover its secrets, treasures, and the mystery of what destroyed it.',
    toneAndFeel: ['Mysterious', 'Exploratory', 'Historical', 'Wondrous', 'Ancient', 'Discovery'],
    themes: ['Discovery and Wonder', 'History and Legacy', 'Lost Knowledge', 'Rise and Fall', 'Archaeology'],
    touchstones: ['Indiana Jones', 'Tomb Raider', 'The Mummy', 'Atlantis', 'Stargate'],
    overview: 'An ancient empire vanished thousands of years ago, leaving behind magnificent ruins, advanced technology, and unanswered questions. Recent discoveries point to a lost city untouched since the fall. The party ventures into unexplored territory, piecing together the civilization\'s history through ruins, artifacts, and ancient texts. But they\'re not alone - rival expeditions and ancient guardians protect the secrets.',
    playerPrinciples: ['Document Your Discoveries', 'Respect the Past', 'Solve Ancient Mysteries', 'Preserve Knowledge'],
    gmPrinciples: ['Make Discovery Feel Earned', 'Use Environmental Storytelling', 'Reveal History Gradually', 'Balance Wonder with Danger'],
    incitingIncident: 'An earthquake reveals the entrance to a buried city, unsealing tombs that have been closed for millennia. Ancient artifacts begin appearing in black markets, and rival archaeological teams race to be the first to explore the ruins. But locals speak of curses and warn that the city was sealed for a reason.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'What draws you to ancient mysteries?',
      'What do you hope to discover?',
      'What historical knowledge do you possess?',
      'Would you keep artifacts or preserve them for study?',
      'What ancient culture fascinates you?',
      'How do you feel about disturbing the dead?',
      'What would you risk to make a legendary discovery?'
    ]
  },
  {
    id: 'guild-rise',
    name: 'Guild/Organization Rise',
    complexity: 3,
    pitch: 'Build and manage an adventuring guild, thieves\' guild, or organization from the ground up, competing with rivals and growing in power.',
    toneAndFeel: ['Strategic', 'Ambitious', 'Competitive', 'Building', 'Political', 'Long-Term'],
    themes: ['Building and Growth', 'Competition', 'Leadership', 'Loyalty and Management', 'Legacy'],
    touchstones: ['The Godfather', 'Breaking Bad', 'Succession', 'Guild Wars', 'The Wire'],
    overview: 'Starting with nothing but ambition, the party founds an organization - an adventuring company, thieves\' guild, mercenary outfit, or merchant consortium. They recruit members, take contracts, manage resources, and compete with established rivals. Success requires shrewd decisions about which jobs to take, who to trust, and when to expand. The goal: build an empire.',
    playerPrinciples: ['Think Long-Term', 'Invest in Your People', 'Build Relationships', 'Balance Risk and Reward'],
    gmPrinciples: ['Make Management Choices Matter', 'Create Rival Organizations', 'Show Consequences of Success and Failure', 'Let Them Build Something Meaningful'],
    incitingIncident: 'The party inherits a failing adventuring guild - a dilapidated guildhall, massive debts, and a tarnished reputation. Rival guilds circle like vultures, waiting to claim your contracts and members. You have one month to turn things around or lose everything. Time to prove that new blood can revive an old legacy.',
    campaignMechanics: [
      {
        name: 'Organization Management',
        description: 'Track guild resources and reputation',
        rules: 'Guild has resources (gold, personnel, equipment), reputation (affects contracts offered), and territory. During downtime, manage recruitment, take contracts, expand territory, and deal with rivals. Successful missions improve reputation and resources. Failed missions have consequences.'
      }
    ],
    sessionZeroQuestions: [
      'What role do you play in the organization?',
      'What type of guild/organization are you building?',
      'What\'s your long-term vision for the organization?',
      'Who is your biggest rival?',
      'What resources or connections do you bring?',
      'How do you handle internal conflicts?',
      'What legacy do you want to leave?'
    ]
  },
  {
    id: 'prophecy-destiny',
    name: 'Prophecy & Destiny',
    complexity: 3,
    pitch: 'The party is central to an ancient prophecy that will determine the fate of the world - are they the chosen heroes or pawns in a cosmic game?',
    toneAndFeel: ['Epic', 'Mythic', 'Fateful', 'Grand', 'Philosophical', 'World-Shaking'],
    themes: ['Fate vs. Free Will', 'Destiny and Choice', 'Heroic Sacrifice', 'Cosmic Stakes', 'Prophecy Fulfillment'],
    touchstones: ['The Lord of the Rings', 'Wheel of Time', 'The Matrix', 'Final Fantasy', 'Star Wars'],
    overview: 'An ancient prophecy speaks of heroes who will rise when darkness threatens to consume the world. Signs and portents point to the party as these chosen ones. But prophecies are cryptic, and interpretation determines meaning. Are they destined to save the world, or will trying to fulfill the prophecy doom it? The line between hero and pawn is thin, and cosmic forces manipulate events toward their own ends.',
    playerPrinciples: ['Question Your Destiny', 'Make Choices That Matter', 'Define Yourself', 'Embrace or Defy Fate'],
    gmPrinciples: ['Keep Prophecy Ambiguous', 'Present Meaningful Choices', 'Show Cosmic Scale', 'Build to Epic Climax'],
    incitingIncident: 'During a celestial alignment, each party member experiences a powerful vision - ancient symbols, a great darkness, and a choice that will determine the world\'s fate. A mysterious oracle finds you, declaring you are the ones spoken of in prophecy. But she warns: prophecy is not destiny, and your choices will determine whether you save the world or doom it.',
    campaignMechanics: [
      {
        name: 'Prophecy Tracker',
        description: 'Track fulfillment or defiance of prophecy elements',
        rules: 'Prophecy has multiple interpretation paths. Party\'s choices fulfill different aspects, leading to different outcomes. Track major prophecy milestones (both fulfilled and subverted). Final confrontation varies based on how much prophecy was followed vs. defied.'
      }
    ],
    sessionZeroQuestions: [
      'Do you believe in fate or free will?',
      'What would you sacrifice to save the world?',
      'What makes you worthy of being "chosen"?',
      'Would you defy prophecy if you disagreed with it?',
      'What do you fear about your destiny?',
      'Who or what marked you for this path?',
      'What do you hope to achieve beyond the prophecy?'
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
    playerPrinciples: [],
    gmPrinciples: [],
    incitingIncident: '',
    campaignMechanics: [],
    sessionZeroQuestions: []
  }
];

export default DND5E_CAMPAIGN_FRAMES;
