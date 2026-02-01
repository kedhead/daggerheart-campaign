import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper to remove undefined values and prepare for Firestore
function sanitizeForFirestore(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined values and internal fields
    if (value === undefined || key === 'id') continue;

    // Handle nested objects
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function usePlayerDisplay(campaignId) {
  const [displayState, setDisplayState] = useState({
    enabled: false,
    fearCount: 0,
    showFear: true,
    showInitiative: true,
    contentType: 'none',
    content: null
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
            content: null
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
      // Build clean data object
      const data = {
        enabled: displayState.enabled ?? false,
        fearCount: displayState.fearCount ?? 0,
        showFear: displayState.showFear ?? true,
        showInitiative: displayState.showInitiative ?? true,
        contentType: displayState.contentType ?? 'none',
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Handle content field specially - use deleteField() if null
      if (data.content === null) {
        data.content = deleteField();
      } else if (data.content) {
        // Ensure content is a clean object
        data.content = {
          url: data.content.url || '',
          name: data.content.name || '',
          type: data.content.type || '',
          showName: data.content.showName !== false
        };
      }

      await setDoc(doc(db, basePath), data, { merge: true });
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
        showName: content.showName !== false
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
