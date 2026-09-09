/**
 * Personalized item names.
 *
 * Items live in the shared campaign item catalog, so renaming a catalog entry
 * would rename it for everyone at the table. A player's chosen
 * name is stored on their own `equippedItems` entry as `customName` instead,
 * which every resolver already merges over the catalog item ({...item, ...ei}).
 * Anything that shows an item name reads it through `displayItemName`, so the
 * catalog name stays the fallback and the item's rules never change.
 */

export const MAX_CUSTOM_NAME_LENGTH = 60;

/** Trim, collapse whitespace and cap a player-entered name. '' clears it. */
export function normalizeCustomName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/\s+/g, ' ').trim().slice(0, MAX_CUSTOM_NAME_LENGTH);
}

/** The name to show: the player's own if they set one, otherwise the catalog's. */
export function displayItemName(item) {
  if (!item) return '';
  return normalizeCustomName(item.customName) || item.name || '';
}

/** True when this item carries a player name different from the catalog name. */
export function hasCustomName(item) {
  const custom = normalizeCustomName(item?.customName);
  return !!custom && custom !== (item?.name || '');
}

/**
 * Anything a character actually carries can be renamed — a weapon, a set of
 * armor, a lantern, a potion. The only thing that can't is a row with no item
 * behind it, since there'd be no catalog name to fall back to.
 */
export function isRenameable(item) {
  return !!item && (!!item.name || !!item.itemId);
}

/**
 * Return a new equippedItems array with `item`'s entry renamed.
 *
 * Entries are matched the way the equip toggles match them — by itemId plus
 * equipped state — so an equipped and a carried copy of the same weapon don't
 * collide. A blank name drops the field entirely, restoring the catalog name.
 * Returns the array unchanged when no entry matches.
 */
export function renameEquippedItem(equippedItems, item, name) {
  const arr = Array.isArray(equippedItems) ? [...equippedItems] : [];
  if (!item) return arr;
  const wasEquipped = item.equipped !== false;
  const idx = arr.findIndex(ei =>
    (ei.itemId === item.itemId || (item.id && (ei.itemId === item.id || ei.id === item.id))) &&
    ((ei.equipped !== false) === wasEquipped)
  );
  if (idx === -1) return arr;
  const custom = normalizeCustomName(name);
  const { customName, ...rest } = arr[idx];
  arr[idx] = custom ? { ...rest, customName: custom } : rest;
  return arr;
}
