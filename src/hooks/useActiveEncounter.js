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
            // Legacy field names: `minor` holds the Major threshold, `major` holds
            // Severe. Damage below Major marks 1 HP, Major–Severe marks 2 HP,
            // Severe or higher marks 3 HP.
            minor: adversary.thresholds?.minor || Math.ceil(hp * 1.3),
            major: adversary.thresholds?.major || Math.ceil(hp * 2.5)
          },
          features: adversary.features || [],
          role: adversary.role || 'standard',
          tier: adversary.tier || 1
        };

        // Only add optional fields if they have values
        if (adversary.difficulty !== undefined) participant.difficulty = adversary.difficulty;
        if (adversary.evasion !== undefined) participant.evasion = adversary.evasion;
        if (adversary.attack !== undefined) participant.attack = adversary.attack;
        if (adversary.attackDamage !== undefined) participant.damage = adversary.attackDamage;
        if (adversary.attackName !== undefined) participant.attackName = adversary.attackName;
        if (adversary.attackRange !== undefined) participant.attackRange = adversary.attackRange;
        if (adversary.description !== undefined) participant.description = adversary.description;
        if (adversary.motives !== undefined) participant.motives = adversary.motives;

        // Boss-specific fields
        if (adversary.isBoss) {
          participant.isBoss = true;
          participant.bossPhases = JSON.parse(JSON.stringify(adversary.phases || []));
          participant.triggeredPhaseIds = [];
          participant.currentPhaseName = null;
          participant.currentFeatures = [...(adversary.features || [])];
        }

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
   * Apply damage to a participant. For boss participants, detects phase transitions
   * and writes pendingPhaseTransition to the encounter document when a threshold is crossed.
   */
  const applyDamage = useCallback(async (participantId, amount, damageType = 'hp') => {
    if (!activeEncounter) return;

    const participant = activeEncounter.participants.find(p => p.id === participantId);
    if (!participant) return;

    let updates = {};
    let phaseToTrigger = null;

    if (damageType === 'hp') {
      const newHP = Math.max(0, participant.currentHP - amount);
      updates.currentHP = newHP;
      if (newHP <= 0) {
        updates.isDefeated = true;
      } else if (participant.isBoss) {
        const untriggered = (participant.bossPhases || [])
          .filter(ph => !(participant.triggeredPhaseIds || []).includes(ph.id))
          .filter(ph => newHP <= Math.floor(participant.maxHP * ph.triggerPercent / 100))
          .sort((a, b) => b.triggerPercent - a.triggerPercent);
        if (untriggered.length > 0) phaseToTrigger = untriggered[0];
      }
    } else if (damageType === 'stress') {
      const newStress = Math.min(participant.maxStress, participant.currentStress + amount);
      updates.currentStress = newStress;
      if (newStress >= participant.maxStress) {
        updates.isDefeated = true;
      }
    }

    const newParticipants = activeEncounter.participants.map(p =>
      p.id === participantId ? { ...p, ...updates } : p
    );

    const encounterUpdates = { participants: newParticipants, updatedAt: serverTimestamp() };
    if (phaseToTrigger) {
      encounterUpdates.pendingPhaseTransition = { participantId, phase: phaseToTrigger };
    }

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await setDoc(docRef, encounterUpdates, { merge: true });
  }, [campaignId, activeEncounter]);

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
   * Confirm a boss phase transition:
   * - Applies new features / attack overrides to the boss participant
   * - Adds summoned participants
   * - Restores HP if healPercent is set
   * - Clears pendingPhaseTransition on the encounter document
   */
  const confirmPhaseTransition = useCallback(async (participantId, phase, allAdversaries = []) => {
    if (!activeEncounter) return;

    const participant = activeEncounter.participants.find(p => p.id === participantId);
    if (!participant) return;

    const baseFeatures = participant.currentFeatures || participant.features || [];
    const newFeatures = phase.newFeatures || [];
    const mergedFeatures = phase.replaceFeatures ? newFeatures : [...baseFeatures, ...newFeatures];

    const participantUpdates = {
      triggeredPhaseIds: [...(participant.triggeredPhaseIds || []), phase.id],
      currentPhaseName: phase.name,
      features: mergedFeatures,
      currentFeatures: mergedFeatures
    };

    if (phase.attackName) participantUpdates.attackName = phase.attackName;
    if (phase.attackDamage) participantUpdates.damage = phase.attackDamage;
    if (phase.attack !== undefined && phase.attack !== null) participantUpdates.attack = phase.attack;

    if (phase.healPercent > 0) {
      const heal = Math.floor(participant.maxHP * phase.healPercent / 100);
      participantUpdates.currentHP = Math.min(participant.maxHP, participant.currentHP + heal);
      if (participantUpdates.currentHP > 0) participantUpdates.isDefeated = false;
    }

    let newParticipants = activeEncounter.participants.map(p =>
      p.id === participantId ? { ...p, ...participantUpdates } : p
    );

    // Add summoned adversaries
    if (phase.summons && phase.summons.length > 0) {
      let summonIndex = activeEncounter.participants.length;
      for (const summon of phase.summons) {
        if (!summon.adversaryId || !(summon.quantity > 0)) continue;
        const adversary = allAdversaries.find(a => a.id === summon.adversaryId);
        if (!adversary) continue;
        const hp = adversary.hp || 4;
        const stress = adversary.stress || 2;
        for (let i = 0; i < summon.quantity; i++) {
          summonIndex++;
          const summoned = {
            id: `p_${Date.now()}_${summonIndex}`,
            type: 'adversary',
            sourceId: adversary.id,
            name: summon.quantity > 1 ? `${adversary.name} ${i + 1}` : adversary.name,
            currentHP: hp,
            maxHP: hp,
            currentStress: 0,
            maxStress: stress,
            conditions: [],
            isDefeated: false,
            thresholds: {
              // Legacy field names: `minor` = Major threshold, `major` = Severe
              minor: adversary.thresholds?.minor || Math.ceil(hp * 1.3),
              major: adversary.thresholds?.major || Math.ceil(hp * 2.5)
            },
            features: adversary.features || [],
            role: adversary.role || 'standard',
            tier: adversary.tier || 1
          };
          if (adversary.difficulty !== undefined) summoned.difficulty = adversary.difficulty;
          if (adversary.attack !== undefined) summoned.attack = adversary.attack;
          if (adversary.attackDamage !== undefined) summoned.damage = adversary.attackDamage;
          if (adversary.attackName !== undefined) summoned.attackName = adversary.attackName;
          if (adversary.attackRange !== undefined) summoned.attackRange = adversary.attackRange;
          if (adversary.description !== undefined) summoned.description = adversary.description;
          if (adversary.motives !== undefined) summoned.motives = adversary.motives;
          newParticipants.push(summoned);
        }
      }
    }

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await setDoc(docRef, {
      participants: newParticipants,
      pendingPhaseTransition: null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }, [campaignId, activeEncounter]);

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
    endEncounter,
    confirmPhaseTransition
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
