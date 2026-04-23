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
          className="storybook-scene-figure"
          onClick={() => openLightbox(scene)}
        >
          <img src={scene.imageUrl} alt={scene.caption} />
          {scene.caption && (
            <figcaption className="storybook-scene-caption">
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
        className="storybook-scene-figure"
        onClick={() => openLightbox(scene)}
      >
        <img src={scene.imageUrl} alt={scene.caption} />
        {scene.caption && (
          <figcaption className="storybook-scene-caption">
            {scene.caption}
          </figcaption>
        )}
      </figure>
    );
  });

  return (
    <div className="storybook-page max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Toolbar */}
      <header className="storybook-toolbar flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="storybook-back-btn self-start"
        >
          <ArrowLeft size={14} /> Back to Chronicle
        </button>
        <div className="flex flex-wrap gap-2">
          {isDM && (
            <button
              type="button"
              onClick={onEdit}
              className="storybook-edit-btn"
            >
              <Edit3 size={13} /> Edit
            </button>
          )}
        </div>
      </header>

      {/* Chapter Title */}
      <div className="storybook-chapter-header">
        <span className="storybook-chapter-label">
          Chapter {chapter.chapterNumber}{chapter.sessionNumber ? ` · Session ${chapter.sessionNumber}` : ''}
        </span>
        <h1 className="storybook-chapter-title">
          {chapter.title}
        </h1>
        <div className="storybook-ornament">
          <div className="storybook-ornament-diamond" />
        </div>
      </div>

      {/* Body: prose + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <article className="storybook-article space-y-4">
          {renderedBody.length > 0 ? renderedBody : <p style={{ color: 'var(--parchment-muted)' }}>No prose yet.</p>}
        </article>

        <aside className="space-y-6">
          {/* Featured Cast */}
          {chapter.spotlights?.length > 0 && (
            <section>
              <h3 className="storybook-sidebar-heading">
                Featured Cast
              </h3>
              <ul className="space-y-3">
                {chapter.spotlights.map(s => (
                  <li
                    key={`${s.entityType}-${s.entityId}`}
                    className="storybook-spotlight-card"
                  >
                    <div className="storybook-spotlight-portrait">
                      {s.portraitUrl ? (
                        <img src={s.portraitUrl} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--parchment-dim)' }}>
                          {(s.name || '?').slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="storybook-spotlight-name">{s.name}</div>
                      <div className="storybook-spotlight-type">
                        {s.entityType}
                      </div>
                      {s.moment && (
                        <p className="storybook-spotlight-moment">{s.moment}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Table Memories */}
          {media.length > 0 && (
            <section>
              <h3 className="storybook-sidebar-heading">
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

      {/* Journal */}
      <section className="storybook-journal-section space-y-4">
        <h3 className="storybook-sidebar-heading">
          <Feather size={12} /> In-Character Journal
        </h3>

        {journalEntries.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--parchment-dim)' }}>No journal entries yet. Be the first to share your character's thoughts.</p>
        ) : (
          <ul className="space-y-3">
            {journalEntries.map(entry => (
              <li
                key={entry.id}
                className="storybook-journal-entry"
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="storybook-journal-author">
                    {entry.characterName || entry.authorName}
                  </span>
                  {entry.characterName && (
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--parchment-dim)' }}>
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
                      className="ml-auto hover:text-red-400"
                      style={{ color: 'var(--parchment-dim)' }}
                      aria-label="Delete entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="storybook-prose text-sm">
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
    if (item.kind === 'audio') return <div className="w-full h-full flex items-center justify-center text-xs font-semibold" style={{ color: 'var(--parchment-muted)' }}>Audio</div>;
    return <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />;
  })();
  return (
    <button
      type="button"
      onClick={onClick}
      className="storybook-media-thumb"
    >
      {preview}
    </button>
  );
}
