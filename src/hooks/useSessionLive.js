import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing live session mode with real-time note-taking
 * Allows players and DM to capture notes during gameplay
 *
 * @param {string} campaignId - The campaign ID
 * @param {string} sessionId - The session ID to manage live notes for
 * @param {boolean} isDM - Whether current user is DM
 * @returns {Object} Live session state and methods
 */
export function useSessionLive(campaignId, sessionId, isDM = false) {
  const { currentUser } = useAuth();
  const [liveNotes, setLiveNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const basePath = campaignId && sessionId
    ? `campaigns/${campaignId}/sessions/${sessionId}/liveNotes`
    : null;

  // Subscribe to live notes for this session
  useEffect(() => {
    if (!basePath) {
      setLiveNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const notesRef = collection(db, basePath);
    const notesQuery = query(notesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const notes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setLiveNotes(notes);
        setLoading(false);
      },
      (err) => {
        console.error('[useSessionLive] Error subscribing to live notes:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [basePath]);

  /**
   * Add a new live note
   * @param {string} content - Note content (supports wiki links)
   * @param {boolean} isHighlight - Mark as highlight for summary
   */
  const addLiveNote = async (content, isHighlight = false) => {
    if (!basePath || !currentUser || !content.trim()) {
      return null;
    }

    try {
      const noteDoc = {
        content: content.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email || 'Unknown',
        isHighlight,
        timestamp: serverTimestamp(),
        order: liveNotes.length
      };

      const docRef = await addDoc(collection(db, basePath), noteDoc);
      console.log('[useSessionLive] Note added:', docRef.id);
      return { id: docRef.id, ...noteDoc };
    } catch (err) {
      console.error('[useSessionLive] Error adding note:', err);
      setError(err.message);
      return null;
    }
  };

  /**
   * Toggle highlight status of a note
   * @param {string} noteId - Note ID to toggle
   */
  const toggleHighlight = async (noteId) => {
    if (!basePath) return false;

    const note = liveNotes.find(n => n.id === noteId);
    if (!note) return false;

    try {
      await updateDoc(doc(db, basePath, noteId), {
        isHighlight: !note.isHighlight
      });
      return true;
    } catch (err) {
      console.error('[useSessionLive] Error toggling highlight:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Update a note's content
   * @param {string} noteId - Note ID to update
   * @param {string} content - New content
   */
  const updateNote = async (noteId, content) => {
    if (!basePath || !content.trim()) return false;

    try {
      await updateDoc(doc(db, basePath, noteId), {
        content: content.trim(),
        editedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error('[useSessionLive] Error updating note:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Delete a note (author or DM only)
   * @param {string} noteId - Note ID to delete
   */
  const deleteNote = async (noteId) => {
    if (!basePath) return false;

    const note = liveNotes.find(n => n.id === noteId);
    if (!note) return false;

    // Only allow author or DM to delete
    if (note.authorId !== currentUser?.uid && !isDM) {
      console.error('[useSessionLive] Not authorized to delete note');
      return false;
    }

    try {
      await deleteDoc(doc(db, basePath, noteId));
      return true;
    } catch (err) {
      console.error('[useSessionLive] Error deleting note:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Clear all live notes (DM only)
   */
  const clearAllNotes = async () => {
    if (!basePath || !isDM) return false;

    try {
      const snapshot = await getDocs(collection(db, basePath));
      if (snapshot.empty) return true;

      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnapshot => {
        batch.delete(doc(db, basePath, docSnapshot.id));
      });

      await batch.commit();
      console.log('[useSessionLive] Cleared', snapshot.size, 'notes');
      return true;
    } catch (err) {
      console.error('[useSessionLive] Error clearing notes:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Compile highlighted notes into a summary string
   * @returns {string} Compiled summary from highlighted notes
   */
  const compileHighlights = () => {
    const highlights = liveNotes.filter(n => n.isHighlight);
    if (highlights.length === 0) {
      return liveNotes.map(n => `• ${n.content}`).join('\n');
    }
    return highlights.map(n => `• ${n.content}`).join('\n');
  };

  /**
   * Get notes grouped by author
   * @returns {Object} Notes grouped by author ID
   */
  const getNotesByAuthor = () => {
    return liveNotes.reduce((acc, note) => {
      if (!acc[note.authorId]) {
        acc[note.authorId] = {
          authorName: note.authorName,
          notes: []
        };
      }
      acc[note.authorId].notes.push(note);
      return acc;
    }, {});
  };

  // Computed values
  const highlightedNotes = liveNotes.filter(n => n.isHighlight);
  const noteCount = liveNotes.length;
  const highlightCount = highlightedNotes.length;

  return {
    liveNotes,
    highlightedNotes,
    noteCount,
    highlightCount,
    loading,
    error,
    addLiveNote,
    toggleHighlight,
    updateNote,
    deleteNote,
    clearAllNotes,
    compileHighlights,
    getNotesByAuthor
  };
}
