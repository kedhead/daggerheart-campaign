import { useState } from 'react';
import { Save, X, Link as LinkIcon } from 'lucide-react';
import './SessionForm.css';

export default function SessionForm({ session, onSave, onCancel, isDM }) {
  const [formData, setFormData] = useState(session || {
    title: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    highlights: [],
    dmNotes: '',
    encounterLinks: '',
    status: 'completed',
    isPlanned: false
  });

  const [highlightInput, setHighlightInput] = useState('');

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const addHighlight = () => {
    if (highlightInput.trim()) {
      setFormData({
        ...formData,
        highlights: [...formData.highlights, highlightInput.trim()]
      });
      setHighlightInput('');
    }
  };

  const removeHighlight = (index) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="session-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>Session Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., The Forest of Whispers"
          required
        />
      </div>

      <div className="input-group">
        <label>Date *</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          required
        />
      </div>

      {isDM && (
        <div className="input-group">
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="planned">Planned (Future Session)</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed (Session Log)</option>
          </select>
        </div>
      )}

      {isDM && (
        <div className="input-group">
          <label>
            <LinkIcon size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Encounter Links (DM Only)
          </label>
          <input
            type="text"
            value={formData.encounterLinks}
            onChange={(e) => handleChange('encounterLinks', e.target.value)}
            placeholder="https://freshcutgrass.app/encounter/..."
          />
          <small className="form-hint">Paste FreshCutGrass encounter link(s), separate multiple with commas</small>
        </div>
      )}

      <div className="input-group">
        <label>Summary {formData.status === 'planned' ? '' : '*'}</label>
        <textarea
          value={formData.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          rows="6"
          placeholder={formData.status === 'planned' ? 'What do you plan for this session?' : 'What happened in this session?'}
          required={formData.status !== 'planned'}
        />
      </div>

      <div className="highlights-form-section">
        <label>Highlights</label>
        <div className="highlight-input-group">
          <input
            type="text"
            value={highlightInput}
            onChange={(e) => setHighlightInput(e.target.value)}
            placeholder="Add a highlight moment..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
          />
          <button type="button" className="btn btn-secondary" onClick={addHighlight}>
            Add
          </button>
        </div>
        {formData.highlights.length > 0 && (
          <ul className="highlights-list">
            {formData.highlights.map((highlight, index) => (
              <li key={index}>
                <span>{highlight}</span>
                <button type="button" onClick={() => removeHighlight(index)}>
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isDM && (
        <div className="input-group">
          <label>DM Notes (DM Only)</label>
          <textarea
            value={formData.dmNotes}
            onChange={(e) => handleChange('dmNotes', e.target.value)}
            rows="4"
            placeholder="Private notes for your eyes only..."
          />
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save Session
        </button>
      </div>
    </form>
  );
}
