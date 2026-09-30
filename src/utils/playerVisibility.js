// Whether a player — as opposed to the DM — should see a piece of campaign
// content at all.
//
// Two flags mean "DM only" in this app, set by different paths:
//   hidden  — the DM's own toggle on NPCs, lore, locations and quests
//   dmOnly  — set by the AI session planner on material that must never reach
//             players, such as puzzle solution sheets (sessionPlanGenerator)
//
// Nothing read `dmOnly` at all, so AI-written puzzle solutions appeared in the
// players' Lore tab; and the NPC list checked neither flag, so hidden NPCs were
// listed for everyone. One predicate, used everywhere a list is filtered, so the
// two flags can't drift apart again.
//
// This is display-level only. Firestore rules still let any member read these
// documents, so a determined player with DevTools can see them — worth knowing,
// and a separate, larger change.

export function isVisibleToPlayers(entity) {
  if (!entity) return false;
  return !entity.hidden && !entity.dmOnly;
}

/** Filter a list for the current viewer: the DM sees everything. */
export function visibleTo(list, isDM) {
  if (!Array.isArray(list)) return [];
  return isDM ? list : list.filter(isVisibleToPlayers);
}
