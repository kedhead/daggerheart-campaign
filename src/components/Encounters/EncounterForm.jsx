import { useState } from 'react';
import { Save, X, ExternalLink } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './EncountersView.css';

export default function EncounterForm({ encounter, onSave, onCancel, campaign, entities, isDM }) {
  const { search } = useEntityRegistry(campaign, entities);
  const [formData, setFormData] = useState(encounter || {
    name: '',
    difficulty: 'medium',
    partyLevel: '',
    description: '',
    enemies: '',
    environment: '',
    tactics: '',
    rewards: '',
    freshcutgrassLink: '',
    hidden: false
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
    <form className="encounter-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Encounter Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Goblin Ambush, Dragon's Lair"
          required
        />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Difficulty *</label>
          <select
            value={formData.difficulty}
            onChange={(e) => handleChange('difficulty', e.target.value)}
            required
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="deadly">Deadly</option>
          </select>
        </div>

        <div className="input-group">
          <label>Party Level</label>
          <input
            type="number"
            value={formData.partyLevel}
            onChange={(e) => handleChange('partyLevel', e.target.value)}
            placeholder="e.g., 3"
            min="1"
            max="20"
          />
        </div>
      </div>

      <div className="input-group">
        <label>Description</label>
        <WikiLinkInput
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          searchEntities={search}
          placeholder="Brief description of the encounter setup... Type [[ to link entities"
          rows={3}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>Enemies</label>
        <WikiLinkInput
          value={formData.enemies}
          onChange={(e) => handleChange('enemies', e.target.value)}
          searchEntities={search}
          placeholder="List enemies and their quantities, e.g., '3x Goblin Warriors, 1x Goblin Shaman'... Type [[ to link entities"
          rows={4}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>Environment</label>
        <input
          type="text"
          value={formData.environment}
          onChange={(e) => handleChange('environment', e.target.value)}
          placeholder="e.g., Forest clearing, Cave entrance, Ruined castle"
        />
      </div>

      <div className="input-group">
        <label>Tactics</label>
        <WikiLinkInput
          value={formData.tactics}
          onChange={(e) => handleChange('tactics', e.target.value)}
          searchEntities={search}
          placeholder="How enemies behave in combat, special strategies... Type [[ to link entities"
          rows={3}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>Rewards</label>
        <WikiLinkInput
          value={formData.rewards}
          onChange={(e) => handleChange('rewards', e.target.value)}
          searchEntities={search}
          placeholder="Loot, experience, story rewards... Type [[ to link entities"
          rows={2}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>
          <ExternalLink size={16} />
          FreshCutGrass Link
        </label>
        <input
          type="url"
          value={formData.freshcutgrassLink}
          onChange={(e) => handleChange('freshcutgrassLink', e.target.value)}
          placeholder="https://freshcutgrass.app/encounter/..."
        />
        <small className="input-hint">
          Link to the full encounter on FreshCutGrass for detailed stats
        </small>
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
          <small className="form-hint">Players won't see this encounter until you reveal it</small>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save Encounter
        </button>
      </div>
    </form>
  );
}
