import { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ListOrdered } from 'lucide-react';
import Modal from '../Modal';

/* Lets the DM reshuffle chapters when they were generated out of order.
   Up/down moves swap the two affected chapters' chapterNumber values; saving
   commits all changes via storybook.updateChapter. */
export default function ReorderChaptersModal({ isOpen, onClose, chapters, updateChapter }) {
  const initial = useMemo(
    () => [...chapters].sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0)),
    [chapters]
  );
  const [order, setOrder] = useState(initial);
  const [saving, setSaving] = useState(false);

  // Sync local order when the chapters list changes or the modal reopens
  useEffect(() => { setOrder(initial); }, [initial, isOpen]);

  const move = (idx, delta) => {
    const next = [...order];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
  };

  const dirty = order.some((ch, i) => (ch.chapterNumber || 0) !== i + 1);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Renumber sequentially 1..N. Skip writes for chapters whose number
      // is already correct.
      for (let i = 0; i < order.length; i++) {
        const ch = order[i];
        const next = i + 1;
        if ((ch.chapterNumber || 0) !== next) {
          await updateChapter(ch.id, { chapterNumber: next });
        }
      }
      onClose();
    } catch (err) {
      alert(`Reorder failed: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} title="Reorder Chapters" size="medium">
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          Use the arrows to move chapters into reading order. Saving will renumber
          every chapter sequentially (Ch. I, Ch. II, …) to match the new order.
        </p>

        <ol className="space-y-2">
          {order.map((ch, i) => (
            <li
              key={ch.id}
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{
                background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
                borderColor: 'var(--line)'
              }}
            >
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: '0.22em',
                  fontSize: '0.7rem',
                  color: 'var(--sb-gilt-bright, #e2b860)',
                  minWidth: '4ch',
                  textAlign: 'center'
                }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate" style={{ fontFamily: "'Cinzel', serif" }}>
                  {ch.title || 'Untitled chapter'}
                </div>
                <div className="text-xs text-white/40">
                  {ch.sessionNumber ? `Session ${ch.sessionNumber}` : 'Freeform'}
                  {(ch.chapterNumber || 0) !== i + 1 && (
                    <span style={{ marginLeft: 8, color: '#fbbf24' }}>
                      was Ch. {ch.chapterNumber}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded text-white/70 hover:text-white border border-white/10 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || saving}
                  aria-label="Move up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded text-white/70 hover:text-white border border-white/10 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1 || saving}
                  aria-label="Move down"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </li>
          ))}
          {order.length === 0 && (
            <li className="text-center text-white/50 italic py-4">No chapters to reorder yet.</li>
          )}
        </ol>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-white/70 font-semibold hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold disabled:opacity-40"
            style={{
              background: 'color-mix(in srgb, var(--primary) 25%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 45%, transparent)'
            }}
          >
            <ListOrdered size={14} />
            {saving ? 'Renumbering…' : 'Save order'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
