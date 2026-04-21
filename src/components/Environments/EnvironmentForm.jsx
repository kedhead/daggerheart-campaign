import { useState } from 'react';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { ENVIRONMENT_TYPES } from '../../data/daggerheartEnvironments';

const FEATURE_TYPES = ['passive', 'hazard', 'action', 'encounter'];

const emptyEnvironment = {
  name: '',
  tier: 1,
  type: 'exploration',
  difficulty: 11,
  description: '',
  impulses: [],
  features: [],
  potentialAdversaries: [],
  hidden: false,
  isOfficial: false
};

export default function EnvironmentForm({ environment, onSave, onCancel, isDM }) {
  const [formData, setFormData] = useState(() => {
    if (!environment) return { ...emptyEnvironment };
    return {
      ...emptyEnvironment,
      ...environment,
      impulses: environment.impulses ? [...environment.impulses] : [],
      features: environment.features ? environment.features.map(f => ({ ...f })) : [],
      potentialAdversaries: environment.potentialAdversaries ? [...environment.potentialAdversaries] : []
    };
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Impulses helpers
  const addImpulse = () => {
    setFormData(prev => ({ ...prev, impulses: [...prev.impulses, ''] }));
  };
  const updateImpulse = (idx, value) => {
    setFormData(prev => {
      const impulses = [...prev.impulses];
      impulses[idx] = value;
      return { ...prev, impulses };
    });
  };
  const removeImpulse = (idx) => {
    setFormData(prev => ({ ...prev, impulses: prev.impulses.filter((_, i) => i !== idx) }));
  };

  // Features helpers
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { name: '', type: 'passive', description: '', cost: '' }]
    }));
  };
  const updateFeature = (idx, field, value) => {
    setFormData(prev => {
      const features = [...prev.features];
      features[idx] = { ...features[idx], [field]: value };
      return { ...prev, features };
    });
  };
  const removeFeature = (idx) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  // Potential adversaries helpers
  const addAdversary = () => {
    setFormData(prev => ({ ...prev, potentialAdversaries: [...prev.potentialAdversaries, ''] }));
  };
  const updateAdversary = (idx, value) => {
    setFormData(prev => {
      const arr = [...prev.potentialAdversaries];
      arr[idx] = value;
      return { ...prev, potentialAdversaries: arr };
    });
  };
  const removeAdversary = (idx) => {
    setFormData(prev => ({
      ...prev,
      potentialAdversaries: prev.potentialAdversaries.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = {
      ...formData,
      impulses: formData.impulses.map(s => s.trim()).filter(Boolean),
      potentialAdversaries: formData.potentialAdversaries.map(s => s.trim()).filter(Boolean),
      features: formData.features
        .filter(f => f.name?.trim() || f.description?.trim())
        .map(f => {
          const out = {
            name: (f.name || '').trim(),
            type: f.type || 'passive',
            description: (f.description || '').trim()
          };
          if (f.cost && f.cost.trim()) out.cost = f.cost.trim();
          return out;
        })
    };
    onSave(cleaned);
  };

  return (
    <form className="environment-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Environment Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., The Whispering Vault"
          required
        />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Tier *</label>
          <select value={formData.tier} onChange={(e) => handleChange('tier', parseInt(e.target.value))}>
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
            <option value={3}>Tier 3</option>
            <option value={4}>Tier 4</option>
          </select>
        </div>

        <div className="input-group">
          <label>Type *</label>
          <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)}>
            {ENVIRONMENT_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Difficulty</label>
          <input
            type="number"
            min="0"
            value={formData.difficulty}
            onChange={(e) => handleChange('difficulty', parseInt(e.target.value) || 0)}
            placeholder="e.g., 13"
          />
          <small className="form-hint">0 to hide DC badge</small>
        </div>
      </div>

      <div className="input-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief overview of the environment..."
          rows={3}
        />
      </div>

      {/* Impulses */}
      <div className="input-group">
        <div className="custom-features-header">
          <label>Impulses</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addImpulse}>
            <Plus size={14} /> Add Impulse
          </button>
        </div>
        <small className="form-hint">GM guidance for running the environment (e.g., "Draw in the curious")</small>
        {formData.impulses.length > 0 && (
          <div className="custom-features-list">
            {formData.impulses.map((impulse, i) => (
              <div key={i} className="custom-feature-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <input
                  type="text"
                  value={impulse}
                  onChange={(e) => updateImpulse(i, e.target.value)}
                  placeholder="e.g., Echo historical events"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm danger"
                  onClick={() => removeImpulse(i)}
                  title="Remove impulse"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="input-group">
        <div className="custom-features-header">
          <label>Features</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addFeature}>
            <Plus size={14} /> Add Feature
          </button>
        </div>
        <small className="form-hint">Mechanical effects, hazards, actions, or encounters</small>
        {formData.features.length > 0 && (
          <div className="custom-features-list">
            {formData.features.map((feature, i) => (
              <div key={i} className="environment-feature-editor">
                <div className="environment-feature-row">
                  <input
                    type="text"
                    value={feature.name}
                    onChange={(e) => updateFeature(i, 'name', e.target.value)}
                    placeholder="Feature name"
                  />
                  <select
                    value={feature.type}
                    onChange={(e) => updateFeature(i, 'type', e.target.value)}
                  >
                    {FEATURE_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={feature.cost || ''}
                    onChange={(e) => updateFeature(i, 'cost', e.target.value)}
                    placeholder="Cost (optional, e.g., 1 Fear)"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm danger"
                    onClick={() => removeFeature(i)}
                    title="Remove feature"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(i, 'description', e.target.value)}
                  placeholder="What the feature does..."
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Potential Adversaries */}
      <div className="input-group">
        <div className="custom-features-header">
          <label>Potential Adversaries</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addAdversary}>
            <Plus size={14} /> Add Adversary
          </button>
        </div>
        <small className="form-hint">Suggested enemies for this environment</small>
        {formData.potentialAdversaries.length > 0 && (
          <div className="custom-features-list">
            {formData.potentialAdversaries.map((adv, i) => (
              <div key={i} className="custom-feature-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <input
                  type="text"
                  value={adv}
                  onChange={(e) => updateAdversary(i, e.target.value)}
                  placeholder="e.g., Bear, Dire Wolf"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm danger"
                  onClick={() => removeAdversary(i)}
                  title="Remove adversary"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
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
          <small className="form-hint">Players won't see this environment until you reveal it</small>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          {environment?.id ? 'Update Environment' : 'Create Environment'}
        </button>
      </div>
    </form>
  );
}
