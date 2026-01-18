import { useState } from 'react';
import { Radio, Square, Star, Copy, Trash2, ArrowLeft, FileText } from 'lucide-react';
import { useSessionLive } from '../../hooks/useSessionLive';
import LiveNoteInput from './LiveNoteInput';
import LiveNoteFeed from './LiveNoteFeed';
import Modal from '../Modal';
import './SessionLive.css';

export default function SessionLive({
  session,
  campaign,
  campaignId,
  isDM,
  currentUserId,
  entities,
  onUpdateSession,
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
    compileHighlights
  } = useSessionLive(campaignId, session?.id, isDM);

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [compiledSummary, setCompiledSummary] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);

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
    setCompiledSummary(summary);
    setShowFinalizeModal(true);
  };

  const handleFinalize = async () => {
    if (!onUpdateSession) return;

    setIsFinalizing(true);

    // Append compiled notes to session summary
    const existingSummary = session.summary || '';
    const divider = existingSummary ? '\n\n--- Live Notes ---\n\n' : '';
    const newSummary = existingSummary + divider + compiledSummary;

    await onUpdateSession(session.id, {
      summary: newSummary,
      isLive: false,
      liveEndedAt: new Date().toISOString()
    });

    // Optionally clear notes after finalizing
    if (isDM) {
      await clearAllNotes();
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
      <div className="session-live-error">
        <p>No session selected</p>
        <button className="btn btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="session-live">
      <div className="session-live-header">
        <div className="header-left">
          <button className="btn btn-ghost" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <div className="session-info">
            <div className="live-indicator">
              <Radio size={16} className="pulse" />
              <span>LIVE</span>
            </div>
            <h2>{session.title}</h2>
          </div>
        </div>

        <div className="header-right">
          <div className="note-stats">
            <span className="stat">
              <FileText size={14} />
              {noteCount} notes
            </span>
            <span className="stat highlight">
              <Star size={14} />
              {highlightCount} highlights
            </span>
          </div>

          <div className="header-actions">
            {noteCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={handleCopyNotes} title="Copy all notes">
                <Copy size={16} />
              </button>
            )}

            {isDM && noteCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={handleClearAll} title="Clear all notes">
                <Trash2 size={16} />
              </button>
            )}

            {isDM && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleEndSession}
                  title="End without saving"
                >
                  <Square size={16} />
                  End
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenFinalize}
                  disabled={noteCount === 0}
                >
                  <FileText size={16} />
                  Finalize
                </button>
              </>
            )}
          </div>
        </div>
      </div>

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
        <div className="finalize-modal">
          <p className="finalize-description">
            Review the compiled notes below. {highlightCount > 0
              ? `Showing ${highlightCount} highlighted notes.`
              : 'Showing all notes (no highlights were marked).'}
          </p>

          <div className="form-group">
            <label>Session Summary Preview</label>
            <textarea
              value={compiledSummary}
              onChange={(e) => setCompiledSummary(e.target.value)}
              rows={12}
              placeholder="Edit the summary before saving..."
            />
          </div>

          <div className="finalize-info">
            <p>This will:</p>
            <ul>
              <li>Append these notes to the session summary</li>
              <li>End live mode for this session</li>
              <li>Clear the live notes</li>
            </ul>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowFinalizeModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
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
