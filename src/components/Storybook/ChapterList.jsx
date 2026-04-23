import { Edit3, Eye } from 'lucide-react';

const STATUS_STYLES = {
  draft:           { label: 'Draft',     bg: 'rgba(196, 154, 60, 0.15)', text: '#c49a3c' },
  pending_review:  { label: 'Needs review', bg: 'rgba(196, 154, 60, 0.25)', text: '#d4aa4c' },
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
            className="group text-left relative overflow-hidden rounded-lg transition hover:scale-[1.01]"
            style={{
              background: '#1e1a14',
              border: '2px solid rgba(196, 154, 60, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(196, 154, 60, 0.06)'
            }}
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              {cover ? (
                <img
                  src={cover}
                  alt={chapter.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  style={{ filter: 'sepia(10%) saturate(85%)' }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #2a2419, #1e1a14)',
                    fontFamily: "'Cinzel', serif",
                    color: 'rgba(196, 154, 60, 0.25)',
                    fontSize: '1.1rem'
                  }}
                >
                  Chapter {chapter.chapterNumber}
                </div>
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(30,26,20,0.95), rgba(30,26,20,0.2) 50%, transparent)' }}
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: '#c49a3c',
                    border: '1px solid rgba(196, 154, 60, 0.25)',
                    fontFamily: "'Cinzel', serif"
                  }}
                >
                  Ch. {chapter.chapterNumber}
                </span>
                {isDM && (
                  <span
                    className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-2">
              <h3
                className="text-xl font-bold leading-tight line-clamp-2"
                style={{ fontFamily: "'Cinzel', serif", color: '#d4c5a0' }}
              >
                {chapter.title || 'Untitled chapter'}
              </h3>
              {excerpt && (
                <p
                  className="text-sm line-clamp-3"
                  style={{ color: '#a0926e', fontFamily: "'EB Garamond', 'Crimson Pro', serif" }}
                >
                  {excerpt}
                </p>
              )}
              <div className="flex items-center justify-between pt-2 text-xs" style={{ color: '#6e6348' }}>
                <span>
                  {chapter.sessionNumber ? `Session ${chapter.sessionNumber}` : 'Freeform'}
                  {chapter.scenes?.length ? ` · ${chapter.scenes.length} scene${chapter.scenes.length === 1 ? '' : 's'}` : ''}
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
                      className="ml-3 inline-flex items-center gap-1 cursor-pointer"
                      style={{ color: '#6e6348' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#c49a3c'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#6e6348'}
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
