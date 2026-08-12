import { Edit3 } from 'lucide-react';

const BADGE = {
  draft:          { cls: 'draft',     label: 'Draft' },
  pending_review: { cls: 'pending',   label: 'Needs review' },
  published:      { cls: 'published', label: 'Published' }
};

export default function ChapterList({ chapters, isDM, onOpen, onEdit }) {
  // Oldest first (Ch. I → Ch. IV), matching a bookshelf you read left-to-right
  const sorted = [...chapters].sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

  return (
    <div className="sb-shelf">
      {sorted.map(chapter => {
        // First scene WITH art — scene 0 may be a placeholder whose
        // illustration failed and is waiting to be regenerated.
        const cover = chapter.scenes?.find(s => s?.imageUrl)?.imageUrl || null;
        const badge = BADGE[chapter.status] || BADGE.draft;

        return (
          <button
            key={chapter.id}
            type="button"
            className="sb-volume"
            onClick={() => onOpen(chapter.id)}
            aria-label={`Open ${chapter.title}`}
          >
            <div className="sb-volume-cover">
              {cover && <img src={cover} alt="" />}
              <div className="sb-volume-plate">
                <span className="num">Chapter {toRoman(chapter.chapterNumber)}</span>
                <span className="nm">{chapter.title || 'Untitled'}</span>
              </div>
              {isDM && <span className={`sb-volume-badge ${badge.cls}`}>{badge.label}</span>}
              {isDM && (
                <span
                  role="button"
                  tabIndex={0}
                  className="sb-volume-edit"
                  aria-label="Edit chapter"
                  onClick={(e) => { e.stopPropagation(); onEdit(chapter.id); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onEdit(chapter.id);
                    }
                  }}
                >
                  <Edit3 size={11} />
                </span>
              )}
            </div>
            <div className="sb-volume-label">
              <div className="title">{chapter.title || 'Untitled chapter'}</div>
              <div className="meta">
                {chapter.sessionNumber ? `Session ${chapter.sessionNumber}` : 'Freeform'}
                {chapter.scenes?.length ? ` · ${chapter.scenes.length} plate${chapter.scenes.length === 1 ? '' : 's'}` : ''}
              </div>
            </div>
          </button>
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
