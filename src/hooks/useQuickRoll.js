import { useCallback } from 'react';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Lightweight hook for triggering quick rolls from the character sheet.
 * Writes to two places:
 *   1. campaigns/{id}/diceRolls  → appears in DiceRollerFloat history
 *   2. campaigns/{id}/battleMapDisplay/diceRoll → triggers 3D animation on map/player screens
 *
 * @param {string} campaignId
 */
export function useQuickRoll(campaignId) {
  const { currentUser } = useAuth();

  const getPlayerInfo = () => ({
    playerName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Player',
    playerColor: localStorage.getItem('daggerheart_dice_color') || '#6366f1',
    playerId: currentUser?.uid,
  });

  /**
   * Roll Hope & Fear dice (2d12) with a modifier.
   * Used for attribute checks and weapon attacks.
   */
  const roll = useCallback(async ({ label = '', modifier = 0 }) => {
    if (!campaignId || !currentUser) return null;

    const hopeDie = Math.floor(Math.random() * 12) + 1;
    const fearDie = Math.floor(Math.random() * 12) + 1;
    const total = Math.max(hopeDie, fearDie) + modifier;
    const outcome = hopeDie >= fearDie ? 'hope' : 'fear';
    const isDoubles = hopeDie === fearDie;

    const { playerName, playerColor, playerId } = getPlayerInfo();

    // 1. Write to shared roll history (shown in DiceRollerFloat)
    await addDoc(collection(db, `campaigns/${campaignId}/diceRolls`), {
      rollerId: currentUser.uid,
      rollerName: playerName,
      system: 'daggerheart',
      rollData: { hopeDie, fearDie, modifier, total, outcome, isDoubles },
      label,
      isPrivate: false,
      timestamp: serverTimestamp(),
    });

    // 2. Trigger map/player-screen display — send config ONLY (no pre-computed values)
    //    so Dice3DOverlay uses physics to animate the dice (same as PlayerDicePanel).
    await setDoc(doc(db, `campaigns/${campaignId}/battleMapDisplay/diceRoll`), {
      system: 'daggerheart',
      modifier,
      label,
      playerName,
      playerColor,
      playerId,
      rollId: Date.now().toString(),
      timestamp: serverTimestamp(),
    });

    return { hopeDie, fearDie, modifier, total, outcome, isDoubles };
  }, [campaignId, currentUser]);

  /**
   * Roll weapon damage (generic dice, e.g. "d8+3", "2d6").
   */
  const rollDamage = useCallback(async ({ label = '', dieType, quantity = 1, modifier = 0 }) => {
    if (!campaignId || !currentUser || !dieType) return null;

    const rolls = Array.from({ length: quantity }, () => Math.floor(Math.random() * dieType) + 1);
    const total = rolls.reduce((a, b) => a + b, 0) + modifier;
    const isDoubles = quantity === 2 && rolls[0] === rolls[1];

    const { playerName, playerColor, playerId } = getPlayerInfo();

    await addDoc(collection(db, `campaigns/${campaignId}/diceRolls`), {
      rollerId: currentUser.uid,
      rollerName: playerName,
      system: 'generic',
      rollData: { dieType, quantity, rolls, modifier, total, isDoubles },
      label,
      isPrivate: false,
      timestamp: serverTimestamp(),
    });

    // Send config ONLY (no pre-computed rolls) so Dice3DOverlay uses physics animation
    await setDoc(doc(db, `campaigns/${campaignId}/battleMapDisplay/diceRoll`), {
      system: 'generic',
      diceConfig: { [`d${dieType}`]: quantity },
      modifier,
      label,
      playerName,
      playerColor,
      playerId,
      rollId: Date.now().toString(),
      timestamp: serverTimestamp(),
    });

    return { dieType, quantity, rolls, modifier, total, isDoubles };
  }, [campaignId, currentUser]);

  return { roll, rollDamage };
}

/**
 * Parses adversary damage strings like "2d6+4 phy", "1d8 physical", "d10 mag"
 * into rollDamage() params. Returns null if the string is unparseable.
 */
export const parseDamageNotation = (str) => {
  if (!str) return null;
  const match = str.match(/^(\d+)?d(\d+)(?:\+(\d+))?/i);
  if (!match) return null;
  return {
    quantity: parseInt(match[1] || '1', 10),
    dieType: parseInt(match[2], 10),
    modifier: parseInt(match[3] || '0', 10),
  };
};
