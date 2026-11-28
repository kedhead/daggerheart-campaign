import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { withoutUndefined } from '../utils/withoutUndefined';
import { participantFor, adversaryMarkStress } from '../utils/encounterParticipants';

export { participantFor, adversaryMarkStress };


/**
 * Hook for managing live encounter state
 * Syncs to Firestore at campaigns/{campaignId}/activeEncounter/current
 */
export function useActiveEncounter(campaignId) {
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [loading, setLoading] = useState(true);
  // The encounter as of the last change, read by every edit: two quick taps
  // used to both start from the same snapshot, and the second undid the first.
  const latest = useRef(null);
  const setLatest = (value) => { latest.current = value; setActiveEncounter(value); };

  // Subscribe to active encounter
  useEffect(() => {
    if (!campaignId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');

    // A listener that errors is finished for good, so a dropped connection used
    // to blank the encounter and leave it frozen until a reload. Keep the last
    // state on screen and listen again after a short wait instead.
    let unsubscribe = () => {};
    let retry = null;
    let stopped = false;
    const listen = (attempt = 0) => {
      unsubscribe = onSnapshot(
        docRef,
        (docSnapshot) => {
          attempt = 0;
          if (docSnapshot.exists()) {
            setLatest({ id: docSnapshot.id, ...docSnapshot.data() });
          } else {
            setLatest(null);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Active encounter subscription error:', error.code);
          setLoading(false);
          if (stopped || error.code === 'permission-denied') {
            setLatest(null);
            return;
          }
          retry = setTimeout(() => listen(attempt + 1), Math.min(15000, 1000 * 2 ** attempt));
        }
      );
    };
    listen();

    return () => {
      stopped = true;
      clearTimeout(retry);
      unsubscribe();
    };
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

      for (let i = 0; i < (slot.quantity || 1); i++) {
        participantIndex++;
        const participant = participantFor(adversary, {
          id: `p_${Date.now()}_${participantIndex}`,
          name: slot.quantity > 1 ? `${adversary.name} ${i + 1}` : adversary.name
        });
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
    if (!campaignId || !latest.current) return;

    // Seen at once by the next edit, before the database answers.
    latest.current = { ...latest.current, ...updates };
    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await setDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }, [campaignId]);

  /**
   * Update a specific participant
   */
  const updateParticipant = useCallback(async (participantId, updates) => {
    if (!latest.current) return;

    const newParticipants = latest.current.participants.map(p =>
      p.id === participantId ? { ...p, ...updates } : p
    );

    await updateEncounter({ participants: newParticipants });
  }, [updateEncounter]);

  /**
   * Apply damage to a participant. For boss participants, detects phase transitions
   * and writes pendingPhaseTransition to the encounter document when a threshold is crossed.
   */
  const applyDamage = useCallback(async (participantId, amount, damageType = 'hp') => {
    if (!latest.current) return;

    const participant = latest.current.participants.find(p => p.id === participantId);
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
      // An adversary that would mark Stress with none left marks HP instead.
      const marked = adversaryMarkStress(participant, amount);
      updates.currentStress = marked.currentStress;
      if (marked.spilled) {
        updates.currentHP = marked.currentHP;
        if (marked.defeated) updates.isDefeated = true;
      }
    }

    const newParticipants = latest.current.participants.map(p =>
      p.id === participantId ? { ...p, ...updates } : p
    );

    const encounterUpdates = { participants: withoutUndefined(newParticipants), updatedAt: serverTimestamp() };
    if (phaseToTrigger) {
      encounterUpdates.pendingPhaseTransition = { participantId, phase: phaseToTrigger };
    }
    latest.current = { ...latest.current, participants: newParticipants, ...(phaseToTrigger ? { pendingPhaseTransition: encounterUpdates.pendingPhaseTransition } : {}) };

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await setDoc(docRef, encounterUpdates, { merge: true });
  }, [campaignId]);

  /**
   * Apply healing to a participant
   */
  const applyHealing = useCallback(async (participantId, amount, healType = 'hp') => {
    if (!latest.current) return;

    const participant = latest.current.participants.find(p => p.id === participantId);
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
  }, [updateParticipant]);

  /**
   * Add a condition to a participant
   */
  const addCondition = useCallback(async (participantId, condition) => {
    if (!latest.current) return;

    const participant = latest.current.participants.find(p => p.id === participantId);
    if (!participant) return;

    if (!participant.conditions.includes(condition)) {
      await updateParticipant(participantId, {
        conditions: [...participant.conditions, condition]
      });
    }
  }, [updateParticipant]);

  /**
   * Remove a condition from a participant
   */
  const removeCondition = useCallback(async (participantId, condition) => {
    if (!latest.current) return;

    const participant = latest.current.participants.find(p => p.id === participantId);
    if (!participant) return;

    await updateParticipant(participantId, {
      conditions: participant.conditions.filter(c => c !== condition)
    });
  }, [updateParticipant]);

  /**
   * Toggle defeated status
   */
  const toggleDefeated = useCallback(async (participantId) => {
    if (!latest.current) return;

    const participant = latest.current.participants.find(p => p.id === participantId);
    if (!participant) return;

    await updateParticipant(participantId, {
      isDefeated: !participant.isDefeated
    });
  }, [updateParticipant]);

  /**
   * Advance to next round
   */
  const nextRound = useCallback(async () => {
    if (!latest.current) return;

    await updateEncounter({
      round: latest.current.round + 1
    });
  }, [updateEncounter]);

  /**
   * Toggle an environment effect
   */
  const toggleEnvironmentEffect = useCallback(async (featureName) => {
    if (!latest.current) return;

    const activeEffects = latest.current.activeEnvironmentEffects || [];
    const isActive = activeEffects.includes(featureName);

    await updateEncounter({
      activeEnvironmentEffects: isActive
        ? activeEffects.filter(e => e !== featureName)
        : [...activeEffects, featureName]
    });
  }, [updateEncounter]);

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
    if (!latest.current) return;

    const participant = latest.current.participants.find(p => p.id === participantId);
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

    let newParticipants = latest.current.participants.map(p =>
      p.id === participantId ? { ...p, ...participantUpdates } : p
    );

    // Add summoned adversaries
    if (phase.summons && phase.summons.length > 0) {
      let summonIndex = latest.current.participants.length;
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

    latest.current = { ...latest.current, participants: newParticipants, pendingPhaseTransition: null };
    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await setDoc(docRef, {
      // Firestore rejects undefined anywhere in a write; one stray field in a
      // feature or summon used to make the whole transition fail.
      participants: withoutUndefined(newParticipants),
      pendingPhaseTransition: null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }, [campaignId]);

  /**
   * Dismiss a pending phase transition without applying it, so a transition
   * that can't be applied never leaves the fight stuck behind its dialog.
   */
  const dismissPhaseTransition = useCallback(async () => {
    if (!campaignId) return;
    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await setDoc(docRef, { pendingPhaseTransition: null, updatedAt: serverTimestamp() }, { merge: true });
  }, [campaignId]);

  /**
   * End the encounter
   */
  const endEncounter = useCallback(async () => {
    if (!campaignId) return;

    const docRef = doc(db, `campaigns/${campaignId}/activeEncounter`, 'current');
    await deleteDoc(docRef);
  }, [campaignId]);

  /**
   * Bring more adversaries into a fight already running (reinforcements):
   * `quantity` of `adversary`, numbered after any already in the fight.
   */
  const addParticipants = useCallback(async (adversary, quantity = 1) => {
    if (!latest.current || !adversary) return;
    const existing = latest.current.participants || [];
    const same = existing.filter(p => p.sourceId === adversary.id).length;
    const count = Math.max(1, Math.min(20, Math.round(Number(quantity) || 1)));
    const added = Array.from({ length: count }, (_, i) => participantFor(adversary, {
      id: `p_${Date.now()}_${existing.length + i + 1}`,
      name: same + count > 1 ? `${adversary.name} ${same + i + 1}` : adversary.name
    }));
    await updateEncounter({ participants: withoutUndefined([...existing, ...added]) });
  }, [updateEncounter]);

  /** Take a participant out of the fight altogether (added by mistake). */
  const removeParticipant = useCallback(async (participantId) => {
    if (!latest.current) return;
    await updateEncounter({ participants: (latest.current.participants || []).filter(p => p.id !== participantId) });
  }, [updateEncounter]);

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
    confirmPhaseTransition,
    dismissPhaseTransition,
    addParticipants,
    removeParticipant
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
