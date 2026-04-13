import { useState } from 'react';
import { Save, X, Wand2, Loader2 } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateNPCPortrait } from '../../services/portraitGenerator';
import './NPCsView.css';

export default function NPCForm({ npc, onSave, onCancel, campaign, entities, isDM }) {
  console.log('[NPCForm] Received props:', {
    campaign: campaign?.name,
    entities: entities ? {
      npcs: entities.npcs?.length || 0,
      locations: entities.locations?.length || 0,
      lore: entities.lore?.length || 0,
      sessions: entities.sessions?.length || 0,
      timelineEvents: entities.timelineEvents?.length || 0,
      encounters: entities.encounters?.length || 0,
      notes: entities.notes?.length || 0
    } : 'undefined'
  });

  const { search, autoLink } = useEntityRegistry(campaign, entities);
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);

  const [formData, setFormData] = useState(npc || {
    name: '',
    occupation: '',
    location: '',
    relationship: 'neutral',
    description: '',
    notes: '',
    firstMet: '',
    avatarUrl: '',
    hidden: false
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [portraitError, setPortraitError] = useState(null);

  // Check if OpenAI key is available
  const openaiKeyInfo = getEffectiveKey('openai');
  const hasOpenAIKey = !!openaiKeyInfo?.key;

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleGeneratePortrait = async () => {
    if (!formData.name) {
      setPortraitError('Please enter an NPC name first');
      return;
    }

    setGeneratingPortrait(true);
    setPortraitError(null);

    try {
      const gameSystem = campaign?.gameSystem || 'daggerheart';
      const campaignId = campaign?.id;
      const avatarUrl = await generateNPCPortrait(formData, openaiKeyInfo?.key || null, gameSystem, campaignId);

      setFormData({
        ...formData,
        avatarUrl
      });
    } catch (err) {
      console.error('Portrait generation failed:', err);
      setPortraitError(err.message || 'Failed to generate portrait');
    } finally {
      setGeneratingPortrait(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        alert('Avatar size must be less than 1MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setUploadingAvatar(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          avatarUrl: e.target.result
        });
        setUploadingAvatar(false);
      };
      reader.onerror = () => {
        alert('Failed to upload avatar');
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="npc-form" onSubmit={handleSubmit}>
      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-preview">
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="NPC portrait" />
          ) : (
            <div className="avatar-placeholder">
              <span>No Portrait</span>
            </div>
          )}
        </div>
        <div className="avatar-upload">
          <label className="btn btn-secondary">
            {uploadingAvatar ? 'Uploading...' : 'Upload Portrait'}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar || generatingPortrait}
              style={{ display: 'none' }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGeneratePortrait}
            disabled={generatingPortrait}
            title="Generate AI portrait"
          >
            {generatingPortrait ? (
              <>
                <Loader2 size={16} className="spinner" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Generate AI
              </>
            )}
          </button>
          {formData.avatarUrl && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleChange('avatarUrl', '')}
              disabled={generatingPortrait}
            >
              Remove
            </button>
          )}
          <small className="form-hint">
            Upload an image or generate with AI
          </small>
          {portraitError && (
            <small className="form-error">{portraitError}</small>
          )}
        </div>
      </div>

      <div className="input-group">
        <label>NPC Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Grimwald the Merchant"
          required
        />
      </div>

      <div className="input-group">
        <label>Occupation</label>
        <input
          type="text"
          value={formData.occupation}
          onChange={(e) => handleChange('occupation', e.target.value)}
          placeholder="e.g., Blacksmith, Tavern Owner, Guard Captain"
        />
      </div>

      <div className="input-group">
        <label>Location</label>
        <WikiLinkInput
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="e.g., Riverside Market, The Golden Lion Inn — Type [[ to link"
          rows={1}
        />
        <small className="form-hint">Type [[ to link to locations or other entities</small>
      </div>

      <div className="input-group">
        <label>Relationship *</label>
        <select
          value={formData.relationship}
          onChange={(e) => handleChange('relationship', e.target.value)}
          required
        >
          <option value="ally">Ally</option>
          <option value="neutral">Neutral</option>
          <option value="enemy">Enemy</option>
        </select>
      </div>

      <div className="input-group">
        <label>Description</label>
        <WikiLinkInput
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="Physical appearance, personality, mannerisms... Type [[ to link entities"
          rows={4}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>Notes</label>
        <WikiLinkInput
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="Important information, quest connections, secrets... Type [[ to link entities"
          rows={4}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>First Met</label>
        <WikiLinkInput
          value={formData.firstMet}
          onChange={(e) => handleChange('firstMet', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="e.g., Session 3, At the tavern in [[Riverdale]] — Type [[ to link"
          rows={1}
        />
        <small className="form-hint">Type [[ to link to sessions, locations, or other entities</small>
      </div>

      {isDM && (
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.hidden}
              onChange={(e) => handleChange('hidden', e.target.checked)}
            />
            <span>Hidden from Players</span>
          </label>
          <small className="form-hint">Players won't see this NPC until you reveal it</small>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save NPC
        </button>
      </div>
    </form>
  );
}
