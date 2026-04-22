/**
 * Common Star Wars species for the D6 system.
 *
 * Grouped roughly by prevalence / familiarity. The list focuses on species
 * that appear in the core Star Wars D6 Rulebook, Galaxy Guides, and widely
 * used EU/canon sources — it is not exhaustive of the entire galaxy.
 */

export const STARWARS_SPECIES_GROUPS = [
  {
    label: 'Common Core Worlds & Rim',
    species: [
      'Human',
      'Twi\u2019lek',
      'Rodian',
      'Wookiee',
      'Mon Calamari',
      'Quarren',
      'Bothan',
      'Sullustan',
      'Gungan',
      'Zabrak',
      'Togruta',
      'Chiss',
      'Duros',
      'Kel Dor',
      'Nautolan',
      'Miraluka',
      'Mirialan',
      'Cerean',
      'Pantoran',
      'Devaronian'
    ]
  },
  {
    label: 'Hutt Space & Outer Rim',
    species: [
      'Hutt',
      'Jawa',
      'Tusken Raider',
      'Weequay',
      'Nikto',
      'Gamorrean',
      'Klatooinian',
      'Vodran',
      'Aqualish',
      'Bith',
      'Ithorian',
      'Kubaz',
      'Talz',
      'Snivvian',
      'Givin',
      'Defel',
      'Shistavanen'
    ]
  },
  {
    label: 'Mandalorian & Warrior Cultures',
    species: [
      'Mandalorian (Human)',
      'Taung',
      'Trandoshan',
      'Barabel',
      'Gand',
      'Noghri',
      'Yuzzum',
      'Yevetha'
    ]
  },
  {
    label: 'Unusual & Rare',
    species: [
      'Ewok',
      'Ugnaught',
      'Jawa',
      'Chadra-Fan',
      'Squib',
      'Verpine',
      'Falleen',
      'Neimoidian',
      'Muun',
      'Umbaran',
      'Geonosian',
      'Kaminoan',
      'Toydarian',
      'Dug',
      'Anzati',
      'Kitonak',
      'Gran',
      'Arcona',
      'Ortolan',
      'Besalisk',
      'Wroonian',
      'Zeltron',
      'Selonian',
      'Draethos',
      'Whiphid',
      'Yaka',
      'Mrlssi',
      'Polis Massan',
      'Lannik',
      'Iktotchi',
      'Caamasi'
    ]
  },
  {
    label: 'Force-Sensitive & Mystical',
    species: [
      'Miraluka',
      'Kiffar',
      'Dathomirian',
      'Nightsister',
      'Echani',
      'Sith Pureblood'
    ]
  },
  {
    label: 'Droids',
    species: [
      'Protocol Droid',
      'Astromech Droid',
      'Battle Droid',
      'Assassin Droid',
      'Medical Droid',
      'Labor Droid',
      'Probe Droid',
      'Other Droid'
    ]
  },
  {
    label: 'Other / Custom',
    species: [
      'Near-Human',
      'Unknown',
      'Other'
    ]
  }
];

// Flat, deduplicated list for quick lookup or search.
export const STARWARS_SPECIES = Array.from(
  new Set(STARWARS_SPECIES_GROUPS.flatMap(g => g.species))
).sort((a, b) => a.localeCompare(b));
