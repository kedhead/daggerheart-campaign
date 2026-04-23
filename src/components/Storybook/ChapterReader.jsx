import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Edit3, Image as ImageIcon, Feather, Trash2 } from 'lucide-react';
import MediaLightbox from './MediaLightbox';
import JournalEntryForm from './JournalEntryForm';
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

  // Split prose into paragraphs and interleave with scene images
  const paragraphs = useMemo(() => {
    return (chapter.prose || '').split(/\n\n+/).filter(p => p.trim());
  }, [chapter.prose]);

  const scenes = chapter.scenes || [];
  const media = chapter.media || [];

  // All clickable visuals, for the lightbox
  const allVisuals = useMemo(() => {
    return [
      ...scenes.map(s => ({ id: s.id, kind: 'image', url: s.imageUrl, caption: s.caption })),
      ...media
    ];
  }, [scenes, media]);

  const openLightbox = (item) => {
    const index = allVisuals.findIndex(v => v.id === item.id || v.url === item.url);
    setLightboxIndex(Math.max(0, index));
    setLightboxItems(allVisuals);
  };

  const handleNavigate = (delta) => {
    if (!lightboxItems) return;
    const next = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    setLightboxIndex(next);
  };

  const handleSubmitJournal = async (entry) => {
    await storybook.addJournalEntry(chapter.id, entry);
  };

  // Distribute scenes between paragraphs
  const renderedBody = [];
  paragraphs.forEach((p, i) => {
    renderedBody.push(
      <div key={`p-${i}`} className="storybook-prose">
        <ReactMarkdown>{p}</ReactMarkdown>
      </div>
    );
    const sceneIndex = Math.floor((i + 1) * (scenes.length / Math.max(paragraphs.length, 1)));
    const prevIndex = Math.floor(i * (scenes.length / Math.max(paragraphs.length, 1)));
    if (sceneIndex > prevIndex && scenes[sceneIndex - 1]) {
      const scene = scenes[sceneIndex - 1];
      renderedBody.push(
        <figure
          key={`scene-${scene.id}`}
          className="my-8 rounded-2xl overflow-hidden border cursor-zoom-in"
          style={{ borderColor: 'var(--line-strong)' }}
          onClick={() => openLightbox(scene)}
        >
          <img src={scene.imageUrl} alt={scene.caption} className="w-full h-auto" />
          {scene.caption && (
            <figcaption
              className="px-5 py-3 text-sm italic"
              style={{ color: 'var(--text-muted)', background: 'color-mix(in srgb, var(--surface) 70%, transparent)' }}
            >
              {scene.caption}
            </figcaption>
          )}
        </figure>
      );
    }
  });

  // Append any scenes that were not yet shown
  const shownSceneCount = renderedBody.filter(n => n.key?.startsWith('scene-')).length;
  scenes.slice(shownSceneCount).forEach(scene => {
    renderedBody.push(
      <figure
        key={`scene-${scene.id}`}
        className="my-8 rounded-2xl overflow-hidden border cursor-zoom-in"
        style={{ borderColor: 'var(--line-strong)' }}
        onClick={() => openLightbox(scene)}
      >
        <img src={scene.imageUrl} alt={scene.caption} className="w-full h-auto" />
        {scene.caption && (
          <figcaption
            className="px-5 py-3 text-sm italic"
            style={{ color: 'var(--text-muted)', background: 'color-mix(in srgb, var(--surface) 70%, transparent)' }}
          >
            {scene.caption}
          </figcaption>
        )}
      </figure>
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 lr-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6" style={{ borderBottom: '1px solid var(--line)' }}>
        <button
          type="button"
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back to Chronicle
        </button>
        <div className="flex flex-wrap gap-2">
          {isDM && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 text-sm font-semibold"
            >
              <Edit3 size={14} /> Edit
            </button>
          )}
        </div>
      </header>

      <div className="text-center space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">
          Chapter {chapter.chapterNumber}{chapter.sessionNumber ? ` • Session ${chapter.sessionNumber}` : ''}
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white font-cinzel leading-tight">
          {chapter.title}
        </h1>
        <div className="mx-auto h-[2px] w-20 rounded-full" style={{ background: 'var(--accent)' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <article className="space-y-4 storybook-article" style={{ fontFamily: 'var(--font-body)', color: 'var(--text)' }}>
          {renderedBody.length > 0 ? renderedBody : <p className="text-white/50">No prose yet.</p>}
        </article>

        <aside className="space-y-6">
          {chapter.spotlights?.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3">
                Featured Cast
              </h3>
              <ul className="space-y-3">
                {chapter.spotlights.map(s => (
                  <li
                    key={`${s.entityType}-${s.entityId}`}
                    className="flex gap-3 p-3 rounded-xl border"
                    style={{
                      background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
                      borderColor: 'var(--line)'
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ background: 'var(--surface-hi)' }}
                    >
                      {s.portraitUrl ? (
                        <img src={s.portraitUrl} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                          {(s.name || '?').slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white font-cinzel">{s.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                        {s.entityType}
                      </div>
                      {s.moment && (
                        <p className="text-xs text-white/70 leading-snug">{s.moment}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {media.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 mb-3 flex items-center gap-2">
                <ImageIcon size={12} /> Table Memories
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {media.map(m => (
                  <MediaThumb key={m.id} item={m} onClick={() => openLightbox(m)} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="space-y-4 pt-8" style={{ borderTop: '1px solid var(--line)' }}>
        <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40 flex items-center gap-2">
          <Feather size={12} /> In-Character Journal
        </h3>

        {journalEntries.length === 0 ? (
          <p className="text-sm text-white/40 italic">No journal entries yet. Be the first to share your character's thoughts.</p>
        ) : (
          <ul className="space-y-3">
            {journalEntries.map(entry => (
              <li
                key={entry.id}
                className="p-4 rounded-xl border"
                style={{
                  background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
                  borderColor: 'var(--line)'
                }}
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-bold text-white font-cinzel">
                    {entry.characterName || entry.authorName}
                  </span>
                  {entry.characterName && (
                    <span className="text-[10px] uppercase tracking-widest text-white/30">
                      ({entry.authorName})
                    </span>
                  )}
                  {(entry.authorId === currentUserId || isDM) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this journal entry?')) {
                          storybook.deleteJournalEntry(chapter.id, entry.id);
                        }
                      }}
                      className="ml-auto text-white/30 hover:text-red-400"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="storybook-prose text-sm" style={{ color: 'var(--text)' }}>
                  <ReactMarkdown>{entry.content}</ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        )}

        {currentUserId && (
          <JournalEntryForm
            characters={characters}
            currentUserId={currentUserId}
            onSubmit={handleSubmitJournal}
          />
        )}
      </section>

      {lightboxItems && (
        <MediaLightbox
          items={lightboxItems}
          index={lightboxIndex}
          onClose={() => setLightboxItems(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

function MediaThumb({ item, onClick }) {
  const preview = (() => {
    if (item.kind === 'video') return <video src={item.url} className="w-full h-full object-cover" />;
    if (item.kind === 'audio') return <div className="w-full h-full flex items-center justify-center text-white/60 text-xs font-semibold">Audio</div>;
    return <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />;
  })();
  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square rounded-lg overflow-hidden border cursor-zoom-in"
      style={{ borderColor: 'var(--line)' }}
    >
      {preview}
    </button>
  );
}
