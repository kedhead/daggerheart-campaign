import { useState, useEffect } from 'react';
import { Save, X, Backpack } from 'lucide-react';
import { EQUIPMENT_CATEGORIES } from '../../../data/systems/daggerheart';
import '../ItemsView.css';

export default function DaggerheartEquipmentForm({ item, formData, setFormData, onSave, onCancel, onChangeType, isDM }) {
  const [localData, setLocalData] = useState({
    name: formData?.name || item?.name || '',
    description: formData?.description || item?.description || '',
    hidden: formData?.hidden || item?.hidden || false,
    type: 'equipment',
    systemData: {
      category: item?.systemData?.category || 'utility',
      mechanicalEffect: item?.systemData?.mechanicalEffect || '',
      activation: item?.systemData?.activation || '',
      uses: item?.systemData?.uses ?? -1,
      hopeCost: item?.systemData?.hopeCost || 0,
      stressCost: item?.systemData?.stressCost || 0
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(localData);
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Item Type</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="item-type-badge equipment" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Backpack size={16} />
            Equipment
          </span>
          <button type="button" className="btn btn-ghost" onClick={onChangeType}>
            Change Type
          </button>
        </div>
      </div>

      <div className="input-group">
        <label>Item Name *</label>
        <input
          type="text"
          value={localData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Potion of Healing, Rope of Climbing"
          required
        />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Category *</label>
          <select
            value={localData.systemData.category}
            onChange={(e) => handleSystemDataChange('category', e.target.value)}
            required
          >
            {EQUIPMENT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Activation</label>
          <input
            type="text"
            value={localData.systemData.activation}
            onChange={(e) => handleSystemDataChange('activation', e.target.value)}
            placeholder="e.g., Action, Reaction, Once per rest"
          />
        </div>
      </div>

      <div className="form-row-3">
        <div className="input-group">
          <label>Uses</label>
          <input
            type="number"
            value={localData.systemData.uses}
            onChange={(e) => handleSystemDataChange('uses', parseInt(e.target.value))}
            min="-1"
            max="99"
          />
          <small className="form-hint">-1 for unlimited</small>
        </div>

        <div className="input-group">
          <label>Hope Cost</label>
          <input
            type="number"
            value={localData.systemData.hopeCost}
            onChange={(e) => handleSystemDataChange('hopeCost', parseInt(e.target.value) || 0)}
            min="0"
            max="10"
          />
        </div>

        <div className="input-group">
          <label>Stress Cost</label>
          <input
            type="number"
            value={localData.systemData.stressCost}
            onChange={(e) => handleSystemDataChange('stressCost', parseInt(e.target.value) || 0)}
            min="0"
            max="10"
          />
        </div>
      </div>

      <div className="input-group">
        <label>Mechanical Effect</label>
        <textarea
          value={localData.systemData.mechanicalEffect}
          onChange={(e) => handleSystemDataChange('mechanicalEffect', e.target.value)}
          placeholder="Describe the mechanical effect of this item when used..."
          rows={4}
        />
        <small className="form-hint">e.g., "Heal 2d6 HP" or "Gain advantage on next Agility roll"</small>
      </div>

      <div className="input-group">
        <label>Description</label>
        <textarea
          value={localData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the item's appearance, lore, or flavor..."
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
          Save Item
        </button>
      </div>
    </form>
  );
}
