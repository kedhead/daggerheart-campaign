import { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Edit3, ChevronLeft, ChevronRight, Film, Mic, Send, Trash2, BookOpen } from 'lucide-react';
import MediaLightbox from './MediaLightbox';
import { useAllJournals } from '../../hooks/useStorybook';

/* ─────────────────────────────────────────────────────────────────────────────
   ChapterReader — the whole chronicle as a single bound book.

   Props historically took a single `chapter`. Now it takes an array of
   `chapters` (chronological) and paginates every chapter into one continuous
   book with a title page and a table of contents up front. The DM can edit
   whichever chapter is currently open via the toolbar.
   ──────────────────────────────────────────────────────────────────────────── */

export default function ChapterReader({
  chapters,
  campaign,
  campaignId,
  characters,
  isDM,
  currentUserId,
  storybook,
  onBack,
  onEditChapter,
  initialChapterId = null
}) {
  const [lightboxItems, setLightboxItems] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [turning, setTurning] = useState(false);

  const orderedChapters = useMemo(
    () => [...(chapters || [])].sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0)),
    [chapters]
  );
  const chapterIds = useMemo(() => orderedChapters.map(c => c.id), [orderedChapters]);
  const journalsByChapter = useAllJournals(campaignId, chapterIds);

  const { leaves, chapterStartLeafIndex } = useMemo(
    () => buildBookLeaves({ chapters: orderedChapters, journalsByChapter, campaignName: campaign?.name }),
    [orderedChapters, journalsByChapter, campaign?.name]
  );

  const spreads = useMemo(() => {
    const out = [];
    for (let i = 0; i < leaves.length; i += 2) out.push([leaves[i], leaves[i + 1] || null]);
    return out.length ? out : [[null, null]];
  }, [leaves]);

  // Jump to initial chapter on first mount
  useEffect(() => {
    if (!initialChapterId) return;
    const chIdx = orderedChapters.findIndex(c => c.id === initialChapterId);
    if (chIdx < 0) return;
    const leafIdx = chapterStartLeafIndex[chIdx];
    if (leafIdx != null) setSpreadIndex(Math.floor(leafIdx / 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialChapterId]);

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

  useEffect(() => {
    const onKey = (e) => {
      if (lightboxItems) return;
      if (e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'INPUT' || e.target?.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight') turnPage(1);
      else if (e.key === 'ArrowLeft') turnPage(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadIndex, spreads.length, lightboxItems]);

  const jumpToChapter = (chapterIdx) => {
    const leafIdx = chapterStartLeafIndex[chapterIdx];
    if (leafIdx == null) return;
    setSpreadIndex(Math.floor(leafIdx / 2));
  };

  const jumpToTOC = () => setSpreadIndex(0); // TOC is in first spread after title

  // Which chapter is currently on screen? Pick from the LEFT leaf of the spread,
  // then fall back to the right leaf.
  const [leftLeaf, rightLeaf] = spreads[spreadIndex] || [null, null];
  const currentChapterIdx = (leftLeaf?.chapterIndex ?? rightLeaf?.chapterIndex);
  const currentChapter = currentChapterIdx != null ? orderedChapters[currentChapterIdx] : null;
  const runningHead = currentChapter?.title || 'The Chronicle';
  const chapterLabel = currentChapter ? `Chapter ${toRoman(currentChapter.chapterNumber)}` : 'The Chronicle';

  // Build the "lightbox pool" — any visual in any chapter
  const allVisuals = useMemo(() => {
    const pool = [];
    orderedChapters.forEach(ch => {
      (ch.scenes || []).forEach(s => pool.push({ id: `${ch.id}-${s.id}`, kind: 'image', url: s.imageUrl, caption: s.caption }));
      (ch.media || []).forEach(m => pool.push({ ...m, id: `${ch.id}-${m.id}` }));
    });
    return pool;
  }, [orderedChapters]);

  const openLightbox = (item) => {
    const idx = allVisuals.findIndex(v => v.url === item.url);
    setLightboxIndex(Math.max(0, idx));
    setLightboxItems(allVisuals);
  };
  const navigateLightbox = (delta) => {
    if (!lightboxItems) return;
    setLightboxIndex((lightboxIndex + delta + lightboxItems.length) % lightboxItems.length);
  };

  return (
    <div>
      <div className="sb-toolbar">
        <button type="button" className="sb-toolbar-btn" onClick={jumpToTOC}>
          <BookOpen size={13} /> Contents
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flexWrap:'wrap' }}>
          {orderedChapters.length > 0 && (
            <select
              value={currentChapterIdx ?? ''}
              onChange={(e) => jumpToChapter(Number(e.target.value))}
              style={{
                fontFamily:"'Cinzel', serif",
                fontSize:'0.72rem', letterSpacing:'0.18em',
                textTransform:'uppercase',
                background:'rgba(0,0,0,0.4)',
                color:'var(--sb-gilt-bright)',
                border:'1px solid rgba(185,136,58,0.4)',
                padding:'0.5rem 0.75rem',
                cursor:'pointer'
              }}
            >
              <option value="" disabled>Jump to chapter…</option>
              {orderedChapters.map((ch, idx) => (
                <option key={ch.id} value={idx}>
                  {`Ch. ${toRoman(ch.chapterNumber)} — ${ch.title || 'Untitled'}`}
                </option>
              ))}
            </select>
          )}
          <span style={{
            fontFamily:"'Cinzel', serif",
            letterSpacing:'0.22em',
            textTransform:'uppercase',
            fontSize:'0.7rem',
            color:'rgba(233, 212, 170, 0.5)'
          }}>
            Spread {spreadIndex + 1} of {spreads.length}
          </span>
        </div>
        {isDM && currentChapter && (
          <button type="button" className="sb-toolbar-btn" onClick={() => onEditChapter(currentChapter.id)}>
            <Edit3 size={13} /> Edit this chapter
          </button>
        )}
        {isDM && !currentChapter && <div />}
      </div>

      <div className="sb-book-frame" style={{ position: 'relative' }}>
        <div className={`sb-spread ${turning ? 'is-turning' : ''}`}>
          <Leaf
            leaf={leftLeaf}
            side="left"
            chapters={orderedChapters}
            folio={spreadIndex * 2 + 1}
            totalFolios={leaves.length}
            chapterLabel={chapterLabel}
            runningHead={runningHead}
            onOpenLightbox={openLightbox}
            storybook={storybook}
            currentUserId={currentUserId}
            isDM={isDM}
            characters={characters}
            onJumpToChapter={jumpToChapter}
          />
          <Leaf
            leaf={rightLeaf}
            side="right"
            chapters={orderedChapters}
            folio={spreadIndex * 2 + 2}
            totalFolios={leaves.length}
            chapterLabel={chapterLabel}
            runningHead={runningHead}
            onOpenLightbox={openLightbox}
            storybook={storybook}
            currentUserId={currentUserId}
            isDM={isDM}
            characters={characters}
            onJumpToChapter={jumpToChapter}
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

function Leaf({ leaf, side, chapters, folio, totalFolios, chapterLabel, runningHead,
                onOpenLightbox, storybook, currentUserId, isDM, characters, onJumpToChapter }) {
  if (!leaf) {
    return (
      <div className={`sb-leaf sb-leaf--${side}`} aria-hidden="true">
        <div className="sb-head"><span className="sb-head-swash">❦</span><span>&nbsp;</span></div>
        <div style={{ flex: 1 }} />
        <div className="sb-folio">—</div>
      </div>
    );
  }

  // Book-level leaves (no chapter head)
  const isTitle = leaf.kind === 'booktitle' || leaf.kind === 'title';
  const isTOC = leaf.kind === 'toc';
  const showHead = !isTitle && !isTOC;

  return (
    <div className={`sb-leaf sb-leaf--${side}`}>
      {showHead && (
        <div className="sb-head">
          <span>{chapterLabel}</span>
          <span className="sb-head-swash">❦</span>
          <span style={{ opacity: 0.7 }}>{truncate(runningHead, 42)}</span>
        </div>
      )}

      {leaf.kind === 'booktitle' && <BookTitleLeaf campaignName={leaf.campaignName} chapterCount={leaf.chapterCount} />}

      {leaf.kind === 'toc' && <TOCLeaf chapters={chapters} leafFolio={leaf.chapterFolios} onJump={onJumpToChapter} />}

      {leaf.kind === 'title' && (
        <ChapterTitleLeaf
          title={leaf.title}
          chapterNumber={leaf.chapterNumber}
          sessionNumber={leaf.sessionNumber}
        />
      )}

      {leaf.kind === 'flow' && (
        <div className="sb-prose">
          {(() => {
            let firstProseSeen = false;
            return leaf.blocks.map((blk, i) => {
              if (blk.kind === 'p') {
                const illuminated = leaf.firstInChapter && !firstProseSeen;
                firstProseSeen = true;
                return <ProseParagraph key={`b-${i}`} content={blk.value} illuminated={illuminated} />;
              }
              return (
                <PlateSection
                  key={`b-${i}`}
                  scene={blk.value}
                  onClick={() => onOpenLightbox({ url: blk.value.imageUrl })}
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
              <div key={m.id} className="sb-memory" role="button" tabIndex={0} onClick={() => onOpenLightbox({ url: m.url })}>
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
                            storybook.deleteJournalEntry(leaf.chapterId, entry.id);
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
                onSubmit={(entry) => storybook.addJournalEntry(leaf.chapterId, entry)}
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

/* ── Leaf variants ──────────────────────────────────────────────────────── */

function BookTitleLeaf({ campaignName, chapterCount }) {
  return (
    <div className="sb-title-leaf" style={{ flex: 1 }}>
      <div className="sb-title-eyebrow">The Chronicle Of</div>
      <h1 className="sb-title">{campaignName || 'the Campaign'}</h1>
      <div className="sb-title-ornament" aria-hidden="true" />
      <div className="sb-title-lozenge" aria-hidden="true" />
      <div className="sb-title-session">
        {chapterCount > 0
          ? `${chapterCount} chapter${chapterCount === 1 ? '' : 's'} bound into this volume.`
          : 'An as-yet-unwritten tome.'}
      </div>
    </div>
  );
}

function ChapterTitleLeaf({ title, chapterNumber, sessionNumber }) {
  return (
    <div className="sb-title-leaf" style={{ flex: 1 }}>
      <div className="sb-title-eyebrow">Chapter {toRoman(chapterNumber)}</div>
      <h1 className="sb-title">{title}</h1>
      <div className="sb-title-ornament" aria-hidden="true" />
      <div className="sb-title-lozenge" aria-hidden="true" />
      {sessionNumber && (
        <div className="sb-title-session">from the chronicle of Session {sessionNumber}</div>
      )}
    </div>
  );
}

function TOCLeaf({ chapters, leafFolio, onJump }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="sb-section-label">Contents</div>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {chapters.map((ch, idx) => (
          <li key={ch.id} style={{ margin: '0.35rem 0' }}>
            <button
              type="button"
              onClick={() => onJump(idx)}
              style={{
                display:'flex', width:'100%',
                alignItems:'baseline', gap:'0.75rem',
                background:'none', border:'none', padding:'0.35rem 0',
                textAlign:'left',
                fontFamily:"'EB Garamond', serif",
                fontSize:'1.02rem',
                color:'var(--sb-ink)',
                cursor:'pointer',
                borderBottom:'1px dotted rgba(110,76,18,0.25)'
              }}
            >
              <span style={{ fontFamily:"'Cinzel', serif", fontSize:'0.72rem', letterSpacing:'0.2em', color:'var(--sb-gilt-deep)', minWidth:'4.5em' }}>
                Ch. {toRoman(ch.chapterNumber)}
              </span>
              <span style={{ flex: 1, fontStyle: 'italic' }}>{ch.title || 'Untitled chapter'}</span>
              <span style={{ fontFamily:"'Cinzel', serif", fontSize:'0.72rem', color:'var(--sb-ink-muted)', letterSpacing:'0.15em' }}>
                {leafFolio?.[idx] ?? '—'}
              </span>
            </button>
          </li>
        ))}
        {chapters.length === 0 && (
          <li style={{ textAlign:'center', fontStyle:'italic', color:'var(--sb-ink-muted)', margin:'2rem 0' }}>
            The chronicler has yet to set down a chapter.
          </li>
        )}
      </ol>
    </div>
  );
}

function ProseParagraph({ content, illuminated }) {
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

/* ── Book-wide leaf builder ──────────────────────────────────────────────── */

function buildBookLeaves({ chapters, journalsByChapter, campaignName }) {
  const leaves = [];
  const chapterStartLeafIndex = [];   // leafIndex where each chapter's title page is
  const chapterStartFolio = [];       // human-facing folio number for TOC

  // 1. Book cover / title page
  leaves.push({
    kind: 'booktitle',
    campaignName,
    chapterCount: chapters.length
  });

  // 2. Table of Contents (populated after we know where each chapter lands)
  const tocLeafIndex = leaves.length;
  leaves.push({ kind: 'toc', chapterFolios: [] }); // placeholder, patched later

  // 3. Each chapter's run of leaves
  chapters.forEach((chapter, chIdx) => {
    const chapterLeaves = buildChapterLeaves({
      chapter,
      chIdx,
      journalEntries: journalsByChapter[chapter.id] || []
    });
    chapterStartLeafIndex.push(leaves.length);
    chapterStartFolio.push(leaves.length + 1); // 1-indexed folio of chapter title
    chapterLeaves.forEach(l => leaves.push(l));
  });

  // Patch the TOC with the computed folios
  leaves[tocLeafIndex] = {
    kind: 'toc',
    chapterFolios: chapterStartFolio
  };

  return { leaves, chapterStartLeafIndex };
}

function buildChapterLeaves({ chapter, chIdx, journalEntries }) {
  const paragraphs = (chapter.prose || '').split(/\n\n+/).filter(p => p.trim());
  const scenes = chapter.scenes || [];
  const spotlights = chapter.spotlights || [];
  const media = chapter.media || [];

  const leaves = [];

  // Title leaf for this chapter
  leaves.push({
    kind: 'title',
    chapterIndex: chIdx,
    title: chapter.title,
    chapterNumber: chapter.chapterNumber,
    sessionNumber: chapter.sessionNumber
  });

  // Flow leaves (prose + inline scenes)
  const stream = [];
  const pCount = paragraphs.length;
  const sCount = scenes.length;
  const sceneBoundaries = new Set();
  if (sCount > 0 && pCount > 0) {
    for (let i = 1; i <= sCount; i++) {
      const after = Math.max(1, Math.min(pCount, Math.floor((i * pCount) / (sCount + 1))));
      sceneBoundaries.add(after);
    }
  }
  let sceneCursor = 0;
  paragraphs.forEach((p, idx) => {
    stream.push({ kind: 'p', value: p });
    if (sceneBoundaries.has(idx + 1) && sceneCursor < sCount) {
      stream.push({ kind: 'scene', value: scenes[sceneCursor++] });
    }
  });
  while (sceneCursor < sCount) stream.push({ kind: 'scene', value: scenes[sceneCursor++] });

  const LEAF_BUDGET = 5;
  let leaf = { kind: 'flow', chapterIndex: chIdx, blocks: [], firstInChapter: true };
  let weight = 0;
  const flush = () => {
    if (leaf.blocks.length) {
      leaves.push(leaf);
      leaf = { kind: 'flow', chapterIndex: chIdx, blocks: [], firstInChapter: false };
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

  if (spotlights.length) leaves.push({ kind: 'personae', chapterIndex: chIdx, spotlights });
  if (media.length) leaves.push({ kind: 'memories', chapterIndex: chIdx, media });

  const JOURNAL_PER_LEAF = 3;
  if (journalEntries.length > 0) {
    for (let i = 0; i < journalEntries.length; i += JOURNAL_PER_LEAF) {
      const chunk = journalEntries.slice(i, i + JOURNAL_PER_LEAF);
      const isLast = i + JOURNAL_PER_LEAF >= journalEntries.length;
      leaves.push({
        kind: 'journal', chapterIndex: chIdx,
        chapterId: chapter.id, entries: chunk, isLastJournal: isLast
      });
    }
  } else {
    leaves.push({
      kind: 'journal', chapterIndex: chIdx,
      chapterId: chapter.id, entries: [], isLastJournal: true
    });
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
