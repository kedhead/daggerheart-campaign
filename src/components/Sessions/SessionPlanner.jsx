import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Plus, Edit2, Trash2, Save, X, Calendar, Link as LinkIcon, AlertCircle } from 'lucide-react';
import LiveTranscriptionPanel from './LiveTranscriptionPanel';
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

  const getStatusStyles = (status) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const handleNotesGenerated = (generatedNotes) => {
    if (isAdding) {
      setFormData(prev => ({
        ...prev,
        notes: prev.notes ? prev.notes + '\n\n' + generatedNotes : generatedNotes
      }));
    }
  };

  if (!isDM) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="p-8 bg-[var(--bg-secondary)] border border-white/5 rounded-xl text-center space-y-4">
          <AlertCircle size={48} className="text-white/20 mx-auto" />
          <h2 className="text-2xl font-bold text-white">DM Access Only</h2>
          <p className="text-white/60">Only Dungeon Masters can access the session planner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
        <div>
          <h2 className="text-3xl font-bold text-white font-cinzel">Session Planner</h2>
          <p className="text-white/60 text-lg">Plan and organize your campaign sessions</p>
        </div>
        {!isAdding && (
          <button
            className="btn btn-primary flex items-center gap-2 px-6 py-3 text-lg shadow-lg shadow-[rgb(var(--color-primary))/20]"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={24} />
            New Session
          </button>
        )}
      </div>

      <LiveTranscriptionPanel onNotesGenerated={handleNotesGenerated} />

      {isAdding && (
        <div className="p-6 bg-[var(--bg-secondary)] border border-white/5 rounded-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Session' : 'New Session'}</h3>
            <button
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              onClick={resetForm}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-semibold text-white/60">Session Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Session 1: The Journey Begins"
                  required
                  className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="date" className="block text-sm font-semibold text-white/60">Date</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-3.5 text-white/40 pointer-events-none" />
                  <input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-3 pl-10 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="status" className="block text-sm font-semibold text-white/60">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="encounterLinks" className="block text-sm font-semibold text-white/60">Encounter Links</label>
              <div className="relative">
                <LinkIcon size={18} className="absolute left-3 top-3.5 text-white/40 pointer-events-none" />
                <input
                  id="encounterLinks"
                  type="text"
                  value={formData.encounterLinks}
                  onChange={(e) => setFormData({ ...formData, encounterLinks: e.target.value })}
                  placeholder="https://freshcutgrass.app/encounter/..."
                  className="w-full p-3 pl-10 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                />
              </div>
              <p className="text-xs text-white/40 mt-1">Paste FreshCutGrass encounter link(s), separate multiple with commas</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="notes" className="block text-sm font-semibold text-white/60">Session Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add your session notes, story beats, NPC details, etc..."
                rows={8}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors resize-y min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {editingId ? 'Update Session' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {sessions.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-secondary)] border border-white/5 rounded-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <Calendar size={32} className="text-white/40" />
            </div>
            <h3 className="text-xl font-bold text-white">No sessions planned yet</h3>
            <p className="text-white/60 max-w-md">
              Start planning your next adventure by creating a session plan.
            </p>
            <button className="btn btn-primary mt-4" onClick={() => setIsAdding(true)}>
              <Plus size={20} />
              Create Your First Session
            </button>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-6 hover:border-white/20 transition-all duration-200">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">{session.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center gap-1 uppercase ${getStatusStyles(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  {session.date && (
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Calendar size={14} />
                      <span>{new Date(session.date).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={() => handleEdit(session)}
                    title="Edit session"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="p-2 rounded-lg text-white/40 hover:text-red-500 hover:bg-white/10 transition-colors"
                    onClick={() => handleDelete(session.id)}
                    title="Delete session"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {session.encounterLinks && (
                <div className="flex items-start gap-3 mb-4 p-3 bg-black/20 rounded-lg border border-white/5">
                  <LinkIcon size={16} className="text-white/40 mt-1 shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {session.encounterLinks.split(',').map((link, index) => (
                      <a
                        key={index}
                        href={link.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-[var(--hope-color)] hover:bg-indigo-600 text-white text-sm rounded transition-colors no-underline font-medium"
                      >
                        Encounter {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {session.notes && (
                <div className="p-4 bg-black/20 rounded-lg border border-white/5 border-l-4 border-l-[var(--hope-color)]">
                  <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{session.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
