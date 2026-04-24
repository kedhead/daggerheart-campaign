import { useMemo, useState } from 'react';
import { BookMarked, Wand2, Settings as SettingsIcon, Sparkles, ArrowLeft } from 'lucide-react';
import { useStorybook } from '../../hooks/useStorybook';
import { useAPIKey } from '../../hooks/useAPIKey';
import ChapterList from './ChapterList';
import ChapterReader from './ChapterReader';
import ChapterEditor from './ChapterEditor';
import GenerateChapterModal from './GenerateChapterModal';
import StorybookSettingsPanel from './StorybookSettingsPanel';
import PendingDraftBanner from './PendingDraftBanner';
import './Storybook.css';

export default function StorybookView({
  campaign,
  campaignId,
  sessions = [],
  characters = [],
  npcs = [],
  adversaries = [],
  locations = [],
  lore = [],
  encounters = [],
  campaignFrame = null,
  updateCampaign,
  isDM,
  currentUserId
}) {
  const storybook = useStorybook(campaignId, isDM);
  const { keys } = useAPIKey(campaign?.createdBy);
  const openaiKey = keys?.openai || null;

  const [activeChapterId, setActiveChapterId] = useState(null);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activeChapter = useMemo(
    () => storybook.chapters.find(c => c.id === activeChapterId) || null,
    [storybook.chapters, activeChapterId]
  );
  const editingChapter = useMemo(
    () => storybook.chapters.find(c => c.id === editingChapterId) || null,
    [storybook.chapters, editingChapterId]
  );

  const visibleChapters = useMemo(() => {
    return storybook.chapters.filter(c => isDM || c.status === 'published');
  }, [storybook.chapters, isDM]);

  const pendingCount = storybook.pendingDrafts.length;

  // ── Reader view ────────────────────────────────────────────────────────────
  if (activeChapter) {
    return (
      <ChapterReader
        chapter={activeChapter}
        campaignId={campaignId}
        campaign={campaign}
        characters={characters}
        npcs={npcs}
        adversaries={adversaries}
        isDM={isDM}
        currentUserId={currentUserId}
        storybook={storybook}
        onBack={() => setActiveChapterId(null)}
        onEdit={() => {
          setEditingChapterId(activeChapter.id);
          setActiveChapterId(null);
        }}
      />
    );
  }

  // ── Editor view ────────────────────────────────────────────────────────────
  if (editingChapter) {
    return (
      <ChapterEditor
        chapter={editingChapter}
        campaignId={campaignId}
        campaign={campaign}
        characters={characters}
        npcs={npcs}
        adversaries={adversaries}
        storybook={storybook}
        apiKey={openaiKey}
        onBack={() => setEditingChapterId(null)}
        onView={() => {
          setActiveChapterId(editingChapter.id);
          setEditingChapterId(null);
        }}
      />
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 lr-fade-in" style={{ fontFamily: 'var(--font-body)' }}>
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 relative"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="space-y-2 relative z-10">
          <span style={{
            fontFamily: 'Cinzel, serif', fontVariant: 'small-caps',
            letterSpacing: '0.4em', fontSize: '0.75rem', color: 'rgba(242,227,191,0.5)'
          }}>
            The Chronicle
          </span>
          <h1 className="sb-hero-title flex items-center gap-4">
            <BookMarked className="text-[color:var(--primary)]" size={40} />
            Story So Far
          </h1>
          <p className="sb-hero-sub">
            An illustrated chronicle of every session, set down in watercolour and ink.
            {visibleChapters.length > 0 && ` ${visibleChapters.length} chapter${visibleChapters.length === 1 ? '' : 's'} bound so far.`}
          </p>
        </div>
        {isDM && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="sb-btn sb-btn-ghost"
              style={{ color: 'rgba(242,227,191,0.8)', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(242,227,191,0.25)' }}
            >
              <SettingsIcon size={14} />
              Style
            </button>
            <button
              type="button"
              onClick={() => setIsGenerateOpen(true)}
              className="sb-btn"
            >
              <Wand2 size={14} />
              Scribe a new chapter
            </button>
          </div>
        )}
      </div>

      {isDM && pendingCount > 0 && (
        <PendingDraftBanner
          drafts={storybook.pendingDrafts}
          onReview={(chapterId) => setEditingChapterId(chapterId)}
          onApprove={(chapterId) => storybook.publishChapter(chapterId)}
          onDiscard={(chapterId) => {
            if (window.confirm('Discard this auto-draft? The chapter will be permanently deleted.')) {
              storybook.deleteChapter(chapterId);
            }
          }}
        />
      )}

      {storybook.loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Sparkles className="animate-pulse" size={20} />
          <span className="ml-3 text-sm font-semibold uppercase tracking-wider">Loading chronicle…</span>
        </div>
      ) : visibleChapters.length === 0 ? (
        <EmptyState isDM={isDM} onGenerate={() => setIsGenerateOpen(true)} />
      ) : (
        <ChapterList
          chapters={visibleChapters}
          isDM={isDM}
          onOpen={(id) => setActiveChapterId(id)}
          onEdit={(id) => setEditingChapterId(id)}
        />
      )}

      {isGenerateOpen && (
        <GenerateChapterModal
          isOpen={isGenerateOpen}
          onClose={() => setIsGenerateOpen(false)}
          campaign={campaign}
          campaignId={campaignId}
          sessions={sessions}
          characters={characters}
          npcs={npcs}
          adversaries={adversaries}
          locations={locations}
          lore={lore}
          encounters={encounters}
          campaignFrame={campaignFrame}
          priorChapters={storybook.chapters}
          apiKey={openaiKey}
          currentUserId={currentUserId}
          addChapter={storybook.addChapter}
        />
      )}

      {isSettingsOpen && (
        <StorybookSettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          campaign={campaign}
          updateCampaign={updateCampaign}
        />
      )}
    </div>
  );
}

function EmptyState({ isDM, onGenerate }) {
  return (
    <div className="sb-room" style={{ padding: '3rem 1rem 5rem' }}>
      <div className="sb-page" style={{ textAlign: 'center' }}>
        <BookMarked size={48} style={{ margin: '0 auto 1rem', color: '#8b5a24' }} />
        <span className="sb-eyebrow">An Empty Volume</span>
        <h2 className="sb-title" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)' }}>
          No chapters bound yet
        </h2>
        <div className="sb-fleuron" aria-hidden="true" />
        <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#4a2f14', maxWidth: '48ch', margin: '0 auto' }}>
          {isDM
            ? 'Finish a session and the chronicler will draft a chapter from the notes. You can also commission one by hand from any completed session.'
            : 'The chronicler has not yet set down any chapter. Return after the next session to find the ink dried.'}
        </p>
        {isDM && (
          <div style={{ marginTop: '1.75rem' }}>
            <button type="button" className="sb-btn" onClick={onGenerate}>
              <Wand2 size={14} />
              Scribe the first chapter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
