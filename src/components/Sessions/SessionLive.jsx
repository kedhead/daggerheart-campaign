import { useState, useMemo } from 'react';
import { Radio, Square, Star, Copy, Trash2, ArrowLeft, FileText, CheckCircle, Sparkles, Loader2, UserPlus, MapPin } from 'lucide-react';
import { useSessionLive } from '../../hooks/useSessionLive';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import { useWakeLock } from '../../hooks/useWakeLock';
import { autoLinkText } from '../../utils/autoLinkText';
import { TRANSCRIPTION_NOTE_PREFIX, starredHighlights, mergeHighlights, unresolvedLinks } from '../../utils/campaignMemory';
import { useAPIKey } from '../../hooks/useAPIKey';
import { summarizeSessionNotes } from '../../services/sessionSummaryGenerator';
import LiveNoteInput from './LiveNoteInput';
import LiveNoteFeed from './LiveNoteFeed';
import LiveTranscriptionPanel from './LiveTranscriptionPanel';
import Modal from '../Modal';
import './SessionLive.css';

export default function SessionLive({
  session,
  campaign,
  campaignId,
  campaignFrame,
  campaignContext = '',
  isDM,
  currentUserId,
  entities,
  onUpdateSession,
  onCreateEntity,
  onBack
}) {
  const {
    liveNotes,
    highlightedNotes,
    noteCount,
    highlightCount,
    loading,
    addLiveNote,
    toggleHighlight,
    deleteNote,
    clearAllNotes,
    archiveAllNotes,
    compileHighlights
  } = useSessionLive(campaignId, session?.id, isDM);

  const { getByName } = useEntityRegistry(campaign, entities, isDM);
  // A live session runs for hours; don't let the note-taker's screen sleep.
  useWakeLock(true);
  // The recap links the names that have pages. Only people, places and lore:
  // linking every session title and encounter name that happens to appear in
  // the prose would bury the links that matter.
  const linkNames = useMemo(() => [
    ...(entities?.npcs || []).map(n => n.name),
    ...(entities?.locations || []).map(l => l.name),
    ...(entities?.lore || []).map(l => l.title),
  ].filter(Boolean), [entities?.npcs, entities?.locations, entities?.lore]);

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [compiledSummary, setCompiledSummary] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState(null);
  const [keepHighlights, setKeepHighlights] = useState(true);
  const [creating, setCreating] = useState(null);
  const [createError, setCreateError] = useState(null);

  const starred = useMemo(() => starredHighlights(highlightedNotes), [highlightedNotes]);
  // Names someone deliberately [[linked]] that have no page yet.
  const missingPages = useMemo(
    () => unresolvedLinks([compiledSummary], (name) => getByName(name)),
    [compiledSummary, getByName]
  );

  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);

  const resolveProvider = () => {
    for (const provider of ['anthropic', 'openai']) {
      const { key } = getEffectiveKey(provider);
      if (key) return { provider, apiKey: key };
    }
    // No client key — let the server fall back to its own env vars.
    return { provider: 'anthropic', apiKey: '' };
  };

  const handleAISummarize = async () => {
    setIsSummarizing(true);
    setSummarizeError(null);
    try {
      const { provider, apiKey } = resolveProvider();
      const polished = await summarizeSessionNotes({
        rawNotes: compiledSummary,
        campaignContext,
        gameSystem: campaign?.gameSystem || 'daggerheart',
        apiKey,
        provider
      });
      setCompiledSummary(autoLinkText(polished, linkNames));
    } catch (err) {
      setSummarizeError(err.message || 'Summarization failed.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddNote = async (content, isHighlight) => {
    await addLiveNote(content, isHighlight);
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Delete this note?')) {
      await deleteNote(noteId);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all notes? This cannot be undone.')) {
      await clearAllNotes();
    }
  };

  const handleOpenFinalize = () => {
    const summary = compileHighlights();
    setCompiledSummary(autoLinkText(summary, linkNames));
    setCreateError(null);
    setShowFinalizeModal(true);
  };

  const handleCreateEntity = async (kind, name) => {
    if (!onCreateEntity) return;
    setCreating(`${kind}:${name}`);
    setCreateError(null);
    try {
      await onCreateEntity(kind, name);
    } catch (err) {
      setCreateError(`Couldn't create ${name}: ${err.message || 'unknown error'}`);
    } finally {
      setCreating(null);
    }
  };

  const handleFinalize = async () => {
    if (!onUpdateSession) return;

    setIsFinalizing(true);

    // Append compiled notes to session summary
    const existingSummary = session.summary || '';
    const divider = existingSummary ? '\n\n--- Live Notes ---\n\n' : '';
    const newSummary = existingSummary + divider + compiledSummary;

    const updates = {
      summary: newSummary,
      isLive: false,
      liveEndedAt: new Date().toISOString(),
      status: 'completed'
    };
    if (keepHighlights && starred.length > 0) {
      updates.highlights = mergeHighlights(session.highlights, starred);
    }
    await onUpdateSession(session.id, updates);

    // Finalizing used to also start a Story So Far chapter in the background.
    // It ran for minutes writing nothing, so DMs generated the same session by
    // hand and ended up with two chapters — see storybookGenerator.js. Write
    // the chapter from Story So Far when you want one.

    // Keep the notes, archived. They used to be deleted here — players'
    // included — so anything the recap left out was lost.
    if (isDM) {
      await archiveAllNotes();
    }

    setIsFinalizing(false);
    setShowFinalizeModal(false);
    onBack();
  };

  const handleEndSession = async () => {
    if (window.confirm('End live session without saving notes to summary?')) {
      if (onUpdateSession) {
        await onUpdateSession(session.id, {
          isLive: false,
          liveEndedAt: new Date().toISOString()
        });
      }
      onBack();
    }
  };

  const handleCopyNotes = () => {
    const text = liveNotes.map(n => `[${n.authorName}] ${n.content}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/50">
        <p>No session selected</p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] rounded-xl overflow-hidden shadow-2xl border border-white/5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-[var(--bg-secondary)] border-b border-white/5 gap-4 md:gap-0">
        <div className="flex items-center gap-4">
          <button
            className="p-2 -ml-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            onClick={onBack}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-xs font-bold tracking-wider w-fit animate-pulse">
              <Radio size={12} />
              <span>LIVE</span>
            </div>
            <h2 className="text-xl font-bold text-white m-0 font-cinzel">{session.title}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 text-sm text-white/60">
              <FileText size={14} />
              {noteCount} notes
            </span>
            <span className="flex items-center gap-1.5 text-sm text-amber-500/80 font-medium">
              <Star size={14} />
              {highlightCount} highlights
            </span>
          </div>

          <div className="flex gap-2">
            {noteCount > 0 && (
              <button
                className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors relative group"
                onClick={handleCopyNotes}
                title="Copy all notes"
              >
                <Copy size={18} />
                <span className="sr-only">Copy Notes</span>
              </button>
            )}

            {isDM && noteCount > 0 && (
              <button
                className="p-2 rounded-md text-white/60 hover:text-red-400 hover:bg-white/10 transition-colors"
                onClick={handleClearAll}
                title="Clear all notes"
              >
                <Trash2 size={18} />
                <span className="sr-only">Clear All Notes</span>
              </button>
            )}

            {isDM && (
              <div className="flex gap-2 ml-2 pl-2 border-l border-white/10">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleEndSession}
                  title="End without saving"
                >
                  <Square size={16} />
                  <span className="hidden sm:inline">End</span>
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenFinalize}
                  disabled={noteCount === 0}
                >
                  <CheckCircle size={16} />
                  <span className="hidden sm:inline">Finalize</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isDM && (
        <div className="px-4 pt-4 shrink-0">
          <LiveTranscriptionPanel 
            onNotesGenerated={(notes) => handleAddNote(`${TRANSCRIPTION_NOTE_PREFIX}\n\n${notes}`, true)}
          />
        </div>
      )}

      <LiveNoteFeed
        notes={liveNotes}
        currentUserId={currentUserId}
        isDM={isDM}
        onToggleHighlight={toggleHighlight}
        onDeleteNote={handleDeleteNote}
        entities={entities}
        campaign={campaign}
      />

      <LiveNoteInput
        onSubmit={handleAddNote}
        disabled={loading}
      />

      {/* Finalize Modal */}
      <Modal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        title="Finalize Session Notes"
        size="large"
      >
        <div className="flex flex-col gap-5">
          <p className="text-white/70 m-0">
            Review the compiled notes below. {highlightCount > 0
              ? <span className="text-amber-400">Showing {highlightCount} highlighted notes.</span>
              : 'Showing all notes (no highlights were marked).'}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-white/60">Session Summary Preview</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-2"
                onClick={handleAISummarize}
                disabled={isSummarizing || !compiledSummary.trim()}
                title="Turn these notes into a polished narrative summary — grounded strictly in what's written here"
              >
                {isSummarizing ? (
                  <><Loader2 size={14} className="animate-spin" /> Summarizing…</>
                ) : (
                  <><Sparkles size={14} /> Summarize with AI</>
                )}
              </button>
            </div>
            {summarizeError && (
              <p className="text-sm text-red-400 m-0">{summarizeError}</p>
            )}
            <textarea
              value={compiledSummary}
              onChange={(e) => setCompiledSummary(e.target.value)}
              rows={12}
              placeholder="Edit the summary before saving..."
              className="w-full p-4 bg-[var(--bg-secondary)] border border-white/10 rounded-lg text-[0.95rem] text-white leading-relaxed resize-y focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
            />
          </div>

          {missingPages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/60 m-0">
                Linked in the notes, but no page yet
              </p>
              <ul className="flex flex-wrap gap-2 m-0 p-0 list-none">
                {missingPages.map(name => (
                  <li key={name} className="flex items-center gap-1 pl-3 pr-1 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white/80">
                    <span className="mr-1">{name}</span>
                    {onCreateEntity && (
                      <>
                        <button
                          type="button"
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50"
                          onClick={() => handleCreateEntity('npc', name)}
                          disabled={!!creating}
                          aria-label={`Create an NPC named ${name}`}
                        >
                          {creating === `npc:${name}` ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                          NPC
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50"
                          onClick={() => handleCreateEntity('location', name)}
                          disabled={!!creating}
                          aria-label={`Create a location named ${name}`}
                        >
                          {creating === `location:${name}` ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                          Location
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {createError && <p className="text-sm text-red-400 m-0">{createError}</p>}
            </div>
          )}

          {starred.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={keepHighlights}
                onChange={(e) => setKeepHighlights(e.target.checked)}
              />
              Add {starred.length === 1 ? 'the starred note' : `the ${starred.length} starred notes`} to this session’s highlights
            </label>
          )}

          <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border-l-4 border-[rgb(var(--color-primary))]">
            <p className="font-semibold text-white mb-2">This will:</p>
            <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
              <li>Append these notes to the session summary, linking names that have pages</li>
              <li>End live mode for this session</li>
              <li>Archive the live notes — they’re kept, and the live feed starts clean next time</li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/10 mt-2">
            <button
              className="flex-1 btn btn-secondary"
              onClick={() => setShowFinalizeModal(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 btn btn-primary"
              onClick={handleFinalize}
              disabled={isFinalizing}
            >
              {isFinalizing ? 'Saving...' : 'Save & End Session'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
