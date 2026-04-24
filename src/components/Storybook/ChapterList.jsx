import { Edit3 } from 'lucide-react';

const STATUS_CLASSES = {
  draft:          { cls: 'is-draft',     label: 'Draft' },
  pending_review: { cls: 'is-pending',   label: 'Needs review' },
  published:      { cls: 'is-published', label: 'Published' }
};

export default function ChapterList({ chapters, isDM, onOpen, onEdit }) {
  const sorted = [...chapters].sort((a, b) => (b.chapterNumber || 0) - (a.chapterNumber || 0));
  return (
    <div className="sb-shelf">
      {sorted.map(chapter => {
        const cover = chapter.scenes?.[0]?.imageUrl || null;
        const status = STATUS_CLASSES[chapter.status] || STATUS_CLASSES.draft;

        return (
          <div key={chapter.id} style={{ position: 'relative' }}>
            <button
              type="button"
              className="sb-book"
              onClick={() => onOpen(chapter.id)}
              aria-label={`Open ${chapter.title}`}
            >
              <div className="sb-book-cover">
                {cover
                  ? <img src={cover} alt="" />
                  : (
                    <div style={{
                      width:'100%', height:'100%',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background: 'linear-gradient(135deg, #4a2f14, #2a170a)',
                      color: '#f2e3bf',
                      fontFamily: 'Cinzel, serif',
                      fontWeight: 700,
                      letterSpacing: '0.25em',
                      fontSize: '1.1rem'
                    }}>
                      {toRoman(chapter.chapterNumber)}
                    </div>
                  )}
                {isDM && (
                  <span className={`sb-book-badge ${status.cls}`}>{status.label}</span>
                )}
              </div>
              <div className="sb-book-label">
                <div className="sb-book-num">Chapter {toRoman(chapter.chapterNumber)}</div>
                <div className="sb-book-title">{chapter.title || 'Untitled chapter'}</div>
                <div className="sb-book-meta">
                  {chapter.sessionNumber ? `Session ${chapter.sessionNumber}` : 'Freeform'}
                  {chapter.scenes?.length ? ` · ${chapter.scenes.length} plate${chapter.scenes.length === 1 ? '' : 's'}` : ''}
                </div>
              </div>
            </button>
            {isDM && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(chapter.id); }}
                aria-label="Edit chapter"
                style={{
                  position: 'absolute', top: '0.5rem', left: '0.5rem',
                  background: 'rgba(0,0,0,0.65)',
                  color: '#f2e3bf',
                  border: '1px solid rgba(242,227,191,0.3)',
                  padding: '0.3rem 0.45rem',
                  borderRadius: 2,
                  cursor: 'pointer',
                  opacity: 0.85
                }}
              >
                <Edit3 size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function toRoman(n) {
  if (!n || n < 1) return '';
  const map = [
    [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],
    [100,'C'],[90,'XC'],[50,'L'],[40,'XL'],
    [10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']
  ];
  let out = '', v = n;
  for (const [num, sym] of map) { while (v >= num) { out += sym; v -= num; } }
  return out;
}
