import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, Backpack, EyeOff, Sparkles, Zap, Heart } from 'lucide-react';
import '../ItemsView.css';

const CATEGORY_CONFIG = {
  utility: { label: 'Utility', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
  magical: { label: 'Magical', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  consumable: { label: 'Consumable', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
  enhancement: { label: 'Enhancement', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
  relic: { label: 'Relic', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.1)' }
};

export default function DaggerheartEquipmentCard({ item, onEdit, onDelete, isDM, isExpanded: controlledExpanded, setIsExpanded: setControlledExpanded }) {
  const [localExpanded, setLocalExpanded] = useState(false);

  // Use controlled state if provided, otherwise use local state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;
  const setIsExpanded = setControlledExpanded || setLocalExpanded;

  const { systemData = {} } = item;
  const {
    category = 'utility',
    mechanicalEffect = '',
    activation = '',
    uses = -1,
    hopeCost = 0,
    stressCost = 0
  } = systemData;

  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.utility;

  return (
    <div className={`item-card card ${item.hidden ? 'hidden-item' : ''}`} style={{
      border: '2px solid transparent',
      background: `linear-gradient(var(--card-bg), var(--card-bg)) padding-box, linear-gradient(135deg, ${categoryConfig.color}, ${categoryConfig.color}88) border-box`
    }}>
      <div className="item-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="item-icon equipment" style={{
          background: `linear-gradient(135deg, ${categoryConfig.color}, ${categoryConfig.color}88)`
        }}>
          <Backpack size={28} />
        </div>

        <div className="item-info">
          <h3>
            {item.name}
            {item.hidden && <EyeOff size={14} style={{ opacity: 0.5, marginLeft: '0.5rem' }} />}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span
              className="item-type-badge"
              style={{
                background: categoryConfig.bgColor,
                color: categoryConfig.color
              }}
            >
              {categoryConfig.label}
            </span>
            {uses !== -1 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {uses} use{uses !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {/* Cost indicators */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            {hopeCost > 0 && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                color: 'var(--hope-color)'
              }}>
                <Sparkles size={14} />
                {hopeCost} Hope
              </span>
            )}
            {stressCost > 0 && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                color: 'var(--fear-color)'
              }}>
                <Zap size={14} />
                {stressCost} Stress
              </span>
            )}
            {activation && (
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                {activation}
              </span>
            )}
          </div>
        </div>

        <button className="btn btn-ghost expand-btn">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="item-details">
          {/* Item Properties */}
          <div className="item-section">
            <h4>Properties</h4>
            <div className="dh-weapon-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="dh-stat">
                <span className="dh-stat-label">Category</span>
                <span className="dh-stat-value" style={{ color: categoryConfig.color }}>
                  {categoryConfig.label}
                </span>
              </div>
              <div className="dh-stat">
                <span className="dh-stat-label">Uses</span>
                <span className="dh-stat-value">
                  {uses === -1 ? 'Unlimited' : uses}
                </span>
              </div>
              <div className="dh-stat">
                <span className="dh-stat-label">Activation</span>
                <span className="dh-stat-value">
                  {activation || 'Action'}
                </span>
              </div>
            </div>
          </div>

          {/* Costs */}
          {(hopeCost > 0 || stressCost > 0) && (
            <div className="item-section">
              <h4>Cost to Use</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {hopeCost > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid var(--hope-color)',
                    borderRadius: '8px'
                  }}>
                    <Sparkles size={20} style={{ color: 'var(--hope-color)' }} />
                    <span style={{ fontWeight: '600', color: 'var(--hope-color)' }}>{hopeCost} Hope</span>
                  </div>
                )}
                {stressCost > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(124, 58, 237, 0.1)',
                    border: '1px solid var(--fear-color)',
                    borderRadius: '8px'
                  }}>
                    <Zap size={20} style={{ color: 'var(--fear-color)' }} />
                    <span style={{ fontWeight: '600', color: 'var(--fear-color)' }}>{stressCost} Stress</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mechanical Effect */}
          {mechanicalEffect && (
            <div className="item-section">
              <h4>Effect</h4>
              <div style={{
                padding: '0.75rem 1rem',
                background: categoryConfig.bgColor,
                borderRadius: '8px',
                borderLeft: `3px solid ${categoryConfig.color}`
              }}>
                <p style={{ margin: 0 }}>{mechanicalEffect}</p>
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
