import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import { nameMatches } from '../../utils/characterTrash';

/**
 * Two-step delete confirmation for a character sheet.
 *
 * `permanent: false` (default) — moving to the trash: one deliberate click,
 * with a promise that the Graveyard can bring them back.
 * `permanent: true` — destroying the document for good: the player has to type
 * the character's name before the button unlocks.
 */
export default function ConfirmDeleteCharacterModal({
  character,
  isOpen,
  onClose,
  onConfirm,
  permanent = false,
}) {
  if (!character) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={permanent ? 'Delete Forever' : 'Delete Character'}
      size="small"
    >
      <DeleteCharacterPrompt
        key={`${character.id}:${permanent}`}
        character={character}
        onClose={onClose}
        onConfirm={onConfirm}
        permanent={permanent}
      />
    </Modal>
  );
}

/** The prompt body, split out so it can be rendered (and tested) on its own. */
export function DeleteCharacterPrompt({ character, onClose, onConfirm, permanent = false }) {
  const [typed, setTyped] = useState('');

  const unlocked = !permanent || nameMatches(typed, character.name);

  const handleConfirm = () => {
    if (!unlocked) return;
    onConfirm();
    onClose();
  };

  return (
    <div className="space-y-5 p-2">
      <div
        className="flex gap-3 p-4 rounded-xl"
        style={{
          background: 'rgba(150,40,40,0.12)',
          border: '1px solid rgba(150,40,40,0.3)',
        }}
      >
        <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'rgba(220,100,100,0.9)' }} />
        <div className="space-y-1">
          <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
            {permanent ? 'Permanently delete ' : 'Delete '}
            <strong>{character.name}</strong>
            {character.playerName ? ` (${character.playerName})` : ''}?
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {permanent
              ? 'The sheet, inventory, and history are erased from the database. This cannot be undone by anyone.'
              : 'The sheet moves to Recently Deleted in the Graveyard, where it can be restored at any time.'}
          </p>
        </div>
      </div>

      {permanent && (
        <div className="space-y-1">
          <label
            className="text-[10px] font-bold uppercase"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
          >
            Type <span style={{ color: 'var(--text)' }}>{character.name}</span> to confirm
          </label>
          <input
            type="text"
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
            placeholder={character.name}
            className="w-full rounded-xl py-2.5 px-4 text-sm focus:outline-none transition-all"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
          style={{
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
          className="flex-1 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase transition-all"
          style={{
            background: unlocked ? 'rgba(150,40,40,0.85)' : 'rgba(150,40,40,0.25)',
            color: unlocked ? '#fff' : 'rgba(255,255,255,0.4)',
            letterSpacing: '0.14em',
            cursor: unlocked ? 'pointer' : 'not-allowed',
          }}
          disabled={!unlocked}
          onClick={handleConfirm}
        >
          <Trash2 size={12} style={{ display: 'inline', marginRight: 6 }} />
          {permanent ? 'Delete Forever' : 'Move to Trash'}
        </button>
      </div>
    </div>
  );
}
