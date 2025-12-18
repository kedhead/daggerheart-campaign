/**
 * Random Generators for Star Wars D6 Campaigns
 * Sci-fi themed lists for generating NPCs, Locations, and other content
 */

export const STARWARS_NAMES = [
  'Kara Stele', 'Jax Pavan', 'Mara Jade', 'Corran Horn', 'Tycho Celchu',
  'Wedge Antilles', 'Dash Rendar', 'Kyle Katarn', 'Jan Ors', 'Mara Kenobi',
  'Cade Skywalker', 'Jaina Solo', 'Jacen Solo', 'Ben Skywalker', 'Tenel Ka',
  'Lowbacca', 'Zekk', 'Tahiri Veila', 'Alema Rar', 'Tesar Sebatyne',
  'Kiro Vanto', 'Eli Vanto', 'Arihnda Pryce', 'Rae Sloane', 'Cassian Andor',
  'Jyn Erso', 'Bodhi Rook', 'Chirrut Îmwe', 'Baze Malbus', 'Saw Gerrera',
  'Hera Syndulla', 'Kanan Jarrus', 'Ezra Bridger', 'Sabine Wren', 'Zeb Orrelios',
  'Cham Syndulla', 'Numa', 'Iden Versio', 'Del Meeko', 'Gideon Hask',
  'Poe Dameron', 'Finn', 'Rose Tico', 'Rey', 'Ben Solo',
  'Amilyn Holdo', 'Snap Wexley', 'Jess Pava', 'Nien Nunb', 'Ackbar',
  'Crix Madine', 'Jan Dodonna', 'Garm Bel Iblis', 'Borsk Fey\'lya', 'Bail Organa',
  'Mon Mothma', 'Leia Organa', 'Luke Skywalker', 'Han Solo', 'Lando Calrissian'
];

export const STARWARS_OCCUPATIONS = [
  'Smuggler', 'Bounty Hunter', 'Pilot', 'Mechanic', 'Engineer',
  'Medic', 'Diplomat', 'Spy', 'Information Broker', 'Merchant',
  'Cantina Owner', 'Docking Bay Supervisor', 'Port Authority Officer', 'Customs Agent',
  'Black Market Dealer', 'Arms Dealer', 'Ship Dealer', 'Salvager', 'Scavenger',
  'Imperial Officer', 'Rebel Operative', 'Resistance Fighter', 'First Order Agent',
  'Scout', 'Explorer', 'Archaeologist', 'Historian', 'Xenobiologist',
  'Astromech Technician', 'Protocol Droid Programmer', 'Slaver', 'Crime Lord Lieutenant',
  'Hutt Cartel Representative', 'Corporate Sector Executive', 'Mining Guild Supervisor',
  'Trade Federation Delegate', 'Banking Clan Representative', 'Techno Union Engineer',
  'Jedi Padawan', 'Former Jedi', 'Force Sensitive', 'Dark Side Adept', 'Imperial Inquisitor',
  'Mandalorian Warrior', 'Clone Trooper', 'Stormtrooper Deserter', 'Imperial Defector',
  'Rebel Cell Leader', 'Resistance Commander', 'New Republic Senator', 'Imperial Moff'
];

export const STARWARS_LOCATIONS = [
  'The Mos Eisley Cantina', 'Docking Bay 94', 'The Emperor\'s Throne Room',
  'Jabba\'s Palace', 'Cloud City', 'Echo Base', 'Massassi Temple',
  'The Jedi Temple', 'Coruscant Underworld', 'Senate Building',
  'Death Star Hangar', 'Imperial Academy', 'Rebel Outpost Delta',
  'Hutt Space Trading Post', 'Corporate Sector Station', 'Smuggler\'s Den',
  'The Outer Rim Territories', 'Wild Space Frontier', 'Unknown Regions Outpost',
  'Hyperspace Waystation', 'Asteroid Mining Colony', 'Tibanna Gas Platform',
  'Spice Mines of Kessel', 'Ryloth Resistance Base', 'Mandalore Stronghold',
  'Kamino Cloning Facility', 'Geonosis Battle Arena', 'Mustafar Mining Complex',
  'Dagobah Swamp', 'Endor Forest Moon', 'Tatooine Jundland Wastes'
];

export const STARWARS_LOCATION_PREFIXES = [
  'New', 'Old', 'Imperial', 'Rebel', 'Hidden', 'Lost', 'Abandoned',
  'Secret', 'Remote', 'Outer Rim', 'Core World', 'Mid Rim', 'Wild Space',
  'Contested', 'Occupied', 'Liberated', 'Blockaded', 'Restricted', 'Free',
  'Trading', 'Mining', 'Research', 'Military', 'Civilian', 'Corporate'
];

