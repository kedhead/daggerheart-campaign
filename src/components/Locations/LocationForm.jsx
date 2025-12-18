import { useState } from 'react';
import { Save, X } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './LocationsView.css';

export default function LocationForm({ location, onSave, onCancel, campaign, entities }) {
  const { search } = useEntityRegistry(campaign, entities);
  const [formData, setFormData] = useState(location || {
    name: '',
    type: 'town',
    region: '',
    description: '',
    notableFeatures: '',
    inhabitants: '',
    secrets: ''
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
    <form className="location-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Location Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Riverdale, The Dark Woods"
          required
        />
      </div>

      <div className="input-group">
        <label>Type *</label>
        <select
          value={formData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          required
        >
          <option value="city">City</option>
          <option value="town">Town</option>
          <option value="village">Village</option>
          <option value="dungeon">Dungeon</option>
          <option value="wilderness">Wilderness</option>
          <option value="landmark">Landmark</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="input-group">
        <label>Region</label>
        <input
          type="text"
          value={formData.region}
          onChange={(e) => handleChange('region', e.target.value)}
          placeholder="e.g., The Northern Kingdoms, Eastern Coast"
        />
      </div>

      <div className="input-group">
        <label>Description</label>
        <WikiLinkInput
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          searchEntities={search}
          placeholder="General description of the location... Type [[ to link entities"
          rows={4}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>Notable Features</label>
        <WikiLinkInput
          value={formData.notableFeatures}
          onChange={(e) => handleChange('notableFeatures', e.target.value)}
          searchEntities={search}
          placeholder="Important landmarks, buildings, or features... Type [[ to link entities"
          rows={3}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>Inhabitants</label>
        <input
          type="text"
          value={formData.inhabitants}
          onChange={(e) => handleChange('inhabitants', e.target.value)}
          placeholder="e.g., Mostly humans, Some elves, Goblin tribe"
        />
      </div>

      <div className="input-group">
        <label>Secrets</label>
        <WikiLinkInput
          value={formData.secrets}
          onChange={(e) => handleChange('secrets', e.target.value)}
          searchEntities={search}
          placeholder="Hidden information about this location... Type [[ to link entities"
          rows={3}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save Location
        </button>
      </div>
    </form>
  );
}
