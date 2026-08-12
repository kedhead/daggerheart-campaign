import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import {
  Edit3, ChevronLeft, ChevronRight, BookOpen, Film, Mic, Send, Trash2, X
} from 'lucide-react';
import MediaLightbox from './MediaLightbox';
import CinematicPlayer from './CinematicPlayer';
import { interleaveProseAndScenes } from './cinematicTimeline';
import { useAllJournals } from '../../hooks/useStorybook';

/* ─────────────────────────────────────────────────────────────────────────────
   ChapterReader — one scrolling chapter at a time, with chapter navigation.

   Kept: the leather-desk surround, parchment page, illuminated initial,
         gilded scene plates, ornate dividers, running chapter header, and
         Dramatis Personae / Table Memories / In-Character Journal sections.
   Dropped: two-page spread + word-count pagination (fragile and prone to
         clipping, dead pages, and empty space bugs).

   Scenes are distributed evenly inline among the paragraphs of the chapter
   so the reading experience never has a "page with only a picture."
   ──────────────────────────────────────────────────────────────────────────── */

export default function ChapterReader({
  chapters,
  campaign,
  campaignId,
  characters,
  isDM,
  currentUserId,
  storybook,
  onEditChapter,
  initialChapterId = null,
  hideJournal = false
}) {
  const orderedChapters = useMemo(
    () => [...(chapters || [])].sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0)),
    [chapters]
  );

  const [chapterIndex, setChapterIndex] = useState(() => {
    if (initialChapterId) {
      const idx = orderedChapters.findIndex(c => c.id === initialChapterId);
      if (idx >= 0) return idx;
    }
    return 0;
  });
  const [cinematicOpen, setCinematicOpen] = useState(false);

  const chapterIds = useMemo(() => orderedChapters.map(c => c.id), [orderedChapters]);
  // Public/share-link visitors don't have permission to read journalEntries,
  // and we explicitly want them hidden anyway, so skip the subscription.
  const journalsByChapter = useAllJournals(campaignId, hideJournal ? [] : chapterIds);

  const [tocOpen, setTocOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const topRef = useRef(null);

  const currentChapter = orderedChapters[chapterIndex] || null;
  const canPrev = chapterIndex > 0;
  const canNext = chapterIndex < orderedChapters.length - 1;

  const gotoChapter = (idx, behavior = 'smooth') => {
    if (idx < 0 || idx >= orderedChapters.length) return;
    setChapterIndex(idx);
    setTocOpen(false);
    // Scroll to top of chapter after the state settles
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior, block: 'start' });
    }, 0);
  };

  // Keyboard nav — ←/→ across chapters
  useEffect(() => {
    const onKey = (e) => {
      if (lightboxItems || tocOpen) return;
      const t = e.target?.tagName;
      if (t === 'TEXTAREA' || t === 'INPUT' || t === 'SELECT') return;
      if (e.key === 'ArrowRight' && canNext) gotoChapter(chapterIndex + 1);
      else if (e.key === 'ArrowLeft' && canPrev) gotoChapter(chapterIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIndex, canPrev, canNext, lightboxItems, tocOpen]);

  // Build the combined lightbox pool (this chapter's scenes + media)
  const allVisuals = useMemo(() => {
    if (!currentChapter) return [];
    const pool = [];
    (currentChapter.scenes || []).filter(s => s?.imageUrl).forEach(s =>
      pool.push({ id: s.id, kind: 'image', url: s.imageUrl, caption: s.caption })
    );
    (currentChapter.media || []).forEach(m => pool.push(m));
    return pool;
  }, [currentChapter]);

  const openLightbox = (url) => {
    const idx = allVisuals.findIndex(v => v.url === url);
    setLightboxIndex(Math.max(0, idx));
    setLightboxItems(allVisuals);
  };
  const navigateLightbox = (delta) => {
    if (!lightboxItems) return;
    setLightboxIndex((lightboxIndex + delta + lightboxItems.length) % lightboxItems.length);
  };

  if (!currentChapter) {
    return (
      <div className="sb-desk" style={{ padding: '3rem 1rem' }}>
        <div className="sb-page" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontStyle: 'italic', color: 'var(--sb-ink-muted)' }}>No chapters bound yet.</p>
        </div>
      </div>
    );
  }

  // Split prose and distribute scenes inline at evenly-spaced boundaries.
  const paragraphs = (currentChapter.prose || '').split(/\n\n+/).filter(p => p.trim());
  // A scene whose illustration failed is kept on the chapter so the DM can
  // regenerate it from the editor, but readers should never see an empty
  // frame — only scenes that actually have art get plated.
  const scenes = (currentChapter.scenes || []).filter(s => s?.imageUrl);
  const blocks = interleaveProseAndScenes(paragraphs, scenes);

  const spotlights = currentChapter.spotlights || [];
  const media = currentChapter.media || [];
  const journalEntries = journalsByChapter[currentChapter.id] || [];

  return (
    <div className="sb-desk">
      {/* Toolbar — chapter nav + DM actions */}
      <div className="sb-toolbar" ref={topRef}>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
          <button type="button" className="sb-toolbar-btn" onClick={() => setTocOpen(true)}>
            <BookOpen size={13} /> Contents
          </button>
          <button
            type="button"
            className="sb-toolbar-btn"
            onClick={() => setCinematicOpen(true)}
            title="Play this chapter as an animated recap"
          >
            <Film size={13} /> Play Recap
          </button>
          <button
            type="button"
            className="sb-toolbar-btn"
            onClick={() => gotoChapter(chapterIndex - 1)}
            disabled={!canPrev}
            style={!canPrev ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <button
            type="button"
            className="sb-toolbar-btn"
            onClick={() => gotoChapter(chapterIndex + 1)}
            disabled={!canNext}
            style={!canNext ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>

        <select
          value={chapterIndex}
          onChange={(e) => gotoChapter(Number(e.target.value))}
          style={{
            fontFamily:"'Cinzel', serif",
            fontSize:'0.72rem', letterSpacing:'0.18em',
            textTransform:'uppercase',
            background:'rgba(0,0,0,0.4)',
            color:'var(--sb-gilt-bright)',
            border:'1px solid rgba(185,136,58,0.4)',
            padding:'0.5rem 0.75rem',
            cursor:'pointer',
            maxWidth: '18rem'
          }}
        >
          {orderedChapters.map((ch, idx) => (
            <option key={ch.id} value={idx}>
              {`Ch. ${toRoman(ch.chapterNumber)} — ${ch.title || 'Untitled'}`}
            </option>
          ))}
        </select>

        {isDM ? (
          <button type="button" className="sb-toolbar-btn" onClick={() => onEditChapter(currentChapter.id)}>
            <Edit3 size={13} /> Edit this chapter
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Chapter page */}
      <article className="sb-page">
        <header className="sb-chapter-header">
          <span className="sb-eyebrow">Chapter {toRoman(currentChapter.chapterNumber)}</span>
          <h1 className="sb-title">{currentChapter.title}</h1>
          {currentChapter.sessionNumber && (
            <div className="sb-title-session">from the chronicle of Session {currentChapter.sessionNumber}</div>
          )}
          <div className="sb-fleuron" aria-hidden="true" />
        </header>

        <div className="sb-prose">
          {blocks.length === 0 ? (
            <p style={{ fontStyle: 'italic', textAlign: 'center', color: 'var(--sb-ink-muted)' }}>
              The chronicler has yet to set down this chapter's prose.
            </p>
          ) : (
            (() => {
              let firstProseSeen = false;
              return blocks.map((blk, i) => {
                if (blk.kind === 'p') {
                  const illuminated = !firstProseSeen;
                  firstProseSeen = true;
                  return <ProseParagraph key={`p-${i}`} content={blk.value} illuminated={illuminated} />;
                }
                return <PlateSection key={`s-${i}`} scene={blk.value} onClick={() => openLightbox(blk.value.imageUrl)} />;
              });
            })()
          )}
        </div>

        {spotlights.length > 0 && (
          <section>
            <div className="sb-rule" aria-hidden="true" />
            <div className="sb-section-label">Dramatis Personae</div>
            <div className="sb-personae">
              {spotlights.map(s => (
                <div key={`${s.entityType}-${s.entityId}`} className="sb-persona">
                  <div className="sb-persona-avatar">
                    {s.portraitUrl
                      ? <img src={s.portraitUrl} alt={s.name} />
                      : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', color:'var(--sb-ink-soft)', fontFamily:'Cinzel', fontWeight:700 }}>{(s.name||'?').slice(0,1)}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sb-persona-name">{s.name}</div>
                    <div className="sb-persona-kind">{s.entityType}</div>
                    {s.moment && <div className="sb-persona-moment">{s.moment}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {media.length > 0 && (
          <section>
            <div className="sb-rule" aria-hidden="true" />
            <div className="sb-section-label">Table Memories</div>
            <div className="sb-memories">
              {media.map(m => (
                <div key={m.id} className="sb-memory" role="button" tabIndex={0} onClick={() => openLightbox(m.url)}>
                  {m.kind === 'image' && <img src={m.url} alt={m.caption || ''} />}
                  {m.kind === 'video' && <div className="sb-memory-slate"><Film size={24} /></div>}
                  {m.kind === 'audio' && <div className="sb-memory-slate"><Mic size={24} /></div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {!hideJournal && (
        <section>
          <div className="sb-rule" aria-hidden="true" />
          <div className="sb-section-label">In-Character Journal</div>
          {journalEntries.length === 0 ? (
            <p style={{ textAlign:'center', fontStyle:'italic', color:'var(--sb-ink-muted)', marginBottom: '1rem' }}>
              The page awaits the first voice.
            </p>
          ) : (
            journalEntries.map(entry => (
              <div key={entry.id} className="sb-journal-entry">
                <div className="sb-journal-head">
                  <span className="sb-journal-name">{entry.characterName || entry.authorName}</span>
                  {entry.characterName && <span className="sb-journal-author">— {entry.authorName}</span>}
                  {(entry.authorId === currentUserId || isDM) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this journal entry?')) {
                          storybook.deleteJournalEntry(currentChapter.id, entry.id);
                        }
                      }}
                      aria-label="Delete entry"
                      style={{ marginLeft:'auto', background:'transparent', border:'none', color:'var(--sb-ink-muted)', cursor:'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="sb-journal-body">
                  <ReactMarkdown>{entry.content}</ReactMarkdown>
                </div>
              </div>
            ))
          )}
          {currentUserId && (
            <div style={{ marginTop: '1rem' }}>
              <JournalComposer
                characters={characters}
                currentUserId={currentUserId}
                onSubmit={(entry) => storybook.addJournalEntry(currentChapter.id, entry)}
              />
            </div>
          )}
        </section>
        )}

        {/* End-of-chapter navigation */}
        <div className="sb-chapter-nav" aria-label="Chapter navigation">
          <button
            type="button"
            className="sb-nav-link"
            onClick={() => gotoChapter(chapterIndex - 1)}
            disabled={!canPrev}
          >
            <ChevronLeft size={16} />
            <span>
              <span className="sb-nav-kicker">Previous chapter</span>
              {canPrev && <span className="sb-nav-title">{orderedChapters[chapterIndex - 1].title}</span>}
            </span>
          </button>
          <div className="sb-fleuron" aria-hidden="true" style={{ margin: 0 }} />
          <button
            type="button"
            className="sb-nav-link sb-nav-link--right"
            onClick={() => gotoChapter(chapterIndex + 1)}
            disabled={!canNext}
          >
            <span>
              <span className="sb-nav-kicker">Next chapter</span>
              {canNext && <span className="sb-nav-title">{orderedChapters[chapterIndex + 1].title}</span>}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </article>

      {tocOpen && (
        <TOCOverlay
          chapters={orderedChapters}
          currentIndex={chapterIndex}
          onClose={() => setTocOpen(false)}
          onSelect={(idx) => gotoChapter(idx, 'auto')}
        />
      )}

      {lightboxItems && (
        <MediaLightbox
          items={lightboxItems}
          index={lightboxIndex}
          onClose={() => setLightboxItems(null)}
          onNavigate={navigateLightbox}
        />
      )}

      {cinematicOpen && (
        <CinematicPlayer
          chapter={currentChapter}
          campaignId={campaignId}
          isDM={isDM}
          updateChapter={storybook?.updateChapter}
          onClose={() => setCinematicOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Content helpers ─────────────────────────────────────────────────────── */
/* interleaveProseAndScenes is shared with the cinematic recap — see
   ./cinematicTimeline.js (imported at the top of this file). */

function ProseParagraph({ content, illuminated }) {
  if (!illuminated) {
    return <div className="sb-para"><ReactMarkdown>{content}</ReactMarkdown></div>;
  }
  const first = content.trimStart().charAt(0);
  const rest = content.trimStart().slice(1);
  return (
    <div className="sb-para sb-para--opening">
      <span className="sb-illuminated">{first}</span>
      <ReactMarkdown>{rest}</ReactMarkdown>
    </div>
  );
}

function PlateSection({ scene, onClick }) {
  return (
    <figure className="sb-plate" onClick={onClick} role="button" tabIndex={0}>
      <div className="sb-plate-frame">
        <img src={scene.imageUrl} alt={scene.caption || ''} />
        <span className="sb-plate-corner tl" />
        <span className="sb-plate-corner tr" />
        <span className="sb-plate-corner bl" />
        <span className="sb-plate-corner br" />
      </div>
      {scene.caption && <figcaption className="sb-plate-caption">{scene.caption}</figcaption>}
    </figure>
  );
}

/* ── TOC overlay ─────────────────────────────────────────────────────────── */

function TOCOverlay({ chapters, currentIndex, onClose, onSelect }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="sb-toc-overlay"
      onClick={onClose}
      role="dialog"
      aria-label="Contents"
    >
      <div className="sb-toc" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="sb-toc-close" aria-label="Close contents" onClick={onClose}>
          <X size={16} />
        </button>
        <div className="sb-eyebrow" style={{ textAlign: 'center' }}>Contents</div>
        <h2 className="sb-title" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>The Chronicle</h2>
        <div className="sb-fleuron" aria-hidden="true" />
        {chapters.length === 0 ? (
          <p style={{ textAlign:'center', fontStyle:'italic', color:'var(--sb-ink-muted)' }}>
            No chapters bound yet.
          </p>
        ) : (
          <ol className="sb-toc-list">
            {chapters.map((ch, idx) => (
              <li key={ch.id}>
                <button
                  type="button"
                  onClick={() => onSelect(idx)}
                  className={`sb-toc-row ${idx === currentIndex ? 'is-current' : ''}`}
                >
                  <span className="sb-toc-num">Ch. {toRoman(ch.chapterNumber)}</span>
                  <span className="sb-toc-title">{ch.title || 'Untitled chapter'}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ── Journal composer ────────────────────────────────────────────────────── */

function JournalComposer({ characters, currentUserId, onSubmit }) {
  const myCharacters = useMemo(
    () => (characters || []).filter(c => c.userId === currentUserId || c.ownerId === currentUserId),
    [characters, currentUserId]
  );
  const [characterId, setCharacterId] = useState(myCharacters[0]?.id || '');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const selected = myCharacters.find(c => c.id === characterId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        characterId: selected?.id || null,
        characterName: selected?.name || ''
      });
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="sb-journal-form" onSubmit={handleSubmit}>
      {myCharacters.length > 1 && (
        <div style={{ marginBottom: '0.65rem' }}>
          <label style={{ fontFamily:"'Cinzel', serif", textTransform:'uppercase', letterSpacing:'0.22em', fontSize:'0.7rem', color:'var(--sb-gilt-deep)', marginRight:'0.6rem' }}>
            Writing as
          </label>
          <select value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
            {myCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={selected ? `What did ${selected.name} feel, recall, or fear?` : 'Pen an entry to this chapter…'}
      />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <span style={{ fontFamily:"'Cinzel', serif", textTransform:'uppercase', letterSpacing:'0.22em', fontSize:'0.68rem', color:'var(--sb-gilt-deep)' }}>
          {selected ? `By ${selected.name}` : 'Anonymous entry'}
        </span>
        <button type="submit" className="sb-btn" disabled={!content.trim() || submitting}>
          <Send size={13} />
          {submitting ? 'Inking…' : 'Enter in the ledger'}
        </button>
      </div>
    </form>
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
