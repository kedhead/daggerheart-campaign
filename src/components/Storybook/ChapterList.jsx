import { Edit3, Eye } from 'lucide-react';

const STATUS_STYLES = {
  draft:           { label: 'Draft',     bg: 'rgba(148, 163, 184, 0.18)', text: '#cbd5e1' },
  pending_review:  { label: 'Needs review', bg: 'rgba(251, 191, 36, 0.18)', text: '#fbbf24' },
  published:       { label: 'Published', bg: 'rgba(34, 197, 94, 0.18)',  text: '#4ade80' }
};

export default function ChapterList({ chapters, isDM, onOpen, onEdit }) {
  const sorted = [...chapters].sort((a, b) => (b.chapterNumber || 0) - (a.chapterNumber || 0));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {sorted.map(chapter => {
        const cover = chapter.scenes?.[0]?.imageUrl || null;
        const status = STATUS_STYLES[chapter.status] || STATUS_STYLES.draft;
        const excerpt = (chapter.prose || '').split('\n').find(l => l.trim());

        return (
          <button
            key={chapter.id}
            type="button"
            onClick={() => onOpen(chapter.id)}
            className="group text-left relative overflow-hidden rounded-2xl border transition hover:scale-[1.01] hover:shadow-2xl"
            style={{
              background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
              borderColor: 'var(--line)'
            }}
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              {cover ? (
                <img src={cover} alt={chapter.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--surface-hi), var(--surface))' }}
                >
                  <span className="text-white/20 font-cinzel text-xl">Chapter {chapter.chapterNumber}</span>
                </div>
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.1) 50%, transparent)' }}
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span
                  className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: 'var(--text)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  Ch. {chapter.chapterNumber}
                </span>
                {isDM && (
                  <span
                    className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-2">
              <h3 className="font-cinzel text-xl font-bold text-white leading-tight line-clamp-2">
                {chapter.title || 'Untitled chapter'}
              </h3>
              {excerpt && (
                <p className="text-sm text-white/60 line-clamp-3">{excerpt}</p>
              )}
              <div className="flex items-center justify-between pt-2 text-xs text-white/40">
                <span>
                  {chapter.sessionNumber ? `Session ${chapter.sessionNumber}` : 'Freeform'}
                  {chapter.scenes?.length ? ` • ${chapter.scenes.length} scene${chapter.scenes.length === 1 ? '' : 's'}` : ''}
                </span>
                {isDM && (
                  <span className="flex items-center gap-2">
                    <Eye size={12} /> Open
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); onEdit(chapter.id); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          onEdit(chapter.id);
                        }
                      }}
                      className="ml-3 inline-flex items-center gap-1 hover:text-white/80 cursor-pointer"
                    >
                      <Edit3 size={12} /> Edit
                    </span>
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
