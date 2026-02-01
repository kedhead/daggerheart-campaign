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
    contentUrl: '',
    contentName: '',
    contentShowName: true
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
            contentUrl: '',
            contentName: '',
            contentShowName: true
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
      // Build clean data object with only primitive values (no nested objects)
      const data = {
        enabled: updates.enabled ?? displayState.enabled ?? false,
        fearCount: updates.fearCount ?? displayState.fearCount ?? 0,
        showFear: updates.showFear ?? displayState.showFear ?? true,
        showInitiative: updates.showInitiative ?? displayState.showInitiative ?? true,
        contentType: updates.contentType ?? displayState.contentType ?? 'none',
        contentUrl: updates.contentUrl ?? displayState.contentUrl ?? '',
        contentName: updates.contentName ?? displayState.contentName ?? '',
        contentShowName: updates.contentShowName ?? displayState.contentShowName ?? true,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, basePath), data);
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
      contentUrl: content.url || '',
      contentName: content.name || '',
      contentShowName: content.showName !== false
    });
  };

  const clearDisplay = async () => {
    await updateDisplayState({
      contentType: 'none',
      contentUrl: '',
      contentName: '',
      contentShowName: true
    });
  };

  // Reconstruct content object for component compatibility
  const content = displayState.contentUrl ? {
    url: displayState.contentUrl,
    name: displayState.contentName || '',
    showName: displayState.contentShowName !== false
  } : null;

  return {
    // State
    displayState,
    loading,
    enabled: displayState.enabled,
    fearCount: displayState.fearCount || 0,
    showFear: displayState.showFear !== false,
    showInitiative: displayState.showInitiative !== false,
    contentType: displayState.contentType || 'none',
    content,

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