export const STARWARS_LOCATION_SUFFIXES = {
  city: ['City', 'Spaceport', 'Starport', 'Hub', 'Station', 'Platform', 'Colony', 'Settlement'],
  town: ['Outpost', 'Trading Post', 'Waystation', 'Depot', 'Terminal', 'Port', 'Haven', 'Refuge'],
  village: ['Settlement', 'Encampment', 'Homestead', 'Colony', 'Compound', 'Outpost', 'Station', 'Base'],
  dungeon: ['Ruins', 'Wreckage', 'Derelict', 'Tomb', 'Catacombs', 'Prison', 'Detention Block', 'Facility'],
  wilderness: ['Sector', 'Expanse', 'Nebula', 'Asteroid Field', 'Badlands', 'Wastes', 'Wilds', 'Frontier'],
  landmark: ['Monument', 'Temple', 'Citadel', 'Observatory', 'Beacon', 'Array', 'Installation', 'Complex'],
  other: ['Sector', 'Zone', 'District', 'Quarter', 'Level', 'Platform', 'Dock', 'Bay']
};

export const STARWARS_REGIONS = [
  'Core Worlds', 'Inner Rim', 'Mid Rim', 'Outer Rim Territories',
  'Wild Space', 'Unknown Regions', 'Expansion Region', 'Colonies',
  'Hutt Space', 'Corporate Sector', 'Tion Cluster', 'Hapes Consortium',
  'Mandalorian Space', 'Chiss Ascendancy', 'Sith Worlds', 'Jedi Territories'
];

export const STARWARS_NPC_DESCRIPTIONS = [
  'A battle-scarred veteran with cybernetic implants and a haunted look in their eyes.',
  'Young and idealistic, eager to prove themselves in the galactic conflict.',
  'Gruff and pragmatic, having survived by their wits in the lawless Outer Rim.',
  'Mysterious and Force-sensitive, with knowledge of ancient Jedi secrets.',
  'Charismatic and smooth-talking, able to negotiate deals across the galaxy.',
  'Sharp-eyed and paranoid, constantly scanning for Imperial surveillance.',
  'Gentle and compassionate, dedicated to healing in a war-torn galaxy.',
  'Calculating and ruthless, with connections to the underworld syndicates.',
  'Brilliant engineer, always tinkering with droids and starship systems.',
  'Former Imperial officer, now disillusioned and seeking redemption.'
];

export const STARWARS_ENCOUNTER_ENVIRONMENTS = [
  'Asteroid field debris', 'Derelict Star Destroyer', 'Abandoned mining colony',
  'Dense jungle on a jungle moon', 'Lava flows on a volcanic world', 'Ice caverns on Hoth',
  'Crashed starship wreckage', 'Imperial research facility', 'Rebel hidden base',
  'Spice smuggling den', 'Hutt crime lord\'s lair', 'Corporate sector station',
  'Ancient Sith temple', 'Jedi ruins', 'Clone Wars battlefield', 'Death Star corridor'
];

export const STARWARS_ENCOUNTER_ENEMY_TYPES = [
  'Stormtroopers', 'Imperial Scout Troopers', 'TIE Fighter pilots',
  'Bounty hunters', 'Hutt cartel enforcers', 'Pirate crew', 'Smugglers',
  'Corporate security forces', 'Mercenary squad', 'Assassin droids',
  'Dark side Force users', 'Imperial Inquisitors', 'Sith cultists',
  'Wild creatures (Rancor, Nexu, Wampa)', 'Battle droids', 'Clone troopers'
];

export const STARWARS_ENCOUNTER_TACTICS = [
  'Coordinate blaster fire from cover positions',
  'Deploy probe droids to scout, then ambush',
  'Call for TIE fighter air support',
  'Use thermal detonators to flush out enemies',
  'Establish defensive perimeter and hold position',
  'Flank using jetpacks or repulsorlifts',
  'Disable ship systems, then board for capture',
  'Ion weapons to disable droids and vehicles',
  'Stun weapons to capture targets alive for interrogation',
  'Retreat to Star Destroyer for orbital bombardment'
];

export const STARWARS_ENCOUNTER_REWARDS = [
  'Imperial credits and seized equipment',
  'Valuable starship components or astromech droid',
  'Encrypted Imperial data chip with intelligence',
  'Black market contacts and safe house coordinates',
  'Rare kyber crystal or Force artifact',
  'Modified blaster pistol or custom armor',
  'Hyperspace navigation charts to hidden routes',
  'Bounty puck with lucrative target information',
  'Republic credits and Alliance commendation',
  'Deactivated assassin droid for reprogramming'
];

export const STARWARS_TONE_FEEL_OPTIONS = [
  'Space Opera', 'Heroic', 'Gritty', 'Noir', 'Swashbuckling',
  'Political Intrigue', 'Military', 'Underworld', 'Mystical',
  'Action-Packed', 'Desperate', 'Hope', 'Rebellion', 'Empire',
  'Smuggler\'s Life', 'Jedi Adventure', 'Dark Side', 'Bounty Hunting'
];

export const STARWARS_THEME_OPTIONS = [
  'Hope vs. Despair', 'Rebellion vs. Empire', 'Light vs. Dark',
  'Freedom vs. Tyranny', 'Duty vs. Personal Gain', 'Redemption',
  'Legacy and Destiny', 'Power and Corruption', 'Loyalty and Betrayal',
  'Survival in the Outer Rim', 'The Force and Balance', 'War\'s Cost'
];
