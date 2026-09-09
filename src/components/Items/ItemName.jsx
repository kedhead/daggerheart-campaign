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
  iconSize = 12,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const name = displayItemName(item);
  const renamed = hasCustomName(item);
  const editable = canRename && typeof onRename === 'function';

  const startEditing = () => {
    setDraft(normalizeCustomName(item?.customName));
    setEditing(true);
  };

  const commit = () => {
    const next = normalizeCustomName(draft);
    setEditing(false);
    // Blank clears the personal name; skip the write when nothing changed.
    if (next !== normalizeCustomName(item?.customName)) onRename(next);
  };

  const cancel = () => setEditing(false);

  if (editing) {
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
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          onClick={e => e.stopPropagation()}
          aria-label={`Rename ${item?.name || 'item'}`}
          style={{
            flex: 1, minWidth: 0, padding: '3px 7px', borderRadius: 6,
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fdf6dc', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
          }}
        />
        <button
          type="button" onClick={commit} title="Save name"
          style={{ ...BTN, color: '#4ade80', borderColor: 'rgba(74,222,128,0.35)' }}
        >
          <Check size={iconSize} />
        </button>
        <button
          type="button" onClick={cancel} title="Cancel"
          style={{ ...BTN, color: 'rgba(255,255,255,0.55)' }}
        >
          <X size={iconSize} />
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
      {editable && (
        <button
          type="button"
          onClick={startEditing}
          title={renamed ? `Rename (currently ${item.name})` : 'Rename this item'}
          style={{ ...BTN, color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}
        >
          <Pencil size={iconSize} />
        </button>
      )}
    </span>
  );
}

const BTN = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: 3, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
  background: 'transparent', border: '1px solid transparent', lineHeight: 0,
};
