import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useBattleMapStore } from '../stores/battleMapStore';

export function useBattleMap(campaignId) {
  const [savedMaps, setSavedMaps] = useState([]);
  const [loading, setLoading] = useState(true);

  const basePath = campaignId ? `campaigns/${campaignId}/battleMaps` : null;
  const displayPath = campaignId ? `campaigns/${campaignId}/playerDisplay/current` : null;

  // Subscribe to saved maps list
  useEffect(() => {
    if (!basePath) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, basePath), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const maps = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSavedMaps(maps);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading battle maps:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Save map to Firestore
  const saveMap = async (mapId, mapState) => {
    if (!basePath) return null;

    try {
      const isNewMap = !mapId;
      const docId = mapId || `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, basePath, docId);

      const data = {
        ...mapState,
        updatedAt: serverTimestamp()
      };

      if (isNewMap) {
        data.createdAt = serverTimestamp();
      }

      await setDoc(docRef, data, { merge: true });

      // Update the store with the new mapId
      useBattleMapStore.getState().setMapId(docId);

      return docId;
    } catch (error) {
      console.error('Error saving battle map:', error);
      throw error;
    }
  };

  // Load a map from Firestore
  const loadMap = async (mapId) => {
    if (!basePath || !mapId) return null;

    try {
      const map = savedMaps.find(m => m.id === mapId);
      return map || null;
    } catch (error) {
      console.error('Error loading battle map:', error);
      throw error;
    }
  };

  // Delete a map
  const deleteMap = async (mapId) => {
    if (!basePath || !mapId) return;

    try {
      await deleteDoc(doc(db, basePath, mapId));
    } catch (error) {
      console.error('Error deleting battle map:', error);
      throw error;
    }
  };

  // Broadcast current map state to player display
  const broadcastToPlayers = async () => {
    if (!displayPath) return;

    try {
      const playerViewState = useBattleMapStore.getState().getPlayerViewState();
      const displayRef = doc(db, displayPath);

      await setDoc(displayRef, {
        showBattleMap: true,
        battleMapState: playerViewState,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error broadcasting to players:', error);
      throw error;
    }
  };

  // Stop broadcasting (hide battle map from player display)
  const stopBroadcast = async () => {
    if (!displayPath) return;

    try {
      const displayRef = doc(db, displayPath);
      await setDoc(displayRef, {
        showBattleMap: false,
        battleMapState: null,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error stopping broadcast:', error);
      throw error;
    }
  };

  return {
    savedMaps,
    loading,
    saveMap,
    loadMap,
    deleteMap,
    broadcastToPlayers,
    stopBroadcast
  };
}
