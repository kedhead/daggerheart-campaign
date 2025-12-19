import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDocs,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Real-time messaging hook for campaign conversations
 *
 * Supports:
 * - 1:1 DM-Player conversations
 * - Group announcements
 * - Unread indicators
 * - Real-time updates
 *
 * @param {string} campaignId - Campaign ID
 * @returns {Object} Messaging state and methods
 */
export function useMessaging(campaignId) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  const basePath = campaignId ? `campaigns/${campaignId}` : null;

  // Subscribe to conversations
  useEffect(() => {
    if (!basePath || !currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, `${basePath}/conversations`),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setConversations(data);
        setLoading(false);
      },
      (error) => {
        console.warn('Conversations subscription error:', error.code);
        setConversations([]);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [basePath, currentUser]);

  /**
   * Subscribe to messages for a specific conversation
   * @param {string} conversationId - Conversation ID
   */
  const subscribeToMessages = useCallback((conversationId) => {
    if (!basePath || !conversationId) return () => {};

    const q = query(
      collection(db, `${basePath}/conversations/${conversationId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(prev => ({
          ...prev,
          [conversationId]: data
        }));
      },
      (error) => {
        console.warn('Messages subscription error:', error.code);
        setMessages(prev => ({
          ...prev,
          [conversationId]: []
        }));
      }
    );

    return unsubscribe;
  }, [basePath]);

  /**
   * Send a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   */
  const sendMessage = async (conversationId, content) => {
    if (!basePath || !currentUser || !content.trim()) return;

    const messageData = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email,
      content: content.trim(),
      timestamp: serverTimestamp(),
      readBy: [currentUser.uid]
    };

    // Add message to subcollection
    await addDoc(
      collection(db, `${basePath}/conversations/${conversationId}/messages`),
      messageData
    );

    // Update conversation metadata
    await updateDoc(doc(db, `${basePath}/conversations`, conversationId), {
      lastMessage: content.trim(),
      lastMessageAt: serverTimestamp(),
      unreadBy: arrayUnion(...getOtherParticipants(conversationId))
    });
  };

  /**
   * Mark conversation as read for current user
   * @param {string} conversationId - Conversation ID
   */
  const markAsRead = async (conversationId) => {
    if (!basePath || !currentUser) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    // Remove current user from unreadBy array
    await updateDoc(doc(db, `${basePath}/conversations`, conversationId), {
      unreadBy: arrayRemove(currentUser.uid)
    });

    // Mark all messages as read
    const conversationMessages = messages[conversationId] || [];
    const unreadMessages = conversationMessages.filter(
      msg => msg.senderId !== currentUser.uid && !msg.readBy?.includes(currentUser.uid)
    );

    for (const msg of unreadMessages) {
      await updateDoc(
        doc(db, `${basePath}/conversations/${conversationId}/messages`, msg.id),
        {
          readBy: arrayUnion(currentUser.uid)
        }
      );
    }
  };

  /**
   * Get or create a conversation between two users
   * @param {string} otherUserId - Other user ID
   * @param {string} otherUserName - Other user display name
   * @returns {Promise<string>} Conversation ID
   */
  const getOrCreateDMConversation = async (otherUserId, otherUserName) => {
    if (!basePath || !currentUser) return null;

    // Create conversation ID from sorted user IDs for consistency
    const participants = [currentUser.uid, otherUserId].sort();
    const conversationId = participants.join('-');

    // Check if conversation exists
    const existing = conversations.find(c => c.id === conversationId);
    if (existing) return conversationId;

    // Create new conversation
    await setDoc(doc(db, `${basePath}/conversations`, conversationId), {
      type: 'dm-player',
      participants: participants,
      participantNames: {
        [currentUser.uid]: currentUser.displayName || currentUser.email,
        [otherUserId]: otherUserName
      },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadBy: [],
      createdAt: serverTimestamp()
    });

    return conversationId;
  };

  /**
   * Get or create announcements conversation
   * @param {Array} allMembers - Array of {userId, displayName} objects
   * @returns {Promise<string>} Conversation ID
   */
  const getOrCreateAnnouncements = async (allMembers) => {
    if (!basePath || !currentUser) return null;

    const conversationId = 'announcements';

    // Check if conversation exists
    const existing = conversations.find(c => c.id === conversationId);
    if (existing) return conversationId;

    // Create new announcements conversation
    const participantNames = {};
    const participantIds = [];

    allMembers.forEach(member => {
      participantIds.push(member.userId);
      participantNames[member.userId] = member.displayName;
    });

    await setDoc(doc(db, `${basePath}/conversations`, conversationId), {
      type: 'announcement',
      participants: participantIds,
      participantNames,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadBy: [],
      createdAt: serverTimestamp()
    });

    return conversationId;
  };

  /**
   * Get other participants in a conversation (for unread marking)
   * @param {string} conversationId - Conversation ID
   * @returns {Array<string>} Array of user IDs
   */
  const getOtherParticipants = (conversationId) => {
    if (!currentUser) return [];

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return [];

    return conversation.participants.filter(id => id !== currentUser.uid);
  };

  /**
   * Get unread count for current user
   * @returns {number} Total unread conversations
   */
  const getUnreadCount = () => {
    if (!currentUser) return 0;
    return conversations.filter(c => c.unreadBy?.includes(currentUser.uid)).length;
  };

  /**
   * Check if conversation has unread messages for current user
   * @param {string} conversationId - Conversation ID
   * @returns {boolean} Has unread messages
   */
  const hasUnread = (conversationId) => {
    if (!currentUser) return false;
    const conversation = conversations.find(c => c.id === conversationId);
    return conversation?.unreadBy?.includes(currentUser.uid) || false;
  };

  return {
    conversations,
    messages,
    loading,
    subscribeToMessages,
    sendMessage,
    markAsRead,
    getOrCreateDMConversation,
    getOrCreateAnnouncements,
    getUnreadCount,
    hasUnread
  };
}
