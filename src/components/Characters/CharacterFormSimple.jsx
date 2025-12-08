import { useState } from 'react';
import { Save, X, ExternalLink } from 'lucide-react';
import './CharacterForm.css';

export default function CharacterFormSimple({ character, onSave, onCancel, isDM }) {
  const [formData, setFormData] = useState(character || {
    name: '',
    demiplaneLink: '',
    playerNotes: '',
    backstory: '',
    dmNotes: ''
  });

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="character-form character-form-simple" onSubmit={handleSubmit}>
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
        <label>
          Demiplane Character Sheet Link *
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
          required
        />
        <small className="input-hint">
          Create your character on Demiplane, then paste the link here. All stats will be managed there.
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
