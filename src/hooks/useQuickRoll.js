import { useCallback } from 'react';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, onSnapshot } from 'firebase/firestore';
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

  const checkMapStatus = async () => {
    if (!campaignId) return false;
    try {
      const snap = await getDoc(doc(db, `campaigns/${campaignId}/battleMapStatus`, 'current'));
      if (snap.exists() && snap.data().lastActive) {
        const lastActive = snap.data().lastActive.toMillis();
        // Return true if active in the last 15 seconds
        if (Date.now() - lastActive < 15000) return true;
      }
    } catch (e) {
      console.warn("Failed to check battle map status", e);
    }
    return false;
  };

  const rollWithMap = (system, data) => {
    return new Promise(async (resolve) => {
      const { playerName, playerColor, playerId } = getPlayerInfo();
      data.playerName = playerName;
      data.playerColor = playerColor;
      data.playerId = playerId;
      data.system = system;
      data.status = 'pending';
      data.rollId = Date.now().toString();

      try {
        const requestsRef = collection(db, `campaigns/${campaignId}/diceRequests`);
        const reqDoc = await addDoc(requestsRef, data);
        
        let timeout;
        const unsubscribe = onSnapshot(doc(db, `campaigns/${campaignId}/diceRequests`, reqDoc.id), (docSnap) => {
          if (docSnap.exists() && docSnap.data().status === 'completed') {
            clearTimeout(timeout);
            unsubscribe();
            // Battle map returns { hopeDie, fearDie, total, etc.}
            resolve(docSnap.data().result);
          }
        });

        // 10s timeout fallback
        timeout = setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 10000);

      } catch (err) {
        resolve(null);
      }
    });
  };

  /**
   * Roll Hope & Fear dice (2d12) with a modifier.
   * Used for attribute checks and weapon attacks.
   */
  const roll = useCallback(async ({ label = '', modifier = 0 }) => {
    if (!campaignId || !currentUser) return null;

    const isMapActive = await checkMapStatus();
    
    if (isMapActive) {
      const mapResult = await rollWithMap('daggerheart', { modifier, label });
      if (mapResult) {
        // Log to local roll history 
        await addDoc(collection(db, `campaigns/${campaignId}/diceRolls`), {
          rollerId: currentUser.uid,
          rollerName: mapResult.playerName || getPlayerInfo().playerName,
          system: 'daggerheart',
          rollData: mapResult,
          label,
          isPrivate: false,
          timestamp: serverTimestamp(),
        });
        return mapResult;
      }
    }

    // --- FALLBACK (Map is off or timed out) ---
    const hopeDie = Math.floor(Math.random() * 12) + 1;
    const fearDie = Math.floor(Math.random() * 12) + 1;
    const total = hopeDie + fearDie + modifier;
    const outcome = hopeDie >= fearDie ? 'hope' : 'fear';
    const isDoubles = hopeDie === fearDie;

    const { playerName } = getPlayerInfo();

    await addDoc(collection(db, `campaigns/${campaignId}/diceRolls`), {
      rollerId: currentUser.uid,
      rollerName: playerName,
      system: 'daggerheart',
      rollData: { hopeDie, fearDie, modifier, total, outcome, isDoubles },
      label,
      isPrivate: false,
      timestamp: serverTimestamp(),
    });

    return { hopeDie, fearDie, modifier, total, outcome, isDoubles };
  }, [campaignId, currentUser]);

  /**
   * Roll weapon damage (generic dice, e.g. "d8+3", "2d6").
   */
  const rollDamage = useCallback(async ({ label = '', dieType, quantity = 1, modifier = 0 }) => {
    if (!campaignId || !currentUser || !dieType) return null;

    const isMapActive = await checkMapStatus();
    
    if (isMapActive) {
      const mapResult = await rollWithMap('generic', { 
        dieType, 
        diceConfig: { [`d${dieType}`]: quantity },
        modifier, 
        label 
      });
      if (mapResult) {
        await addDoc(collection(db, `campaigns/${campaignId}/diceRolls`), {
          rollerId: currentUser.uid,
          rollerName: mapResult.playerName || getPlayerInfo().playerName,
          system: 'generic',
          rollData: { dieType, quantity, rolls: mapResult.rolls, modifier, total: mapResult.total, isDoubles: mapResult.isCrit }, // approximation for damage doubles
          label,
          isPrivate: false,
          timestamp: serverTimestamp(),
        });
        return { dieType, quantity, rolls: mapResult.rolls, modifier, total: mapResult.total };
      }
    }

    // --- FALLBACK ---
    const rolls = Array.from({ length: quantity }, () => Math.floor(Math.random() * dieType) + 1);
    const total = rolls.reduce((a, b) => a + b, 0) + modifier;
    const isDoubles = quantity === 2 && rolls[0] === rolls[1];

    const { playerName } = getPlayerInfo();

    await addDoc(collection(db, `campaigns/${campaignId}/diceRolls`), {
      rollerId: currentUser.uid,
      rollerName: playerName,
      system: 'generic',
      rollData: { dieType, quantity, rolls, modifier, total, isDoubles },
      label,
      isPrivate: false,
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
