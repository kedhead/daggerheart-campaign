/**
 * Audio Storage Service
 * Persists AI-generated audio to Firebase Storage and caches URL mappings in Firestore
 */

import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

/**
 * Upload a base64 data URL to Firebase Storage and return a permanent download URL
 * @param {string} campaignId - Campaign ID for storage path
 * @param {string} dataUrl - Base64 data URL (e.g., "data:audio/mpeg;base64,...")
 * @param {string} filename - Filename for the audio file (without extension)
 * @returns {Promise<string>} Permanent Firebase Storage download URL
 */
export async function persistAudio(campaignId, dataUrl, filename) {
  const safeName = (filename || 'audio').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
  const storagePath = `campaigns/${campaignId}/audio/${safeName}.mp3`;
  const storageRef = ref(storage, storagePath);

  console.log('Uploading audio to Firebase Storage:', storagePath);
  await uploadString(storageRef, dataUrl, 'data_url');
  const downloadUrl = await getDownloadURL(storageRef);
  console.log('Audio uploaded to Storage:', downloadUrl);

  return downloadUrl;
}

/**
 * Save audio cache mappings to Firestore
 * @param {string} campaignId - Campaign ID
 * @param {object} sounds - Sound ID → Firebase URL mapping
 * @param {object} music - Theme key → Firebase URL mapping
 */
export async function saveAudioCache(campaignId, sounds, music) {
  try {
    const cacheRef = doc(db, `campaigns/${campaignId}/audioCache/data`);
    await setDoc(cacheRef, {
      sounds: sounds || {},
      music: music || {},
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('Audio cache saved to Firestore');
  } catch (error) {
    console.error('Failed to save audio cache:', error);
  }
}

/**
 * Load audio cache mappings from Firestore
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<{ sounds: object, music: object }>} Cached URL mappings
 */
export async function loadAudioCache(campaignId) {
  try {
    const cacheRef = doc(db, `campaigns/${campaignId}/audioCache/data`);
    const snapshot = await getDoc(cacheRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      console.log('Audio cache loaded from Firestore:', {
        soundCount: Object.keys(data.sounds || {}).length,
        musicCount: Object.keys(data.music || {}).length
      });
      return {
        sounds: data.sounds || {},
        music: data.music || {}
      };
    }

    return { sounds: {}, music: {} };
  } catch (error) {
    console.error('Failed to load audio cache:', error);
    return { sounds: {}, music: {} };
  }
}
