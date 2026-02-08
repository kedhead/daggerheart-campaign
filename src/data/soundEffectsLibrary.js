/**
 * Curated Sound Effects Library
 * ~166 free RPG sound effects from MaterialFoundry/SoundFxLibrary
 * Served via jsDelivr CDN for instant playback
 * Variants are grouped so clicking a sound picks a random variant
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/MaterialFoundry/SoundFxLibrary@master';

export function getSoundEffectUrl(path) {
  return `${CDN_BASE}/${encodeURI(path)}`;
}

/**
 * Get a random variant URL for a curated sound effect
 */
export function getRandomVariantUrl(sound) {
  const variant = sound.variants[Math.floor(Math.random() * sound.variants.length)];
  return getSoundEffectUrl(variant);
}

/**
 * Curated sound effects organized by category
 * Categories match the existing soundboard tabs: combat, magic, nature, ambient, creatures
 * Each entry: { id, name, variants: [paths], loop: boolean }
 */
export const CURATED_SOUND_EFFECTS = {
  combat: [
    {
      id: 'curated-arrow-flyby',
      name: 'Arrow Fly-By',
      variants: [
        'Combat/Single/Arrow Fly-By/arrow-fly-by-1.mp3',
        'Combat/Single/Arrow Fly-By/arrow-fly-by-2.mp3',
        'Combat/Single/Arrow Fly-By/arrow-fly-by-3.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-arrow-impact',
      name: 'Arrow Impact',
      variants: [
        'Combat/Single/Arrow Impact/arrow-impact-1.mp3',
        'Combat/Single/Arrow Impact/arrow-impact-2.mp3',
        'Combat/Single/Arrow Impact/arrow-impact-3.mp3',
        'Combat/Single/Arrow Impact/arrow-impact-4.mp3',
        'Combat/Single/Arrow Impact/arrow-impact-5.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-battle-cry',
      name: 'Battle Cry',
      variants: [
        'Combat/Single/Battle Cry/battle-cry-1.mp3',
        'Combat/Single/Battle Cry/battle-cry-2.mp3',
        'Combat/Single/Battle Cry/battle-cry-3.mp3',
        'Combat/Single/Battle Cry/battle-cry-4.mp3',
        'Combat/Single/Battle Cry/battle-cry-5.mp3',
        'Combat/Single/Battle Cry/battle-cry-6.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-melee-hit',
      name: 'Melee Hit',
      variants: [
        'Combat/Single/Melee Hit/melee-hit-1.mp3',
        'Combat/Single/Melee Hit/melee-hit-2.mp3',
        'Combat/Single/Melee Hit/melee-hit-3.mp3',
        'Combat/Single/Melee Hit/melee-hit-4.mp3',
        'Combat/Single/Melee Hit/melee-hit-5.mp3',
        'Combat/Single/Melee Hit/melee-hit-6.mp3',
        'Combat/Single/Melee Hit/melee-hit-7.mp3',
        'Combat/Single/Melee Hit/melee-hit-8.mp3',
        'Combat/Single/Melee Hit/melee-hit-9.mp3',
        'Combat/Single/Melee Hit/melee-hit-10.mp3',
        'Combat/Single/Melee Hit/melee-hit-11.mp3',
        'Combat/Single/Melee Hit/melee-hit-12.mp3',
        'Combat/Single/Melee Hit/melee-hit-13.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-melee-miss',
      name: 'Melee Miss',
      variants: [
        'Combat/Single/Melee Miss/melee-miss-1.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-shield-hit',
      name: 'Shield Hit',
      variants: [
        'Combat/Single/Shield Hit/shield-hit-1.mp3',
        'Combat/Single/Shield Hit/shield-hit-3.mp3',
        'Combat/Single/Shield Hit/shield-hit-4.mp3',
        'Combat/Single/Shield Hit/shield-hit-5.mp3',
        'Combat/Single/Shield Hit/shield-hit-6.mp3',
        'Combat/Single/Shield Hit/shield-hit-7.mp3',
        'Combat/Single/Shield Hit/shield-hit-8.mp3',
        'Combat/Single/Shield Hit/shield-hit-9.mp3',
        'Combat/Single/Shield Hit/shield-hit-10.mp3',
        'Combat/Single/Shield Hit/shield-hit-11.mp3',
        'Combat/Single/Shield Hit/shield-hit-12.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-throw-hit',
      name: 'Throw Hit',
      variants: [
        'Combat/Single/Throw Hit/throw-hit-1.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-fight-yells',
      name: 'Fight Yells',
      variants: [
        'Combat/Loops/Fight Yells/fight-yells-1.mp3',
        'Combat/Loops/Fight Yells/fight-yells-2.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-swordfight',
      name: 'Swordfight',
      variants: [
        'Combat/Loops/Swordfight/swordfight-1.mp3',
        'Combat/Loops/Swordfight/swordfight-2.mp3',
        'Combat/Loops/Swordfight/swordfight-3.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-swordfight-yells',
      name: 'Swordfight Yells',
      variants: [
        'Combat/Loops/Swordfight Yells/swordfight-yells-1.mp3',
      ],
      loop: true,
    },
  ],

  magic: [
    {
      id: 'curated-spell-impact',
      name: 'Spell Impact',
      variants: [
        'Combat/Single/Spell Impact/spell-impact-1.mp3',
        'Combat/Single/Spell Impact/spell-impact-2.mp3',
        'Combat/Single/Spell Impact/spell-impact-3.mp3',
        'Combat/Single/Spell Impact/spell-impact-4.mp3',
        'Combat/Single/Spell Impact/spell-impact-5.mp3',
        'Combat/Single/Spell Impact/spell-impact-6.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-spell-lightning',
      name: 'Lightning Spell',
      variants: [
        'Combat/Single/Spell Impact Lightning/spell-impact-lightning-1.mp3',
        'Combat/Single/Spell Impact Lightning/spell-impact-lightning-2.mp3',
        'Combat/Single/Spell Impact Lightning/spell-impact-lightning-3.mp3',
        'Combat/Single/Spell Impact Lightning/spell-impact-lightning-4.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-spell-whoosh',
      name: 'Spell Whoosh',
      variants: [
        'Combat/Single/Spell Whoosh/spell-whoosh-1.mp3',
        'Combat/Single/Spell Whoosh/spell-whoosh-2.mp3',
        'Combat/Single/Spell Whoosh/spell-whoosh-3.mp3',
        'Combat/Single/Spell Whoosh/spell-whoosh-4.mp3',
      ],
      loop: false,
    },
  ],

  nature: [
    {
      id: 'curated-forest-day',
      name: 'Forest Day',
      variants: [
        'Nature/Loops/Forest Day/forest-day-1.mp3',
        'Nature/Loops/Forest Day/forest-day-2.mp3',
        'Nature/Loops/Forest Day/forest-day-3.mp3',
        'Nature/Loops/Forest Day/forest-day-4.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-forest-night',
      name: 'Forest Night',
      variants: [
        'Nature/Loops/Forest Night/forest-night-1.mp3',
        'Nature/Loops/Forest Night/forest-night-2.mp3',
        'Nature/Loops/Forest Night/forest-night-3.mp3',
        'Nature/Loops/Forest Night/forest-night-4.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-ocean',
      name: 'Ocean Waves',
      variants: [
        'Nature/Loops/Ocean/ocean-1.mp3',
        'Nature/Loops/Ocean/ocean-2.mp3',
        'Nature/Loops/Ocean/ocean-3.mp3',
        'Nature/Loops/Ocean/ocean-4.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-rain',
      name: 'Rain',
      variants: [
        'Nature/Loops/Rain/rain-1.mp3',
        'Nature/Loops/Rain/rain-2.mp3',
        'Nature/Loops/Rain/rain-3.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-river',
      name: 'River',
      variants: [
        'Nature/Loops/River/river-1.mp3',
        'Nature/Loops/River/river-2.mp3',
        'Nature/Loops/River/river-3.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-stream',
      name: 'Stream',
      variants: [
        'Nature/Loops/Stream/stream-1.mp3',
        'Nature/Loops/Stream/stream-2.mp3',
        'Nature/Loops/Stream/stream-3.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-waterfall',
      name: 'Waterfall',
      variants: [
        'Nature/Loops/Waterfall/waterfall-1.mp3',
        'Nature/Loops/Waterfall/waterfall-2.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-wind',
      name: 'Wind',
      variants: [
        'Nature/Loops/Wind/wind-1.mp3',
        'Nature/Loops/Wind/wind-2.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-water-drips-echo',
      name: 'Water Drips Echo',
      variants: [
        'Nature/Loops/Water Drips Echo/water-drips-echo-1.mp3',
        'Nature/Loops/Water Drips Echo/water-drips-echo-2.mp3',
        'Nature/Loops/Water Drips Echo/water-drips-echo-3.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-water-drips',
      name: 'Water Drips',
      variants: [
        'Nature/Loops/Water Drips/water-drips-1.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-thunder',
      name: 'Thunder',
      variants: [
        'Nature/Single/Thunder/thunder-1.mp3',
        'Nature/Single/Thunder/thunder-2.mp3',
        'Nature/Single/Thunder/thunder-3.mp3',
        'Nature/Single/Thunder/thunder-4.mp3',
        'Nature/Single/Thunder/thunder-5.mp3',
        'Nature/Single/Thunder/thunder-6.mp3',
        'Nature/Single/Thunder/thunder-7.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-tree-falling',
      name: 'Tree Falling',
      variants: [
        'Nature/Single/Tree Falling/tree-falling-1.mp3',
        'Nature/Single/Tree Falling/tree-falling-2.mp3',
      ],
      loop: false,
    },
  ],

  ambient: [
    {
      id: 'curated-tavern-chatter',
      name: 'Tavern Chatter',
      variants: [
        'Tavern/Loops/Chatter/chatter-1.mp3',
        'Tavern/Loops/Chatter/chatter-2.mp3',
        'Tavern/Loops/Chatter/chatter-3.mp3',
        'Tavern/Loops/Chatter/chatter-4.mp3',
        'Tavern/Loops/Chatter/chatter-5.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-blacksmith',
      name: 'Blacksmith',
      variants: [
        'Town/Loops/Blacksmith/blacksmith-1.mp3',
        'Town/Loops/Blacksmith/blacksmith-2.mp3',
        'Town/Loops/Blacksmith/blacksmith-3.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-market',
      name: 'Market',
      variants: [
        'Town/Loops/Market/market-1.mp3',
        'Town/Loops/Market/market-2.mp3',
        'Town/Loops/Market/market-3.mp3',
        'Town/Loops/Market/market-4.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-fire',
      name: 'Fire',
      variants: [
        'Misc/Loops/Fire/fire-1.mp3',
        'Misc/Loops/Fire/fire-2.mp3',
        'Misc/Loops/Fire/fire-3.mp3',
      ],
      loop: true,
    },
    {
      id: 'curated-door-close',
      name: 'Door Close',
      variants: [
        'Misc/Single/Door Close/door-close-1.mp3',
        'Misc/Single/Door Close/door-close-2.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-door-open',
      name: 'Door Open',
      variants: [
        'Misc/Single/Door Close/door-open-1.mp3',
        'Misc/Single/Door Close/door-open-2.mp3',
        'Misc/Single/Door Close/door-open-3.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-squeaky-door',
      name: 'Squeaky Door',
      variants: [
        'Misc/Single/Squeaky Door Open/squeaky-door-open-1.mp3',
        'Misc/Single/Squeaky Door Open/squeaky-door-open-2.mp3',
        'Misc/Single/Squeaky Door Open/squeaky-door-open-3.mp3',
        'Misc/Single/Squeaky Door Open Slow/squeaky-door-open-slow-1.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-impact',
      name: 'Impact',
      variants: [
        'Misc/Single/Impact/impact-1.mp3',
        'Misc/Single/Impact/impact-2.mp3',
        'Misc/Single/Impact/impact-3.mp3',
        'Misc/Single/Impact/impact-4.mp3',
        'Misc/Single/Impact/impact-5.mp3',
        'Misc/Single/Impact/impact-6.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-water-splash',
      name: 'Water Splash',
      variants: [
        'Misc/Single/Water Splash/water-splash-1.mp3',
        'Misc/Single/Water Splash/water-splash-2.mp3',
        'Misc/Single/Water Splash/water-splash-3.mp3',
        'Misc/Single/Water Splash/water-splash-4.mp3',
      ],
      loop: false,
    },
  ],

  creatures: [
    {
      id: 'curated-bear-groan',
      name: 'Bear Groan',
      variants: [
        'Creatures/Animals/Bear Groan/bear-groan-1.mp3',
        'Creatures/Animals/Bear Groan/bear-groan-2.mp3',
        'Creatures/Animals/Bear Groan/bear-groan-3.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-cow-moo',
      name: 'Cow Moo',
      variants: [
        'Creatures/Animals/Crow Moo/cow-moo-1.mp3',
        'Creatures/Animals/Crow Moo/cow-moo-2.mp3',
        'Creatures/Animals/Crow Moo/cow-moo-3.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-dog-howl',
      name: 'Dog Howl',
      variants: [
        'Creatures/Animals/Dog Howl/dog-howl-1.mp3',
        'Creatures/Animals/Dog Howl/dog-howl-2.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-donkey',
      name: 'Donkey',
      variants: [
        'Creatures/Animals/Donkey/donkey-1.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-horse-gallop',
      name: 'Horse Gallop',
      variants: [
        'Creatures/Animals/Horse Gallop/horse-galop-1.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-horse-whinny',
      name: 'Horse Whinny',
      variants: [
        'Creatures/Animals/Horse Whinny/horse-whinny-1.mp3',
        'Creatures/Animals/Horse Whinny/horse-whinny-2.mp3',
        'Creatures/Animals/Horse Whinny/horse-whinny-3.mp3',
        'Creatures/Animals/Horse Whinny/horse-whinny-4.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-rooster',
      name: 'Rooster',
      variants: [
        'Creatures/Animals/Rooster/rooster-1.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-wolf-growl',
      name: 'Wolf Growl',
      variants: [
        'Creatures/Animals/Wolf Growl/wolf-growl-1.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-wolf-howl',
      name: 'Wolf Howl',
      variants: [
        'Creatures/Animals/Wolf Howl/wolf-howl-1.mp3',
        'Creatures/Animals/Wolf Howl/wolf-howl-2.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-angry-noises',
      name: 'Angry Noises',
      variants: [
        'Creatures/Monsters/Angry Noises/angry-noises-1.mp3',
        'Creatures/Monsters/Angry Noises/angry-noises-2.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-monster-growl',
      name: 'Monster Growl',
      variants: [
        'Creatures/Monsters/Growl/growl-1.mp3',
        'Creatures/Monsters/Growl/growl-2.mp3',
        'Creatures/Monsters/Growl/growl-3.mp3',
        'Creatures/Monsters/Growl/growl-4.mp3',
        'Creatures/Monsters/Growl/growl-5.mp3',
        'Creatures/Monsters/Growl/growl-6.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-moan',
      name: 'Ghostly Moan',
      variants: [
        'Creatures/Monsters/Moan/moan-1.mp3',
        'Creatures/Monsters/Moan/moan-2.mp3',
      ],
      loop: false,
    },
    {
      id: 'curated-zombie',
      name: 'Zombie',
      variants: [
        'Creatures/Monsters/Zombie/zombie-1.mp3',
        'Creatures/Monsters/Zombie/zombie-2.mp3',
        'Creatures/Monsters/Zombie/zombie-3.mp3',
        'Creatures/Monsters/Zombie/zombie-4.mp3',
        'Creatures/Monsters/Zombie/zombie-5.mp3',
        'Creatures/Monsters/Zombie/zombie-6.mp3',
        'Creatures/Monsters/Zombie/zombie-7.mp3',
      ],
      loop: false,
    },
  ],
};
