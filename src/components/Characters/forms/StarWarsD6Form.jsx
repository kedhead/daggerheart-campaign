import { useState } from 'react';
import { getGameSystem } from '../../../data/systems/index.js';

export default function StarWarsD6Form({ character, onSave, onCancel, isDM }) {
  const gameSystem = getGameSystem('starwarsd6');

  const [formData, setFormData] = useState(character || {
    name: '',
    playerName: '',
    avatarUrl: '',
    level: 1,
    systemData: {
      characterSheetLink: '',
      template: '',
      species: '',
      forceSensitive: false,
      playerNotes: ''
    },
    backstory: '',
    demiplaneLink: '',
    dmNotes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateSystemData = (field, value) => {
    setFormData({
      ...formData,
      systemData: {
        ...formData.systemData,
        [field]: value
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="character-form">
      <div className="form-section">
        <h3>Basic Information</h3>

        <div className="input-group">
          <label>Character Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label>Player Name *</label>
          <input
            type="text"
            value={formData.playerName}
            onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label>Avatar URL</label>
          <input
            type="url"
            value={formData.avatarUrl}
            onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Star Wars D6 Details</h3>

        <div className="input-group">
          <label>Species</label>
          <select
            value={formData.systemData.species}
            onChange={(e) => updateSystemData('species', e.target.value)}
          >
            <option value="">Select Species</option>
            {gameSystem.species.map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Template/Class</label>
          <select
            value={formData.systemData.template}
            onChange={(e) => updateSystemData('template', e.target.value)}
          >
            <option value="">Select Template</option>
            {gameSystem.templates.map(template => (
              <option key={template} value={template}>{template}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={formData.systemData.forceSensitive}
              onChange={(e) => updateSystemData('forceSensitive', e.target.checked)}
              style={{ width: 'auto', margin: 0 }}
            />
            Force Sensitive
          </label>
        </div>

        <div className="input-group">
          <label>Character Sheet Link</label>
          <input
            type="url"
            value={formData.systemData.characterSheetLink}
            onChange={(e) => updateSystemData('characterSheetLink', e.target.value)}
            placeholder="https://... (optional external character sheet)"
          />
          <small style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Link to your external character sheet (if using one)
          </small>
        </div>

        <div className="input-group">
          <label>Player Notes</label>
          <textarea
            value={formData.systemData.playerNotes}
            onChange={(e) => updateSystemData('playerNotes', e.target.value)}
            placeholder="Quick notes about your character..."
            rows="4"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Additional Details</h3>

        <div className="input-group">
          <label>Backstory</label>
          <textarea
            value={formData.backstory}
            onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
            rows="5"
            placeholder="Your character's history and background..."
          />
        </div>

        {isDM && (
          <div className="input-group">
            <label>DM Notes (Private)</label>
            <textarea
              value={formData.dmNotes}
              onChange={(e) => setFormData({ ...formData, dmNotes: e.target.value })}
              rows="4"
              placeholder="Private notes only visible to the DM..."
            />
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Character
        </button>
      </div>
    </form>
  );
}
