// Daggerheart's conditions. Three are core rules; the rest are "unique
// conditions" that a feature defines in its own text. These are every one
// the adversaries, environments and items in the app's catalog impose,
// with what they do and how they end, taken from that text. The GM can
// also add any other by name (see ConditionsBar).

export const CORE_CONDITIONS = [
  { name: 'Hidden', effect: 'Rolls against you have disadvantage.', clear: 'An adversary would see you, you move into their line of sight, or you attack.' },
  { name: 'Restrained', effect: "You can't move, but you can still act from where you are.", clear: 'When the effect that restrained you says so.' },
  { name: 'Vulnerable', effect: 'All rolls targeting you have advantage.', clear: 'When the effect that caused it ends.' },
];

export const UNIQUE_CONDITIONS = [
  { name: 'Ablaze', source: 'Emberite Shard', effect: 'Roll a d4 on each action roll: on a 1 mark a HP, on a 4 the condition clears.', clear: 'Rolling a 4 on that d4.' },
  { name: 'Beguiled', source: 'Gobstalker', effect: "Sees the Gobstalker as a friend and can't attack it. When a PC rolls with Fear, mark a Stress or attack a target the Gobstalker picks.", clear: 'Instinct Roll (16).' },
  { name: 'Chilled', source: 'Young Ice Dragon', effect: 'Disadvantage on attack rolls.', clear: 'Next rest, or when you clear a Stress.' },
  { name: 'Constricted', source: 'Lamia', effect: 'Restrained, and mark a Stress whenever the Lamia takes the spotlight.', clear: 'The Lamia moves or takes Major or greater damage.' },
  { name: 'Contagious', source: 'Harbinger of Pestilence', effect: 'Disadvantage on action rolls.', clear: 'Spend 3 Hope.' },
  { name: 'Cursed', source: 'Jagged Knife Hexer', effect: 'When you roll with Hope, the Hexer can mark a Stress to make it a roll with Fear.', clear: 'Temporary: when the GM says it ends.' },
  { name: 'Dazed', source: 'Hydra', effect: "Can't use Regeneration, but immune to magic damage.", clear: 'The next roll with Fear.', adversary: true },
  { name: 'Deathlocked', source: 'Mortal Hunter', effect: "The Hunter's attacks against you deal direct damage.", clear: 'End of the scene.' },
  { name: 'Deep Trance', source: 'Gobstalker', effect: "Can't act except to try to wake up.", clear: 'Taking damage, or a Presence Roll (16).' },
  { name: 'Dizzied', source: 'Assassin Poisoner', effect: 'Disadvantage on your next action roll.', clear: 'After that roll.' },
  { name: 'Enchanted', source: 'Kelpie', effect: 'You see the Kelpie as a trusted friend and do what it says, unless it goes against your deepest morals.', clear: 'Taking damage.' },
  { name: 'Entranced', source: 'Siren', effect: "Can't act, and you're Vulnerable.", clear: 'After marking 2 Stress.' },
  { name: 'Enveloped', source: 'Huge Green Ooze', effect: 'Mark an extra Stress every time you make an action roll.', clear: 'The Ooze takes Severe damage.' },
  { name: 'Envenomated', source: 'Viper', effect: 'Mark a Stress whenever you make an action roll.', clear: 'Temporary: when the GM says it ends.' },
  { name: 'Glowing', source: 'Gorgon', effect: "Attack rolls against you have advantage, and you can't become Hidden.", clear: 'End of the scene.' },
  { name: 'Grappled', source: 'Giant Octopus', effect: 'Restrained and Vulnerable.', clear: 'A successful Strength or Finesse Roll.' },
  { name: 'Guilty', source: 'High Seraph', effect: "You don't gain Hope on a roll with Hope. The Seraph's standard attacks deal Severe damage to you; Hallowed Archers deal double.", clear: 'The Seraph is defeated.' },
  { name: 'Ignited', source: 'Red Ooze', effect: 'Take 1d4 magic damage whenever you make an action roll.', clear: 'Extinguish it with a Finesse Roll (14).' },
  { name: 'Marked', source: 'Vault Guardian Turret', effect: 'Your Evasion is halved.', clear: 'The Turret is destroyed, or you become Hidden.' },
  { name: 'Panicked', source: 'Guahalan Alebrujo', effect: 'Mark a Stress when you take the spotlight.', clear: 'Temporary: when the GM says it ends.' },
  { name: 'Petrified', source: 'Basilisk', effect: "Can't act.", clear: 'Only by applying Basilisk saliva.' },
  { name: 'Poisoned', source: 'Giant Scorpion, Fungispunj Sporophore and others', effect: 'Roll a d6 before each action roll: on 4 or lower, mark a Stress.', clear: 'As the source says, e.g. next rest or Knowledge Roll (16), or spend a Hope.' },
  { name: 'Protected', source: 'Cult Adept', effect: 'Resistance to all damage.', clear: 'The Adept marks their last HP.', adversary: true },
  { name: 'Rattled', source: 'Entombed Cat Beast', effect: "The Cat Beast rolls damage twice against you and takes the better, then this clears.", clear: 'Rolling with Hope, or being hit that way.' },
  { name: 'Rooted', source: 'Oak Treant', effect: 'Restrained, with resistance to physical damage.', clear: 'The Treant ends it instead of moving.', adversary: true },
  { name: 'Scared', source: 'Gobstalker', effect: "Can't do anything but flee or shake off the terror; mark a Stress whenever the GM spends a Fear.", clear: 'Presence Roll (16).' },
  { name: 'Shaken', source: 'Rulebook example', effect: "You don't gain Hope on a roll with Hope; that roll clears Shaken instead.", clear: 'Your next roll with Hope.' },
  { name: 'Shaky', source: 'Darkweave Spinner, Manticore', effect: 'Disadvantage on attack rolls.', clear: 'As the source says: Instinct Roll (10), or spend a Hope.' },
  { name: 'Slowed', source: 'Soul-Shattered Mage', effect: "You're Vulnerable and must mark a Stress when you move.", clear: 'Rolling with Hope.' },
  { name: 'Stiff', source: 'Basilisk', effect: 'Mark a Stress each time you act. Stiff again makes you Petrified.', clear: 'A rest, or the Basilisk is defeated.' },
  { name: 'Swallowed', source: 'Ravenous Mockery, Lamplight Beguiler', effect: 'Restrained, and you take damage whenever it takes the spotlight.', clear: 'It takes Major or Severe damage.' },
  { name: 'Taunted', source: 'Weaponmaster', effect: 'Your next attack has disadvantage against anyone but the Weaponmaster.', clear: 'Your next successful attack.' },
  { name: 'Terrified', source: 'Wyvern', effect: "You don't gain a Hope when you roll with Hope.", clear: 'Presence Roll (18), or the Wyvern is defeated.' },
];

export const ALL_CONDITIONS = [...CORE_CONDITIONS.map(c => ({ ...c, core: true })), ...UNIQUE_CONDITIONS];

/** A condition's details by name (any case), or null for one the GM made up. */
export function conditionInfo(name) {
  const n = String(name || '').trim().toLowerCase();
  return ALL_CONDITIONS.find(c => c.name.toLowerCase() === n) || null;
}

/** How a condition is shown: its listed name, or the GM's own words tidied. */
export function conditionLabel(name) {
  const info = conditionInfo(name);
  if (info) return info.name;
  const s = String(name || '').trim();
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}

/** Add a condition (once; conditions don't stack), by its listed spelling. */
export function addCondition(list = [], name) {
  const label = conditionLabel(name).slice(0, 40);
  if (!label) return list;
  return (list || []).some(c => conditionLabel(c).toLowerCase() === label.toLowerCase()) ? list : [...(list || []), label];
}

export function removeCondition(list = [], name) {
  const key = conditionLabel(name).toLowerCase();
  return (list || []).filter(c => conditionLabel(c).toLowerCase() !== key);
}
