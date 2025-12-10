import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import WizardStep from '../WizardStep';

export default function TouchstonesStep({ value, onChange }) {
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

  return (
    <WizardStep
      title="Touchstones"
      description="What media (books, movies, games, shows) inspired this campaign? Add 2-6 touchstones."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label>Touchstones</label>
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
              placeholder="Add a touchstone..."
              style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            <button className="btn btn-primary" onClick={addItem}>
              <Plus size={20} />
              Add
            </button>
          </div>
          <small className="form-hint">Examples: Princess Mononoke, The Witcher, Dark Souls, Avatar: The Last Airbender</small>
        </div>
      </div>
    </WizardStep>
  );
}
