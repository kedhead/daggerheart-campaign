import { Sparkles, Check, Pencil, Trash2 } from 'lucide-react';

export default function PendingDraftBanner({ drafts, onReview, onApprove, onDiscard }) {
  if (!drafts || drafts.length === 0) return null;
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: 'color-mix(in srgb, #fbbf24 12%, transparent)',
        borderColor: 'color-mix(in srgb, #fbbf24 40%, transparent)'
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }}
        >
          <Sparkles size={18} />
        </div>
        <div>
          <h3 className="text-white font-bold">
            {drafts.length} chapter{drafts.length === 1 ? '' : 's'} awaiting review
          </h3>
          <p className="text-white/60 text-sm">Auto-drafted after a session was finalized. Review, edit, or publish.</p>
        </div>
      </div>
      <ul className="space-y-2">
        {drafts.map(d => (
          <li
            key={d.id}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-xl border"
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderColor: 'rgba(255,255,255,0.08)'
            }}
          >
            <div className="flex flex-col">
              <span className="text-white font-semibold font-cinzel">{d.title}</span>
              <span className="text-xs text-white/40">
                Chapter {d.chapterNumber}{d.sessionNumber ? ` • Session ${d.sessionNumber}` : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onReview(d.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5"
              >
                <Pencil size={12} /> Review
              </button>
              <button
                type="button"
                onClick={() => onApprove(d.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)'
                }}
              >
                <Check size={12} /> Publish
              </button>
              <button
                type="button"
                onClick={() => onDiscard(d.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 flex items-center gap-1.5"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <Trash2 size={12} /> Discard
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
