import { useEffect } from 'react';

/**
 * Keep the screen on while `active`.
 *
 * Phones dim and lock mid-session, so a player glancing at their sheet found
 * a lock screen and the DM's tablet went dark during a fight. The Screen Wake
 * Lock API holds the screen on while the page is visible; the browser drops
 * the lock whenever the tab is hidden, so it's re-requested on return.
 *
 * Does nothing where the API is missing (older Safari, insecure origins).
 */
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.wakeLock?.request) return undefined;

    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) { lock.release().catch(() => {}); lock = null; }
      } catch {
        // Denied (battery saver, permissions policy) — the screen just sleeps as before.
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release?.().catch(() => {});
    };
  }, [active]);
}
