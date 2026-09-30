import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { changeFear } from '../services/fearPool';

const DISPLAY_DEFAULTS = Object.freeze({
  enabled: false,
  fearCount: 0,
  showFear: true,
  showInitiative: true,
  showNames: false, // Global toggle for showing names/captions
  contentType: 'none',
  contentUrl: '',
  contentName: '',
  contentShowName: true,
  contentItems: [], // Array of content items for multi-display
  videoMuted: true // DM-controlled mute for uploaded videos (default on for reliable autoplay)
});

export function usePlayerDisplay(campaignId) {
  const [displayState, setDisplayState] = useState({ ...DISPLAY_DEFAULTS });
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
          const data = docSnapshot.data();
          // Layer over defaults: writes are now partial (merge), so a document
          // may lack fields it never had set.
          setDisplayState({
            ...DISPLAY_DEFAULTS,
            id: docSnapshot.id,
            ...data,
            contentItems: data.contentItems || [] // Ensure array exists
          });
        } else {
          setDisplayState({ ...DISPLAY_DEFAULTS });
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

  // Update the display state in Firestore.
  //
  // Writes ONLY the fields being changed, merged into the document. This used
  // to rebuild the whole document from this device's local copy and overwrite
  // it, which erased any field not in its list and re-sent fearCount on every
  // unrelated change — so toggling "show names" on one DM device could revert
  // a Fear added on another. fearCount is never written from here any more;
  // it goes through the transactional helpers in services/fearPool.
  const updateDisplayState = async (updates) => {
    if (!basePath) return;
    const { fearCount: _ignored, ...rest } = updates || {};
    try {
      await setDoc(doc(db, basePath), { ...rest, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error('Error updating player display:', error);
      throw error;
    }
  };

  // Fear counter methods — transactional, clamped to 0-12 (see fearPool).
  const incrementFear = () => changeFear(campaignId, n => n + 1);
  const decrementFear = () => changeFear(campaignId, n => n - 1);
  const setFearCount = (count) => changeFear(campaignId, () => count);
  const resetFear = () => changeFear(campaignId, () => 0);
  // Add several at once (e.g. the Fear a rest grants) without reading a
  // possibly stale local value first.
  const addFear = (amount) => changeFear(campaignId, n => n + (Number(amount) || 0));

  // Toggle visibility
  const toggleFear = async () => {
    await updateDisplayState({ showFear: !displayState.showFear });
  };

  const toggleInitiative = async () => {
    await updateDisplayState({ showInitiative: !displayState.showInitiative });
  };

  const toggleNames = async () => {
    await updateDisplayState({ showNames: !displayState.showNames });
  };

  const toggleEnabled = async () => {
    await updateDisplayState({ enabled: !displayState.enabled });
  };

  const toggleVideoMuted = async () => {
    await updateDisplayState({ videoMuted: !(displayState.videoMuted !== false) });
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
      contentShowName: true,
      contentItems: []
    });
  };

  // Multi-content methods
  const addContentItem = async (contentType, content) => {
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: contentType,
      url: content.url || '',
      name: content.name || '',
      showName: content.showName !== false,
      addedAt: Date.now()
    };
    const currentItems = displayState.contentItems || [];
    await updateDisplayState({
      contentItems: [...currentItems, newItem]
    });
  };

  const removeContentItem = async (itemId) => {
    const currentItems = displayState.contentItems || [];
    await updateDisplayState({
      contentItems: currentItems.filter(item => item.id !== itemId)
    });
  };

  const clearAllContent = async () => {
    await updateDisplayState({
      contentItems: [],
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
    showNames: displayState.showNames === true,
    contentType: displayState.contentType || 'none',
    content,
    contentItems: displayState.contentItems || [],
    videoMuted: displayState.videoMuted !== false, // default true

    // Fear methods
    incrementFear,
    decrementFear,
    setFearCount,
    resetFear,
    addFear,

    // Toggle methods
    toggleFear,
    toggleInitiative,
    toggleNames,
    toggleEnabled,
    toggleVideoMuted,

    // Content methods (single - legacy)
    setDisplayContent,
    clearDisplay,

    // Content methods (multi)
    addContentItem,
    removeContentItem,
    clearAllContent,

    // Generic update
    updateDisplayState
  };
}
