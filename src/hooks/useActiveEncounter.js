import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook for managing live encounter state
 * Syncs to Firestore at campaigns/{campaignId}/activeEncounter/current
 */
export function useActiveEncounter(campaignId) {
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to active encounter
  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');

    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setActiveEncounter({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          setActiveEncounter(null);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Active encounter subscription error:', error.code);
        setActiveEncounter(null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [campaignId]);

  /**
   * Start a new encounter from an encounter template
   */
  const startEncounter = useCallback(async (encounter, adversaries, environment = null) => {
    if (!campaignId) return;

    // Build participants from adversary slots
    const participants = [];
    let participantIndex = 0;

    const slots = Array.isArray(encounter.adversarySlots) ? encounter.adversarySlots : [];

    for (const slot of slots) {
      const adversary = adversaries.find(a => a.id === slot.adversaryId);
      if (!adversary) continue;

      const hp = adversary.hp || 10;
      const stress = adversary.stress || 3;

      for (let i = 0; i < (slot.quantity || 1); i++) {
        participantIndex++;

        // Build participant with only defined values
        const participant = {
          id: `p_${Date.now()}_${participantIndex}`,
          type: 'adversary',
          sourceId: adversary.id,
          name: slot.quantity > 1 ? `${adversary.name} ${i + 1}` : adversary.name,
          currentHP: hp,
          maxHP: hp,
          currentStress: 0,
          maxStress: stress,
          conditions: [],
          isDefeated: false,
          thresholds: {
            minor: adversary.thresholds?.minor || Math.floor(hp / 3),
            major: adversary.thresholds?.major || Math.floor(hp * 2 / 3),
            severe: adversary.thresholds?.severe || hp
          },
          features: adversary.features || [],
          role: adversary.role || 'standard',
          tier: adversary.tier || 1
        };

        // Only add optional fields if they have values
        if (adversary.difficulty !== undefined) participant.difficulty = adversary.difficulty;
        if (adversary.evasion !== undefined) participant.evasion = adversary.evasion;
        if (adversary.attack !== undefined) participant.attack = adversary.attack;
        if (adversary.damage !== undefined) participant.damage = adversary.damage;

        participants.push(participant);
      }
    }

    const encounterData = {
      encounterId: encounter.id || null,
      encounterName: encounter.name || 'Unnamed Encounter',
      environmentId: encounter.environmentId || null,
      environment: environment ? {
        name: environment.name || '',
        tier: environment.tier || 1,
        type: environment.type || 'combat',
        difficulty: environment.difficulty || 0,
        description: environment.description || '',
        features: environment.features || [],
        impulses: environment.impulses || []
      } : null,
      status: 'active',
      round: 1,
      participants,
      activeEnvironmentEffects: [],
      partySize: encounter.partySize || 4,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await setDoc(docRef, encounterData);

    return encounterData;
  }, [campaignId]);

  /**
   * Update encounter state
   */
  const updateEncounter = useCallback(async (updates) => {
    if (!campaignId || !activeEncounter) return;

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await setDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }, [campaignId, activeEncounter]);

  /**
   * Update a specific participant
   */
  const updateParticipant = useCallback(async (participantId, updates) => {
    if (!activeEncounter) return;

    const newParticipants = activeEncounter.participants.map(p =>
      p.id === participantId ? { ...p, ...updates } : p
    );

    await updateEncounter({ participants: newParticipants });
  }, [activeEncounter, updateEncounter]);

  /**
   * Apply damage to a participant
   */
  const applyDamage = useCallback(async (participantId, amount, damageType = 'hp') => {
    if (!activeEncounter) return;

    const participant = activeEncounter.participants.find(p => p.id === participantId);
    if (!participant) return;

    let updates = {};

    if (damageType === 'hp') {
      const newHP = Math.max(0, participant.currentHP - amount);
      updates.currentHP = newHP;
      if (newHP <= 0) {
        updates.isDefeated = true;
      }
    } else if (damageType === 'stress') {
      const newStress = Math.min(participant.maxStress, participant.currentStress + amount);
      updates.currentStress = newStress;
      if (newStress >= participant.maxStress) {
        updates.isDefeated = true;
      }
    }

    await updateParticipant(participantId, updates);
  }, [activeEncounter, updateParticipant]);

  /**
   * Apply healing to a participant
   */
  const applyHealing = useCallback(async (participantId, amount, healType = 'hp') => {
    if (!activeEncounter) return;

    const participant = activeEncounter.participants.find(p => p.id === participantId);
    if (!participant) return;

    let updates = {};

    if (healType === 'hp') {
      const newHP = Math.min(participant.maxHP, participant.currentHP + amount);
      updates.currentHP = newHP;
      if (newHP > 0 && participant.isDefeated) {
        updates.isDefeated = false;
      }
    } else if (healType === 'stress') {
      const newStress = Math.max(0, participant.currentStress - amount);
      updates.currentStress = newStress;
    }

    await updateParticipant(participantId, updates);
  }, [activeEncounter, updateParticipant]);

  /**
   * Add a condition to a participant
   */
  const addCondition = useCallback(async (participantId, condition) => {
    if (!activeEncounter) return;

    const participant = activeEncounter.participants.find(p => p.id === participantId);
    if (!participant) return;

    if (!participant.conditions.includes(condition)) {
      await updateParticipant(participantId, {
        conditions: [...participant.conditions, condition]
      });
    }
  }, [activeEncounter, updateParticipant]);

  /**
   * Remove a condition from a participant
   */
  const removeCondition = useCallback(async (participantId, condition) => {
    if (!activeEncounter) return;

    const participant = activeEncounter.participants.find(p => p.id === participantId);
    if (!participant) return;

    await updateParticipant(participantId, {
      conditions: participant.conditions.filter(c => c !== condition)
    });
  }, [activeEncounter, updateParticipant]);

  /**
   * Toggle defeated status
   */
  const toggleDefeated = useCallback(async (participantId) => {
    if (!activeEncounter) return;

    const participant = activeEncounter.participants.find(p => p.id === participantId);
    if (!participant) return;

    await updateParticipant(participantId, {
      isDefeated: !participant.isDefeated
    });
  }, [activeEncounter, updateParticipant]);

  /**
   * Advance to next round
   */
  const nextRound = useCallback(async () => {
    if (!activeEncounter) return;

    await updateEncounter({
      round: activeEncounter.round + 1
    });
  }, [activeEncounter, updateEncounter]);

  /**
   * Toggle an environment effect
   */
  const toggleEnvironmentEffect = useCallback(async (featureName) => {
    if (!activeEncounter) return;

    const activeEffects = activeEncounter.activeEnvironmentEffects || [];
    const isActive = activeEffects.includes(featureName);

    await updateEncounter({
      activeEnvironmentEffects: isActive
        ? activeEffects.filter(e => e !== featureName)
        : [...activeEffects, featureName]
    });
  }, [activeEncounter, updateEncounter]);

  /**
   * Pause the encounter
   */
  const pauseEncounter = useCallback(async () => {
    await updateEncounter({ status: 'paused' });
  }, [updateEncounter]);

  /**
   * Resume a paused encounter
   */
  const resumeEncounter = useCallback(async () => {
    await updateEncounter({ status: 'active' });
  }, [updateEncounter]);

  /**
   * End the encounter
   */
  const endEncounter = useCallback(async () => {
    if (!campaignId) return;

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await deleteDoc(docRef);
  }, [campaignId]);

  return {
    activeEncounter,
    loading,
    startEncounter,
    updateEncounter,
    updateParticipant,
    applyDamage,
    applyHealing,
    addCondition,
    removeCondition,
    toggleDefeated,
    nextRound,
    toggleEnvironmentEffect,
    pauseEncounter,
    resumeEncounter,
    endEncounter
  };
}

// Daggerheart conditions
export const DAGGERHEART_CONDITIONS = [
  'frightened',
  'restrained',
  'vulnerable',
  'hidden',
  'stunned',
  'weakened',
  'slowed',
  'burning',
  'poisoned',
  'bleeding'
];
