import { useEffect, useState, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const HEARTBEAT_INTERVAL = 60000; // 60 seconds
const AWAY_THRESHOLD = 120000; // 2 minutes - mark as away
const OFFLINE_THRESHOLD = 300000; // 5 minutes - mark as offline

/**
 * Hook for managing user presence in a campaign
 * @param {string} campaignId - The campaign ID
 * @param {string} currentView - Current view the user is on
 */
export function usePresence(campaignId, currentView) {
  const { currentUser } = useAuth();
  const [presenceList, setPresenceList] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const heartbeatRef = useRef(null);
  const presenceDocRef = useRef(null);

  // Update presence in Firestore
  const updatePresence = useCallback(async (status = 'online') => {
    if (!campaignId || !currentUser) return;

    try {
      const presenceRef = doc(db, 'campaigns', campaignId, 'presence', currentUser.uid);
      presenceDocRef.current = presenceRef;

      await setDoc(presenceRef, {
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        status,
        currentView: currentView || 'dashboard',
        lastSeen: serverTimestamp(),
        userId: currentUser.uid,
      }, { merge: true });

      setIsOnline(status === 'online');
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [campaignId, currentUser, currentView]);

  // Remove presence on cleanup
  const removePresence = useCallback(async () => {
    if (!presenceDocRef.current) return;

    try {
      await deleteDoc(presenceDocRef.current);
    } catch (error) {
      console.error('Error removing presence:', error);
    }
  }, []);

  // Set up presence and heartbeat
  useEffect(() => {
    if (!campaignId || !currentUser) return;

    // Initial presence update
    updatePresence('online');

    // Heartbeat interval
    heartbeatRef.current = setInterval(() => {
      updatePresence('online');
    }, HEARTBEAT_INTERVAL);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online');
      }
    };

    // Handle beforeunload
    const handleBeforeUnload = () => {
      removePresence();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removePresence();
    };
  }, [campaignId, currentUser, updatePresence, removePresence]);

  // Update view when it changes
  useEffect(() => {
    if (campaignId && currentUser && currentView) {
      updatePresence('online');
    }
  }, [currentView, campaignId, currentUser, updatePresence]);

  // Subscribe to presence updates
  useEffect(() => {
    if (!campaignId) return;

    const presenceCollectionRef = collection(db, 'campaigns', campaignId, 'presence');

    const unsubscribe = onSnapshot(presenceCollectionRef, (snapshot) => {
      const now = Date.now();
      const presenceData = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const lastSeenTime = data.lastSeen?.toMillis?.() || 0;
        const timeSinceLastSeen = now - lastSeenTime;

        // Determine status based on lastSeen time
        let computedStatus = data.status;
        if (timeSinceLastSeen > OFFLINE_THRESHOLD) {
          computedStatus = 'offline';
        } else if (timeSinceLastSeen > AWAY_THRESHOLD && data.status === 'online') {
          computedStatus = 'away';
        }

        // Only include non-offline users
        if (computedStatus !== 'offline') {
          presenceData.push({
            id: doc.id,
            ...data,
            computedStatus,
          });
        }
      });

      setPresenceList(presenceData);
    });

    return () => unsubscribe();
  }, [campaignId]);

  return {
    presenceList,
    isOnline,
    updatePresence,
  };
}
