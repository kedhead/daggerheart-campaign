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
  const rollDamage = useCallback(async ({ label = '', dieType, quantity = 1, modifier = 0 } = {}) => {
    if (!campaignId || !dieType) return null;
    return publishRoll({
      campaignId,
      system: 'generic',
      config: { sides: dieType, quantity, modifier },
      rollerInfo: rollerInfoFromUser(currentUser),
      label,
    });
  }, [campaignId, currentUser]);

  // Star Wars D6 dice pool: e.g. rollD6Pool({count: 4, modifier: 2, label: 'Blaster (4D+2)'}).
  // First die is the wild die (explodes on 6, complication on 1).
  const rollD6Pool = useCallback(async ({ label = '', count = 3, modifier = 0 } = {}) => {
    if (!campaignId) return null;
    return publishRoll({
      campaignId,
      system: 'starwarsd6',
      config: { count, modifier },
      rollerInfo: rollerInfoFromUser(currentUser),
      label,
    });
  }, [campaignId, currentUser]);

  return { roll, rollDamage, rollD6Pool };
}
