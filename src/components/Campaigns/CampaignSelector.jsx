import { useState } from 'react';
import { Plus, FolderOpen, Trash2, Edit3, Search } from 'lucide-react';
import { useCampaigns } from '../../hooks/useCampaigns';
import CampaignBrowser from './CampaignBrowser';
import GameSystemSelector from './GameSystemSelector';
import Modal from '../Modal';
import './CampaignSelector.css';

export default function CampaignSelector({ currentCampaignId, onSelectCampaign, userRole }) {
  const { campaigns, loading, createCampaign, deleteCampaign } = useCampaigns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBrowseMode, setIsBrowseMode] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [gameSystem, setGameSystem] = useState('daggerheart');
  const [creating, setCreating] = useState(false);

  const isDM = userRole === 'dm';

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const newCampaignId = await createCampaign(campaignName, campaignDescription, isPublic, gameSystem);
      setIsModalOpen(false);
      setCampaignName('');
      setCampaignDescription('');
      setIsPublic(false);
      setGameSystem('daggerheart');
      if (newCampaignId) {
        onSelectCampaign(newCampaignId);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCampaign = async (e, campaignId, campaignName) => {
    e.stopPropagation(); // Prevent selecting the campaign

    const confirmed = window.confirm(
      `Are you sure you want to delete "${campaignName}"?\n\nThis will permanently delete all characters, lore, and sessions in this campaign. This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await deleteCampaign(campaignId);
      } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('Failed to delete campaign');
      }
    }
  };

  // Show browser if in browse mode
  if (isBrowseMode) {
    return <CampaignBrowser onClose={() => setIsBrowseMode(false)} />;
  }

  if (loading) {
    return (
      <div className="campaign-selector-loading">
        <div className="loading-spinner"></div>
        <p>Loading campaigns...</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="campaign-selector-empty">
        <FolderOpen size={64} />
        <h2>No Campaigns Yet</h2>
        {isDM ? (
          <>
            <p>Create your first campaign to get started</p>
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={20} />
              Create Campaign
            </button>
          </>
        ) : (
          <>
            <p>You haven't joined any campaigns yet</p>
            <p className="empty-state-help">
              Browse public campaigns to request to join, or ask a DM to invite you directly.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => setIsBrowseMode(true)}
            >
              <Search size={20} />
              Browse Campaigns
            </button>
          </>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Campaign"
          size="medium"
        >
          <form onSubmit={handleCreateCampaign} className="campaign-form">
            <div className="input-group">
              <label>Campaign Name *</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Shadowfen Chronicles"
                required
                disabled={creating}
              />
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder="A brief description of your campaign..."
                rows="4"
                disabled={creating}
              />
            </div>

            <GameSystemSelector
              selectedSystem={gameSystem}
              onSelect={setGameSystem}
            />

            <div className="input-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={creating}
                />
                <span>Allow players to request to join this campaign</span>
              </label>
              <small className="form-hint">
                If enabled, your campaign will be visible in the campaign browser and players can request to join. You'll approve all requests.
              </small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="campaign-selector">
      <div className="campaign-selector-header">
        <h2>My Campaigns</h2>
        <div className="header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsBrowseMode(true)}
          >
            <Search size={16} />
            Browse
          </button>
          {isDM && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} />
              New Campaign
            </button>
          )}
        </div>
      </div>

      <div className="campaigns-grid">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={`campaign-card ${currentCampaignId === campaign.id ? 'active' : ''}`}
          >
            <div className="campaign-card-content" onClick={() => onSelectCampaign(campaign.id)}>
              <div className="campaign-icon">
                <FolderOpen size={32} />
              </div>
              <div className="campaign-info">
                <h3>{campaign.name}</h3>
                {campaign.description && <p>{campaign.description}</p>}
              </div>
            </div>
            <button
              className="btn btn-icon campaign-delete-btn"
              onClick={(e) => handleDeleteCampaign(e, campaign.id, campaign.name)}
              title="Delete campaign"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Campaign"
        size="medium"
      >
        <form onSubmit={handleCreateCampaign} className="campaign-form">
          <div className="input-group">
            <label>Campaign Name *</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Shadowfen Chronicles"
              required
              disabled={creating}
            />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              placeholder="A brief description of your campaign..."
              rows="4"
              disabled={creating}
            />
          </div>

          <GameSystemSelector
            selectedSystem={gameSystem}
            onSelect={setGameSystem}
          />

          <div className="input-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={creating}
              />
              <span>Allow players to request to join this campaign</span>
            </label>
            <small className="form-hint">
              If enabled, your campaign will be visible in the campaign browser and players can request to join. You'll approve all requests.
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
