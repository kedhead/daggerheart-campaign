import { useState } from 'react';
import { Plus } from 'lucide-react';
import SessionCard from './SessionCard';
import SessionForm from './SessionForm';
import SessionLive from './SessionLive';
import Modal from '../Modal';
import './SessionsView.css';

export default function SessionsView({ sessions, addSession, updateSession, deleteSession, isDM, campaign, npcs = [], locations = [], lore = [], timelineEvents = [], encounters = [], notes = [], currentUserId }) {
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
    if (editingSession) {
      updateSession(editingSession.id, sessionData);
    } else {
      addSession(sessionData);
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
        onBack={handleExitLive}
      />
    );
  }

  return (
    <div className="sessions-view">
      <div className="view-header">
        <div>
          <h2>Session Log</h2>
          <p className="view-subtitle">{sessions.length} session{sessions.length !== 1 ? 's' : ''} logged</p>
        </div>
        {isDM && (
          <button className={`btn btn-primary ${isDM ? 'dm-mode' : ''}`} onClick={handleAdd}>
            <Plus size={20} />
            Log Session
          </button>
        )}
      </div>

      {sortedSessions.length === 0 ? (
        <div className="empty-state">
          <p>No sessions logged yet</p>
          {isDM && (
            <button className={`btn btn-primary ${isDM ? 'dm-mode' : ''}`} onClick={handleAdd}>
              <Plus size={20} />
              Log First Session
            </button>
          )}
        </div>
      ) : (
        <div className="sessions-list">
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
        size="medium"
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
