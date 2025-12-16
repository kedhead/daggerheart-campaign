import { useState } from 'react';
import { Save, X, Plus, Trash2, ExternalLink } from 'lucide-react';
import './GenericForm.css';
import '../CharacterForm.css';

export default function GenericForm({ character, onSave, onCancel, isDM }) {
  const [formData, setFormData] = useState(character || {
    name: '',
    playerName: '',
    avatarUrl: '',
    systemData: {
      characterClass: '',
      level: 1,
      characterSheetLink: '',
      attributes: [
        { name: 'Strength', value: 10 },
        { name: 'Dexterity', value: 10 },
        { name: 'Constitution', value: 10 },
        { name: 'Intelligence', value: 10 },
        { name: 'Wisdom', value: 10 },
        { name: 'Charisma', value: 10 }
      ],
      skills: [],
      abilities: [],
      hp: 10,
      maxHp: 10,
      armorClass: 10,
      background: '',
      equipment: '',
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

  // Attribute Management
  const addAttribute = () => {
    handleSystemDataChange('attributes', [
      ...formData.systemData.attributes,
      { name: '', value: 10 }
    ]);
  };

  const removeAttribute = (index) => {
    const updated = formData.systemData.attributes.filter((_, i) => i !== index);
    handleSystemDataChange('attributes', updated);
  };

  const updateAttribute = (index, field, value) => {
    const updated = formData.systemData.attributes.map((attr, i) =>
      i === index ? { ...attr, [field]: field === 'value' ? parseInt(value) || 0 : value } : attr
    );
    handleSystemDataChange('attributes', updated);
  };

  // Skill Management
  const addSkill = () => {
    handleSystemDataChange('skills', [
      ...formData.systemData.skills,
      { name: '', value: 0 }
    ]);
  };

  const removeSkill = (index) => {
    const updated = formData.systemData.skills.filter((_, i) => i !== index);
    handleSystemDataChange('skills', updated);
  };

  const updateSkill = (index, field, value) => {
    const updated = formData.systemData.skills.map((skill, i) =>
      i === index ? { ...skill, [field]: field === 'value' ? parseInt(value) || 0 : value } : skill
    );
    handleSystemDataChange('skills', updated);
  };

  // Ability Management
  const addAbility = () => {
    handleSystemDataChange('abilities', [
      ...formData.systemData.abilities,
      { name: '', description: '' }
    ]);
  };

  const removeAbility = (index) => {
    const updated = formData.systemData.abilities.filter((_, i) => i !== index);
    handleSystemDataChange('abilities', updated);
  };

  const updateAbility = (index, field, value) => {
    const updated = formData.systemData.abilities.map((ability, i) =>
      i === index ? { ...ability, [field]: value } : ability
    );
    handleSystemDataChange('abilities', updated);
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
    <form className="character-form generic-form" onSubmit={handleSubmit}>
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

      {/* Character Info Section */}
      <div className="form-section">
        <h3>Character Info</h3>

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

        <div className="form-row">
          <div className="input-group">
            <label>Class/Archetype</label>
            <input
              type="text"
              value={formData.systemData.characterClass}
              onChange={(e) => handleSystemDataChange('characterClass', e.target.value)}
              placeholder="Warrior, Mage, Rogue, etc."
            />
          </div>

          <div className="input-group">
            <label>Level/Rank</label>
            <input
              type="number"
              value={formData.systemData.level}
              onChange={(e) => handleSystemDataChange('level', parseInt(e.target.value) || 1)}
              min="1"
              max="20"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Character Sheet Link</label>
          <input
            type="url"
            value={formData.systemData.characterSheetLink}
            onChange={(e) => handleSystemDataChange('characterSheetLink', e.target.value)}
            placeholder="https://..."
          />
          <small className="form-hint">
            Link to an external character sheet (optional)
          </small>
        </div>
      </div>

      {/* Attributes Section */}
      <div className="form-section">
        <div className="section-header">
          <h3>Attributes</h3>
          <button type="button" onClick={addAttribute} className="btn btn-sm btn-secondary">
            <Plus size={16} /> Add Attribute
          </button>
        </div>

        <div className="dynamic-fields-grid">
          {formData.systemData.attributes.map((attr, index) => (
            <div key={index} className="dynamic-field-row">
              <input
                type="text"
                value={attr.name}
                onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                placeholder="Attribute Name"
                className="field-name"
              />
              <input
                type="number"
                value={attr.value}
                onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                placeholder="Value"
                className="field-value"
              />
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                className="btn btn-icon btn-danger-ghost"
                title="Remove attribute"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Section */}
      <div className="form-section">
        <div className="section-header">
          <h3>Skills</h3>
          <button type="button" onClick={addSkill} className="btn btn-sm btn-secondary">
            <Plus size={16} /> Add Skill
          </button>
        </div>

        {formData.systemData.skills.length === 0 ? (
          <p className="empty-state">No skills added yet. Click "Add Skill" to get started.</p>
        ) : (
          <div className="dynamic-fields-grid">
            {formData.systemData.skills.map((skill, index) => (
              <div key={index} className="dynamic-field-row">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(index, 'name', e.target.value)}
                  placeholder="Skill Name"
                  className="field-name"
                />
                <input
                  type="number"
                  value={skill.value}
                  onChange={(e) => updateSkill(index, 'value', e.target.value)}
                  placeholder="Bonus"
                  className="field-value"
                />
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="btn btn-icon btn-danger-ghost"
                  title="Remove skill"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Abilities Section */}
      <div className="form-section">
        <div className="section-header">
          <h3>Special Abilities/Powers</h3>
          <button type="button" onClick={addAbility} className="btn btn-sm btn-secondary">
            <Plus size={16} /> Add Ability
          </button>
        </div>

        {formData.systemData.abilities.length === 0 ? (
          <p className="empty-state">No abilities added yet. Click "Add Ability" to get started.</p>
        ) : (
          <div className="abilities-list">
            {formData.systemData.abilities.map((ability, index) => (
              <div key={index} className="ability-field">
                <div className="ability-header">
                  <input
                    type="text"
                    value={ability.name}
                    onChange={(e) => updateAbility(index, 'name', e.target.value)}
                    placeholder="Ability Name"
                    className="ability-name"
                  />
                  <button
                    type="button"
                    onClick={() => removeAbility(index)}
                    className="btn btn-icon btn-danger-ghost"
                    title="Remove ability"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <textarea
                  value={ability.description}
                  onChange={(e) => updateAbility(index, 'description', e.target.value)}
                  placeholder="Describe what this ability does..."
                  rows="3"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vitals Section */}
      <div className="form-section">
        <h3>Vitals</h3>

        <div className="form-row">
          <div className="input-group">
            <label>Current HP</label>
            <input
              type="number"
              value={formData.systemData.hp}
              onChange={(e) => handleSystemDataChange('hp', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div className="input-group">
            <label>Max HP</label>
            <input
              type="number"
              value={formData.systemData.maxHp}
              onChange={(e) => handleSystemDataChange('maxHp', parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>

          <div className="input-group">
            <label>Armor Class/Defense</label>
            <input
              type="number"
              value={formData.systemData.armorClass}
              onChange={(e) => handleSystemDataChange('armorClass', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="form-section">
        <h3>Background & Notes</h3>

        <div className="input-group">
          <label>Background</label>
          <textarea
            value={formData.systemData.background}
            onChange={(e) => handleSystemDataChange('background', e.target.value)}
            placeholder="Character backstory, personality, appearance..."
            rows="4"
          />
        </div>

        <div className="input-group">
          <label>Equipment & Inventory</label>
          <textarea
            value={formData.systemData.equipment}
            onChange={(e) => handleSystemDataChange('equipment', e.target.value)}
            placeholder="Weapons, armor, items..."
            rows="4"
          />
        </div>

        <div className="input-group">
          <label>Player Notes</label>
          <textarea
            value={formData.systemData.playerNotes}
            onChange={(e) => handleSystemDataChange('playerNotes', e.target.value)}
            placeholder="Campaign notes, goals, reminders..."
            rows="4"
          />
        </div>
      </div>

      {/* Backstory */}
      <div className="input-group">
        <label>Backstory (Additional)</label>
        <textarea
          value={formData.backstory}
          onChange={(e) => handleChange('backstory', e.target.value)}
          placeholder="Extended character story and motivations..."
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
