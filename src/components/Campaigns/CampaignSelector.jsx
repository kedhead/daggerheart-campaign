import { useState } from 'react';
import { Plus, FolderOpen, Trash2, Edit3 } from 'lucide-react';
import { useCampaigns } from '../../hooks/useCampaigns';
import Modal from '../Modal';
import './CampaignSelector.css';

export default function CampaignSelector({ currentCampaignId, onSelectCampaign }) {
  const { campaigns, loading, createCampaign, deleteCampaign } = useCampaigns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const newCampaignId = await createCampaign(campaignName, campaignDescription);
      setIsModalOpen(false);
      setCampaignName('');
      setCampaignDescription('');
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
        <p>Create your first campaign to get started</p>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
          Create Campaign
        </button>

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
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      <div className="campaigns-grid">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className={`campaign-card ${currentCampaignId === campaign.id ? 'active' : ''}`}
            onClick={() => onSelectCampaign(campaign.id)}
          >
            <div className="campaign-icon">
              <FolderOpen size={32} />
            </div>
            <div className="campaign-info">
              <h3>{campaign.name}</h3>
              {campaign.description && <p>{campaign.description}</p>}
            </div>
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
