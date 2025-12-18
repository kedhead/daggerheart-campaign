// Star Wars D6 Campaign Frame Templates
// Classic Star Wars campaign structures adapted to campaign frame format

export const STARWARSD6_CAMPAIGN_FRAMES = [
  {
    id: 'rebellion-heroes',
    name: 'Heroes of the Rebellion',
    complexity: 2,
    pitch: 'Join the Rebel Alliance in their fight against the tyrannical Galactic Empire. Undertake dangerous missions, rescue prisoners, and strike at Imperial targets in a heroic struggle for freedom.',
    toneAndFeel: ['Heroic', 'Action-Packed', 'Dangerous', 'Hopeful', 'Espionage', 'Military'],
    themes: ['Hope vs. Despair', 'Rebellion vs. Empire', 'Freedom vs. Tyranny', 'Sacrifice', 'Unity'],
    touchstones: ['Star Wars: A New Hope', 'Rogue One', 'Star Wars Rebels', 'Andor'],
    overview: 'The Galactic Empire has crushed the Old Republic and rules through fear and military might. The Rebel Alliance fights a desperate guerrilla war from hidden bases across the galaxy. Imperial Star Destroyers patrol hyperspace lanes while stormtroopers enforce brutal order on countless worlds. But hope remains alive in those brave enough to resist tyranny.',
    playerPrinciples: ['Fight for Something Bigger Than Yourself', 'Trust Your Team Even When Outnumbered', 'Find Hope in Dark Times', 'Make Sacrifices for Freedom'],
    gmPrinciples: ['Make the Empire Feel Overwhelming', 'Reward Clever Tactics Over Direct Combat', 'Show the Human Cost of War', 'Balance Danger with Hope'],
    incitingIncident: 'The party intercepts Imperial transmissions about a secret weapon being developed at a hidden facility. Rebel command assigns you to infiltrate the base, gather intelligence, and if possible, sabotage the project before it can be deployed against the Alliance.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'What drove you to join the Rebellion?',
      'What have you lost to the Empire?',
      'Which Rebel cell or base do you call home?',
      'What Imperial officer or agent do you have history with?',
      'What would you sacrifice for the Alliance?',
      'How do you feel about the use of extreme measures against the Empire?',
      'What do you hope to see in a galaxy free from Imperial rule?'
    ]
  },
  {
    id: 'scoundrels-edge',
    name: 'Scoundrels on the Edge',
    complexity: 1,
    pitch: 'Life on the fringes of galactic society. Smuggle cargo, avoid Imperial entanglements, hustle for credits, and try to stay one step ahead of bounty hunters and crime lords.',
    toneAndFeel: ['Gritty', 'Fast-Paced', 'Opportunistic', 'Noir', 'Underworld', 'Desperate'],
    themes: ['Survival', 'Greed vs. Ethics', 'Found Family', 'Debt and Consequences', 'Independence'],
    touchstones: ['Solo: A Star Wars Story', 'The Mandalorian', 'Firefly', 'Cowboy Bebop'],
    overview: 'The Outer Rim is a lawless frontier where Imperial control is weak and crime syndicates rule. Smugglers run the blockades, bounty hunters track their prey, and everyone is looking for their next big score. Credits are hard to come by, debts pile up fast, and crossing the wrong Hutt can be fatal. But for those skilled and lucky enough, the Edge offers freedom that the Core Worlds can never match.',
    playerPrinciples: ['Look Out for Number One (and Your Crew)', 'Take Risks for Big Payoffs', 'Never Make a Deal You Can\'t Walk Away From', 'Reputation Matters - Good or Bad'],
    gmPrinciples: ['Make Consequences Feel Real and Personal', 'Keep the Pressure On (Debts, Bounties, Enemies)', 'Give Them Tough Moral Choices', 'Let Them Build Underworld Connections'],
    incitingIncident: 'A mysterious client offers the party a lucrative but dangerous smuggling job - no questions asked. The cargo turns out to be more trouble than expected, and now you\'re caught between Imperial forces, bounty hunters, and a powerful crime lord who all want what you\'re carrying.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'What brought you to the Outer Rim fringe?',
      'Who do you owe money or favors to?',
      'What\'s the biggest score you ever pulled off?',
      'What line won\'t you cross for credits?',
      'Which faction (Empire, Rebels, Hutts, etc.) do you avoid?',
      'What reputation do you have in the underworld?',
      'What do you ultimately hope to achieve out here?'
    ]
  },
  {
    id: 'jedi-legacy',
    name: 'Legacy of the Jedi',
    complexity: 3,
    pitch: 'Force-sensitive characters discover their connection to the Force and the ancient Jedi traditions, while evading Imperial Inquisitors and uncovering lost Jedi knowledge.',
    toneAndFeel: ['Mystical', 'Epic', 'Dangerous', 'Philosophical', 'Ancient', 'Hunted'],
    themes: ['Light vs. Dark', 'Legacy and Duty', 'Hope and Renewal', 'Power and Temptation', 'Balance'],
    touchstones: ['Star Wars: The Last Jedi', 'Star Wars Rebels', 'Jedi: Fallen Order', 'The Force Awakens'],
    overview: 'Order 66 decimated the Jedi Order, and the Empire hunts the few survivors with relentless Inquisitors. Jedi temples lie in ruins, their knowledge scattered or destroyed. But the Force endures. Force-sensitive individuals across the galaxy feel the call, discovering fragments of Jedi training and philosophy. The path is dangerous - Imperial Inquisitors track Force users, and the Dark Side whispers tempting shortcuts to power.',
    playerPrinciples: ['Question What It Means to Be a Jedi', 'Resist the Temptation of the Dark Side', 'Protect the Innocent Even at Great Risk', 'Seek Knowledge and Understanding'],
    gmPrinciples: ['Make Force Discovery Feel Earned and Meaningful', 'Hunt Them with Inquisitors and Dark Siders', 'Present Moral Dilemmas About Using Power', 'Reveal Jedi History Gradually'],
    incitingIncident: 'One of you experiences a powerful Force vision leading to the ruins of an ancient Jedi Temple. There you discover a damaged holocron containing fragmentary Jedi training. But activating it has alerted the Empire to your presence - Inquisitors are coming.',
    campaignMechanics: [
      {
        name: 'Force Point Tracking',
        description: 'Track the use of Force Points and Dark Side temptation',
        rules: 'Characters receive Force Points that can be used for extraordinary actions. Using a Force Point for selfish or violent reasons risks Dark Side corruption. GM can offer Dark Side Points (more powerful but corrupting). Track Dark Side Points - too many and the character turns to darkness.'
      }
    ],
    sessionZeroQuestions: [
      'When did you first realize you were Force-sensitive?',
      'What Jedi teaching or philosophy resonates with you most?',
      'What tempts you toward the Dark Side?',
      'How do you hide your Force sensitivity from the Empire?',
      'What do you hope to learn about the Jedi?',
      'Would you use the Dark Side to save someone you love?',
      'What legacy do you want to leave for future Force users?'
    ]
  },
  {
    id: 'bounty-hunters',
    name: 'Bounty Hunter\'s Guild',
    complexity: 2,
    pitch: 'Professional bounty hunters taking contracts across the galaxy. Track dangerous targets, navigate the underworld, and compete with rival hunters for the biggest bounties.',
    toneAndFeel: ['Professional', 'Tense', 'Competitive', 'Dangerous', 'Tactical', 'Gritty'],
    themes: ['Honor Among Hunters', 'The Hunt', 'Professional vs. Personal', 'Competition', 'Survival'],
    touchstones: ['The Mandalorian', 'The Book of Boba Fett', 'Cowboy Bebop', 'No Country for Old Men'],
    overview: 'The Bounty Hunters Guild regulates contracts across the galaxy. Members track fugitives, capture targets, and collect bounties from Hutts, the Empire, corporations, and private clients. The best hunters earn legendary reputations and top credits. But the job is deadly - targets fight back, rival hunters sabotage jobs, and the Guild\'s code is strict. Honor matters, but so does survival.',
    playerPrinciples: ['Follow the Hunter\'s Code', 'Respect Your Prey', 'Never Betray a Contract (Unless...)', 'Build Your Reputation'],
    gmPrinciples: ['Make Each Hunt Unique and Challenging', 'Create Rival Hunters to Compete With', 'Give Bounties Depth and Backstory', 'Test Their Professional Ethics'],
    incitingIncident: 'The Bounty Hunters Guild posts a high-value contract - a target worth enough credits to set you up for life. But the bounty is contested by multiple top hunters, and the target has powerful allies who don\'t want them taken alive.',
    campaignMechanics: [
      {
        name: 'Bounty Tracking',
        description: 'Track investigation and pursuit of targets',
        rules: 'Each bounty requires investigation (gathering intel), pursuit (tracking the target), and capture (confrontation). GMs award clues based on skill checks. Targets may have allies, traps, or escape plans. Bounty values increase with difficulty and danger.'
      }
    ],
    sessionZeroQuestions: [
      'What drove you to become a bounty hunter?',
      'What\'s your most memorable capture?',
      'What\'s your signature weapon or tactic?',
      'Have you ever let a target go? Why?',
      'Which rival hunter do you have history with?',
      'What bounty are you still hunting?',
      'Where do you draw the line in this profession?'
    ]
  },
  {
    id: 'imperial-agents',
    name: 'Imperial Operatives',
    complexity: 2,
    pitch: 'Serve the Galactic Empire as elite operatives. Hunt Rebels, maintain order, root out corruption, and enforce Imperial law across the galaxy.',
    toneAndFeel: ['Military', 'Disciplined', 'Morally Complex', 'Structured', 'Professional', 'Conflicted'],
    themes: ['Duty vs. Morality', 'Order vs. Freedom', 'Loyalty', 'The Cost of Service', 'Shades of Gray'],
    touchstones: ['Andor (Imperial perspective)', 'Star Wars: Squadrons', 'Thrawn novels', 'The Manchurian Candidate'],
    overview: 'The Galactic Empire maintains order through military might and intelligence operations. Imperial Intelligence operatives serve on the front lines - hunting Rebel cells, rooting out traitors, and maintaining security. Operatives have access to Imperial resources and authority, but also face strict oversight. Not all Imperials are monsters - many genuinely believe in order and stability. But orders from above aren\'t always just.',
    playerPrinciples: ['Follow Orders (Until You Can\'t)', 'Question What You\'re Fighting For', 'Protect Your Team', 'Find Honor in Service'],
    gmPrinciples: ['Show Both Sides of the Empire', 'Give Them Morally Complex Missions', 'Make Loyalty Complicated', 'Show Consequences of Blind Obedience'],
    incitingIncident: 'Imperial Intelligence assigns your team to infiltrate and dismantle a Rebel cell operating in a populated sector. But as you investigate, you discover the "Rebels" include civilians protesting unjust Imperial policies. Your commanding officer orders you to eliminate them all.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'Why did you join the Empire?',
      'What do you believe the Empire stands for?',
      'What Imperial order troubled you most?',
      'Have you ever questioned your superiors?',
      'What would make you defect?',
      'How do you view the Rebellion?',
      'What do you hope to achieve through your service?'
    ]
  },
  {
    id: 'sector-rangers',
    name: 'Sector Rangers',
    complexity: 1,
    pitch: 'Maintain law and order as independent peacekeepers in the Outer Rim, dealing with pirates, protecting colonists, and solving frontier disputes.',
    toneAndFeel: ['Western', 'Frontier Justice', 'Independent', 'Protective', 'Lawful', 'Isolated'],
    themes: ['Justice vs. Law', 'Protection of the Innocent', 'Frontier Life', 'Self-Reliance', 'Community'],
    touchstones: ['The Mandalorian', 'Firefly', 'Justified', 'True Grit', 'Westworld'],
    overview: 'The Outer Rim is too distant for effective Imperial control or Rebel influence. Sector Rangers serve as independent peacekeepers, protecting colonists and settlers from pirates, slavers, and corporate exploitation. Rangers have limited resources and operate far from backup. Justice on the frontier is often improvised, and Rangers must balance the law with what\'s right.',
    playerPrinciples: ['Protect Those Who Can\'t Protect Themselves', 'Make Justice Swift and Fair', 'Rely on Your Own Resources', 'Build Trust with Frontier Communities'],
    gmPrinciples: ['Emphasize Frontier Isolation and Self-Reliance', 'Give Them No Easy Answers', 'Make Justice Personal', 'Show the Frontier\'s Harsh Beauty'],
    incitingIncident: 'Pirates have been raiding shipping lanes in your sector, and a distress call comes from a remote mining colony under attack. By the time you arrive, the pirates have taken hostages and are demanding ransom. No Imperial or Rebel support is coming - it\'s up to you.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'What made you become a Sector Ranger?',
      'What frontier world do you call home?',
      'What\'s the hardest decision you\'ve made as a Ranger?',
      'Who in the sector trusts you most?',
      'What threat to the sector keeps you up at night?',
      'How do you balance law with justice?',
      'What would make you hang up your badge?'
    ]
  },
  {
    id: 'unknown-regions',
    name: 'Exploring the Unknown',
    complexity: 2,
    pitch: 'Chart the Unknown Regions, discover lost civilizations, encounter strange alien species, and uncover ancient mysteries beyond the galactic rim.',
    toneAndFeel: ['Exploratory', 'Wondrous', 'Dangerous', 'Mysterious', 'Alien', 'Discovery'],
    themes: ['Exploration and Discovery', 'First Contact', 'Ancient Mysteries', 'Survival', 'Wonder'],
    touchstones: ['Star Trek', 'Interstellar', 'Journey to the Center of the Earth', 'The Expanse'],
    overview: 'Beyond the known galaxy lies the Unknown Regions - uncharted space filled with navigation hazards, strange phenomena, and mysteries waiting to be discovered. Ancient civilizations left ruins on forgotten worlds. Alien species unknown to the galaxy thrive in isolation. Explorers brave these dangers for glory, knowledge, or riches.',
    playerPrinciples: ['Approach the Unknown with Wonder', 'Document and Preserve Discoveries', 'Respect Alien Cultures', 'Survive Against the Odds'],
    gmPrinciples: ['Make Discoveries Feel Wondrous and Earned', 'Create Unique Alien Species and Cultures', 'Balance Wonder with Danger', 'Make Navigation and Resources Matter'],
    incitingIncident: 'While exploring a derelict ship in deep space, you discover an ancient star map pointing to coordinates in the Unknown Regions. The map promises the location of a legendary lost civilization with technology beyond anything in the known galaxy. But you\'re not the only ones who found it.',
    campaignMechanics: [
      {
        name: 'Exploration Resources',
        description: 'Track supplies and ship condition during long expeditions',
        rules: 'Track fuel, supplies, and ship integrity. Long journeys through unmapped space risk hyperspace accidents, equipment failures, and resource depletion. Finding supply caches or friendly outposts is crucial for survival.'
      }
    ],
    sessionZeroQuestions: [
      'What drives you to explore the Unknown Regions?',
      'What discovery would make you famous?',
      'What danger of deep space do you fear most?',
      'Have you encountered anything that defies explanation?',
      'What would you do if you found a civilization that wanted no contact?',
      'What relic or technology are you searching for?',
      'What would make you turn back from an expedition?'
    ]
  },
  {
    id: 'clone-wars',
    name: 'Clone Wars Heroes',
    complexity: 3,
    pitch: 'Fight in the Clone Wars alongside Jedi Generals and Clone Troopers, battling Separatist forces and uncovering conspiracies that threaten the Republic.',
    toneAndFeel: ['Epic', 'Military', 'Tragic', 'Heroic', 'Political', 'War Drama'],
    themes: ['War and Sacrifice', 'Loyalty and Betrayal', 'The Fall of Ideals', 'Brotherhood', 'Conspiracy'],
    touchstones: ['Star Wars: The Clone Wars', 'Band of Brothers', 'MASH', 'Apocalypse Now'],
    overview: 'The Clone Wars rage across the galaxy as the Republic battles the Separatist Alliance. Jedi serve as generals, leading clone armies into desperate battles. But darkness lurks beneath the surface - Sith Lords manipulate both sides, engineering the Jedi\'s destruction and the Republic\'s transformation into Empire. Heroes fight valiantly, unaware of the approaching tragedy.',
    playerPrinciples: ['Fight for the Republic and Your Brothers', 'Question the War\'s Purpose', 'Form Bonds in Battle', 'Seek the Truth Behind the Conflict'],
    gmPrinciples: ['Show the Scale and Horror of War', 'Foreshadow the Empire\'s Rise', 'Make Battles Personal and Tactical', 'Present Impossible Choices'],
    incitingIncident: 'Your squad is assigned to a critical battle that could turn the tide of the war. But intelligence suggests a Separatist super-weapon is being developed behind enemy lines, and a Republic Senator may be secretly aiding the enemy. Time to choose - follow orders or investigate the conspiracy.',
    campaignMechanics: [
      {
        name: 'War Campaign',
        description: 'Track large-scale military campaigns and tactical decisions',
        rules: 'Battles have strategic objectives beyond "defeat all enemies." Tactical decisions (flanking, air support, orbital strikes) affect outcomes. Track squad morale and casualties. Failed missions have consequences for future battles.'
      }
    ],
    sessionZeroQuestions: [
      'What battalion or unit do you serve with?',
      'Which Jedi General do you serve under?',
      'What battle changed you?',
      'What brother-in-arms have you lost?',
      'Do you believe in the Republic\'s cause?',
      'What suspicions do you have about the war?',
      'What will you do when Order 66 comes?'
    ]
  },
  {
    id: 'old-republic',
    name: 'Tales of the Old Republic',
    complexity: 3,
    pitch: 'Adventure in the ancient days of the Jedi Order and Sith Empire, thousands of years before the Galactic Empire. Epic conflicts between Light and Dark.',
    toneAndFeel: ['Mythic', 'Epic', 'Ancient', 'Force-Focused', 'Legendary', 'Grand'],
    themes: ['Light vs. Dark', 'Ancient Conflicts', 'Legacy and Destiny', 'Power and Corruption', 'Philosophy'],
    touchstones: ['Knights of the Old Republic', 'The Lord of the Rings', 'Dragon Age', 'Arthurian Legends'],
    overview: 'Thousands of years before the rise of the Empire, the galaxy was different. The Jedi Order thrived, their temples numerous and their philosophy strong. But the Sith Empire rose from the ashes of defeat, waging war against the Republic. Force users were common, ancient technologies abounded, and the fate of the galaxy hung in balance between Light and Dark.',
    playerPrinciples: ['Uphold or Challenge Ancient Traditions', 'Explore the Nature of the Force', 'Make Legendary Choices', 'Leave a Legacy'],
    gmPrinciples: ['Make the Era Feel Mythic and Ancient', 'Show Both Jedi and Sith as Complex', 'Include Lost Force Knowledge', 'Make Moral Choices Matter'],
    incitingIncident: 'The Jedi Council sends you to investigate reports of Sith activity in a remote sector. You discover an ancient Sith artifact that grants terrible power - the kind that could turn the tide of the war. The question is: do you destroy it, use it, or let the Jedi Council decide?',
    campaignMechanics: [
      {
        name: 'Force Philosophy',
        description: 'Track alignment with Jedi or Sith philosophy',
        rules: 'Actions reflect Force philosophy (selfless vs. selfish, peaceful vs. passionate). Track choices on a spectrum between pure Light and pure Dark. Extreme alignment grants power but locks you into a path. Balance is difficult but possible.'
      }
    ],
    sessionZeroQuestions: [
      'Are you a Jedi, Sith, or independent Force user?',
      'What ancient Force technique do you seek?',
      'What Jedi or Sith Master trained you?',
      'What do you believe about the Light and Dark sides?',
      'What ancient mystery drives your quest?',
      'Would you sacrifice Jedi principles for victory?',
      'What legacy do you want to leave in the Force?'
    ]
  },
  {
    id: 'corporate-sector',
    name: 'Corporate Sector Intrigue',
    complexity: 2,
    pitch: 'Navigate the cutthroat world of mega-corporations in the Corporate Sector Authority, where credits rule and ethics are negotiable.',
    toneAndFeel: ['Noir', 'Political', 'Tense', 'Corporate', 'Cynical', 'Thriller'],
    themes: ['Greed and Power', 'Corporate Ethics', 'Economic Warfare', 'Survival in a Corrupt System', 'Whistleblowing'],
    touchstones: ['Blade Runner', 'Cyberpunk 2077', 'The Expanse', 'Mr. Robot', 'Margin Call'],
    overview: 'The Corporate Sector Authority operates beyond Republic and Imperial law. Mega-corporations wield absolute power, treating workers as expendable and profits as sacred. Corporate espionage, hostile takeovers, and "accidents" are business as usual. In this world, credits buy anything - including lives, loyalty, and truth.',
    playerPrinciples: ['Follow the Credits', 'Trust No One Completely', 'Document Everything', 'Find Your Line'],
    gmPrinciples: ['Show Corporate Power as Overwhelming', 'Make Every Choice Have Economic Consequences', 'Present Moral Compromises', 'Reward Clever Schemes'],
    incitingIncident: 'You\'re hired to steal industrial secrets from a rival corporation. The job seems straightforward until you discover the "secrets" are evidence of deadly safety violations being covered up. Workers are dying, and the corporation will kill to keep it quiet. Take the credits and run, or blow the whistle?',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'Which corporation do you work for (or against)?',
      'What corporate betrayal shaped you?',
      'How far will you go for credits?',
      'What ethical line won\'t you cross?',
      'Who in the corporate world can you trust?',
      'What do you want to expose or bring down?',
      'What\'s your ultimate goal in the Corporate Sector?'
    ]
  },
  {
    id: 'hutt-cartel',
    name: 'Hutt Cartel Operations',
    complexity: 2,
    pitch: 'Work for (or against) the powerful Hutt crime families. Navigate the galactic underworld, manage criminal enterprises, and survive cartel politics.',
    toneAndFeel: ['Dangerous', 'Criminal', 'Political', 'Brutal', 'Opportunistic', 'Noir'],
    themes: ['Crime and Consequences', 'Loyalty vs. Survival', 'Honor Among Thieves', 'Power Politics', 'Moral Compromise'],
    touchstones: ['The Godfather', 'The Wire', 'Narcos', 'Breaking Bad', 'Goodfellas'],
    overview: 'The Hutt Cartels control vast criminal empires spanning slavery, spice smuggling, gambling, and extortion. Hutt crime lords are ruthless and cunning, ruling through fear and calculated violence. Working for the Hutts can be profitable, but crossing them is fatal. In the underworld, reputation and connections mean everything.',
    playerPrinciples: ['Keep Your Word (When It Matters)', 'Show Respect to Those Who Earn It', 'Never Show Weakness', 'Survive by Any Means'],
    gmPrinciples: ['Make the Hutts Feel Powerful and Dangerous', 'Show the Underworld\'s Brutal Logic', 'Create Complex Criminal Relationships', 'Make Betrayal Feel Personal'],
    incitingIncident: 'A powerful Hutt crime lord recruits your group for a major operation - taking over a rival cartel\'s territory. The job promises riches and status in the underworld. But success will draw attention from the Empire, Rebels, and other Hutts. In this world, there are no clean victories.',
    campaignMechanics: [
      {
        name: 'Underworld Reputation',
        description: 'Track reputation and standing in criminal circles',
        rules: 'Actions affect reputation with various factions (Hutts, Black Sun, Pykes, etc.). High reputation grants access and resources but also enemies. Betrayals are remembered. Favors owed and debts create complications.'
      }
    ],
    sessionZeroQuestions: [
      'How did you get involved with the Hutt Cartel?',
      'Which Hutt do you work for (or against)?',
      'What\'s your role in the criminal underworld?',
      'What line won\'t you cross, even for the Hutts?',
      'Who in the underworld has your back?',
      'What debt or favor do you owe?',
      'What\'s your endgame in the criminal life?'
    ]
  },
  {
    id: 'new-republic',
    name: 'Building the New Republic',
    complexity: 2,
    pitch: 'After the Empire\'s fall, help establish the New Republic. Combat Imperial remnants, mediate political disputes, and forge a new government from the ashes.',
    toneAndFeel: ['Hopeful', 'Political', 'Challenging', 'Military', 'Diplomatic', 'Nation-Building'],
    themes: ['Hope and Renewal', 'Building from Ruins', 'Democracy vs. Order', 'Healing Old Wounds', 'Unity'],
    touchstones: ['The Mandalorian', 'Star Wars: Squadrons', 'The West Wing', 'Battlestar Galactica'],
    overview: 'The Empire has fallen, but peace is far from certain. Imperial warlords refuse to surrender, holding sectors hostage. Former enemies must learn to work together. Corruption threatens the fledgling Republic before it can even establish itself. The galaxy needs heroes who can fight when necessary and negotiate when possible - building a better future from the ashes of tyranny.',
    playerPrinciples: ['Fight for a Better Future', 'Build Bridges Between Former Enemies', 'Balance Ideals with Pragmatism', 'Protect the New Republic'],
    gmPrinciples: ['Show the Challenges of Nation-Building', 'Make Politics Personal', 'Balance Hope with Realistic Obstacles', 'Give Them Meaningful Victories'],
    incitingIncident: 'An Imperial Warlord refuses to surrender and threatens border worlds with orbital bombardment. The New Republic Senate is divided - some want military action, others want negotiation. Your team is sent to resolve the crisis, but you\'ll have to navigate both the Warlord\'s forces and Republic politics.',
    campaignMechanics: [],
    sessionZeroQuestions: [
      'What role did you play in defeating the Empire?',
      'What do you hope the New Republic will become?',
      'What part of the old Republic should be restored?',
      'What mistakes must the New Republic avoid?',
      'How do you feel about working with former Imperials?',
      'What sector or world are you helping to rebuild?',
      'What would make you lose faith in the New Republic?'
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

export default STARWARSD6_CAMPAIGN_FRAMES;
