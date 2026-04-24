import { useMemo, useState } from 'react';
import { BookMarked, Wand2, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { useStorybook } from '../../hooks/useStorybook';
import { useAPIKey } from '../../hooks/useAPIKey';
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

  const [editingChapterId, setEditingChapterId] = useState(null);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const editingChapter = useMemo(
    () => storybook.chapters.find(c => c.id === editingChapterId) || null,
    [storybook.chapters, editingChapterId]
  );

  const visibleChapters = useMemo(() => {
    return storybook.chapters.filter(c => isDM || c.status === 'published');
  }, [storybook.chapters, isDM]);

  const pendingCount = storybook.pendingDrafts.length;

  // ── Editor view (DM-only, per-chapter) ────────────────────────────────────
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

  // ── Book view (the primary experience — everyone lands here) ─────────────
  //
  // When there are no chapters yet, show the empty-book state. Otherwise
  // open the single bound book with every published/visible chapter, and
  // float DM controls (Generate / Style / Pending drafts) above the book.

  const hasContent = !storybook.loading && visibleChapters.length > 0;

  return (
    <div className="sb-desk min-h-screen lr-fade-in">
      {/* DM action bar + pending drafts live above the book */}
      {isDM && (pendingCount > 0 || true) && (
        <div className="sb-toolbar" style={{ marginBottom: pendingCount > 0 ? '1rem' : '1.25rem' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:'0.75rem' }}>
            <span className="sb-hero-eyebrow" style={{ letterSpacing: '0.35em' }}>The Chronicle</span>
            <span style={{ fontFamily:"'EB Garamond', serif", fontStyle:'italic', color:'rgba(233,212,170,0.55)' }}>
              {visibleChapters.length} chapter{visibleChapters.length === 1 ? '' : 's'} · {campaign?.name || 'this campaign'}
            </span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
            <button type="button" onClick={() => setIsSettingsOpen(true)} className="sb-toolbar-btn">
              <SettingsIcon size={13} />
              Style
            </button>
            <button type="button" onClick={() => setIsGenerateOpen(true)} className="sb-btn">
              <Wand2 size={14} />
              Scribe a new chapter
            </button>
          </div>
        </div>
      )}

      {isDM && pendingCount > 0 && (
        <div style={{ maxWidth: 1280, margin: '0 auto 1.25rem' }}>
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
        </div>
      )}

      {storybook.loading ? (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'rgba(233, 212, 170, 0.55)', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: '0.78rem' }}>
          <Sparkles className="animate-pulse" size={18} />
          Loading chronicle…
        </div>
      ) : !hasContent ? (
        <EmptyState isDM={isDM} onGenerate={() => setIsGenerateOpen(true)} />
      ) : (
        <ChapterReader
          chapters={visibleChapters}
          campaign={campaign}
          campaignId={campaignId}
          characters={characters}
          isDM={isDM}
          currentUserId={currentUserId}
          storybook={storybook}
          onEditChapter={(chapterId) => setEditingChapterId(chapterId)}
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
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <div className="sb-book-frame" style={{ padding: '0.75rem' }}>
        <div className="sb-spread" style={{ minHeight: 0 }}>
          <div className="sb-leaf sb-leaf--left" style={{ padding: '3rem 2.25rem', minHeight: 'unset' }}>
            <div className="sb-title-leaf" style={{ flex: 1 }}>
              <BookMarked size={40} style={{ color: 'var(--sb-gilt-deep)', margin: '0 auto 1rem', display: 'block' }} />
              <div className="sb-title-eyebrow">An Empty Volume</div>
              <h1 className="sb-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>No chapters bound yet</h1>
              <div className="sb-title-ornament" aria-hidden="true" />
              <p style={{ marginTop: '1.25rem', fontStyle: 'italic', color: 'var(--sb-ink-soft)' }}>
                {isDM
                  ? 'Finalize a session and the chronicler will draft a chapter from its notes — or commission one by hand from any completed session.'
                  : 'The chronicler has yet to set down a chapter. Return after the next session to find the ink dried.'}
              </p>
              {isDM && (
                <div style={{ marginTop: '1.5rem' }}>
                  <button type="button" onClick={onGenerate} className="sb-btn">
                    <Wand2 size={14} />
                    Scribe the first chapter
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="sb-leaf sb-leaf--right" aria-hidden="true" style={{ minHeight: 'unset' }}>
            <div className="sb-head"><span className="sb-head-swash">❦</span><span>&nbsp;</span></div>
            <div style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

