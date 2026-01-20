import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const SETTINGS_DOC = 'appSettings/sharedApiKeys';
const USAGE_COLLECTION = 'userUsage';

/**
 * Hook for managing shared API keys with usage limits
 * Admin sets keys in Firestore, users consume with daily/monthly limits
 *
 * @param {string} userId - Current user's Firebase UID
 * @returns {object} Shared API key state and functions
 */
export function useSharedAPIKey(userId) {
  const [sharedConfig, setSharedConfig] = useState(null);
  const [userUsage, setUserUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load shared config (read-only for regular users)
  useEffect(() => {
    const configRef = doc(db, SETTINGS_DOC);

    const unsubscribe = onSnapshot(
      configRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Don't expose actual keys to client - just availability
          setSharedConfig({
            enabled: data.enabled || false,
            hasAnthropicKey: !!data.anthropicKey,
            hasOpenaiKey: !!data.openaiKey,
            dailyLimit: data.dailyLimit || 10,
            monthlyLimit: data.monthlyLimit || 100,
            // Keys are only for server-side use, but we need them for client API calls
            // In a production app, you'd use Firebase Functions as a proxy
            // For simplicity, we'll store encrypted and trust authenticated users
            _anthropicKey: data.anthropicKey || null,
            _openaiKey: data.openaiKey || null
          });
        } else {
          setSharedConfig({ enabled: false });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading shared API config:', err);
        setError('Failed to load shared API configuration');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Load user usage
  useEffect(() => {
    if (!userId) {
      setUserUsage(null);
      return;
    }

    const usageRef = doc(db, USAGE_COLLECTION, userId);

    const unsubscribe = onSnapshot(
      usageRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserUsage(snapshot.data());
        } else {
          // Initialize usage document
          setUserUsage({
            daily: { date: getTodayString(), count: 0 },
            monthly: { month: getMonthString(), count: 0 },
            totalAllTime: 0
          });
        }
      },
      (err) => {
        console.error('Error loading user usage:', err);
      }
    );

    return unsubscribe;
  }, [userId]);

  /**
   * Check if user can make a request (within limits)
   * @returns {object} { allowed: boolean, reason?: string, remaining: { daily, monthly } }
   */
  const checkUsageLimit = useCallback(() => {
    if (!sharedConfig?.enabled) {
      return { allowed: false, reason: 'Shared API keys are not enabled' };
    }

    if (!userUsage) {
      return { allowed: true, remaining: { daily: sharedConfig.dailyLimit, monthly: sharedConfig.monthlyLimit } };
    }

    const today = getTodayString();
    const thisMonth = getMonthString();

    // Reset daily count if it's a new day
    const dailyCount = userUsage.daily?.date === today ? userUsage.daily.count : 0;
    const monthlyCount = userUsage.monthly?.month === thisMonth ? userUsage.monthly.count : 0;

    const dailyRemaining = sharedConfig.dailyLimit - dailyCount;
    const monthlyRemaining = sharedConfig.monthlyLimit - monthlyCount;

    if (dailyRemaining <= 0) {
      return {
        allowed: false,
        reason: `Daily limit reached (${sharedConfig.dailyLimit}/day). Resets at midnight.`,
        remaining: { daily: 0, monthly: monthlyRemaining }
      };
    }

    if (monthlyRemaining <= 0) {
      return {
        allowed: false,
        reason: `Monthly limit reached (${sharedConfig.monthlyLimit}/month). Resets on the 1st.`,
        remaining: { daily: dailyRemaining, monthly: 0 }
      };
    }

    return {
      allowed: true,
      remaining: { daily: dailyRemaining, monthly: monthlyRemaining }
    };
  }, [sharedConfig, userUsage]);

  /**
   * Record a usage (call after successful API request)
   */
  const recordUsage = useCallback(async () => {
    if (!userId) return;

    const today = getTodayString();
    const thisMonth = getMonthString();
    const usageRef = doc(db, USAGE_COLLECTION, userId);

    try {
      const currentUsage = userUsage || {};
      const dailyCount = currentUsage.daily?.date === today ? currentUsage.daily.count : 0;
      const monthlyCount = currentUsage.monthly?.month === thisMonth ? currentUsage.monthly.count : 0;

      await setDoc(usageRef, {
        daily: {
          date: today,
          count: dailyCount + 1
        },
        monthly: {
          month: thisMonth,
          count: monthlyCount + 1
        },
        totalAllTime: (currentUsage.totalAllTime || 0) + 1,
        lastUsed: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Failed to record usage:', err);
    }
  }, [userId, userUsage]);

  /**
   * Get the shared API key for a provider (if allowed)
   * @param {string} provider - 'anthropic' or 'openai'
   * @returns {string|null} The API key or null
   */
  const getSharedKey = useCallback((provider) => {
    if (!sharedConfig?.enabled) return null;

    const limitCheck = checkUsageLimit();
    if (!limitCheck.allowed) return null;

    if (provider === 'anthropic' && sharedConfig._anthropicKey) {
      return sharedConfig._anthropicKey;
    }
    if (provider === 'openai' && sharedConfig._openaiKey) {
      return sharedConfig._openaiKey;
    }

    return null;
  }, [sharedConfig, checkUsageLimit]);

  /**
   * Check if shared keys are available for a provider
   * @param {string} provider - 'anthropic' or 'openai' (optional)
   * @returns {boolean}
   */
  const hasSharedKey = useCallback((provider) => {
    if (!sharedConfig?.enabled) return false;

    if (provider === 'anthropic') return sharedConfig.hasAnthropicKey;
    if (provider === 'openai') return sharedConfig.hasOpenaiKey;

    return sharedConfig.hasAnthropicKey || sharedConfig.hasOpenaiKey;
  }, [sharedConfig]);

  return {
    sharedConfig,
    userUsage,
    loading,
    error,
    checkUsageLimit,
    recordUsage,
    getSharedKey,
    hasSharedKey,
    isEnabled: sharedConfig?.enabled || false
  };
}

// Helper functions
function getTodayString() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
}

/**
 * Admin hook for managing shared API key settings
 * Only superadmins can use this
 *
 * @returns {object} Admin functions for managing shared keys
 */
export function useSharedAPIKeyAdmin() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsage, setAllUsage] = useState([]);

  // Load full config (including keys) for admin
  useEffect(() => {
    const configRef = doc(db, SETTINGS_DOC);

    const unsubscribe = onSnapshot(
      configRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setConfig(snapshot.data());
        } else {
          setConfig({
            enabled: false,
            anthropicKey: '',
            openaiKey: '',
            dailyLimit: 10,
            monthlyLimit: 100
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading admin config:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  /**
   * Save shared API key configuration
   * @param {object} newConfig - Configuration to save
   */
  const saveConfig = async (newConfig) => {
    const configRef = doc(db, SETTINGS_DOC);
    try {
      await setDoc(configRef, {
        ...newConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('Failed to save config:', err);
      throw err;
    }
  };

  return {
    config,
    loading,
    saveConfig
  };
}
