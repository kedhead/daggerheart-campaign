import { useState } from 'react';
import { Save, X } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './NPCsView.css';

export default function NPCForm({ npc, onSave, onCancel, campaign }) {
  const { search } = useEntityRegistry(campaign);
  const [formData, setFormData] = useState(npc || {
    name: '',
    occupation: '',
    location: '',
    relationship: 'neutral',
    description: '',
    notes: '',
    firstMet: '',
    avatarUrl: ''
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
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
              disabled={uploadingAvatar}
              style={{ display: 'none' }}
            />
          </label>
          {formData.avatarUrl && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleChange('avatarUrl', '')}
            >
              Remove
            </button>
          )}
          <small className="form-hint">Max 1MB, square images work best</small>
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
        <input
          type="text"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="e.g., Riverside Market, The Golden Lion Inn"
        />
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
          placeholder="Important information, quest connections, secrets... Type [[ to link entities"
          rows={4}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>First Met</label>
        <input
          type="text"
          value={formData.firstMet}
          onChange={(e) => handleChange('firstMet', e.target.value)}
          placeholder="e.g., Session 3, At the tavern in Riverdale"
        />
      </div>

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
