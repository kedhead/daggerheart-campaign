import { useState } from 'react';
import { Save, X, ExternalLink, Wand2, Loader2 } from 'lucide-react';
import { generateCharacterPortrait } from '../../services/portraitGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';
import './CharacterForm.css';

export default function CharacterFormSimple({ character, onSave, onCancel, isDM, campaign }) {
  const [formData, setFormData] = useState(character || {
    name: '',
    playerName: '',
    avatarUrl: '',
    demiplaneLink: '',
    playerNotes: '',
    backstory: '',
    dmNotes: '',
    appearanceDescription: ''
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);

  // Get OpenAI API key for AI avatar generation
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const openaiKeyInfo = getEffectiveKey('openai');
  const hasOpenAIKey = !!openaiKeyInfo?.key;

  const handleGenerateAvatar = async () => {
    if (!hasOpenAIKey) {
      alert('OpenAI API key required for AI avatar generation. Add one in API Settings.');
      return;
    }

    if (!formData.appearanceDescription?.trim()) {
      alert('Please add an appearance description first to generate an avatar.');
      return;
    }

    setGeneratingAvatar(true);
    try {
      const imageUrl = await generateCharacterPortrait(
        formData,
        openaiKeyInfo.key,
        campaign?.gameSystem || 'daggerheart',
        campaign?.id
      );
      setFormData({
        ...formData,
        avatarUrl: imageUrl
      });
    } catch (err) {
      console.error('Avatar generation failed:', err);
      alert('Failed to generate avatar: ' + err.message);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 1MB for avatars)
      if (file.size > 1 * 1024 * 1024) {
        alert('Avatar size must be less than 1MB');
        return;
      }

      // Check if it's an image
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
    <form className="character-form character-form-simple" onSubmit={handleSubmit}>
      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-preview">
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="Character avatar" />
          ) : (
            <div className="avatar-placeholder">
              <span>No Avatar</span>
            </div>
          )}
        </div>
        <div className="avatar-upload">
          <label className="btn btn-secondary">
            {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              style={{ display: 'none' }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary ai-generate-btn"
            onClick={handleGenerateAvatar}
            disabled={generatingAvatar || !formData.appearanceDescription?.trim() || !hasOpenAIKey}
            title={!hasOpenAIKey ? 'Add an OpenAI API key in Settings to use AI generation' : !formData.appearanceDescription?.trim() ? 'Add an appearance description first' : 'Generate AI Avatar'}
          >
            {generatingAvatar ? <Loader2 size={16} className="spinner" /> : <Wand2 size={16} />}
            {generatingAvatar ? 'Generating...' : 'AI Generate'}
          </button>
          {formData.avatarUrl && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleChange('avatarUrl', '')}
            >
              Remove
            </button>
          )}
          <small className="form-hint">Max 1MB for upload, or use AI generation below</small>
        </div>
      </div>

      <div className="input-group">
        <label>Appearance Description (for AI Avatar)</label>
        <textarea
          value={formData.appearanceDescription}
          onChange={(e) => handleChange('appearanceDescription', e.target.value)}
          rows="3"
          placeholder="Describe your character's physical appearance: hair color, eye color, build, distinguishing features, typical attire..."
        />
        <small className="input-hint">
          Used to generate an AI portrait. Be descriptive! Include physical features, clothing, and any unique characteristics.
        </small>
      </div>

      <div className="input-group">
        <label>Character Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Eldrin Shadowstep"
          required
        />
      </div>

      <div className="input-group">
        <label>Player Name</label>
        <input
          type="text"
          value={formData.playerName}
          onChange={(e) => handleChange('playerName', e.target.value)}
          placeholder="Your real name"
        />
      </div>

      <div className="input-group">
        <label>
          Demiplane Character Sheet Link
          <a
            href="https://app.demiplane.com/nexus/daggerheart"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-inline"
          >
            <ExternalLink size={14} />
            Create on Demiplane
          </a>
        </label>
        <input
          type="url"
          value={formData.demiplaneLink}
          onChange={(e) => handleChange('demiplaneLink', e.target.value)}
          placeholder="https://app.demiplane.com/nexus/daggerheart/..."
        />
        <small className="input-hint">
          Optional: Link to your Demiplane character sheet. You can also use a paper sheet or the built-in character sheet instead.
        </small>
      </div>

      <div className="input-group">
        <label>Character Notes</label>
        <textarea
          value={formData.playerNotes}
          onChange={(e) => handleChange('playerNotes', e.target.value)}
          rows="4"
          placeholder="Personal notes, goals, relationships, etc."
        />
        <small className="input-hint">
          Your personal character notes (visible to you and DM)
        </small>
      </div>

      <div className="input-group">
        <label>Backstory</label>
        <textarea
          value={formData.backstory}
          onChange={(e) => handleChange('backstory', e.target.value)}
          rows="6"
          placeholder="Tell your character's story..."
        />
      </div>

      {isDM && (
        <div className="input-group">
          <label>DM Notes (DM Only)</label>
          <textarea
            value={formData.dmNotes}
            onChange={(e) => handleChange('dmNotes', e.target.value)}
            rows="4"
            placeholder="Private notes for your eyes only..."
          />
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save Character
        </button>
      </div>
    </form>
  );
}
