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
    loading
  };
}
