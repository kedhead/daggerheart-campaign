import { useState } from 'react';
import { Sparkles, Loader2, X, Sword, Shield, Backpack } from 'lucide-react';
import Modal from '../Modal';
import { generateItem } from '../../services/itemGenerator';
import './ItemsView.css';

const TYPES = [
  { value: 'weapon', label: 'Weapon', icon: Sword },
  { value: 'armor', label: 'Armor', icon: Shield },
  { value: 'equipment', label: 'Equipment', icon: Backpack }
];

const RARITIES = [
  { value: '', label: '— None —' },
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'relic', label: 'Relic' }
];

export default function ItemAIModal({ isOpen, onClose, onGenerated, apiKey, provider, campaignContext }) {
  const [concept, setConcept] = useState('');
  const [type, setType] = useState('armor');
  const [tier, setTier] = useState(1);
  const [rarity, setRarity] = useState('relic');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!concept.trim()) {
      setError('Describe the item concept first.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const result = await generateItem({
        concept,
        type,
        tier,
        rarity,
        apiKey,
        provider,
        campaignContext
      });
      onGenerated(result);
      setConcept('');
    } catch (e) {
      setError(e.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Item with AI"
      size="medium"
    >
      <div className="item-ai-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="item-ai-hint">
          Describe the item you want — a concept, a scene, a character who might wield it. The AI will
          build a mechanically valid Daggerheart statblock with named custom features you can edit
          before saving.
        </div>

        <div className="input-group">
          <label>Concept</label>
          <textarea
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder={`e.g. "A waterlogged relic shield blessed by the bog-choir spirits — hums with subsonic tones and keeps its bearer perpetually damp."`}
            rows={4}
            disabled={generating}
          />
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Item Type</label>
            <div className="item-type-selector" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`type-option ${type === value ? 'selected' : ''}`}
                  onClick={() => setType(value)}
                  disabled={generating}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-row">
          {(type === 'weapon' || type === 'armor') && (
            <div className="input-group">
              <label>Power Tier</label>
              <select value={tier} onChange={(e) => setTier(parseInt(e.target.value))} disabled={generating}>
                <option value={1}>Tier 1 — Novice</option>
                <option value={2}>Tier 2 — Seasoned</option>
                <option value={3}>Tier 3 — Formidable</option>
                <option value={4}>Tier 4 — Legendary</option>
              </select>
            </div>
          )}
          <div className="input-group">
            <label>Rarity</label>
            <select value={rarity} onChange={(e) => setRarity(e.target.value)} disabled={generating}>
              {RARITIES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="item-ai-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={generating}>
            <X size={16} /> Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating || !concept.trim()}
          >
            {generating ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            {generating ? 'Generating...' : 'Generate Item'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
