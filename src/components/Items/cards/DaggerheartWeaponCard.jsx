import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, Sword, EyeOff } from 'lucide-react';
import '../ItemsView.css';

const TRAIT_LABELS = {
  agility: 'Agility',
  strength: 'Strength',
  finesse: 'Finesse',
  instinct: 'Instinct',
  presence: 'Presence',
  knowledge: 'Knowledge'
};

const RANGE_LABELS = {
  melee: 'Melee',
  close: 'Close',
  far: 'Far',
  'very far': 'Very Far'
};

export default function DaggerheartWeaponCard({ item, onEdit, onDelete, isDM, isExpanded: controlledExpanded, setIsExpanded: setControlledExpanded }) {
  const [localExpanded, setLocalExpanded] = useState(false);

  // Use controlled state if provided, otherwise use local state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;
  const setIsExpanded = setControlledExpanded || setLocalExpanded;

  const { systemData = {} } = item;
  const {
    classification = 'primary',
    damageType = 'physical',
    trait = 'strength',
    range = 'melee',
    burden = 'one-handed',
    features = []
  } = systemData;

  // Format damage for a tier
  const formatDamage = (tier) => {
    const dice = systemData[`damageTier${tier}Dice`] || 'd8';
    const modifier = systemData[`damageTier${tier}Modifier`] || 0;
    return modifier > 0 ? `${dice}+${modifier}` : dice;
  };

  return (
    <div className={`item-card card dh-weapon-card ${item.hidden ? 'hidden-item' : ''}`}>
      <div className="item-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="item-icon weapon">
          <Sword size={28} />
        </div>

        <div className="item-info">
          <h3>
            {item.name}
            {item.hidden && <EyeOff size={14} style={{ opacity: 0.5, marginLeft: '0.5rem' }} />}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="item-type-badge weapon">
              {classification}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {TRAIT_LABELS[trait]} • {RANGE_LABELS[range]} • {burden === 'two-handed' ? '2H' : '1H'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{
              padding: '0.15rem 0.5rem',
              background: damageType === 'physical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)',
              borderRadius: '4px',
              color: damageType === 'physical' ? '#ef4444' : '#8b5cf6'
            }}>
              {damageType}
            </span>
            <span style={{ color: 'var(--hope-color)', fontWeight: '600' }}>
              T1: {formatDamage(1)}
            </span>
          </div>
        </div>

        <button className="btn btn-ghost expand-btn">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="item-details">
          {/* Damage Tiers */}
          <div className="item-section">
            <h4>Damage by Tier</h4>
            <div className="dh-damage-tiers">
              {[1, 2, 3, 4].map(tier => (
                <div key={tier} className="dh-tier">
                  <div className="dh-tier-label">Tier {tier}</div>
                  <div className="dh-tier-damage">{formatDamage(tier)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="item-section">
            <h4>Properties</h4>
            <div className="dh-weapon-stats">
              <div className="dh-stat">
                <span className="dh-stat-label">Classification</span>
                <span className="dh-stat-value" style={{ textTransform: 'capitalize' }}>{classification}</span>
              </div>
              <div className="dh-stat">
                <span className="dh-stat-label">Damage Type</span>
                <span className="dh-stat-value" style={{ textTransform: 'capitalize' }}>{damageType}</span>
              </div>
              <div className="dh-stat">
                <span className="dh-stat-label">Attack Trait</span>
                <span className="dh-stat-value">{TRAIT_LABELS[trait]}</span>
              </div>
              <div className="dh-stat">
                <span className="dh-stat-label">Range</span>
                <span className="dh-stat-value">{RANGE_LABELS[range]}</span>
              </div>
              <div className="dh-stat">
                <span className="dh-stat-label">Burden</span>
                <span className="dh-stat-value" style={{ textTransform: 'capitalize' }}>{burden}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="item-section">
              <h4>Features</h4>
              <div className="dh-features">
                {features.map(feature => (
                  <span key={feature} className="dh-feature">{feature}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="item-section">
              <h4>Description</h4>
              <p>{item.description}</p>
            </div>
          )}

          {isDM && (
            <div className="item-actions">
              <button className="btn btn-secondary" onClick={onEdit}>
                <Edit2 size={16} />
                Edit
              </button>
              <button className="btn btn-danger" onClick={onDelete}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
