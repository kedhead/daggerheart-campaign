import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { LORE_TYPES } from '../../data/daggerheart';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './LoreForm.css';

export default function LoreForm({ lore, onSave, onCancel, isDM, campaign }) {
  const { search } = useEntityRegistry(campaign);
  const [formData, setFormData] = useState(lore || {
    title: '',
    type: 'location',
    content: '',
    tags: [],
    hidden: false
  });

  const [tagInput, setTagInput] = useState('');

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="lore-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
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
          {LORE_TYPES.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label>Content *</label>
        <WikiLinkInput
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          searchEntities={search}
          placeholder="Type [[ to link entities"
          rows={8}
          required
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="tags-form-section">
        <label>Tags</label>
        <div className="tag-input-group">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tag..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <button type="button" className="btn btn-secondary" onClick={addTag}>
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="tags-list">
            {formData.tags.map((tag, index) => (
              <span key={index} className="badge">
                {tag}
                <button type="button" onClick={() => removeTag(index)}>
                  <X size={14} />
                </button>
              </span>
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
            <span>Hidden (DM Only)</span>
          </label>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save Entry
        </button>
      </div>
    </form>
  );
}
