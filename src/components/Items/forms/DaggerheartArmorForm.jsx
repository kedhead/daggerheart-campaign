import { useState, useEffect } from 'react';
import { Save, X, Shield, Plus, Trash2 } from 'lucide-react';
import { ARMOR_FEATURES } from '../../../data/systems/daggerheart';
import { splitFeatures, toggleStandardFeature, hasFeatureName, featureNameList, promoteUnknownFeatures } from '../../../utils/itemFeatures';
import '../ItemsView.css';

export default function DaggerheartArmorForm({ item, formData, setFormData, onSave, onCancel, onChangeType, isDM }) {
  // Fix for legacy database items exported with the buggy default of 6 slots
  const initialArmorScore = item?.systemData?.armorScore || 2;
  const initialFeatures = promoteUnknownFeatures(item?.systemData?.features);
  let initialArmorSlots = item?.systemData?.armorSlots || initialArmorScore;

  if (initialArmorSlots === 6 && initialArmorScore !== 6 && !hasFeatureName(initialFeatures, 'Fortified')) {
    initialArmorSlots = initialArmorScore;
  }

  const initialThresholds = item?.systemData?.thresholds || {};

  const [localData, setLocalData] = useState({
    name: formData?.name || item?.name || '',
    description: formData?.description || item?.description || '',
    hidden: formData?.hidden || item?.hidden || false,
    type: 'armor',
    systemData: {
      armorScore: initialArmorScore,
      armorSlots: initialArmorSlots,
      tier: item?.systemData?.tier || 1,
      rarity: item?.systemData?.rarity || '',
      features: initialFeatures,
      // Per Daggerheart core rules: armor prints Major/Severe bases; the
      // sheet adds character level to produce the final thresholds.
      // (Legacy field naming: `minor` stores Major base, `major` stores Severe.)
      thresholds: {
        minor: initialThresholds.minor ?? 0,
        major: initialThresholds.major ?? 0
      }
    }
  });

  useEffect(() => {
    setFormData(localData);
  }, [localData]);

  const handleChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSystemDataChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      systemData: {
        ...prev.systemData,
        [field]: value
      }
    }));
  };

  const handleThresholdChange = (key, value) => {
    setLocalData(prev => ({
      ...prev,
      systemData: {
        ...prev.systemData,
        thresholds: {
          ...(prev.systemData.thresholds || {}),
          [key]: parseInt(value, 10) || 0
        }
      }
    }));
  };

  const toggleFeature = (feature) => {
    handleSystemDataChange('features', toggleStandardFeature(localData.systemData.features, feature));
  };

  const addCustomFeature = () => {
    const current = localData.systemData.features || [];
    handleSystemDataChange('features', [...current, { name: '', description: '' }]);
  };

  const updateCustomFeature = (index, field, value) => {
    const current = localData.systemData.features || [];
    const customIndexes = current
      .map((f, i) => (f && typeof f === 'object' ? i : -1))
      .filter(i => i >= 0);
    const target = customIndexes[index];
    if (target === undefined) return;
    const next = [...current];
    next[target] = { ...next[target], [field]: value };
    handleSystemDataChange('features', next);
  };

  const removeCustomFeature = (index) => {
    const current = localData.systemData.features || [];
    const customIndexes = current
      .map((f, i) => (f && typeof f === 'object' ? i : -1))
      .filter(i => i >= 0);
    const target = customIndexes[index];
    if (target === undefined) return;
    handleSystemDataChange('features', current.filter((_, i) => i !== target));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localData);
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Item Type</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="item-type-badge armor" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} />
            Armor
          </span>
          <button type="button" className="btn btn-ghost" onClick={onChangeType}>
            Change Type
          </button>
        </div>
      </div>

      <div className="input-group">
        <label>Armor Name *</label>
        <input
          type="text"
          value={localData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Dragonscale Platemail"
          required
        />
      </div>

      <div className="form-row-3">
        <div className="input-group">
          <label>Armor Score *</label>
          <input
            type="number"
            value={localData.systemData.armorScore}
            onChange={(e) => handleSystemDataChange('armorScore', parseInt(e.target.value) || 0)}
            min="0"
            max="15"
            required
          />
          <small className="form-hint">Damage reduced when marking armor slot</small>
        </div>

        <div className="input-group">
          <label>Armor Slots *</label>
          <input
            type="number"
            value={localData.systemData.armorSlots}
            onChange={(e) => handleSystemDataChange('armorSlots', parseInt(e.target.value) || localData.systemData.armorScore)}
            min="1"
            max="12"
            required
          />
          <small className="form-hint">Number of times armor can be used</small>
        </div>

        <div className="input-group">
          <label>Tier *</label>
          <select
            value={localData.systemData.tier}
            onChange={(e) => handleSystemDataChange('tier', parseInt(e.target.value))}
            required
          >
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
            <option value={3}>Tier 3</option>
            <option value={4}>Tier 4</option>
          </select>
        </div>
      </div>

      <div className="input-group">
        <label>Rarity</label>
        <select
          value={localData.systemData.rarity || ''}
          onChange={(e) => handleSystemDataChange('rarity', e.target.value)}
        >
          <option value="">— None —</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="legendary">Legendary</option>
          <option value="relic">Relic</option>
        </select>
        <small className="form-hint">Use Relic for unique story items like the Bog-Song Aegis</small>
      </div>

      <div className="form-row-3">
        <div className="input-group">
          <label>Major Threshold Base</label>
          <input
            type="number"
            value={localData.systemData.thresholds?.minor ?? 0}
            onChange={(e) => handleThresholdChange('minor', e.target.value)}
            min="0"
            max="99"
          />
          <small className="form-hint">Sheet adds character level (e.g. Chainmail = 7)</small>
        </div>
        <div className="input-group">
          <label>Severe Threshold Base</label>
          <input
            type="number"
            value={localData.systemData.thresholds?.major ?? 0}
            onChange={(e) => handleThresholdChange('major', e.target.value)}
            min="0"
            max="99"
          />
          <small className="form-hint">Sheet adds character level (e.g. Chainmail = 15)</small>
        </div>
        <div className="input-group" />
      </div>

      <div className="input-group">
        <label>Standard Features</label>
        <div className="features-multiselect">
          {ARMOR_FEATURES.map(feature => (
            <label
              key={feature}
              className={`feature-checkbox ${hasFeatureName(localData.systemData.features, feature) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={hasFeatureName(localData.systemData.features, feature)}
                onChange={() => toggleFeature(feature)}
              />
              {feature}
            </label>
          ))}
        </div>
        <small className="form-hint">
          Deflecting: Evasion bonus • Sheltering: Protects allies • Barrier: +5 score, -1 evasion • Resilient: Chance to save last slot
        </small>
      </div>

      <div className="input-group">
        <div className="custom-features-header">
          <label>Custom Features</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addCustomFeature}>
            <Plus size={14} /> Add Feature
          </button>
        </div>
        <small className="form-hint">
          Unique named abilities — e.g. "Ever-Damp: +1 Evasion vs. fire or physical grabs."
        </small>
        <div className="custom-features-list">
          {splitFeatures(localData.systemData.features).custom.map((feat, idx) => (
            <div key={idx} className="custom-feature-row">
              <input
                type="text"
                value={feat.name}
                onChange={(e) => updateCustomFeature(idx, 'name', e.target.value)}
                placeholder="Feature name"
                className="custom-feature-name"
              />
              <textarea
                value={feat.description}
                onChange={(e) => updateCustomFeature(idx, 'description', e.target.value)}
                placeholder="Mechanical effect or description"
                rows={2}
                className="custom-feature-desc"
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeCustomFeature(idx)}
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label>Description</label>
        <textarea
          value={localData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the armor's appearance, history, or special properties..."
          rows={3}
        />
      </div>

      {isDM && (
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={localData.hidden}
              onChange={(e) => handleChange('hidden', e.target.checked)}
            />
            <span>Hidden from Players</span>
          </label>
          <small className="form-hint">Players won't see this item until you reveal it</small>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save Armor
        </button>
      </div>
    </form>
  );
}
