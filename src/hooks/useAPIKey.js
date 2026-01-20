import { useState, useEffect, useCallback } from 'react';
import { encrypt, decrypt, isEncryptionSupported } from '../utils/encryption';
import { useSharedAPIKey } from './useSharedAPIKey';

const STORAGE_KEY = 'dh_ai_api_keys';

/**
 * Hook for managing API keys with encryption
 * Stores keys in localStorage, encrypted with user's Firebase UID
 *
 * @param {string} userId - Current user's Firebase UID
 * @returns {object} API key management functions and state
 */
export function useAPIKey(userId) {
  const [keys, setKeys] = useState({
    anthropic: null,
    openai: null,
    provider: 'anthropic' // Default provider
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Shared API key support
  const {
    sharedConfig,
    checkUsageLimit,
    recordUsage,
    getSharedKey,
    hasSharedKey,
    isEnabled: sharedKeysEnabled,
    userUsage,
    loading: sharedLoading
  } = useSharedAPIKey(userId);

  // Load keys from localStorage on mount
  useEffect(() => {
    async function loadKeys() {
      if (!userId) {
        setLoading(false);
        return;
      }

      if (!isEncryptionSupported()) {
        setError('Encryption not supported in this browser');
        setLoading(false);
        return;
      }

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const decrypted = await decrypt(stored, userId);
          const parsed = JSON.parse(decrypted);
          setKeys(parsed);
          setError(null); // Clear any previous errors on successful load
        }
      } catch (err) {
        console.error('Failed to load API keys:', err);
        // IMPORTANT: Do NOT clear localStorage on decryption failure
        // The user ID might be temporarily unavailable or incorrect
        // Keys will remain encrypted and available when userId is correct
        setError('Encrypted API keys found but cannot be decrypted. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    }

    loadKeys();
  }, [userId]);

  /**
   * Save an API key for a specific provider
   * @param {string} provider - 'anthropic' or 'openai'
   * @param {string} key - The API key to save
   */
  const saveKey = async (provider, key) => {
    if (!userId) {
      setError('User not logged in');
      return false;
    }

    if (!isEncryptionSupported()) {
      setError('Encryption not supported in this browser');
      return false;
    }

    try {
      const updated = { ...keys, [provider]: key, provider };
      const encrypted = await encrypt(JSON.stringify(updated), userId);
      localStorage.setItem(STORAGE_KEY, encrypted);
      setKeys(updated);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to save API key:', err);
      setError('Failed to save API key');
      return false;
    }
  };

  /**
   * Remove an API key for a specific provider
   * @param {string} provider - 'anthropic' or 'openai'
   */
  const removeKey = async (provider) => {
    if (!userId) return false;

    try {
      const updated = { ...keys, [provider]: null };

      // If both keys are null, remove from localStorage entirely
      if (!updated.anthropic && !updated.openai) {
        localStorage.removeItem(STORAGE_KEY);
        setKeys({ anthropic: null, openai: null, provider: 'anthropic' });
      } else {
        const encrypted = await encrypt(JSON.stringify(updated), userId);
        localStorage.setItem(STORAGE_KEY, encrypted);
        setKeys(updated);
      }

      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to remove API key:', err);
      setError('Failed to remove API key');
      return false;
    }
  };

  /**
   * Clear all API keys
   */
  const clearAllKeys = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKeys({ anthropic: null, openai: null, provider: 'anthropic' });
    setError(null);
  };

  /**
   * Check if a specific provider has a key configured (own or shared)
   * @param {string} provider - 'anthropic' or 'openai' (optional)
   * @returns {boolean} - True if the provider (or any provider) has a key
   */
  const hasKey = useCallback((provider) => {
    if (provider) {
      // User's own key takes priority
      if (keys[provider]) return true;
      // Fall back to shared key
      return hasSharedKey(provider);
    }
    // If no provider specified, check if any key exists
    return !!(keys.anthropic || keys.openai || hasSharedKey('anthropic') || hasSharedKey('openai'));
  }, [keys, hasSharedKey]);

  /**
   * Check if user has their OWN key (not shared)
   * @param {string} provider - 'anthropic' or 'openai' (optional)
   * @returns {boolean}
   */
  const hasOwnKey = useCallback((provider) => {
    if (provider) {
      return !!keys[provider];
    }
    return !!(keys.anthropic || keys.openai);
  }, [keys]);

  /**
   * Get the effective API key for a provider (own key or shared)
   * @param {string} provider - 'anthropic' or 'openai'
   * @returns {{ key: string|null, isShared: boolean, usageCheck?: object }}
   */
  const getEffectiveKey = useCallback((provider) => {
    // User's own key takes priority
    if (keys[provider]) {
      return { key: keys[provider], isShared: false };
    }

    // Try shared key
    if (sharedKeysEnabled && hasSharedKey(provider)) {
      const usageCheck = checkUsageLimit();
      if (!usageCheck.allowed) {
        return { key: null, isShared: true, usageCheck };
      }
      const sharedKey = getSharedKey(provider);
      return { key: sharedKey, isShared: true, usageCheck };
    }

    return { key: null, isShared: false };
  }, [keys, sharedKeysEnabled, hasSharedKey, checkUsageLimit, getSharedKey]);

  /**
   * Switch the active provider
   * @param {string} provider - 'anthropic' or 'openai'
   */
  const setProvider = async (provider) => {
    if (!userId) return false;

    try {
      const updated = { ...keys, provider };
      const encrypted = await encrypt(JSON.stringify(updated), userId);
      localStorage.setItem(STORAGE_KEY, encrypted);
      setKeys(updated);
      return true;
    } catch (err) {
      console.error('Failed to set provider:', err);
      return false;
    }
  };

  /**
   * Get the current active API key
   * @returns {string|null} - The active API key or null
   */
  const getActiveKey = () => {
    return keys[keys.provider] || null;
  };

  return {
    keys,
    hasKey,
    hasOwnKey,
    loading: loading || sharedLoading,
    error,
    saveKey,
    removeKey,
    clearAllKeys,
    setProvider,
    getActiveKey,
    encryptionSupported: isEncryptionSupported(),
    // Shared key support
    getEffectiveKey,
    recordUsage,
    sharedKeysEnabled,
    sharedConfig,
    userUsage,
    checkUsageLimit
  };
}
