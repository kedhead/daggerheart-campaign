import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, Shield, EyeOff } from 'lucide-react';
import '../ItemsView.css';

const FEATURE_DESCRIPTIONS = {
  'Deflecting': 'Mark armor slot for Evasion bonus equal to available slots',
  'Sheltering': 'Armor reduces damage for nearby allies too',
  'Barrier': '+5 Armor Score, -1 Evasion',
  'Resilient': 'Roll d6; on 6, avoid marking last armor slot',
  'Fortified': 'Additional armor slots'
};

export default function DaggerheartArmorCard({ item, onEdit, onDelete, isDM, isExpanded: controlledExpanded, setIsExpanded: setControlledExpanded }) {
  const [localExpanded, setLocalExpanded] = useState(false);

  // Use controlled state if provided, otherwise use local state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;
  const setIsExpanded = setControlledExpanded || setLocalExpanded;

  const { systemData = {} } = item;
  const {
    armorScore = 2,
    armorSlots = 6,
    tier = 1,
    features = []
  } = systemData;

  return (
    <div className={`item-card card ${item.hidden ? 'hidden-item' : ''}`} style={{
      border: '2px solid transparent',
      background: 'linear-gradient(var(--card-bg), var(--card-bg)) padding-box, linear-gradient(135deg, #3b82f6, #1d4ed8) border-box'
    }}>
      <div className="item-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="item-icon armor">
          <Shield size={28} />
        </div>

        <div className="item-info">
          <h3>
            {item.name}
            {item.hidden && <EyeOff size={14} style={{ opacity: 0.5, marginLeft: '0.5rem' }} />}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="item-type-badge armor">
              Tier {tier}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {armorSlots} slots
            </span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
            padding: '0.25rem 0.75rem',
            background: 'rgba(59, 130, 246, 0.15)',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>{armorScore}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Armor</span>
          </div>
        </div>

        <button className="btn btn-ghost expand-btn">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="item-details">
          {/* Armor Stats */}
          <div className="item-section">
            <h4>Armor Properties</h4>
            <div className="dh-armor-stats">
              <div className="dh-armor-score">
                <span className="value">{armorScore}</span>
                <span className="label">Score</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="dh-weapon-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="dh-stat">
                    <span className="dh-stat-label">Armor Slots</span>
                    <span className="dh-stat-value">{armorSlots}</span>
                  </div>
                  <div className="dh-stat">
                    <span className="dh-stat-label">Tier</span>
                    <span className="dh-stat-value">{tier}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Armor Slots */}
          <div className="item-section">
            <h4>Armor Slots</h4>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {Array(armorSlots).fill(0).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: '2px solid #3b82f6',
                    background: 'rgba(59, 130, 246, 0.1)'
                  }}
                />
              ))}
            </div>
            <small style={{ color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
              Mark a slot to reduce damage by {armorScore}
            </small>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="item-section">
              <h4>Features</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {features.map(feature => (
                  <div
                    key={feature}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px'
                    }}
                  >
                    <span style={{ fontWeight: '600', color: '#3b82f6' }}>{feature}</span>
                    {FEATURE_DESCRIPTIONS[feature] && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {FEATURE_DESCRIPTIONS[feature]}
                      </p>
                    )}
                  </div>
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
