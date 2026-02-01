import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export function usePlayerDisplay(campaignId) {
  const [displayState, setDisplayState] = useState({
    enabled: false,
    fearCount: 0,
    showFear: true,
    showInitiative: true,
    contentType: 'none',
    content: null,
    updatedAt: null
  });
  const [loading, setLoading] = useState(true);

  const basePath = campaignId ? `campaigns/${campaignId}/playerDisplay/current` : null;

  // Subscribe to player display state
  useEffect(() => {
    if (!basePath) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, basePath),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setDisplayState({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          // Initialize with defaults if document doesn't exist
          setDisplayState({
            enabled: false,
            fearCount: 0,
            showFear: true,
            showInitiative: true,
            contentType: 'none',
            content: null,
            updatedAt: null
          });
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Player Display subscription error:', error.code);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [basePath]);

  // Update the display state in Firestore
  const updateDisplayState = async (updates) => {
    if (!basePath) return;
    try {
      await setDoc(doc(db, basePath), {
        ...displayState,
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating player display:', error);
      throw error;
    }
  };

  // Fear counter methods
  const incrementFear = async () => {
    await updateDisplayState({ fearCount: (displayState.fearCount || 0) + 1 });
  };

  const decrementFear = async () => {
    const newCount = Math.max(0, (displayState.fearCount || 0) - 1);
    await updateDisplayState({ fearCount: newCount });
  };

  const setFearCount = async (count) => {
    await updateDisplayState({ fearCount: Math.max(0, count) });
  };

  const resetFear = async () => {
    await updateDisplayState({ fearCount: 0 });
  };

  // Toggle visibility
  const toggleFear = async () => {
    await updateDisplayState({ showFear: !displayState.showFear });
  };

  const toggleInitiative = async () => {
    await updateDisplayState({ showInitiative: !displayState.showInitiative });
  };

  const toggleEnabled = async () => {
    await updateDisplayState({ enabled: !displayState.enabled });
  };

  // Content methods
  const setDisplayContent = async (contentType, content) => {
    await updateDisplayState({
      contentType,
      content: {
        url: content.url || '',
        name: content.name || '',
        type: content.type || '',
        showName: content.showName !== undefined ? content.showName : true
      }
    });
  };

  const clearDisplay = async () => {
    await updateDisplayState({
      contentType: 'none',
      content: null
    });
  };

  return {
    // State
    displayState,
    loading,
    enabled: displayState.enabled,
    fearCount: displayState.fearCount || 0,
    showFear: displayState.showFear !== false,
    showInitiative: displayState.showInitiative !== false,
    contentType: displayState.contentType || 'none',
    content: displayState.content,

    // Fear methods
    incrementFear,
    decrementFear,
    setFearCount,
    resetFear,

    // Toggle methods
    toggleFear,
    toggleInitiative,
    toggleEnabled,

    // Content methods
    setDisplayContent,
    clearDisplay,

    // Generic update
    updateDisplayState
  };
}
