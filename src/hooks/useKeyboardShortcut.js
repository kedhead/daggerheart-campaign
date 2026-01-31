import { useEffect, useCallback } from 'react';

/**
 * Hook for registering keyboard shortcuts
 * @param {string} key - The key to listen for (e.g., 'Escape', 'k')
 * @param {Function} callback - Function to call when shortcut is triggered
 * @param {Object} options - Configuration options
 * @param {boolean} options.ctrl - Require Ctrl/Cmd key
 * @param {boolean} options.shift - Require Shift key
 * @param {boolean} options.alt - Require Alt key
 * @param {boolean} options.enabled - Whether the shortcut is active (default: true)
 * @param {boolean} options.preventDefault - Whether to prevent default behavior (default: true)
 */
export function useKeyboardShortcut(key, callback, options = {}) {
  const {
    ctrl = false,
    shift = false,
    alt = false,
    enabled = true,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Check if we're in an input field and should ignore
      const target = event.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow Escape to work even in inputs
      if (key !== 'Escape' && isInput) return;

      // Check modifier keys
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      if (ctrl && !ctrlOrCmd) return;
      if (!ctrl && ctrlOrCmd && key !== 'Escape') return; // Don't trigger if cmd/ctrl pressed unless required
      if (shift && !event.shiftKey) return;
      if (!shift && event.shiftKey) return;
      if (alt && !event.altKey) return;
      if (!alt && event.altKey) return;

      // Check if the key matches
      if (event.key.toLowerCase() === key.toLowerCase()) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    [key, callback, ctrl, shift, alt, enabled, preventDefault]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);
}

/**
 * Hook for Escape key to close modals/panels
 * @param {Function} onClose - Function to call when Escape is pressed
 * @param {boolean} isOpen - Whether the modal/panel is currently open
 */
export function useEscapeKey(onClose, isOpen = true) {
  useKeyboardShortcut('Escape', onClose, { enabled: isOpen });
}
