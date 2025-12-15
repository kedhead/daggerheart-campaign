import { useState } from 'react';
import { Users, BookOpen, ScrollText, ExternalLink, Edit3 } from 'lucide-react';
import DiceRoller from '../DiceRoller';
import Modal from '../Modal';
import { getGameSystem } from '../../data/systems/index.js';
import './DashboardView.css';

const ICON_MAP = {
  sword: '⚔️',
  sparkles: '✨',
  'user-circle': '👤',
  home: '🏠',
  'book-open': '📖'
};

export default function DashboardView({ campaign, updateCampaign, characters, lore, sessions, isDM }) {
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState(campaign);

  // Get external tools from game system
  const gameSystem = getGameSystem(campaign?.gameSystem);
  const externalTools = gameSystem?.externalTools || [];

  const handleSaveCampaign = (e) => {
    e.preventDefault();
    updateCampaign(campaignForm);
    setIsEditingCampaign(false);
  };

  const recentSessions = [...sessions]
    .sort((a, b) => b.number - a.number)
    .slice(0, 3);

  return (
    <div className="dashboard-view">
      <div className="campaign-header card">
        <div className="campaign-info">
          <h1>{campaign.name}</h1>
          <p>{campaign.description}</p>
        </div>
        {isDM && (
          <button
            className="btn btn-icon"
            onClick={() => setIsEditingCampaign(true)}
          >
            <Edit3 size={20} />
          </button>
        )}
      </div>

      <div className="stats-row">
        <div className="stat-card card">
          <div className="stat-icon">
            <Users size={32} />
          </div>
          <div className="stat-content">
            <h3>{characters.length}</h3>
            <p>Character{characters.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">
            <BookOpen size={32} />
          </div>
          <div className="stat-content">
            <h3>{lore.length}</h3>
            <p>Lore Entr{lore.length !== 1 ? 'ies' : 'y'}</p>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">
            <ScrollText size={32} />
          </div>
          <div className="stat-content">
            <h3>{sessions.length}</h3>
            <p>Session{sessions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {externalTools.map((tool, index) => (
              <a
                key={index}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="quick-action-card card"
              >
                <span className="action-icon">{ICON_MAP[tool.icon] || '🔗'}</span>
                <div className="action-content">
                  <h4>{tool.name}</h4>
                  <p>{tool.description}</p>
                </div>
                <ExternalLink size={18} className="external-icon" />
              </a>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Dice Roller</h2>
          <DiceRoller isDM={isDM} />
        </div>
      </div>

      {recentSessions.length > 0 && (
        <div className="dashboard-section">
          <h2>Recent Sessions</h2>
          <div className="recent-sessions">
            {recentSessions.map(session => (
              <div key={session.id} className="recent-session-card card">
                <div className="session-badge">#{session.number}</div>
                <div className="session-content">
                  <h4>{session.title}</h4>
                  <p className="session-date">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="session-preview">{session.summary.substring(0, 150)}...</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isEditingCampaign}
        onClose={() => setIsEditingCampaign(false)}
        title="Edit Campaign"
        size="medium"
      >
        <form onSubmit={handleSaveCampaign} className="campaign-form">
          <div className="input-group">
            <label>Campaign Name</label>
            <input
              type="text"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea
              value={campaignForm.description}
              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              rows="4"
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditingCampaign(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
