/**
 * Curated Music Library
 * 179 free fantasy RPG tracks from Tabletop-RPG-Music (archived GitHub repo)
 * Served via jsDelivr CDN for instant playback
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/Tabletop-RPG-Music/tabletop-rpg-music@master/music';

export function getTrackUrl(filename) {
  return `${CDN_BASE}/${filename}.mp3`;
}

// Manual overrides for tricky CamelCase conversions
const DISPLAY_NAME_OVERRIDES = {
  'YeOldeTavern': "Ye Olde Tavern",
  'DingyTavern': 'Dingy Tavern',
  'SnowedInn': 'Snowed Inn',
  'TavernMusic': 'Tavern Music',
  'HomeandHearth': 'Home and Hearth',
  'TheBigBadEvilGuy': 'The Big Bad Evil Guy',
  'TheHelpfulHag': 'The Helpful Hag',
  'AStrangeWorld': 'A Strange World',
  'AirandWater': 'Air and Water',
  'FireandAsh': 'Fire and Ash',
  'ShadowandPain': 'Shadow and Pain',
  'SpellsandShadows': 'Spells and Shadows',
  'WhimsyandWarnings': 'Whimsy and Warnings',
  'HopeandMemory': 'Hope and Memory',
  'YouShouldn\'tBeHere': "You Shouldn't Be Here",
  'TheOldWaysofWar': 'The Old Ways of War',
  'TheFieldsOfOblivion': 'The Fields of Oblivion',
  'SongoftheElves': 'Song of the Elves',
  'UndertheMoonlightGlow': 'Under the Moonlight Glow',
  'EchoesfromtheAbyss': 'Echoes from the Abyss',
  'CaveoftheCrystalSerpent': 'Cave of the Crystal Serpent',
  'HallofForgottenHeroes': 'Hall of Forgotten Heroes',
  'EdgeoftheVoid': 'Edge of the Void',
  'SacredSpaceAmongDreamingSpheres': 'Sacred Space Among Dreaming Spheres',
  'SpiritsoftheJungle': 'Spirits of the Jungle',
  'AcrosstheHinterlands': 'Across the Hinterlands',
  'AbovetheRuins': 'Above the Ruins',
  'BeneaththeSpires': 'Beneath the Spires',
  'BeyondtheGates': 'Beyond the Gates',
  'BeyondtheVoid': 'Beyond the Void',
  'RiseoftheRealm': 'Rise of the Realm',
  'WarofRebirth': 'War of Rebirth',
  'MerchantofShadows': 'Merchant of Shadows',
  'KingdomofStars': 'Kingdom of Stars',
  'MelodyofMemory': 'Melody of Memory',
  'EdgeofUprising': 'Edge of Uprising',
  'WhispersintheDark': 'Whispers in the Dark',
  'DreamsofElysium': 'Dreams of Elysium',
  'LegendsofMagic': 'Legends of Magic',
  'TearsofAsmodeus': 'Tears of Asmodeus',
  'TearsofLight': 'Tears of Light',
  'TempleofBones': 'Temple of Bones',
  'BladesandBows': 'Blades and Bows',
  'DanceofBlades': 'Dance of Blades',
  'DanceofDeceit': 'Dance of Deceit',
};

/**
 * Convert CamelCase filename to readable display name
 */
export function getTrackDisplayName(filename) {
  if (DISPLAY_NAME_OVERRIDES[filename]) {
    return DISPLAY_NAME_OVERRIDES[filename];
  }
  // Split CamelCase: insert space before each uppercase letter that follows a lowercase
  return filename
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

/**
 * Music library organized by theme
 * ~120 curated tracks across 7 themes
 */
export const MUSIC_LIBRARY = {
  battle: [
    'AbyssalAssault',
    'ArcticAttack',
    'AscendantChaos',
    'BattleForge',
    'BladesandBows',
    'BrutalBattle',
    'CyberpunkWar',
    'DanceofBlades',
    'FlyingThunder',
    'GladiatorsCharge',
    'TheOldWaysofWar',
    'TribalWar',
    'ValhallaAwaits',
    'WastelandWar',
    'WarofRebirth',
    'EdgeofUprising',
    'Nemesis',
  ],
  exploration: [
    'AcrosstheHinterlands',
    'AbovetheRuins',
    'AgeofWonder',
    'BeneathTheWaves',
    'CampfireMemories',
    'ColdLands',
    'EternalDesert',
    'ForestStargazing',
    'Greenwood',
    'HallowedLands',
    'Landscapes',
    'MountainVillage',
    'MysticMeadows',
    'Prologue',
    'TheFrontier',
    'TreetopSanctuary',
    'WindsofChange',
  ],
  mystery: [
    'AbolethsLair',
    'CityIntrigue',
    'CityofGhosts',
    'DanceofDeceit',
    'DarkDungeon',
    'DarkSpaces',
    'FortuneTeller',
    'HagCoven',
    'MerchantofShadows',
    'NeonDetective',
    'SecretSteps',
    'TheAbandonedManor',
    'TheGlitteringCaverns',
    'TheSerpentsLair',
    'TheUnderdark',
  ],
  tavern: [
    'DingyTavern',
    'Dockside',
    'HomeandHearth',
    'Kraghammer',
    'Outlaw',
    'RegularGnoll',
    'SnowedInn',
    'TavernMusic',
    'ToyTown',
    'Whitestone',
    'YeOldeTavern',
  ],
  tension: [
    'AstralDreadnought',
    'BansheesCall',
    'CorruptedForest',
    'DarkRitual',
    'DemonLord',
    'Desolation',
    'Dreadmire',
    'EvilsApproach',
    'FadingHope',
    'Fracture',
    'Omen',
    'ShadowandPain',
    'TempleofBones',
    'TheBigBadEvilGuy',
    'YouShouldn\'tBeHere',
  ],
  victory: [
    'AftertheWar',
    'DawnsLight',
    'DragonsDefeated',
    'HopeandMemory',
    'JourneysEnd',
    'RiseoftheRealm',
    'Solace',
    'TearsofLight',
    'TheHeroesReturn',
    'TheWorldSong',
  ],
  mystical: [
    'ArcaneResonance',
    'AStrangeWorld',
    'AstralSea',
    'BygoneAge',
    'CelestialMemories',
    'ClockworkArcana',
    'DreamsofElysium',
    'Dreamscape',
    'DreamweaversCall',
    'DruidicSwamps',
    'EldritchProphecy',
    'EtherealVisions',
    'FeyDreams',
    'FireTemple',
    'ForgottenGods',
    'LegendsofMagic',
    'MagicReborn',
    'Otherworld',
    'PixieMeadow',
    'PlaneShift',
    'ShamansTrance',
    'SongoftheElves',
    'TheFeywild',
    'WizardTower',
  ],
};
