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
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">
            The Chronicle
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-white flex items-center gap-4 font-cinzel">
            <BookMarked className="text-[color:var(--primary)]" size={44} />
            Story So Far
          </h1>
          <p className="text-white/60 text-base max-w-2xl">
            An illustrated chronicle of every session, told in watercolor and ink.
            {visibleChapters.length > 0 && ` ${visibleChapters.length} chapter${visibleChapters.length === 1 ? '' : 's'} recorded.`}
          </p>
        </div>
        {isDM && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06] hover:border-white/20 transition"
            >
              <SettingsIcon size={16} />
              <span className="text-sm font-semibold">Style settings</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGenerateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-white transition"
              style={{
                background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                borderColor: 'color-mix(in srgb, var(--primary) 40%, transparent)'
              }}
            >
              <Wand2 size={16} />
              <span className="text-sm font-bold">Generate chapter</span>
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
    <div
      className="text-center py-20 px-6 rounded-3xl border"
      style={{
        background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
        borderColor: 'var(--line)'
      }}
    >
      <BookMarked size={56} className="mx-auto mb-4 text-white/30" />
      <h3 className="text-xl font-bold text-white/90 mb-2 font-cinzel">No chapters yet</h3>
      <p className="text-white/50 max-w-md mx-auto">
        {isDM
          ? 'Finalize a session to get an auto-drafted chapter, or generate one manually. The AI turns your session notes into illustrated prose.'
          : 'Your GM hasn’t published any chapters of the chronicle yet. Check back after the next session.'}
      </p>
      {isDM && (
        <button
          type="button"
          onClick={onGenerate}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold transition"
          style={{
            background: 'color-mix(in srgb, var(--primary) 25%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 45%, transparent)'
          }}
        >
          <Wand2 size={16} />
          Generate your first chapter
        </button>
      )}
    </div>
  );
}
