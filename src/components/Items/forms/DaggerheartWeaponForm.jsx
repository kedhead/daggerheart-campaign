import { useState, useEffect } from 'react';
import { Save, X, Sword } from 'lucide-react';
import { WEAPON_FEATURES } from '../../../data/systems/daggerheart';
import '../ItemsView.css';

const TRAITS = [
  { value: 'agility', label: 'Agility' },
  { value: 'strength', label: 'Strength' },
  { value: 'finesse', label: 'Finesse' },
  { value: 'instinct', label: 'Instinct' },
  { value: 'presence', label: 'Presence' },
  { value: 'knowledge', label: 'Knowledge' }
];

const RANGES = [
  { value: 'melee', label: 'Melee' },
  { value: 'close', label: 'Close' },
  { value: 'far', label: 'Far' },
  { value: 'very far', label: 'Very Far' }
];

const DICE_OPTIONS = ['d4', 'd6', 'd8', 'd10', 'd12'];

export default function DaggerheartWeaponForm({ item, formData, setFormData, onSave, onCancel, onChangeType, isDM }) {
  const [localData, setLocalData] = useState({
    name: formData?.name || item?.name || '',
    description: formData?.description || item?.description || '',
    hidden: formData?.hidden || item?.hidden || false,
    type: 'weapon',
    systemData: {
      classification: item?.systemData?.classification || 'primary',
      damageType: item?.systemData?.damageType || 'physical',
      trait: item?.systemData?.trait || 'strength',
      range: item?.systemData?.range || 'melee',
      burden: item?.systemData?.burden || 'one-handed',
      damageTier1Dice: item?.systemData?.damageTier1Dice || 'd8',
      damageTier1Modifier: item?.systemData?.damageTier1Modifier || 0,
      damageTier2Dice: item?.systemData?.damageTier2Dice || 'd8',
      damageTier2Modifier: item?.systemData?.damageTier2Modifier || 3,
      damageTier3Dice: item?.systemData?.damageTier3Dice || 'd8',
      damageTier3Modifier: item?.systemData?.damageTier3Modifier || 6,
      damageTier4Dice: item?.systemData?.damageTier4Dice || 'd8',
      damageTier4Modifier: item?.systemData?.damageTier4Modifier || 9,
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
          <span className="item-type-badge weapon" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sword size={16} />
            Weapon
          </span>
          <button type="button" className="btn btn-ghost" onClick={onChangeType}>
            Change Type
          </button>
        </div>
      </div>

      <div className="input-group">
        <label>Weapon Name *</label>
        <input
          type="text"
          value={localData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Flamebound Greatsword"
          required
        />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Classification *</label>
          <select
            value={localData.systemData.classification}
            onChange={(e) => handleSystemDataChange('classification', e.target.value)}
            required
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>

        <div className="input-group">
          <label>Damage Type *</label>
          <select
            value={localData.systemData.damageType}
            onChange={(e) => handleSystemDataChange('damageType', e.target.value)}
            required
          >
            <option value="physical">Physical</option>
            <option value="magical">Magical</option>
          </select>
        </div>
      </div>

      <div className="form-row-3">
        <div className="input-group">
          <label>Attack Trait *</label>
          <select
            value={localData.systemData.trait}
            onChange={(e) => handleSystemDataChange('trait', e.target.value)}
            required
          >
            {TRAITS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Range *</label>
          <select
            value={localData.systemData.range}
            onChange={(e) => handleSystemDataChange('range', e.target.value)}
            required
          >
            {RANGES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Burden *</label>
          <select
            value={localData.systemData.burden}
            onChange={(e) => handleSystemDataChange('burden', e.target.value)}
            required
          >
            <option value="one-handed">One-Handed</option>
            <option value="two-handed">Two-Handed</option>
          </select>
        </div>
      </div>

      <div className="tier-damage-section">
        <h4>Damage by Tier</h4>
        <div className="tier-damage-grid">
          {[1, 2, 3, 4].map(tier => (
            <div key={tier} className="tier-input">
              <label>Tier {tier}</label>
              <div className="inputs">
                <select
                  value={localData.systemData[`damageTier${tier}Dice`]}
                  onChange={(e) => handleSystemDataChange(`damageTier${tier}Dice`, e.target.value)}
                >
                  {DICE_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={localData.systemData[`damageTier${tier}Modifier`]}
                  onChange={(e) => handleSystemDataChange(`damageTier${tier}Modifier`, parseInt(e.target.value) || 0)}
                  min="0"
                  max="20"
                  placeholder="+0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label>Features</label>
        <div className="features-multiselect">
          {WEAPON_FEATURES.map(feature => (
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
      </div>

      <div className="input-group">
        <label>Description</label>
        <textarea
          value={localData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the weapon's appearance, history, or special properties..."
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
          Save Weapon
        </button>
      </div>
    </form>
  );
}
