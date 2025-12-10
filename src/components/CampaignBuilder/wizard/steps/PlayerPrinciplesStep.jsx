import { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import WizardStep from '../WizardStep';
import { templateService } from '../../../../services/templateService';

export default function PlayerPrinciplesStep({ value, onChange }) {
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
    const generated = templateService.generatePlayerPrinciples(3);
    onChange(generated);
  };

  return (
    <WizardStep
      title="Player Principles"
      description="Create 2-5 guiding principles that help players understand how to engage with your campaign."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label>Player Principles</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {value.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <span style={{ flex: 1 }}>{item}</span>
                <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', color: 'var(--text)' }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              placeholder="Add a player principle..."
              style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <button className="btn btn-primary" onClick={addItem}>
              <Plus size={20} />
              Add
            </button>
          </div>
          <small className="form-hint">Example: "Embrace the wild - let nature guide your choices"</small>
        </div>

        <button className="btn btn-secondary" onClick={generateRandom} style={{ alignSelf: 'flex-start' }}>
          <Sparkles size={20} />
          Generate Random
        </button>
      </div>
    </WizardStep>
  );
}
