import { Edit2, Trash2, ChevronDown, ChevronRight, AlertTriangle, Eye, Zap, Shield } from 'lucide-react';

const TYPE_COLORS = {
  exploration: 'var(--hope-color)',
  social: '#60a5fa',
  combat: 'var(--fear-color)',
  traversal: '#22c55e',
  event: '#f59e0b'
};

const TYPE_ICONS = {
  exploration: '🌲',
  social: '🗣️',
  combat: '⚔️',
  traversal: '🚶',
  event: '⚡'
};

const FEATURE_ICONS = {
  passive: <Eye size={14} />,
  hazard: <AlertTriangle size={14} />,
  action: <Zap size={14} />,
  encounter: <Shield size={14} />
};

export default function EnvironmentCard({
  environment,
  onEdit,
  onDelete,
  isDM,
  isExpanded,
  onToggleExpand
}) {
  const {
    name,
    tier,
    type,
    difficulty,
    description,
    impulses,
    features,
    potentialAdversaries,
    hidden,
    isOfficial
  } = environment;

  const typeColor = TYPE_COLORS[type] || 'var(--text-muted)';
  const typeIcon = TYPE_ICONS[type] || '📍';

  return (
    <div className={`environment-card ${hidden ? 'hidden-env' : ''}`}>
      <div className="environment-card-header" onClick={onToggleExpand}>
        <div className="environment-main-info">
          <div className="environment-title-row">
            <span className="environment-type-icon">{typeIcon}</span>
            <h3 className="environment-name">{name}</h3>
            {isOfficial && <span className="official-badge">SRD</span>}
            {hidden && isDM && <span className="hidden-badge">Hidden</span>}
          </div>
          <div className="environment-meta">
            <span className="tier-badge" style={{ borderColor: typeColor }}>
              Tier {tier}
            </span>
            <span className="type-badge" style={{ background: typeColor }}>
              {type}
            </span>
            {difficulty > 0 && (
              <span className="difficulty-badge">
                DC {difficulty}
              </span>
            )}
          </div>
        </div>
        <button className="expand-toggle">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <p className="environment-description">{description}</p>

      {isExpanded && (
        <div className="environment-details">
          {/* Impulses */}
          {impulses && impulses.length > 0 && (
            <div className="environment-section">
              <h4 className="section-label">Impulses</h4>
              <ul className="impulses-list">
                {impulses.map((impulse, i) => (
                  <li key={i}>{impulse}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <div className="environment-section">
              <h4 className="section-label">Features</h4>
              <div className="features-list">
                {features.map((feature, i) => (
                  <div key={i} className={`feature-item feature-${feature.type}`}>
                    <div className="feature-header">
                      {FEATURE_ICONS[feature.type] || <Zap size={14} />}
                      <span className="feature-name">{feature.name}</span>
                      <span className="feature-type-badge">{feature.type}</span>
                      {feature.cost && (
                        <span className="feature-cost">{feature.cost}</span>
                      )}
                    </div>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Potential Adversaries */}
          {potentialAdversaries && potentialAdversaries.length > 0 && (
            <div className="environment-section">
              <h4 className="section-label">Potential Adversaries</h4>
              <div className="adversaries-tags">
                {potentialAdversaries.map((adv, i) => (
                  <span key={i} className="adversary-tag">{adv}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isDM && (
        <div className="environment-card-actions">
          {onEdit && (
            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit2 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              className="btn btn-ghost btn-sm danger"
              onClick={(e) => { e.stopPropagation(); onDelete(environment.id); }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
