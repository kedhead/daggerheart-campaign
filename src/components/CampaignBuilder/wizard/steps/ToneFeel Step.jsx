import { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import WizardStep from '../WizardStep';
import { templateService } from '../../../../services/templateService';

export default function ToneFeelStep({ value, onChange }) {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const generateRandom = () => {
    const generated = templateService.generateToneAndFeel(6);
    onChange(generated);
  };

  return (
    <WizardStep
      title="Tone & Feel"
      description="Define the emotional atmosphere and style of your campaign with 4-8 descriptive words."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label>Tone & Feel Tags</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {value.map((item, index) => (
              <span key={index} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--hope-color-10)', border: '1px solid var(--hope-color)', borderRadius: '20px', fontSize: '0.875rem' }}>
                {item}
                <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text)' }}>
                  <X size={16} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              placeholder="Add a tone/feel word..."
              style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <button className="btn btn-primary" onClick={addItem}>
              <Plus size={20} />
              Add
            </button>
          </div>
          <small className="form-hint">Examples: Dark, Whimsical, Epic, Gritty, Mysterious, Lighthearted</small>
        </div>

        <button className="btn btn-secondary" onClick={generateRandom} style={{ alignSelf: 'flex-start' }}>
          <Sparkles size={20} />
          Generate Random
        </button>
      </div>
    </WizardStep>
  );
}
