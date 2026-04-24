import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Edit3, Feather, Trash2, Film, Mic, Send } from 'lucide-react';
import MediaLightbox from './MediaLightbox';
import { useChapterJournal } from '../../hooks/useStorybook';

export default function ChapterReader({
  chapter,
  campaignId,
  campaign,
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

  const paragraphs = useMemo(
    () => (chapter.prose || '').split(/\n\n+/).filter(p => p.trim()),
    [chapter.prose]
  );

  const scenes = chapter.scenes || [];
  const spotlights = chapter.spotlights || [];
  const media = chapter.media || [];

  const allVisuals = useMemo(() => {
    return [
      ...scenes.map(s => ({ id: s.id, kind: 'image', url: s.imageUrl, caption: s.caption })),
      ...media
    ];
  }, [scenes, media]);

  const openLightbox = (item) => {
    const idx = allVisuals.findIndex(v => v.id === item.id || v.url === item.url);
    setLightboxIndex(Math.max(0, idx));
    setLightboxItems(allVisuals);
  };
  const navigateLightbox = (delta) => {
    if (!lightboxItems) return;
    setLightboxIndex((lightboxIndex + delta + lightboxItems.length) % lightboxItems.length);
  };

  // Interleave scenes evenly between paragraphs
  const body = [];
  paragraphs.forEach((p, i) => {
    body.push(
      <div key={`p-${i}`} className="sb-para">
        <ReactMarkdown>{p}</ReactMarkdown>
      </div>
    );
    const nextIdx = Math.floor((i + 1) * (scenes.length / Math.max(paragraphs.length, 1)));
    const prevIdx = Math.floor(i * (scenes.length / Math.max(paragraphs.length, 1)));
    if (nextIdx > prevIdx && scenes[nextIdx - 1]) {
      const sc = scenes[nextIdx - 1];
      body.push(<Plate key={`pl-${sc.id}`} scene={sc} onClick={() => openLightbox(sc)} />);
    }
  });
  const shown = body.filter(n => n.key?.startsWith('pl-')).length;
  scenes.slice(shown).forEach(sc => {
    body.push(<Plate key={`pl-${sc.id}`} scene={sc} onClick={() => openLightbox(sc)} />);
  });

  return (
    <div className="sb-room">
      <div className="sb-room-header">
        <button type="button" className="sb-backlink" onClick={onBack}>
          <ArrowLeft size={14} /> Close the book
        </button>
        {isDM && (
          <button type="button" className="sb-backlink" onClick={onEdit}>
            <Edit3 size={14} /> Edit chapter
          </button>
        )}
      </div>

      <article className="sb-page">
        <span className="sb-eyebrow">
          Chapter {toRoman(chapter.chapterNumber)}
          {chapter.sessionNumber ? ` · Session ${chapter.sessionNumber}` : ''}
        </span>
        <h1 className="sb-title">{chapter.title}</h1>
        <div className="sb-fleuron" aria-hidden="true" />

        <div className="sb-body">
          {body.length > 0 ? body : <p className="sb-para" style={{ textAlign: 'center' }}>No prose yet.</p>}
        </div>

        {spotlights.length > 0 && (
          <>
            <div className="sb-rule" aria-hidden="true" />
            <h2 className="sb-personae-title">Dramatis Personae</h2>
            <div className="sb-personae-grid">
              {spotlights.map(s => (
                <div key={`${s.entityType}-${s.entityId}`} className="sb-persona">
                  <div className="sb-persona-avatar">
                    {s.portraitUrl
                      ? <img src={s.portraitUrl} alt={s.name} />
                      : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', color:'#5c3b16', fontFamily:'Cinzel', fontWeight:700 }}>{(s.name||'?').slice(0,1)}</div>}
                  </div>
                  <div className="sb-persona-body">
                    <div className="sb-persona-name">{s.name}</div>
                    <div className="sb-persona-kind">{s.entityType}</div>
                    {s.moment && <div className="sb-persona-moment">{s.moment}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {media.length > 0 && (
          <>
            <div className="sb-rule" aria-hidden="true" />
            <h2 className="sb-personae-title">Table Memories</h2>
            <div className="sb-memories-grid">
              {media.map(m => (
                <div key={m.id} className="sb-memory" onClick={() => openLightbox(m)} role="button" tabIndex={0}>
                  {m.kind === 'image' && <img src={m.url} alt={m.caption || ''} />}
                  {m.kind === 'video' && (
                    <div className="sb-memory-placeholder"><Film size={28} /></div>
                  )}
                  {m.kind === 'audio' && (
                    <div className="sb-memory-placeholder"><Mic size={28} /></div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="sb-rule" aria-hidden="true" />
        <h2 className="sb-personae-title">
          <Feather size={14} style={{ display:'inline', marginRight:'0.5rem', verticalAlign:'-2px' }} />
          In-Character Journal
        </h2>

        {journalEntries.length === 0
          ? <p style={{ textAlign:'center', fontStyle:'italic', color:'#8b5a24', margin:'0 0 1.25rem' }}>The page awaits the first voice.</p>
          : (
            <div style={{ marginBottom: '1.25rem' }}>
              {journalEntries.map(entry => (
                <div key={entry.id} className="sb-journal-entry">
                  <div className="sb-journal-head">
                    <span className="sb-journal-name">{entry.characterName || entry.authorName}</span>
                    {entry.characterName && <span className="sb-journal-author">— {entry.authorName}</span>}
                    {(entry.authorId === currentUserId || isDM) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this journal entry?')) {
                            storybook.deleteJournalEntry(chapter.id, entry.id);
                          }
                        }}
                        style={{ marginLeft:'auto', background:'transparent', border:'none', color:'#8b5a24', cursor:'pointer' }}
                        aria-label="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="sb-journal-body">
                    <ReactMarkdown>{entry.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {currentUserId && (
          <JournalComposer
            characters={characters}
            currentUserId={currentUserId}
            onSubmit={(entry) => storybook.addJournalEntry(chapter.id, entry)}
          />
        )}
      </article>

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

function Plate({ scene, onClick }) {
  return (
    <figure className="sb-plate" onClick={onClick}>
      <img src={scene.imageUrl} alt={scene.caption || ''} />
      {scene.caption && <figcaption className="sb-plate-caption">{scene.caption}</figcaption>}
    </figure>
  );
}

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
          <label style={{ fontVariant:'small-caps', letterSpacing:'0.2em', fontSize:'0.75rem', color:'#6b4a22', marginRight:'0.5rem' }}>
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
        placeholder={selected ? `What did ${selected.name} feel, remember, or fear?` : 'Pen an entry to this chapter…'}
      />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.75rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <span style={{ fontFamily:'Cinzel', fontVariant:'small-caps', letterSpacing:'0.18em', fontSize:'0.7rem', color:'#6b4a22' }}>
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
