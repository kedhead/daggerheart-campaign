import { useState } from 'react';
import { Save, X, TreePine, Play } from 'lucide-react';
import BPCalculator, { calculateUsedBP, calculateBPBudget } from './BPCalculator';
import AdversaryPicker from './AdversaryPicker';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './EncounterBuilder.css';

export default function EncounterBuilder({
  encounter,
  onSave,
  onCancel,
  campaign,
  adversaries = [],
  environments = [],
  characters = [],
  entities,
  isDM
}) {
  const { search } = useEntityRegistry(campaign, entities);
  const characterCount = characters.length;

  const [formData, setFormData] = useState(encounter || {
    name: '',
    description: '',
    environmentId: '',
    adversarySlots: [],
    partySize: characterCount || 4,
    tactics: '',
    rewards: '',
    hidden: false
  });

  // Calculate BP values
  const usedBP = calculateUsedBP(formData.adversarySlots, adversaries);
  const budget = calculateBPBudget(formData.partySize);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      calculatedBP: budget,
      usedBP: usedBP
    });
  };

  // Get selected environment details
  const selectedEnvironment = environments.find(e => e.id === formData.environmentId);

  return (
    <form className="encounter-builder" onSubmit={handleSubmit}>
      {/* Basic Info */}
      <div className="builder-section">
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

        <div className="input-group">
          <label>Description</label>
          <WikiLinkInput
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            searchEntities={search}
            placeholder="Brief setup description... Type [[ to link entities"
            rows={3}
          />
        </div>
      </div>

      {/* BP Calculator */}
      <div className="builder-section">
        <BPCalculator
          partySize={formData.partySize}
          setPartySize={(size) => handleChange('partySize', size)}
          usedBP={usedBP}
          characterCount={characterCount}
        />
      </div>

      {/* Environment Selection */}
      <div className="builder-section">
        <div className="section-header">
          <h4>
            <TreePine size={18} />
            Environment
          </h4>
        </div>

        {environments.length === 0 ? (
          <div className="empty-section-note">
            <p>No environments in catalog</p>
            <small>Import or create environments first</small>
          </div>
        ) : (
          <div className="input-group">
            <select
              value={formData.environmentId}
              onChange={(e) => handleChange('environmentId', e.target.value)}
            >
              <option value="">-- Select Environment (Optional) --</option>
              {[1, 2, 3, 4].map(tier => {
                const tierEnvs = environments.filter(e => e.tier === tier);
                if (tierEnvs.length === 0) return null;
                return (
                  <optgroup key={tier} label={`Tier ${tier}`}>
                    {tierEnvs.map(env => (
                      <option key={env.id} value={env.id}>
                        {env.name} ({env.type}, DC {env.difficulty})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        )}

        {selectedEnvironment && (
          <div className="selected-environment-preview">
            <div className="env-preview-header">
              <span className="env-name">{selectedEnvironment.name}</span>
              <span className="env-meta">
                T{selectedEnvironment.tier} • {selectedEnvironment.type} • DC {selectedEnvironment.difficulty}
              </span>
            </div>
            <p className="env-desc">{selectedEnvironment.description}</p>
            {selectedEnvironment.features?.length > 0 && (
              <div className="env-features-count">
                {selectedEnvironment.features.length} feature{selectedEnvironment.features.length !== 1 ? 's' : ''} available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adversary Picker */}
      <div className="builder-section">
        <AdversaryPicker
          adversarySlots={formData.adversarySlots}
          setAdversarySlots={(slots) => handleChange('adversarySlots', slots)}
          adversaries={adversaries}
        />
      </div>

      {/* Additional Fields */}
      <div className="builder-section">
        <div className="input-group">
          <label>Tactics</label>
          <WikiLinkInput
            value={formData.tactics}
            onChange={(e) => handleChange('tactics', e.target.value)}
            searchEntities={search}
            placeholder="How enemies behave in combat..."
            rows={3}
          />
        </div>

        <div className="input-group">
          <label>Rewards</label>
          <WikiLinkInput
            value={formData.rewards}
            onChange={(e) => handleChange('rewards', e.target.value)}
            searchEntities={search}
            placeholder="Loot, experience, story rewards..."
            rows={2}
          />
        </div>
      </div>

      {/* Visibility */}
      {isDM && (
        <div className="builder-section">
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.hidden}
                onChange={(e) => handleChange('hidden', e.target.checked)}
              />
              <span>Hidden from Players</span>
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
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
