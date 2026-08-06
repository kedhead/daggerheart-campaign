// The single hook used by every inline 1-touch roll button in the app —
// character-sheet abilities, weapon damage, adversary attacks, encounter
// trackers. All of these eventually call publishRoll(); the heavy lifting
// (RNG, persistence, cross-device sync, animation) is handled by the
// downstream service + DiceTray.

import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { publishRoll } from './service.js';
import { getPlayerDiceColor, getDualitySet } from './playerColor.js';

function rollerInfoFromUser(currentUser) {
  return {
    rollerId: currentUser?.uid || null,
    rollerName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Player',
    rollerColor: getPlayerDiceColor(currentUser?.uid),
    duality: (({ hope, fear }) => ({ hope, fear }))(getDualitySet()),
  };
}

export function useDice(campaignId) {
  const { currentUser } = useAuth();

  // Daggerheart Hope/Fear roll. Optional advantage/disadvantage adds an
  // extra d6 (advantage adds, disadvantage subtracts).
  const roll = useCallback(async ({ label = '', modifier = 0, advantage = false, disadvantage = false } = {}) => {
    if (!campaignId) return null;
    return publishRoll({
      campaignId,
      system: 'daggerheart',
      config: { modifier, advantage, disadvantage },
      rollerInfo: rollerInfoFromUser(currentUser),
      label,
    });
  }, [campaignId, currentUser]);

  // Damage / generic roll: e.g. rollDamage({dieType: 8, quantity: 2, modifier: 3, label: 'Longsword'}).
  // `rerollBelow` drives reroll abilities — Not Good Enough passes 2 so any
  // damage die landing on a 1 or a 2 is rerolled before the total is taken.
  const rollDamage = useCallback(async ({
    label = '', dieType, quantity = 1, modifier = 0, rerollBelow = 0, rerollSource = '',
  } = {}) => {
    if (!campaignId || !dieType) return null;
    return publishRoll({
      campaignId,
      system: 'generic',
      config: { sides: dieType, quantity, modifier, rerollBelow, rerollSource },
      rollerInfo: rollerInfoFromUser(currentUser),
      label,
    });
  }, [campaignId, currentUser]);

  // Parry (Parrying Dagger). Rolls the dagger's damage dice against an
  // incoming damage roll and publishes the comparison, so the table sees which
  // of the attacker's dice were knocked out and what the damage came down to.
  // `target` is { rollId, label, dice: [{value, sides}], modifier, total }.
  // No modifier on the parry roll itself — only the die faces matter.
  const rollParry = useCallback(async ({ label = 'Parry', dieType, quantity = 1, target } = {}) => {
    if (!campaignId || !dieType || !target) return null;
    return publishRoll({
      campaignId,
      system: 'generic',
      config: { sides: dieType, quantity, modifier: 0, parryTarget: target },
      rollerInfo: rollerInfoFromUser(currentUser),
      label,
    });
  }, [campaignId, currentUser]);

  return { roll, rollDamage, rollParry };
}
