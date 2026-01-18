import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDocs,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing shared dice rolls in a campaign
 * Provides real-time subscription to roll history and methods to add/clear rolls
 *
 * @param {string} campaignId - The campaign ID
 * @param {boolean} isDM - Whether current user is DM (for clearHistory permission)
 * @returns {Object} Roll history and methods
 */
export function useDiceRolls(campaignId, isDM = false) {
  const { currentUser } = useAuth();
  const [rolls, setRolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to recent rolls (last 50)
  useEffect(() => {
    if (!campaignId) {
      setRolls([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const rollsRef = collection(db, `campaigns/${campaignId}/diceRolls`);
    const rollsQuery = query(
      rollsRef,
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      rollsQuery,
      (snapshot) => {
        const rollsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamp to JS Date for display
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setRolls(rollsData);
        setLoading(false);
      },
      (err) => {
        console.error('[useDiceRolls] Error subscribing to rolls:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [campaignId]);

  /**
   * Add a new roll to the shared history
   * @param {Object} rollData - Roll data including system-specific fields
   * @param {string} rollData.system - Game system ('daggerheart', 'dnd5e', 'starwarsd6', 'generic')
   * @param {Object} rollData.rollData - System-specific roll results
   * @param {string} [rollData.label] - Optional description of what the roll was for
   * @param {boolean} [rollData.isPrivate] - If true, only DM can see this roll
   */
  const addRoll = async (rollData) => {
    if (!campaignId || !currentUser) {
      console.error('[useDiceRolls] Cannot add roll: missing campaignId or user');
      return null;
    }

    try {
      const rollDoc = {
        rollerId: currentUser.uid,
        rollerName: currentUser.displayName || currentUser.email || 'Unknown',
        system: rollData.system,
        rollData: rollData.rollData,
        label: rollData.label || '',
        isPrivate: rollData.isPrivate || false,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(
        collection(db, `campaigns/${campaignId}/diceRolls`),
        rollDoc
      );

      console.log('[useDiceRolls] Roll added:', docRef.id);
      return { id: docRef.id, ...rollDoc };
    } catch (err) {
      console.error('[useDiceRolls] Error adding roll:', err);
      setError(err.message);
      return null;
    }
  };

  /**
   * Clear all roll history (DM only)
   */
  const clearHistory = async () => {
    if (!campaignId || !isDM) {
      console.error('[useDiceRolls] Cannot clear history: not DM or missing campaignId');
      return false;
    }

    try {
      const rollsRef = collection(db, `campaigns/${campaignId}/diceRolls`);
      const snapshot = await getDocs(rollsRef);

      if (snapshot.empty) {
        console.log('[useDiceRolls] No rolls to clear');
        return true;
      }

      // Batch delete all rolls
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(doc(db, `campaigns/${campaignId}/diceRolls`, docSnapshot.id));
      });

      await batch.commit();
      console.log('[useDiceRolls] Cleared', snapshot.size, 'rolls');
      return true;
    } catch (err) {
      console.error('[useDiceRolls] Error clearing history:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Get visible rolls (filters out private rolls for non-DMs)
   */
  const visibleRolls = isDM
    ? rolls
    : rolls.filter(roll => !roll.isPrivate || roll.rollerId === currentUser?.uid);

  return {
    rolls: visibleRolls,
    allRolls: rolls, // For DM to see everything
    loading,
    error,
    addRoll,
    clearHistory
  };
}

/**
 * Helper function to format roll results for different systems
 */
export function formatRollResult(roll) {
  const { system, rollData } = roll;

  switch (system) {
    case 'daggerheart': {
      const { hopeDie, fearDie, modifier, total, outcome } = rollData;
      const outcomeText = outcome === 'hope' ? '✨ Hope' : outcome === 'fear' ? '💀 Fear' : '⚖️ Tie';
      return {
        primary: `${total}`,
        secondary: `Hope: ${hopeDie} | Fear: ${fearDie}${modifier ? ` + ${modifier}` : ''}`,
        badge: outcomeText,
        badgeClass: outcome
      };
    }

    case 'dnd5e': {
      const { d20, d20Second, modifier, total, mode, isCrit, isCritFail } = rollData;
      let modeText = '';
      if (mode === 'advantage') modeText = ' (Adv)';
      if (mode === 'disadvantage') modeText = ' (Dis)';

      let badge = '';
      let badgeClass = '';
      if (isCrit) { badge = '🎯 Crit!'; badgeClass = 'crit'; }
      if (isCritFail) { badge = '💥 Crit Fail!'; badgeClass = 'critfail'; }

      return {
        primary: `${total}`,
        secondary: d20Second !== undefined
          ? `d20: ${d20}, ${d20Second}${modifier ? ` + ${modifier}` : ''}${modeText}`
          : `d20: ${d20}${modifier ? ` + ${modifier}` : ''}`,
        badge,
        badgeClass
      };
    }

    case 'starwarsd6': {
      const { dice, wildDie, total, complication } = rollData;
      return {
        primary: `${total}`,
        secondary: `Dice: [${dice.join(', ')}] | Wild: ${wildDie}`,
        badge: complication ? '⚠️ Complication' : '',
        badgeClass: complication ? 'complication' : ''
      };
    }

    case 'generic':
    default: {
      const { dieType, quantity, rolls, modifier, total } = rollData;
      return {
        primary: `${total}`,
        secondary: `${quantity}d${dieType}: [${rolls.join(', ')}]${modifier ? ` + ${modifier}` : ''}`,
        badge: '',
        badgeClass: ''
      };
    }
  }
}
