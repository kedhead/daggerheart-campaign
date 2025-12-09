import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Edit2, Trash2, Save, X, Calendar, Link as LinkIcon } from 'lucide-react';
import './SessionPlanner.css';

export default function SessionPlanner({ campaign, isDM }) {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    notes: '',
    encounterLinks: '',
    status: 'planned'
  });

  useEffect(() => {
    if (campaign?.sessions) {
      setSessions(campaign.sessions);
    }
  }, [campaign]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newSession = {
        id: editingId || Date.now().toString(),
        ...formData,
        createdAt: editingId ? sessions.find(s => s.id === editingId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedSessions;
      if (editingId) {
        updatedSessions = sessions.map(s => s.id === editingId ? newSession : s);
      } else {
        updatedSessions = [...sessions, newSession];
      }

      const campaignRef = doc(db, `campaigns/${campaign.id}`);
      await updateDoc(campaignRef, {
        sessions: updatedSessions,
        updatedAt: serverTimestamp()
      });

      setSessions(updatedSessions);
      resetForm();
    } catch (err) {
      console.error('Error saving session:', err);
      alert('Failed to save session');
    }
  };

  const handleEdit = (session) => {
    setEditingId(session.id);
    setFormData({
      name: session.name,
      date: session.date,
      notes: session.notes,
      encounterLinks: session.encounterLinks,
      status: session.status
    });
    setIsAdding(true);
  };

  const handleDelete = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      const campaignRef = doc(db, `campaigns/${campaign.id}`);
      await updateDoc(campaignRef, {
        sessions: updatedSessions,
        updatedAt: serverTimestamp()
      });
      setSessions(updatedSessions);
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Failed to delete session');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      notes: '',
      encounterLinks: '',
      status: 'planned'
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'status-planned';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      default: return 'status-planned';
    }
  };

  if (!isDM) {
    return (
      <div className="sessions-view">
        <div className="view-header">
          <h2>Sessions</h2>
          <p className="view-subtitle">Only DMs can access session planning</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-view">
      <div className="view-header">
        <div>
          <h2>Session Planner</h2>
          <p className="view-subtitle">Plan and organize your campaign sessions</p>
        </div>
        {!isAdding && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={20} />
            New Session
          </button>
        )}
      </div>

      {isAdding && (
        <div className="session-form card">
          <div className="form-header">
            <h3>{editingId ? 'Edit Session' : 'New Session'}</h3>
            <button className="btn-icon" onClick={resetForm}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Session Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Session 1: The Journey Begins"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <div className="input-with-icon">
                  <Calendar size={18} />
                  <input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="encounterLinks">Encounter Links</label>
              <div className="input-with-icon">
                <LinkIcon size={18} />
                <input
                  id="encounterLinks"
                  type="text"
                  value={formData.encounterLinks}
                  onChange={(e) => setFormData({ ...formData, encounterLinks: e.target.value })}
                  placeholder="https://freshcutgrass.app/encounter/..."
                />
              </div>
              <small className="form-hint">Paste FreshCutGrass encounter link(s), separate multiple with commas</small>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Session Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add your session notes, story beats, NPC details, etc..."
                rows={8}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                {editingId ? 'Update Session' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="sessions-list">
        {sessions.length === 0 && !isAdding ? (
          <div className="empty-state card">
            <p>No sessions planned yet</p>
            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
              <Plus size={20} />
              Create Your First Session
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="session-card card">
              <div className="session-header">
                <div className="session-title">
                  <h3>{session.name}</h3>
                  <span className={`session-status ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                <div className="session-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(session)}
                    title="Edit session"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(session.id)}
                    title="Delete session"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {session.date && (
                <div className="session-date">
                  <Calendar size={16} />
                  <span>{new Date(session.date).toLocaleString()}</span>
                </div>
              )}

              {session.encounterLinks && (
                <div className="session-encounters">
                  <LinkIcon size={16} />
                  <div className="encounter-links">
                    {session.encounterLinks.split(',').map((link, index) => (
                      <a
                        key={index}
                        href={link.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="encounter-link"
                      >
                        Encounter {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {session.notes && (
                <div className="session-notes">
                  <p>{session.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
