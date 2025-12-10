/**
 * Encryption utilities for API key storage
 * Uses Web Crypto API for client-side encryption (AES-GCM)
 * Keys are encrypted using user's Firebase UID as the key material
 */

const SALT = 'daggerheart_campaign_builder_v1'; // Static salt for key derivation

/**
 * Generate encryption key from user's Firebase UID
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<CryptoKey>} - Encryption key
 */
async function getKey(uid) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(uid),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text using Web Crypto API
 * @param {string} text - Text to encrypt
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<string>} - Base64 encoded encrypted data (IV + ciphertext)
 */
export async function encrypt(text, uid) {
  try {
    const key = await getKey(uid);
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(text)
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted text
 * @param {string} encryptedText - Base64 encoded encrypted data
 * @param {string} uid - User's Firebase UID
 * @returns {Promise<string>} - Decrypted text
 */
export async function decrypt(encryptedText, uid) {
  try {
    const key = await getKey(uid);

    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data. The data may be corrupted or the user account may have changed.');
  }
}

/**
 * Check if Web Crypto API is available
 * @returns {boolean} - True if Web Crypto API is supported
 */
export function isEncryptionSupported() {
  return !!(window.crypto && window.crypto.subtle);
}
