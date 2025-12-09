import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
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

          // Migrate legacy campaigns without dmId or members
          if (!campaignData.dmId || !campaignData.members) {
            try {
              const updates = {
                dmId: currentUser.uid,
                members: {
                  [currentUser.uid]: {
                    role: 'dm',
                    email: currentUser.email,
                    displayName: currentUser.displayName || 'DM',
                    joinedAt: serverTimestamp()
                  }
                }
              };

              await updateDoc(docSnapshot.ref, updates);
              console.log('Migrated legacy campaign to new structure');

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(data);
    });

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
    loading
  };
}
