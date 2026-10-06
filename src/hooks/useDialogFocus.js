import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

// Open dialogs, oldest first — Modal and the hand-built overlays alike. Only
// the top one handles Tab and Escape, so a confirm opened over an editor
// neither fights it for focus nor closes it along with itself.
const stack = [];

/**
 * Keyboard focus for a dialog.
 *
 * Dialogs used to leave focus wherever it was: Tab walked through the page
 * behind the overlay, a screen reader didn't know a dialog had opened, and
 * closing one dropped focus to the top of the page. While `active`:
 *   · focus moves into the dialog (an element with autoFocus wins, else the
 *     first focusable control, else the dialog itself);
 *   · Tab and Shift+Tab cycle inside it;
 *   · Escape calls `onEscape`, if given;
 *   · on close, focus returns to whatever opened it.
 *
 * @param {{ current: HTMLElement|null }} ref - the dialog element
 * @param {boolean} active - the dialog is open
 * @param {() => void} [onEscape]
 */
export function useDialogFocus(ref, active = true, onEscape) {
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    const opener = document.activeElement;
    const node = ref.current;
    const token = {};
    stack.push(token);

    const focusables = () => (node ? [...node.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement) : []);

    // Let autoFocus (applied during commit) win; otherwise pick the first control.
    const raf = requestAnimationFrame(() => {
      if (!node || node.contains(document.activeElement)) return;
      const first = focusables()[0];
      if (first) first.focus();
      else { node.setAttribute('tabindex', '-1'); node.focus(); }
    });

    const onKey = (e) => {
      if (!node || stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        if (escapeRef.current) { e.stopPropagation(); escapeRef.current(); }
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (!node.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      const at = stack.lastIndexOf(token);
      if (at !== -1) stack.splice(at, 1);
      if (opener && typeof opener.focus === 'function' && document.contains(opener)) opener.focus();
    };
  }, [ref, active]);
}
