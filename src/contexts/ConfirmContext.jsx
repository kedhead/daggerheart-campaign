import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

// A themed replacement for window.confirm().
//
// The browser's own confirm box blocks the whole page, looks nothing like the
// site, and on a phone is easy to dismiss by accident. This renders through the
// app's Modal and resolves a promise instead:
//
//   const confirm = useConfirm();
//   if (!(await confirm({ title: 'Remove member', message: '…', confirmLabel: 'Remove', danger: true }))) return;
//
// A plain string works too: `await confirm('Discard this draft?')`.

const ConfirmContext = createContext(null);

function normalize(opts) {
  if (typeof opts === 'string') return { message: opts };
  return opts || {};
}

// Outside the provider (smoke tests, an isolated render) fall back to the
// browser's confirm, or to "no" where there is no browser.
function fallbackConfirm(opts) {
  const { title, message } = normalize(opts);
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') return Promise.resolve(false);
  return Promise.resolve(window.confirm([title, message].filter(Boolean).join('\n\n')));
}

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((opts) => new Promise((resolve) => {
    // A second request while one is open answers the first with "no".
    resolverRef.current?.(false);
    resolverRef.current = resolve;
    setRequest(normalize(opts));
  }), []);

  const settle = useCallback((answer) => {
    resolverRef.current?.(answer);
    resolverRef.current = null;
    setRequest(null);
  }, []);

  const { title, message, confirmLabel, cancelLabel, danger } = request || {};

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal isOpen={!!request} onClose={() => settle(false)} title={title || 'Are you sure?'} size="small">
        <div className="space-y-5 p-2">
          {message && (
            <div className="flex gap-3">
              {danger && <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} aria-hidden="true" />}
              <p style={{ color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{message}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              style={{ minHeight: 44, background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--line)' }}
              onClick={() => settle(false)}
            >
              {cancelLabel || 'Cancel'}
            </button>
            <button
              type="button"
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              style={{
                minHeight: 44,
                color: '#fff',
                background: danger ? 'rgba(170,45,45,0.9)' : 'var(--primary)',
                border: '1px solid transparent',
              }}
              onClick={() => settle(true)}
            >
              {confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** Returns `confirm(opts) => Promise<boolean>`. Never throws outside the provider. */
export function useConfirm() {
  return useContext(ConfirmContext) || fallbackConfirm;
}
