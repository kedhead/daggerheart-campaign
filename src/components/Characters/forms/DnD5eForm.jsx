import { useState } from 'react';
import { Save, X, ExternalLink } from 'lucide-react';
import '../CharacterForm.css';

export default function DnD5eForm({ character, onSave, onCancel, isDM }) {
  const [formData, setFormData] = useState(character || {
    name: '',
    playerName: '',
    avatarUrl: '',
    systemData: {
      dndBeyondLink: '',
      playerNotes: ''
    },
    backstory: '',
    dmNotes: ''
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSystemDataChange = (field, value) => {
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        [field]: value
      }
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
          <small>Max 1MB</small>
        </div>
      </div>

      {/* Basic Info */}
      <div className="input-group">
        <label>Character Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Aric Stormblade"
          required
        />
      </div>

      <div className="input-group">
        <label>Player Name</label>
        <input
          type="text"
          value={formData.playerName}
          onChange={(e) => handleChange('playerName', e.target.value)}
          placeholder="Your name"
        />
      </div>

      {/* D&D Beyond Link */}
      <div className="input-group">
        <label>D&D Beyond Character Link *</label>
        <input
          type="url"
          value={formData.systemData.dndBeyondLink}
          onChange={(e) => handleSystemDataChange('dndBeyondLink', e.target.value)}
          placeholder="https://www.dndbeyond.com/characters/..."
          required
        />
        <small className="form-hint">
          Link to your D&D Beyond character sheet.
          <a
            href="https://www.dndbeyond.com/characters"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            Create one <ExternalLink size={12} />
          </a>
        </small>
      </div>

      {/* Player Notes */}
      <div className="input-group">
        <label>Player Notes</label>
        <textarea
          value={formData.systemData.playerNotes}
          onChange={(e) => handleSystemDataChange('playerNotes', e.target.value)}
          placeholder="Quick notes about your character, important abilities, etc."
          rows="4"
        />
      </div>

      {/* Backstory */}
      <div className="input-group">
        <label>Backstory</label>
        <textarea
          value={formData.backstory}
          onChange={(e) => handleChange('backstory', e.target.value)}
          placeholder="Your character's story, background, and motivations..."
          rows="6"
        />
      </div>

      {/* DM Notes (only visible to DM) */}
      {isDM && (
        <div className="input-group dm-only">
          <label>DM Notes</label>
          <textarea
            value={formData.dmNotes}
            onChange={(e) => handleChange('dmNotes', e.target.value)}
            placeholder="Private notes only visible to the DM..."
            rows="4"
          />
          <small className="form-hint">Only visible to the DM</small>
        </div>
      )}

      {/* Form Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={18} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={18} />
          Save Character
        </button>
      </div>
    </form>
  );
}
