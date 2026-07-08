import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeChapterForFirestore } from '../services/storybookGenerator';

/**
 * useStorybook — real-time hook for the "Story So Far" chapter collection.
 *
 * Subscribes to campaigns/{id}/storybook ordered by chapterNumber desc.
 * Exposes CRUD helpers plus media upload and journal entry helpers.
 */
export function useStorybook(campaignId, isDM = false) {
  const { currentUser } = useAuth();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const basePath = campaignId ? `campaigns/${campaignId}/storybook` : null;

  useEffect(() => {
    if (!basePath) {
      setChapters([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, basePath), orderBy('chapterNumber', 'desc'));
    const unsub = onSnapshot(
      q,
      snap => {
        setChapters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error('[useStorybook] subscribe error:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [basePath]);

  const pendingDrafts = chapters.filter(c => c.status === 'pending_review');
  const publishedChapters = chapters.filter(c => c.status === 'published');
  const draftChapters = chapters.filter(c => c.status === 'draft');

  const nextChapterNumber = () => {
    if (chapters.length === 0) return 1;
    return Math.max(...chapters.map(c => c.chapterNumber || 0)) + 1;
  };

  const addChapter = useCallback(async (chapter) => {
    if (!basePath) return null;
    // Strip any leaked base64 data: URLs so the write can't breach Firestore's
    // 1 MB document limit. Images live in Storage; only their URLs belong here.
    const safeChapter = sanitizeChapterForFirestore(chapter);
    const docData = {
      ...safeChapter,
      chapterNumber: safeChapter.chapterNumber ?? nextChapterNumber(),
      media: safeChapter.media || [],
      scenes: safeChapter.scenes || [],
      spotlights: safeChapter.spotlights || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const ref = await addDoc(collection(db, basePath), docData);
    return { id: ref.id, ...docData };
  }, [basePath, chapters]);

  const updateChapter = useCallback(async (chapterId, patch) => {
    if (!basePath) return false;
    await updateDoc(doc(db, basePath, chapterId), {
      ...patch,
      updatedAt: serverTimestamp()
    });
    return true;
  }, [basePath]);

  const publishChapter = useCallback(async (chapterId) => {
    if (!basePath) return false;
    await updateDoc(doc(db, basePath, chapterId), {
      status: 'published',
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  }, [basePath]);

  const deleteChapter = useCallback(async (chapterId) => {
    if (!basePath) return false;
    const chapter = chapters.find(c => c.id === chapterId);
    // Best-effort: remove uploaded images/media from Storage
    if (chapter) {
      const paths = [
        ...(chapter.scenes || []).map(s => s.storagePath).filter(Boolean),
        ...(chapter.media || []).map(m => m.storagePath).filter(Boolean),
        ...(chapter.narration || []).map(n => n.storagePath).filter(Boolean),
        ...Object.values(chapter.sceneVideos || {}).map(v => v.storagePath).filter(Boolean)
      ];
      await Promise.all(paths.map(async p => {
        try { await deleteObject(ref(storage, p)); }
        catch (e) { /* ignore missing files */ }
      }));
    }
    await deleteDoc(doc(db, basePath, chapterId));
    return true;
  }, [basePath, chapters]);

  // ── Media upload ──────────────────────────────────────────────────────────

  const classifyMedia = (file) => {
    const t = file.type || '';
    if (t.startsWith('image/')) return 'image';
    if (t.startsWith('video/')) return 'video';
    if (t.startsWith('audio/')) return 'audio';
    return 'image';
  };

  const uploadMedia = useCallback(async (chapterId, file, caption = '') => {
    if (!basePath || !file) return null;
    const kind = classifyMedia(file);
    const folder = kind === 'image' ? 'images' : 'media';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const storagePath = `campaigns/${campaignId}/storybook/${folder}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    const mediaItem = {
      id: `m_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      kind,
      url,
      storagePath,
      caption,
      uploadedBy: currentUser?.uid || '',
      uploadedByName: currentUser?.displayName || currentUser?.email || 'Unknown',
      uploadedAt: new Date().toISOString()
    };

    const chapter = chapters.find(c => c.id === chapterId);
    const nextMedia = [...(chapter?.media || []), mediaItem];
    await updateChapter(chapterId, { media: nextMedia });
    return mediaItem;
  }, [basePath, campaignId, chapters, currentUser, updateChapter]);

  const removeMedia = useCallback(async (chapterId, mediaId) => {
    if (!basePath) return false;
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return false;
    const item = (chapter.media || []).find(m => m.id === mediaId);
    if (item?.storagePath) {
      try { await deleteObject(ref(storage, item.storagePath)); }
      catch (e) { /* ignore */ }
    }
    const nextMedia = (chapter.media || []).filter(m => m.id !== mediaId);
    await updateChapter(chapterId, { media: nextMedia });
    return true;
  }, [basePath, chapters, updateChapter]);

  // ── Journal entries (nested subcollection) ─────────────────────────────────

  const journalPath = (chapterId) =>
    basePath && chapterId ? `${basePath}/${chapterId}/journalEntries` : null;

  const addJournalEntry = useCallback(async (chapterId, { content, characterId, characterName }) => {
    const path = journalPath(chapterId);
    if (!path || !currentUser || !content?.trim()) return null;
    const entry = {
      authorId: currentUser.uid,
      authorName: currentUser.displayName || currentUser.email || 'Unknown',
      characterId: characterId || null,
      characterName: characterName || '',
      content: content.trim(),
      createdAt: serverTimestamp()
    };
    const ref = await addDoc(collection(db, path), entry);
    return { id: ref.id, ...entry };
  }, [basePath, currentUser]);

  const deleteJournalEntry = useCallback(async (chapterId, entryId) => {
    const path = journalPath(chapterId);
    if (!path) return false;
    await deleteDoc(doc(db, path, entryId));
    return true;
  }, [basePath]);

  return {
    chapters,
    pendingDrafts,
    publishedChapters,
    draftChapters,
    loading,
    error,
    addChapter,
    updateChapter,
    publishChapter,
    deleteChapter,
    uploadMedia,
    removeMedia,
    addJournalEntry,
    deleteJournalEntry,
    journalPath
  };
}

/**
 * useChapterJournal — subscribes to the journal entries of a single chapter.
 */
export function useChapterJournal(campaignId, chapterId) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId || !chapterId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const path = `campaigns/${campaignId}/storybook/${chapterId}/journalEntries`;
    const q = query(collection(db, path), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      snap => {
        setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => {
        console.error('[useChapterJournal] subscribe error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [campaignId, chapterId]);

  return { entries, loading };
}

/**
 * useAllJournals — subscribes to journalEntries of every chapter at once.
 * Returns a map { [chapterId]: entries[] }. Used by the single-book reader
 * so each chapter's journal leaf can show live entries without needing a
 * separate hook call per chapter (which would break the rules of hooks).
 */
export function useAllJournals(campaignId, chapterIds) {
  const [byChapter, setByChapter] = useState({});
  const key = (chapterIds || []).join(',');

  useEffect(() => {
    if (!campaignId || !chapterIds?.length) {
      setByChapter({});
      return;
    }
    const unsubs = chapterIds.map(chapterId => {
      const path = `campaigns/${campaignId}/storybook/${chapterId}/journalEntries`;
      const q = query(collection(db, path), orderBy('createdAt', 'asc'));
      return onSnapshot(
        q,
        snap => {
          const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setByChapter(prev => ({ ...prev, [chapterId]: entries }));
        },
        err => console.error('[useAllJournals] subscribe error:', err)
      );
    });
    return () => unsubs.forEach(u => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, key]);

  return byChapter;
}
