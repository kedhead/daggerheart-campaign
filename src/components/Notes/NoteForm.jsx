import { useState } from 'react';
import { Save, X } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './NotesView.css';

export default function NoteForm({ note, onSave, onCancel, campaign, entities }) {
  const { search } = useEntityRegistry(campaign, entities);
  const [formData, setFormData] = useState(note || {
    title: '',
    category: 'other',
    content: ''
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
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Note Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Talk to the mysterious stranger"
          required
        />
      </div>

      <div className="input-group">
        <label>Category *</label>
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          required
        >
          <option value="quest">Quest</option>
          <option value="npc">NPC</option>
          <option value="location">Location</option>
          <option value="combat">Combat</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="input-group">
        <label>Content</label>
        <WikiLinkInput
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          searchEntities={search}
          placeholder="Write your notes here... Type [[ to link entities"
          rows={8}
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
          Save Note
        </button>
      </div>
    </form>
  );
}
