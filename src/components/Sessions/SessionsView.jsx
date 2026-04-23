import { useState, useCallback } from 'react';
import { Plus, BookOpen, ScrollText } from 'lucide-react';
import SessionCard from './SessionCard';
import SessionForm from './SessionForm';
import SessionLive from './SessionLive';
import Modal from '../Modal';
import { autoDraftChapterFromSession } from '../../services/storybookGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useToast } from '../../contexts/ToastContext';
import './SessionsView.css';

export default function SessionsView({
  sessions,
  addSession,
  updateSession,
  deleteSession,
  isDM,
  campaign,
  characters = [],
  npcs = [],
  adversaries = [],
  locations = [],
  lore = [],
  timelineEvents = [],
  encounters = [],
  notes = [],
  campaignFrame = null,
  currentUserId
}) {
  const { keys } = useAPIKey(campaign?.createdBy);
  const { info, success, error: toastError } = useToast();
  const openaiKey = keys?.openai || null;

  const triggerAutoDraft = useCallback((session) => {
    if (!isDM || !openaiKey || !campaign?.id) return;
    info(`Drafting Story So Far chapter for "${session.title}"…`);
    // Fire-and-forget: never block session save/finalize
    autoDraftChapterFromSession({
      campaign,
      session,
      entities: { characters, npcs, adversaries, locations, lore, sessions, encounters, campaignFrame },
      campaignId: campaign.id,
      apiKey: openaiKey,
      gameSystem: campaign.gameSystem || 'daggerheart',
      onComplete: (res) => {
        if (res.ok) success('Story chapter drafted — review it in Story So Far.');
        else if (res.error && res.error !== 'already-exists' && res.error !== 'no-api-key') toastError(`Story draft failed: ${res.error}`);
      }
    }).catch(err => {
      console.error('[SessionsView] auto-draft threw:', err);
    });
  }, [isDM, openaiKey, campaign, characters, npcs, adversaries, locations, lore, sessions, encounters, campaignFrame, info, success, toastError]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [liveSession, setLiveSession] = useState(null);

  const handleAdd = () => {
    setEditingSession(null);
    setIsModalOpen(true);
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  const handleSave = (sessionData) => {
    const wasCompleted = editingSession?.status === 'completed';
    const isNowCompleted = sessionData.status === 'completed';

    if (editingSession) {
      updateSession(editingSession.id, sessionData);
      // Newly completed (transitioned from planned/in_progress → completed)
      if (isNowCompleted && !wasCompleted) {
        triggerAutoDraft({ id: editingSession.id, ...editingSession, ...sessionData });
      }
    } else {
      addSession(sessionData).then?.((result) => {
        // addSession in the hook returns the new doc reference/data — best-effort
        if (isNowCompleted && result?.id) {
          triggerAutoDraft({ id: result.id, ...sessionData });
        }
      });
      // Also fire for void-returning addSession impls: we can only trigger with
      // a real id once the subscription delivers it, so skip that edge case.
    }
    setIsModalOpen(false);
    setEditingSession(null);
  };

  const handleGoLive = async (session) => {
    // Mark session as live and open live mode
    await updateSession(session.id, {
      isLive: true,
      liveStartedAt: new Date().toISOString()
    });
    setLiveSession(session);
  };

  const handleExitLive = () => {
    setLiveSession(null);
  };

  // Sort sessions by number in descending order (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => b.number - a.number);

  // If in live mode, show the live session view
  if (liveSession) {
    // Get the updated session data from the sessions array
    const currentSession = sessions.find(s => s.id === liveSession.id) || liveSession;
    return (
      <SessionLive
        session={currentSession}
        campaign={campaign}
        campaignId={campaign?.id}
        isDM={isDM}
        currentUserId={currentUserId}
        entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
        onUpdateSession={updateSession}
        onAutoDraftChapter={triggerAutoDraft}
        onBack={handleExitLive}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3 font-cinzel">
            <BookOpen className="text-[rgb(var(--color-primary))]" size={32} />
            Session Log
          </h2>
          <p className="text-white/60 text-lg">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} logged
          </p>
        </div>
        {isDM && (
          <button
            className="btn btn-primary flex items-center gap-2 px-6 py-3 text-lg shadow-lg shadow-[rgb(var(--color-primary))/20]"
            onClick={handleAdd}
          >
            <Plus size={24} />
            Log Session
          </button>
        )}
      </div>

      {sortedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-secondary)] border border-white/5 rounded-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
            <ScrollText size={32} className="text-white/40" />
          </div>
          <h3 className="text-xl font-bold text-white">No sessions logged yet</h3>
          <p className="text-white/60 max-w-md">
            Start tracking your campaign's history by logging your first session.
          </p>
          {isDM && (
            <button className="btn btn-primary mt-4" onClick={handleAdd}>
              <Plus size={20} />
              Log First Session
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={() => handleEdit(session)}
              onDelete={() => deleteSession(session.id)}
              onGoLive={() => handleGoLive(session)}
              isDM={isDM}
              campaign={campaign}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSession(null);
        }}
        title={editingSession ? 'Edit Session' : 'Log New Session'}
        size="large"
      >
        <SessionForm
          session={editingSession}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingSession(null);
          }}
          isDM={isDM}
          campaign={campaign}
          entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
        />
      </Modal>
    </div>
  );
}
