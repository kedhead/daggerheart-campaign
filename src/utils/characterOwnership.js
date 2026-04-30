// Single helper for "which user owns this character?"
//
// Backwards-compat: characters created before the GM-assignable feature only
// have `createdBy`. Newer characters can have an explicit `playerId` set by
// the GM (e.g. to hand a sheet over to a player's alternate account). The
// effective owner is the first that's set.
export function getCharacterOwnerId(character) {
  if (!character) return null;
  return character.playerId || character.createdBy || null;
}

export function canPlayerAccessCharacter(character, uid) {
  if (!uid) return false;
  return getCharacterOwnerId(character) === uid;
}
