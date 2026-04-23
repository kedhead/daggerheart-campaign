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
    <div className="min-h-screen p-6 space-y-8 lr-fade-in" style={{ background: '#1e1a14', fontFamily: 'var(--font-body)' }}>
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 relative"
        style={{ borderBottom: '1px solid rgba(196, 154, 60, 0.2)' }}
      >
        <div className="space-y-2 relative z-10">
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#c49a3c' }}>
            The Chronicle
          </span>
          <h1 className="text-3xl md:text-5xl font-bold flex items-center gap-4" style={{ fontFamily: "'Cinzel', serif", color: '#d4c5a0' }}>
            <BookMarked style={{ color: '#c49a3c' }} size={44} />
            Story So Far
          </h1>
          <p className="text-base max-w-2xl" style={{ fontFamily: "'EB Garamond', 'Crimson Pro', serif", color: '#a0926e' }}>
            An illustrated chronicle of every session, told in watercolor and ink.
            {visibleChapters.length > 0 && ` ${visibleChapters.length} chapter${visibleChapters.length === 1 ? '' : 's'} recorded.`}
          </p>
        </div>
        {isDM && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition"
              style={{
                background: 'rgba(196, 154, 60, 0.08)',
                border: '1px solid rgba(196, 154, 60, 0.2)',
                color: '#a0926e',
                fontFamily: "'Cinzel', serif",
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              <SettingsIcon size={16} />
              <span>Style settings</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGenerateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition"
              style={{
                background: 'rgba(196, 154, 60, 0.15)',
                border: '1px solid rgba(196, 154, 60, 0.35)',
                color: '#c49a3c',
                fontFamily: "'Cinzel', serif",
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}
            >
              <Wand2 size={16} />
              <span>Generate chapter</span>
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
        <div className="flex items-center justify-center py-20" style={{ color: '#6e6348' }}>
          <Sparkles className="animate-pulse" size={20} />
          <span className="ml-3 text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>Loading chronicle…</span>
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
    <div
      className="text-center py-20 px-6 rounded-lg"
      style={{
        background: '#2a2419',
        border: '2px solid rgba(196, 154, 60, 0.15)'
      }}
    >
      <BookMarked size={56} className="mx-auto mb-4" style={{ color: '#6e6348' }} />
      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Cinzel', serif", color: '#d4c5a0' }}>No chapters yet</h3>
      <p className="max-w-md mx-auto" style={{ color: '#a0926e', fontFamily: "'EB Garamond', 'Crimson Pro', serif" }}>
        {isDM
          ? 'Finalize a session to get an auto-drafted chapter, or generate one manually. The AI turns your session notes into illustrated prose.'
          : "Your GM hasn't published any chapters of the chronicle yet. Check back after the next session."}
      </p>
      {isDM && (
        <button
          type="button"
          onClick={onGenerate}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition"
          style={{
            background: 'rgba(196, 154, 60, 0.15)',
            border: '1px solid rgba(196, 154, 60, 0.3)',
            color: '#c49a3c',
            fontFamily: "'Cinzel', serif",
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}
        >
          <Wand2 size={16} />
          Generate your first chapter
        </button>
      )}
    </div>
  );
}

