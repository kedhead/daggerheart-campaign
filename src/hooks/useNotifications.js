import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Aggregates notification data from existing Firestore data:
 * - Unread message conversations (from conversations collection)
 * - Pending join requests (passed in from campaign doc)
 *
 * No new Firestore collection required.
 *
 * @param {string} campaignId
 * @param {Object} campaign - Campaign document (for joinRequests)
 * @param {boolean} isDM
 * @returns {{ unreadConversations, pendingJoinRequests, totalCount }}
 */
export function useNotifications(campaignId, campaign, isDM) {
  const { currentUser } = useAuth();
  const [unreadConversations, setUnreadConversations] = useState([]);

  // Subscribe to conversations and track which ones the user hasn't read
  useEffect(() => {
    if (!campaignId || !currentUser) {
      setUnreadConversations([]);
      return;
    }

    const q = query(
      collection(db, `campaigns/${campaignId}/conversations`),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const unread = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(conv => conv.unreadBy?.includes(currentUser.uid));
        setUnreadConversations(unread);
      },
      (error) => {
        // Silently handle permission errors (e.g. not a member yet)
        console.warn('Notifications subscription error:', error.code);
        setUnreadConversations([]);
      }
    );

    return unsubscribe;
  }, [campaignId, currentUser]);

  // Pending join requests — only visible to DM
  const pendingJoinRequests = isDM && campaign?.joinRequests
    ? Object.entries(campaign.joinRequests)
        .filter(([, req]) => req.status === 'pending')
        .map(([userId, req]) => ({ userId, ...req }))
    : [];

  const totalCount = unreadConversations.length + pendingJoinRequests.length;

  return { unreadConversations, pendingJoinRequests, totalCount };
}
