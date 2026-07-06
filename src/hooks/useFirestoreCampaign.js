import { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useCollection } from './useCollection';

export function useFirestoreCampaign(campaignId) {
  const { currentUser } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [campaignFrame, setCampaignFrame] = useState(null);
  const [campaignFrameDraft, setCampaignFrameDraft] = useState(null);
  const [initiative, setInitiative] = useState(null);
  const [loading, setLoading] = useState(true);

  // Base path for shared campaign
  const basePath = campaignId ? `campaigns/${campaignId}` : null;

  // Collection subscriptions — each is a live-updating array via useCollection
  const characters    = useCollection(basePath, 'characters');
  const lore          = useCollection(basePath, 'lore');
  const sessions      = useCollection(basePath, 'sessions', {
    queryFn: (ref) => query(ref, orderBy('number', 'desc'))
  });
  const npcs          = useCollection(basePath, 'npcs');
  const timelineEvents = useCollection(basePath, 'timelineEvents');
  const locations     = useCollection(basePath, 'locations');
  const encounters    = useCollection(basePath, 'encounters');
  const notes         = useCollection(basePath, 'notes');
  // Items and partyInventory wait for campaign to load so membership is verified
  const items         = useCollection(basePath, 'items',         { waitFor: !!campaign });
  const partyInventory = useCollection(basePath, 'partyInventory', { waitFor: !!campaign });
  const quests        = useCollection(basePath, 'quests');
  const adversaries   = useCollection(basePath, 'adversaries');
  const environments  = useCollection(basePath, 'environments');
  const maps          = useCollection(basePath, 'maps',          { waitFor: !!campaign });
  const battleMaps    = useCollection(basePath, 'battleMaps',    { waitFor: !!campaign });

  // Track whether migration has been attempted for this campaign session
  const migrationRan = useRef(false);

  // Subscribe to campaign info (pure read — no writes in listener)
  useEffect(() => {
    if (!basePath) {
      setLoading(false);
      return;
    }

    migrationRan.current = false; // reset when campaign changes

    const unsubscribe = onSnapshot(
      doc(db, basePath),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setCampaign({ id: docSnapshot.id, ...docSnapshot.data() });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading campaign:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // One-shot migration effect — runs once per campaign load, never inside listener
  useEffect(() => {
    if (!basePath || !campaign || migrationRan.current) return;

    const updates = {};

    if (!campaign.dmId || !campaign.members) {
      updates.dmId = currentUser.uid;
      updates.members = {
        [currentUser.uid]: {
          role: 'dm',
          email: currentUser.email,
          displayName: currentUser.displayName || 'DM',
          joinedAt: serverTimestamp()
        }
      };
    }

    if (!campaign.gameSystem) {
      updates.gameSystem = 'daggerheart';
    }

    migrationRan.current = true;

    if (Object.keys(updates).length === 0) return;

    updateDoc(doc(db, basePath), updates)
      .then(() => console.log('Migrated legacy campaign:', Object.keys(updates).join(', ')))
      .catch(err => console.error('Error migrating campaign:', err));
  }, [basePath, campaign]);


  // Subscribe to Campaign Frame
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      doc(db, `${basePath}/campaignFrame/main`),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setCampaignFrame({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          setCampaignFrame(null);
        }
      },
      (error) => {
        console.warn('Campaign Frame subscription error (may be due to pending permissions):', error.code);
        setCampaignFrame(null);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Subscribe to Campaign Frame Draft
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      doc(db, `${basePath}/campaignFrameDraft/draft`),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setCampaignFrameDraft({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          setCampaignFrameDraft(null);
        }
      },
      (error) => {
        console.warn('Campaign Frame Draft subscription error (may be due to pending permissions):', error.code);
        setCampaignFrameDraft(null);
      }
    );

    return unsubscribe;
  }, [basePath]);


  // Subscribe to Initiative
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      doc(db, `${basePath}/initiative/current`),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setInitiative({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          setInitiative(null);
        }
      },
      (error) => {
        console.warn('Initiative subscription error (may be due to pending permissions):', error.code);
        setInitiative(null);
      }
    );

    return unsubscribe;
  }, [basePath]);


  // Campaign methods
  const updateCampaign = async (updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, basePath), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  // Character methods
  const addCharacter = async (character) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/characters`), {
      ...character,
      gameSystem: campaign?.gameSystem || 'daggerheart', // Inherit from campaign
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...character };
  };

  const updateCharacter = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/characters`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteCharacter = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/characters`, id));
  };

  // Lore methods
  const addLore = async (loreEntry) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/lore`), {
      ...loreEntry,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...loreEntry };
  };

  const updateLore = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/lore`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteLore = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/lore`, id));
  };

  // Session methods
  const addSession = async (session) => {
    if (!basePath) return;

    // Calculate next session number
    const nextNumber = sessions.length > 0
      ? Math.max(...sessions.map(s => s.number || 0)) + 1
      : 1;

    const docRef = await addDoc(collection(db, `${basePath}/sessions`), {
      ...session,
      number: nextNumber,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...session, number: nextNumber };
  };

  const updateSession = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/sessions`, id), updates);
  };

  const deleteSession = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/sessions`, id));
  };

  // NPC methods
  const addNPC = async (npcData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/npcs`), {
      ...npcData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...npcData };
  };

  const updateNPC = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/npcs`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteNPC = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/npcs`, id));
  };

  // Timeline Event methods
  const addTimelineEvent = async (eventData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/timelineEvents`), {
      ...eventData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...eventData };
  };

  const updateTimelineEvent = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/timelineEvents`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteTimelineEvent = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/timelineEvents`, id));
  };

  // Location methods
  const addLocation = async (locationData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/locations`), {
      ...locationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...locationData };
  };

  const updateLocation = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/locations`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteLocation = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/locations`, id));
  };

  // Encounter methods
  const addEncounter = async (encounterData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/encounters`), {
      ...encounterData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...encounterData };
  };

  const updateEncounter = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/encounters`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteEncounter = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/encounters`, id));
  };

  // Note methods
  const addNote = async (noteData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/notes`), {
      ...noteData,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...noteData };
  };

  const updateNote = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/notes`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteNote = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/notes`, id));
  };

  // Campaign Frame methods
  const saveCampaignFrameDraft = async (draftData) => {
    if (!basePath) return;
    await setDoc(doc(db, `${basePath}/campaignFrameDraft`, 'draft'), {
      ...draftData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const completeCampaignFrame = async (frameData) => {
    if (!basePath) return;

    // Save to main collection
    await setDoc(doc(db, `${basePath}/campaignFrame`, 'main'), {
      ...frameData,
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Delete draft
    try {
      await deleteDoc(doc(db, `${basePath}/campaignFrameDraft`, 'draft'));
    } catch (err) {
      // Draft may not exist, that's okay
      console.log('No draft to delete');
    }
  };

  const deleteCampaignFrameDraft = async () => {
    if (!basePath) return;
    try {
      await deleteDoc(doc(db, `${basePath}/campaignFrameDraft`, 'draft'));
    } catch (err) {
      console.log('No draft to delete');
    }
  };

  // Item methods
  const addItem = async (itemData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/items`), {
      ...itemData,
      gameSystem: campaign?.gameSystem || 'daggerheart',
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...itemData };
  };

  const updateItem = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/items`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteItem = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/items`, id));
  };

  // Adversary methods
  const addAdversary = async (adversaryData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/adversaries`), {
      ...adversaryData,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...adversaryData };
  };

  const updateAdversary = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/adversaries`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteAdversary = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/adversaries`, id));
  };

  // Environment methods
  const addEnvironment = async (environmentData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/environments`), {
      ...environmentData,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...environmentData };
  };

  const updateEnvironment = async (id, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/environments`, id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteEnvironment = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/environments`, id));
  };

  // Character Inventory methods — always read fresh from Firestore to avoid stale-state overwrites
  const _getCharacterInventory = async (characterId) => {
    const snap = await getDoc(doc(db, `${basePath}/characters`, characterId));
    return snap.exists() ? (snap.data().inventory || []) : null;
  };

  const addToCharacterInventory = async (characterId, itemId, quantity = 1, notes = '') => {
    if (!basePath) return;
    const inventory = await _getCharacterInventory(characterId);
    if (inventory === null) return;

    const newEntry = {
      itemId,
      quantity,
      equipped: false,
      slot: null,
      notes,
      acquiredAt: new Date().toISOString()
    };

    await updateDoc(doc(db, `${basePath}/characters`, characterId), {
      inventory: [...inventory, newEntry],
      updatedAt: serverTimestamp()
    });
  };

  const removeFromCharacterInventory = async (characterId, inventoryIndex) => {
    if (!basePath) return;
    const inventory = await _getCharacterInventory(characterId);
    if (inventory === null) return;

    const updated = [...inventory];
    updated.splice(inventoryIndex, 1);

    await updateDoc(doc(db, `${basePath}/characters`, characterId), {
      inventory: updated,
      updatedAt: serverTimestamp()
    });
  };

  const updateCharacterInventoryItem = async (characterId, inventoryIndex, updates) => {
    if (!basePath) return;
    const inventory = await _getCharacterInventory(characterId);
    if (inventory === null) return;

    const updated = [...inventory];
    updated[inventoryIndex] = { ...updated[inventoryIndex], ...updates };

    await updateDoc(doc(db, `${basePath}/characters`, characterId), {
      inventory: updated,
      updatedAt: serverTimestamp()
    });
  };

  const toggleEquipped = async (characterId, inventoryIndex, slot = null) => {
    if (!basePath) return;
    const inventory = await _getCharacterInventory(characterId);
    if (inventory === null) return;

    const updated = [...inventory];
    const item = updated[inventoryIndex];
    updated[inventoryIndex] = {
      ...item,
      equipped: !item.equipped,
      slot: !item.equipped ? slot : null
    };

    await updateDoc(doc(db, `${basePath}/characters`, characterId), {
      inventory: updated,
      updatedAt: serverTimestamp()
    });
  };

  // Party Inventory methods
  const addToPartyInventory = async (itemId, quantity = 1, notes = '') => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/partyInventory`), {
      itemId,
      quantity,
      notes,
      addedBy: currentUser.uid,
      addedByName: currentUser.displayName || currentUser.email,
      addedAt: serverTimestamp()
    });
    return { id: docRef.id, itemId, quantity, notes };
  };

  const removeFromPartyInventory = async (entryId) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/partyInventory`, entryId));
  };

  const updatePartyInventoryItem = async (entryId, updates) => {
    if (!basePath) return;
    await updateDoc(doc(db, `${basePath}/partyInventory`, entryId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  // Transfer methods — use writeBatch so both sides commit atomically
  const transferToParty = async (characterId, inventoryIndex, quantity = null) => {
    if (!basePath) return;

    // Fresh read to avoid stale-state race conditions
    const charRef = doc(db, `${basePath}/characters`, characterId);
    const charSnap = await getDoc(charRef);
    if (!charSnap.exists()) return;

    const inventory = [...(charSnap.data().inventory || [])];
    const inventoryItem = inventory[inventoryIndex];
    if (!inventoryItem) return;

    const transferQuantity = quantity ?? inventoryItem.quantity;

    const batch = writeBatch(db);

    // Add to party inventory
    const partyRef = doc(collection(db, `${basePath}/partyInventory`));
    batch.set(partyRef, {
      itemId: inventoryItem.itemId,
      quantity: transferQuantity,
      notes: inventoryItem.notes || '',
      addedBy: currentUser.uid,
      addedByName: currentUser.displayName || currentUser.email,
      addedAt: serverTimestamp()
    });

    // Remove from or reduce character inventory
    if (transferQuantity >= inventoryItem.quantity) {
      inventory.splice(inventoryIndex, 1);
    } else {
      inventory[inventoryIndex] = { ...inventoryItem, quantity: inventoryItem.quantity - transferQuantity };
    }
    batch.update(charRef, { inventory, updatedAt: serverTimestamp() });

    await batch.commit();
  };

  const transferToCharacter = async (partyEntryId, characterId, quantity = null) => {
    if (!basePath) return;
    const partyItem = partyInventory.find(p => p.id === partyEntryId);
    if (!partyItem) return;

    const transferQuantity = quantity ?? partyItem.quantity;

    // Fresh read of character inventory
    const charRef = doc(db, `${basePath}/characters`, characterId);
    const charSnap = await getDoc(charRef);
    if (!charSnap.exists()) return;

    const inventory = [...(charSnap.data().inventory || [])];
    const newEntry = {
      itemId: partyItem.itemId,
      quantity: transferQuantity,
      equipped: false,
      slot: null,
      notes: partyItem.notes || '',
      acquiredAt: new Date().toISOString()
    };

    const batch = writeBatch(db);

    // Add to character inventory
    batch.update(charRef, {
      inventory: [...inventory, newEntry],
      updatedAt: serverTimestamp()
    });

    // Remove from or reduce party inventory
    const partyRef = doc(db, `${basePath}/partyInventory`, partyEntryId);
    if (transferQuantity >= partyItem.quantity) {
      batch.delete(partyRef);
    } else {
      batch.update(partyRef, {
        quantity: partyItem.quantity - transferQuantity,
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();
  };

  // Initiative methods
  const startInitiative = async (participants = []) => {
    if (!basePath) return;
    const initiativeData = {
      active: true,
      currentTurn: 0,
      round: 1,
      participants: participants.map((p, index) => ({
        id: `participant-${Date.now()}-${index}`,
        name: p.name,
        type: p.type || 'custom',
        entityId: p.entityId || null,
        initiative: p.initiative || 0,
        hp: p.hp || null,
        maxHp: p.maxHp || null,
        conditions: [],
        isHidden: p.isHidden || false
      })),
      linkedEncounterId: null,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, `${basePath}/initiative`, 'current'), initiativeData);
    return initiativeData;
  };

  const updateInitiative = async (updates) => {
    if (!basePath) return;
    await setDoc(doc(db, `${basePath}/initiative`, 'current'), {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const nextTurn = async () => {
    if (!basePath || !initiative) return;
    const { currentTurn, round, participants } = initiative;

    let newTurn = currentTurn + 1;
    let newRound = round;

    if (newTurn >= participants.length) {
      newTurn = 0;
      newRound = round + 1;
    }

    await updateInitiative({ currentTurn: newTurn, round: newRound });
  };

  const previousTurn = async () => {
    if (!basePath || !initiative) return;
    const { currentTurn, round, participants } = initiative;

    let newTurn = currentTurn - 1;
    let newRound = round;

    if (newTurn < 0) {
      if (round > 1) {
        newTurn = participants.length - 1;
        newRound = round - 1;
      } else {
        newTurn = 0;
      }
    }

    await updateInitiative({ currentTurn: newTurn, round: newRound });
  };

  const addParticipant = async (participant) => {
    if (!basePath || !initiative) return;
    const newParticipant = {
      id: `participant-${Date.now()}`,
      name: participant.name,
      type: participant.type || 'custom',
      entityId: participant.entityId || null,
      initiative: participant.initiative || 0,
      hp: participant.hp || null,
      maxHp: participant.maxHp || null,
      conditions: [],
      isHidden: participant.isHidden || false
    };

    const participants = [...initiative.participants, newParticipant];
    // Sort by initiative (descending)
    participants.sort((a, b) => b.initiative - a.initiative);

    await updateInitiative({ participants });
  };

  const removeParticipant = async (participantId) => {
    if (!basePath || !initiative) return;
    const participants = initiative.participants.filter(p => p.id !== participantId);

    // Adjust currentTurn if needed
    let currentTurn = initiative.currentTurn;
    if (currentTurn >= participants.length) {
      currentTurn = Math.max(0, participants.length - 1);
    }

    await updateInitiative({ participants, currentTurn });
  };

  const updateParticipant = async (participantId, updates) => {
    if (!basePath || !initiative) return;
    const participants = initiative.participants.map(p =>
      p.id === participantId ? { ...p, ...updates } : p
    );
    await updateInitiative({ participants });
  };

  const reorderParticipants = async (orderedIds) => {
    if (!basePath || !initiative) return;
    const participantMap = {};
    initiative.participants.forEach(p => { participantMap[p.id] = p; });

    const participants = orderedIds.map(id => participantMap[id]).filter(Boolean);
    await updateInitiative({ participants, currentTurn: 0 });
  };

  const endInitiative = async () => {
    if (!basePath) return;
    try {
      await deleteDoc(doc(db, `${basePath}/initiative`, 'current'));
    } catch (err) {
      console.log('No initiative to end');
    }
  };

  // Quest methods
  const addQuest = async (questData) => {
    if (!basePath) return;
    const docRef = await addDoc(collection(db, `${basePath}/quests`), {
      ...questData,
      status: questData.status || 'active',
      objectives: questData.objectives || [],
      hidden: questData.hidden || false,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...questData };
  };

  const updateQuest = async (id, updates) => {
    if (!basePath) return;
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    // Add completedAt timestamp when status changes to completed or failed
    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.completedAt = serverTimestamp();
    }
    await updateDoc(doc(db, `${basePath}/quests`, id), updateData);
  };

  const deleteQuest = async (id) => {
    if (!basePath) return;
    await deleteDoc(doc(db, `${basePath}/quests`, id));
  };

  const toggleQuestObjective = async (questId, objectiveId, completed) => {
    if (!basePath) return;
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.objectives) return;

    const updatedObjectives = quest.objectives.map(obj =>
      obj.id === objectiveId ? { ...obj, completed } : obj
    );

    await updateDoc(doc(db, `${basePath}/quests`, questId), {
      objectives: updatedObjectives,
      updatedAt: serverTimestamp()
    });
  };

  return {
    campaign,
    updateCampaign,
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    lore,
    addLore,
    updateLore,
    deleteLore,
    sessions,
    addSession,
    updateSession,
    deleteSession,
    npcs,
    addNPC,
    updateNPC,
    deleteNPC,
    timelineEvents,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    encounters,
    addEncounter,
    updateEncounter,
    deleteEncounter,
    notes,
    addNote,
    updateNote,
    deleteNote,
    campaignFrame,
    campaignFrameDraft,
    saveCampaignFrameDraft,
    completeCampaignFrame,
    deleteCampaignFrameDraft,
    // Items
    items,
    addItem,
    updateItem,
    deleteItem,
    // Adversaries
    adversaries,
    addAdversary,
    updateAdversary,
    deleteAdversary,
    // Environments
    environments,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    // Maps (generic map/image records + Battle Map Studio documents)
    maps,
    battleMaps,
    // Character Inventory
    addToCharacterInventory,
    removeFromCharacterInventory,
    updateCharacterInventoryItem,
    toggleEquipped,
    // Party Inventory
    partyInventory,
    addToPartyInventory,
    removeFromPartyInventory,
    updatePartyInventoryItem,
    // Transfers
    transferToParty,
    transferToCharacter,
    // Initiative
    initiative,
    startInitiative,
    updateInitiative,
    nextTurn,
    previousTurn,
    addParticipant,
    removeParticipant,
    updateParticipant,
    reorderParticipants,
    endInitiative,
    // Quests
    quests,
    addQuest,
    updateQuest,
    deleteQuest,
    toggleQuestObjective,
    loading
  };
}
