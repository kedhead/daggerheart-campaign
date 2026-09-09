import { useEffect, useRef, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { displayItemName, hasCustomName, normalizeCustomName, MAX_CUSTOM_NAME_LENGTH } from '../../utils/itemNames';

/**
 * An item's name, with an optional inline rename affordance.
 *
 * The character sheet and the player portal are styled by two different
 * systems (dh-* classes vs. inline styles), so the caller passes the styling
 * for the name itself and this component only owns the pencil, the input and
 * the save/cancel controls — which stay neutral enough to sit on either.
 *
 * Editing is uncontrolled by default. Pass `editing` + `onEditingChange` to
 * drive it from outside, which is how the portal's inventory cards open the
 * editor from a labeled "Rename" button down in their action row: a bare
 * pencil is too easy to miss on a phone.
 *
 * Renaming writes to the player's own inventory entry, never the shared
 * catalog item: see utils/itemNames.js.
 */
export default function ItemName({
  item,
  canRename = false,
  onRename,
  className,
  style,
  wrapperStyle,
  showOriginal = false,
  showPencil = true,
  editing: editingProp,
  onEditingChange,
  iconSize = 12,
}) {
  const [editingState, setEditingState] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const controlled = editingProp !== undefined;
  const editing = controlled ? editingProp : editingState;

  const setEditing = (next) => {
    if (!controlled) setEditingState(next);
    if (onEditingChange) onEditingChange(next);
  };

  const name = displayItemName(item);
  const renamed = hasCustomName(item);
  const editable = canRename && typeof onRename === 'function';

  // Seed the draft from the stored name whenever the editor opens, however it
  // was opened — the pencil here or a Rename button somewhere else on the card.
  useEffect(() => {
    if (!editing) return;
    setDraft(normalizeCustomName(item?.customName));
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const commit = () => {
    const next = normalizeCustomName(draft);
    setEditing(false);
    // Blank clears the personal name; skip the write when nothing changed.
    if (next !== normalizeCustomName(item?.customName)) onRename(next);
  };

  if (editing && editable) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0, ...wrapperStyle }}>
        <input
          ref={inputRef}
          value={draft}
          maxLength={MAX_CUSTOM_NAME_LENGTH}
          placeholder={item?.name || 'Name'}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
          }}
          onClick={e => e.stopPropagation()}
          aria-label={`Rename ${item?.name || 'item'}`}
          style={{
            flex: 1, minWidth: 0, padding: '5px 8px', borderRadius: 7,
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fdf6dc', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}
        />
        <button
          type="button" onClick={commit} title="Save name" aria-label="Save name"
          style={{ ...BTN, color: '#4ade80', background: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.4)' }}
        >
          <Check size={iconSize + 2} />
        </button>
        <button
          type="button" onClick={() => setEditing(false)} title="Cancel" aria-label="Cancel rename"
          style={{ ...BTN, color: 'rgba(255,255,255,0.6)' }}
        >
          <X size={iconSize + 2} />
        </button>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, minWidth: 0, ...wrapperStyle }}>
      <span className={className} style={style}>{name}</span>
      {showOriginal && renamed && (
        <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
          {item.name}
        </span>
      )}
      {editable && showPencil && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title={renamed ? `Rename (currently ${item.name})` : 'Rename this item'}
          aria-label={`Rename ${item?.name || 'item'}`}
          style={{ ...BTN, color: 'rgba(255,255,255,0.55)', alignSelf: 'center' }}
        >
          <Pencil size={iconSize} />
        </button>
      )}
    </span>
  );
}

// Sized for a thumb, not just a mouse — the portal is used on phones.
const BTN = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 26, minHeight: 26, padding: 4, borderRadius: 7,
  cursor: 'pointer', flexShrink: 0, lineHeight: 0,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)',
};
