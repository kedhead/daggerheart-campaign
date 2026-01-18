import { useState, useEffect } from 'react';
import { Save, X, Shield } from 'lucide-react';
import { ARMOR_FEATURES } from '../../../data/systems/daggerheart';
import '../ItemsView.css';

export default function DaggerheartArmorForm({ item, formData, setFormData, onSave, onCancel, onChangeType, isDM }) {
  const [localData, setLocalData] = useState({
    name: formData?.name || item?.name || '',
    description: formData?.description || item?.description || '',
    hidden: formData?.hidden || item?.hidden || false,
    type: 'armor',
    systemData: {
      armorScore: item?.systemData?.armorScore || 2,
      armorSlots: item?.systemData?.armorSlots || 6,
      tier: item?.systemData?.tier || 1,
      features: item?.systemData?.features || []
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

  const toggleFeature = (feature) => {
    const features = localData.systemData.features || [];
    const newFeatures = features.includes(feature)
      ? features.filter(f => f !== feature)
      : [...features, feature];
    handleSystemDataChange('features', newFeatures);
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
            onChange={(e) => handleSystemDataChange('armorSlots', parseInt(e.target.value) || 6)}
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
        <label>Features</label>
        <div className="features-multiselect">
          {ARMOR_FEATURES.map(feature => (
            <label
              key={feature}
              className={`feature-checkbox ${localData.systemData.features?.includes(feature) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={localData.systemData.features?.includes(feature) || false}
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
