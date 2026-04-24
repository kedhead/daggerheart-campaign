import { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Edit3, ChevronLeft, ChevronRight, Film, Mic, Send, Trash2 } from 'lucide-react';
import MediaLightbox from './MediaLightbox';
import { useChapterJournal } from '../../hooks/useStorybook';

/* ─────────────────────────────────────────────────────────────────────────────
   ChapterReader — a two-page spread, paginated book reading experience.

   The chapter is broken into "leaves" (pages). Each leaf holds a blend of
   prose paragraphs and scene plates, plus dedicated spreads for the
   Dramatis Personae, Table Memories, and In-Character Journal.

   On wide screens we render two leaves side-by-side; on mobile, one at a time.
   Prev/next turn the pages with a small animation.
   ──────────────────────────────────────────────────────────────────────────── */

export default function ChapterReader({
  chapter,
  campaignId,
  characters,
  isDM,
  currentUserId,
  storybook,
  onBack,
  onEdit
}) {
  const [lightboxItems, setLightboxItems] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { entries: journalEntries } = useChapterJournal(campaignId, chapter.id);

  const [spreadIndex, setSpreadIndex] = useState(0);
  const [turning, setTurning] = useState(false);

  const paragraphs = useMemo(
    () => (chapter.prose || '').split(/\n\n+/).filter(p => p.trim()),
    [chapter.prose]
  );
  const scenes = chapter.scenes || [];
  const spotlights = chapter.spotlights || [];
  const media = chapter.media || [];

  // Build the ordered list of leaves (pages)
  const leaves = useMemo(
    () => buildLeaves({ chapter, paragraphs, scenes, spotlights, media, journalEntries }),
    [chapter, paragraphs, scenes, spotlights, media, journalEntries]
  );

  // Pair leaves into spreads (2 per view)
  const spreads = useMemo(() => {
    const out = [];
    for (let i = 0; i < leaves.length; i += 2) {
      out.push([leaves[i], leaves[i + 1] || null]);
    }
    return out.length ? out : [[null, null]];
  }, [leaves]);

  useEffect(() => {
    if (spreadIndex >= spreads.length) setSpreadIndex(Math.max(0, spreads.length - 1));
  }, [spreads.length, spreadIndex]);

  const turnPage = (delta) => {
    const next = spreadIndex + delta;
    if (next < 0 || next >= spreads.length) return;
    setTurning(true);
    setSpreadIndex(next);
    setTimeout(() => setTurning(false), 420);
  };

  // Keyboard page-turn
  useEffect(() => {
    const onKey = (e) => {
      if (lightboxItems) return;
      if (e.key === 'ArrowRight') turnPage(1);
      else if (e.key === 'ArrowLeft') turnPage(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spreadIndex, spreads.length, lightboxItems]);

  const allVisuals = useMemo(
    () => [
      ...scenes.map(s => ({ id: s.id, kind: 'image', url: s.imageUrl, caption: s.caption })),
      ...media
    ],
    [scenes, media]
  );
  const openLightbox = (item) => {
    const idx = allVisuals.findIndex(v => v.id === item.id || v.url === item.url);
    setLightboxIndex(Math.max(0, idx));
    setLightboxItems(allVisuals);
  };
  const navigateLightbox = (delta) => {
    if (!lightboxItems) return;
    setLightboxIndex((lightboxIndex + delta + lightboxItems.length) % lightboxItems.length);
  };

  const [leftLeaf, rightLeaf] = spreads[spreadIndex] || [null, null];
  const runningHead = chapter.title;
  const chapterLabel = `Chapter ${toRoman(chapter.chapterNumber)}`;

  return (
    <div className="sb-desk">
      <div className="sb-toolbar">
        <button type="button" className="sb-toolbar-btn" onClick={onBack}>
          <ArrowLeft size={13} /> Close the book
        </button>
        <div style={{
          fontFamily: "'Cinzel', serif",
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontSize: '0.72rem',
          color: 'rgba(233, 212, 170, 0.55)'
        }}>
          Spread {spreadIndex + 1} of {spreads.length}
        </div>
        {isDM && (
          <button type="button" className="sb-toolbar-btn" onClick={onEdit}>
            <Edit3 size={13} /> Edit chapter
          </button>
        )}
      </div>

      <div className="sb-book-frame" style={{ position: 'relative' }}>
        <div className={`sb-spread ${turning ? 'is-turning' : ''}`}>
          <Leaf
            leaf={leftLeaf}
            side="left"
            chapterNumber={chapter.chapterNumber}
            chapterLabel={chapterLabel}
            runningHead={runningHead}
            folio={spreadIndex * 2 + 1}
            totalFolios={leaves.length}
            onOpenLightbox={openLightbox}
            storybook={storybook}
            chapterId={chapter.id}
            currentUserId={currentUserId}
            isDM={isDM}
            characters={characters}
          />
          <Leaf
            leaf={rightLeaf}
            side="right"
            chapterNumber={chapter.chapterNumber}
            chapterLabel={chapterLabel}
            runningHead={runningHead}
            folio={spreadIndex * 2 + 2}
            totalFolios={leaves.length}
            onOpenLightbox={openLightbox}
            storybook={storybook}
            chapterId={chapter.id}
            currentUserId={currentUserId}
            isDM={isDM}
            characters={characters}
          />
        </div>

        <button
          type="button"
          className="sb-turn prev"
          aria-label="Previous spread"
          disabled={spreadIndex === 0}
          onClick={() => turnPage(-1)}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="sb-turn next"
          aria-label="Next spread"
          disabled={spreadIndex >= spreads.length - 1}
          onClick={() => turnPage(1)}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {spreads.length > 1 && (
        <div className="sb-pips" role="tablist" aria-label="Jump to spread">
          {spreads.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`sb-pip ${i === spreadIndex ? 'is-current' : ''}`}
              onClick={() => setSpreadIndex(i)}
              aria-label={`Spread ${i + 1}`}
              aria-current={i === spreadIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {lightboxItems && (
        <MediaLightbox
          items={lightboxItems}
          index={lightboxIndex}
          onClose={() => setLightboxItems(null)}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
}

/* ── Leaf renderer (one side of a spread) ────────────────────────────────── */

function Leaf({ leaf, side, chapterNumber, chapterLabel, runningHead, folio, totalFolios,
                onOpenLightbox, storybook, chapterId, currentUserId, isDM, characters }) {
  if (!leaf) {
    // Blank verso page — show just aged parchment with a folio
    return (
      <div className={`sb-leaf sb-leaf--${side}`} aria-hidden="true">
        <div className="sb-head">
          <span className="sb-head-swash">❦</span>
          <span>&nbsp;</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="sb-folio">—</div>
      </div>
    );
  }

  const isTitle = leaf.kind === 'title';
  const showHead = !isTitle;

  return (
    <div className={`sb-leaf sb-leaf--${side}`}>
      {showHead && (
        <div className="sb-head">
          <span>{chapterLabel}</span>
          <span className="sb-head-swash">❦</span>
          <span style={{ opacity: 0.7 }}>{truncate(runningHead, 42)}</span>
        </div>
      )}

      {leaf.kind === 'title' && <TitleLeaf chapter={{ title: leaf.title, chapterNumber, ...leaf }} />}

      {leaf.kind === 'flow' && (
        <div className="sb-prose">
          {(() => {
            // Find the index of the first paragraph block on this leaf to
            // anchor the illuminated initial (only on the very first leaf).
            let firstProseSeen = false;
            return leaf.blocks.map((blk, i) => {
              if (blk.kind === 'p') {
                const illuminated = leaf.firstInChapter && !firstProseSeen;
                firstProseSeen = true;
                return <ProseParagraph key={`b-${i}`} content={blk.value} illuminated={illuminated} />;
              }
              // scene plate inline
              return (
                <PlateSection
                  key={`b-${i}`}
                  scene={blk.value}
                  onClick={() => onOpenLightbox(blk.value)}
                />
              );
            });
          })()}
        </div>
      )}

      {leaf.kind === 'personae' && (
        <>
          <div className="sb-section-label">Dramatis Personae</div>
          <div className="sb-personae">
            {leaf.spotlights.map(s => (
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
        </>
      )}

      {leaf.kind === 'memories' && (
        <>
          <div className="sb-section-label">Table Memories</div>
          <div className="sb-memories">
            {leaf.media.map(m => (
              <div key={m.id} className="sb-memory" role="button" tabIndex={0} onClick={() => onOpenLightbox(m)}>
                {m.kind === 'image' && <img src={m.url} alt={m.caption || ''} />}
                {m.kind === 'video' && <div className="sb-memory-slate"><Film size={24} /></div>}
                {m.kind === 'audio' && <div className="sb-memory-slate"><Mic size={24} /></div>}
              </div>
            ))}
          </div>
        </>
      )}

      {leaf.kind === 'journal' && (
        <>
          <div className="sb-section-label">In-Character Journal</div>
          {leaf.entries.length === 0
            ? <p style={{ textAlign:'center', fontStyle:'italic', color:'var(--sb-ink-muted)' }}>The page awaits the first voice.</p>
            : leaf.entries.map(entry => (
                <div key={entry.id} className="sb-journal-entry">
                  <div className="sb-journal-head">
                    <span className="sb-journal-name">{entry.characterName || entry.authorName}</span>
                    {entry.characterName && <span className="sb-journal-author">— {entry.authorName}</span>}
                    {(entry.authorId === currentUserId || isDM) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this journal entry?')) {
                            storybook.deleteJournalEntry(chapterId, entry.id);
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
          }
          {leaf.isLastJournal && currentUserId && (
            <div style={{ marginTop: '1rem' }}>
              <JournalComposer
                characters={characters}
                currentUserId={currentUserId}
                onSubmit={(entry) => storybook.addJournalEntry(chapterId, entry)}
              />
            </div>
          )}
        </>
      )}

      <div className="sb-folio">
        {folio}{totalFolios > 0 ? ` · ${totalFolios}` : ''}
      </div>
    </div>
  );
}

/* ── Renderers for page content ──────────────────────────────────────────── */

function TitleLeaf({ chapter }) {
  return (
    <div className="sb-title-leaf" style={{ flex: 1 }}>
      <div className="sb-title-eyebrow">Chapter {toRoman(chapter.chapterNumber)}</div>
      <h1 className="sb-title">{chapter.title}</h1>
      <div className="sb-title-ornament" aria-hidden="true" />
      <div className="sb-title-lozenge" aria-hidden="true" />
      {chapter.sessionNumber && (
        <div className="sb-title-session">from the chronicle of Session {chapter.sessionNumber}</div>
      )}
    </div>
  );
}

function ProseParagraph({ content, illuminated }) {
  // Take the first character for the illuminated initial; render the rest as
  // a single paragraph after the drop-cap box.
  if (!illuminated) {
    return <div><ReactMarkdown>{content}</ReactMarkdown></div>;
  }
  const first = content.trimStart().charAt(0);
  const rest = content.trimStart().slice(1);
  return (
    <div>
      <span className="sb-illuminated">{first}</span>
      <ReactMarkdown>{rest}</ReactMarkdown>
    </div>
  );
}

function PlateSection({ scene, onClick }) {
  return (
    <div className="sb-plate" onClick={onClick} role="button" tabIndex={0}>
      <div className="sb-plate-frame">
        <img src={scene.imageUrl} alt={scene.caption || ''} />
        <span className="sb-plate-corner tl" />
        <span className="sb-plate-corner tr" />
        <span className="sb-plate-corner bl" />
        <span className="sb-plate-corner br" />
      </div>
      {scene.caption && <div className="sb-plate-caption">{scene.caption}</div>}
    </div>
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

/* ── Pagination — scenes flow inline with prose, like figures in a real book
   Instead of forcing each scene to its own spread (which chopped the prose
   into 1-2 paragraph gasps), we pack paragraphs and scenes together onto a
   leaf until the leaf is "full". Prose weight is the real budget; scene
   plates consume space equivalent to a long paragraph.
   ─────────────────────────────────────────────────────────────────────── */

function buildLeaves({ chapter, paragraphs, scenes, spotlights, media, journalEntries }) {
  const leaves = [];

  // 1. Title page
  leaves.push({
    kind: 'title',
    title: chapter.title,
    chapterNumber: chapter.chapterNumber,
    sessionNumber: chapter.sessionNumber
  });

  // 2. Build an ordered content stream: paragraphs interleaved with scenes.
  //    Scenes anchor at roughly evenly-spaced paragraph boundaries so they
  //    illustrate the section they fall next to.
  const stream = [];
  const pCount = paragraphs.length;
  const sCount = scenes.length;
  const sceneBoundaries = new Set();
  if (sCount > 0 && pCount > 0) {
    for (let i = 1; i <= sCount; i++) {
      // Place scene i after paragraph index = floor(i * pCount / (sCount + 1))
      const after = Math.max(1, Math.min(pCount, Math.floor((i * pCount) / (sCount + 1))));
      sceneBoundaries.add(after);
    }
  }

  let sceneCursor = 0;
  paragraphs.forEach((p, idx) => {
    stream.push({ kind: 'p', value: p });
    // Insert any scenes whose anchor boundary was this paragraph (idx+1)
    if (sceneBoundaries.has(idx + 1) && sceneCursor < sCount) {
      stream.push({ kind: 'scene', value: scenes[sceneCursor++] });
    }
  });
  // Any scenes left over (chapter had more scenes than paragraphs) — append
  while (sceneCursor < sCount) stream.push({ kind: 'scene', value: scenes[sceneCursor++] });

  // 3. Pack the stream onto leaves. Each leaf has a "weight budget":
  //    a paragraph is ~1 unit, a scene plate is ~2 units. Budget 5 per leaf
  //    keeps pages visually balanced and lets prose breathe.
  const LEAF_BUDGET = 5;
  let leaf = { kind: 'flow', blocks: [], firstInChapter: true };
  let weight = 0;

  const flush = () => {
    if (leaf.blocks.length) {
      leaves.push(leaf);
      leaf = { kind: 'flow', blocks: [], firstInChapter: false };
      weight = 0;
    }
  };

  for (const item of stream) {
    const w = item.kind === 'scene' ? 2 : 1;
    if (weight + w > LEAF_BUDGET && leaf.blocks.length > 0) flush();
    leaf.blocks.push(item);
    weight += w;
  }
  flush();

  // 4. Dramatis personae
  if (spotlights.length) {
    leaves.push({ kind: 'personae', spotlights });
  }

  // 5. Table memories
  if (media.length) {
    leaves.push({ kind: 'memories', media });
  }

  // 6. Journal — break entries into chunks of 3, last one gets the composer
  const JOURNAL_PER_LEAF = 3;
  const hasEntries = journalEntries.length > 0;
  if (hasEntries) {
    for (let i = 0; i < journalEntries.length; i += JOURNAL_PER_LEAF) {
      const chunk = journalEntries.slice(i, i + JOURNAL_PER_LEAF);
      const isLast = i + JOURNAL_PER_LEAF >= journalEntries.length;
      leaves.push({
        kind: 'journal',
        entries: chunk,
        isLastJournal: isLast
      });
    }
  } else {
    leaves.push({ kind: 'journal', entries: [], isLastJournal: true });
  }

  return leaves;
}

function truncate(s, n) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
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
