import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useFirestoreCampaign(campaignId) {
  const { currentUser } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [lore, setLore] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [notes, setNotes] = useState([]);
  const [campaignFrame, setCampaignFrame] = useState(null);
  const [campaignFrameDraft, setCampaignFrameDraft] = useState(null);
  const [items, setItems] = useState([]);
  const [partyInventory, setPartyInventory] = useState([]);
  const [initiative, setInitiative] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Base path for shared campaign
  const basePath = campaignId ? `campaigns/${campaignId}` : null;

  // Subscribe to campaign info
  useEffect(() => {
    if (!basePath) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, basePath),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const campaignData = { id: docSnapshot.id, ...docSnapshot.data() };

          // Collect migration updates
          const updates = {};

          // Migrate legacy campaigns without dmId or members
          if (!campaignData.dmId || !campaignData.members) {
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

          // Migrate legacy campaigns without gameSystem
          if (!campaignData.gameSystem) {
            updates.gameSystem = 'daggerheart';
          }

          // Apply migrations if needed
          if (Object.keys(updates).length > 0) {
            try {
              await updateDoc(docSnapshot.ref, updates);
              console.log('Migrated legacy campaign:', Object.keys(updates).join(', '));

              // Update local state with migrated data
              setCampaign({ ...campaignData, ...updates });
            } catch (error) {
              console.error('Error migrating campaign:', error);
              setCampaign(campaignData);
            }
          } else {
            setCampaign(campaignData);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading campaign:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [basePath, currentUser]);

  // Subscribe to characters
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      collection(db, `${basePath}/characters`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCharacters(data);
      },
      (error) => {
        console.warn('Characters subscription error (may be due to pending permissions):', error.code);
        setCharacters([]);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Subscribe to lore
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      collection(db, `${basePath}/lore`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLore(data);
      },
      (error) => {
        console.warn('Lore subscription error (may be due to pending permissions):', error.code);
        setLore([]);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Subscribe to sessions
  useEffect(() => {
    if (!basePath) return;

    const q = query(
      collection(db, `${basePath}/sessions`),
      orderBy('number', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSessions(data);
      },
      (error) => {
        console.warn('Sessions subscription error (may be due to pending permissions):', error.code);
        setSessions([]);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Subscribe to NPCs
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      collection(db, `${basePath}/npcs`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNpcs(data);
      },
      (error) => {
        console.warn('NPCs subscription error (may be due to pending permissions):', error.code);
        setNpcs([]);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Subscribe to Timeline Events
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      collection(db, `${basePath}/timelineEvents`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTimelineEvents(data);
      },
      (error) => {
        console.warn('Timeline subscription error (may be due to pending permissions):', error.code);
        setTimelineEvents([]);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Subscribe to Locations
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      collection(db, `${basePath}/locations`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocations(data);
      },
      (error) => {
        console.warn('Locations subscription error (may be due to pending permissions):', error.code);
        setLocations([]);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Subscribe to Encounters
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      collection(db, `${basePath}/encounters`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEncounters(data);
      },
      (error) => {
        console.warn('Encounters subscription error (may be due to pending permissions):', error.code);
        setEncounters([]);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Subscribe to Notes
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      collection(db, `${basePath}/notes`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotes(data);
      },
      (error) => {
        console.warn('Notes subscription error (may be due to pending permissions):', error.code);
        setNotes([]);
      }
    );

    return unsubscribe;
  }, [basePath]);

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

  // Subscribe to Items - wait for campaign to be loaded first (ensures membership is verified)
  useEffect(() => {
    if (!basePath || !campaign) return;

    let retryTimeout;
    let unsubscribe;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const subscribe = () => {
      unsubscribe = onSnapshot(
        collection(db, `${basePath}/items`),
        (snapshot) => {
          retryCount = 0; // Reset on success
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setItems(data);
        },
        (error) => {
          console.warn('Items subscription error:', error.code);
          // Only clear items on permanent errors, retry on permission errors
          if (error.code === 'permission-denied' && retryCount < MAX_RETRIES) {
            retryCount++;
            // Retry after a short delay - membership may still be propagating
            retryTimeout = setTimeout(() => {
              console.log(`Retrying items subscription (attempt ${retryCount}/${MAX_RETRIES})...`);
              if (unsubscribe) unsubscribe();
              subscribe();
            }, 1000);
          } else {
            setItems([]);
          }
        }
      );
    };

    subscribe();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [basePath, campaign]);

  // Subscribe to Party Inventory - wait for campaign to be loaded first
  useEffect(() => {
    if (!basePath || !campaign) return;

    let retryTimeout;
    let unsubscribe;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const subscribe = () => {
      unsubscribe = onSnapshot(
        collection(db, `${basePath}/partyInventory`),
        (snapshot) => {
          retryCount = 0; // Reset on success
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPartyInventory(data);
        },
        (error) => {
          console.warn('Party Inventory subscription error:', error.code);
          if (error.code === 'permission-denied' && retryCount < MAX_RETRIES) {
            retryCount++;
            retryTimeout = setTimeout(() => {
              console.log(`Retrying party inventory subscription (attempt ${retryCount}/${MAX_RETRIES})...`);
              if (unsubscribe) unsubscribe();
              subscribe();
            }, 1000);
          } else {
            setPartyInventory([]);
          }
        }
      );
    };

    subscribe();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [basePath, campaign]);

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

  // Subscribe to Quests
  useEffect(() => {
    if (!basePath) return;

    const unsubscribe = onSnapshot(
      collection(db, `${basePath}/quests`),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuests(data);
      },
      (error) => {
        console.warn('Quests subscription error (may be due to pending permissions):', error.code);
        setQuests([]);
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

  // Character Inventory methods (updates character document)
  const addToCharacterInventory = async (characterId, itemId, quantity = 1, notes = '') => {
    if (!basePath) return;
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const inventory = character.inventory || [];
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
    const character = characters.find(c => c.id === characterId);
    if (!character || !character.inventory) return;

    const inventory = [...character.inventory];
    inventory.splice(inventoryIndex, 1);

    await updateDoc(doc(db, `${basePath}/characters`, characterId), {
      inventory,
      updatedAt: serverTimestamp()
    });
  };

  const updateCharacterInventoryItem = async (characterId, inventoryIndex, updates) => {
    if (!basePath) return;
    const character = characters.find(c => c.id === characterId);
    if (!character || !character.inventory) return;

    const inventory = [...character.inventory];
    inventory[inventoryIndex] = { ...inventory[inventoryIndex], ...updates };

    await updateDoc(doc(db, `${basePath}/characters`, characterId), {
      inventory,
      updatedAt: serverTimestamp()
    });
  };

  const toggleEquipped = async (characterId, inventoryIndex, slot = null) => {
    if (!basePath) return;
    const character = characters.find(c => c.id === characterId);
    if (!character || !character.inventory) return;

    const inventory = [...character.inventory];
    const item = inventory[inventoryIndex];
    inventory[inventoryIndex] = {
      ...item,
      equipped: !item.equipped,
      slot: !item.equipped ? slot : null
    };

    await updateDoc(doc(db, `${basePath}/characters`, characterId), {
      inventory,
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

  // Transfer methods
  const transferToParty = async (characterId, inventoryIndex, quantity = null) => {
    if (!basePath) return;
    const character = characters.find(c => c.id === characterId);
    if (!character || !character.inventory) return;

    const inventoryItem = character.inventory[inventoryIndex];
    if (!inventoryItem) return;

    const transferQuantity = quantity || inventoryItem.quantity;

    // Add to party inventory
    await addToPartyInventory(inventoryItem.itemId, transferQuantity, inventoryItem.notes);

    // Remove from or reduce character inventory
    if (transferQuantity >= inventoryItem.quantity) {
      await removeFromCharacterInventory(characterId, inventoryIndex);
    } else {
      await updateCharacterInventoryItem(characterId, inventoryIndex, {
        quantity: inventoryItem.quantity - transferQuantity
      });
    }
  };

  const transferToCharacter = async (partyEntryId, characterId, quantity = null) => {
    if (!basePath) return;
    const partyItem = partyInventory.find(p => p.id === partyEntryId);
    if (!partyItem) return;

    const transferQuantity = quantity || partyItem.quantity;

    // Add to character inventory
    await addToCharacterInventory(characterId, partyItem.itemId, transferQuantity, partyItem.notes);

    // Remove from or reduce party inventory
    if (transferQuantity >= partyItem.quantity) {
      await removeFromPartyInventory(partyEntryId);
    } else {
      await updatePartyInventoryItem(partyEntryId, {
        quantity: partyItem.quantity - transferQuantity
      });
    }
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
