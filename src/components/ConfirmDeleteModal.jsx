import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';

/**
 * Confirmation before a PERMANENT delete.
 *
 * NPCs, lore entries and sessions were deleted on a single tap with no prompt
 * and no way back — one mis-tap on a phone at the table erased a session's
 * recap. Unlike characters (see ConfirmDeleteCharacterModal), these have no
 * trash to restore from, so this says so plainly rather than implying a safety
 * net that doesn't exist.
 *
 * One deliberate click, not type-to-confirm: that friction is reserved for
 * destroying a character sheet for good.
 */
export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, kind, name, consequence }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delete ${kind}`} size="small">
      <div className="space-y-5 p-2">
        <div
          className="flex gap-3 p-4 rounded-xl"
          style={{ background: 'rgba(150,40,40,0.12)', border: '1px solid rgba(150,40,40,0.3)' }}
        >
          <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'rgba(220,100,100,0.9)' }} />
          <div className="space-y-1">
            <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
              Delete <strong>{name || `this ${kind.toLowerCase()}`}</strong>?
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {consequence || 'This is permanent. There is no trash to restore it from.'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
            style={{
              minHeight: 44,
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              border: '1px solid var(--line)',
              letterSpacing: '0.14em',
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
            style={{
              minHeight: 44,
              background: 'rgba(150,40,40,0.85)',
              color: '#fff',
              letterSpacing: '0.14em',
            }}
            onClick={handleConfirm}
          >
            <Trash2 size={12} style={{ display: 'inline', marginRight: 6 }} />
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
