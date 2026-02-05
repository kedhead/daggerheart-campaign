import { TreePine, AlertTriangle, Zap, Eye, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const FEATURE_ICONS = {
  passive: Eye,
  hazard: AlertTriangle,
  action: Zap,
  encounter: Shield
};

export default function EnvironmentEffectsPanel({
  environment,
  activeEffects = [],
  onToggleEffect,
  isDM
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!environment) return null;

  const { name, tier, type, difficulty, description, features, impulses } = environment;

  return (
    <div className="environment-panel">
      <div className="env-panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="env-title-row">
          <TreePine size={18} />
          <h4>{name}</h4>
          <span className="env-badges">
            <span className="tier-badge">T{tier}</span>
            <span className="type-badge">{type}</span>
            <span className="dc-badge">DC {difficulty}</span>
          </span>
        </div>
        <button className="expand-btn">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="env-panel-content">
          <p className="env-description">{description}</p>

          {/* Impulses */}
          {impulses && impulses.length > 0 && (
            <div className="impulses-section">
              <h5>Impulses</h5>
              <div className="impulses-list">
                {impulses.map((impulse, idx) => (
                  <span key={idx} className="impulse-tag">{impulse}</span>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <div className="env-features-section">
              <h5>Features</h5>
              <div className="env-features-list">
                {features.map((feature, idx) => {
                  const FeatureIcon = FEATURE_ICONS[feature.type] || Zap;
                  const isActive = activeEffects.includes(feature.name);

                  return (
                    <div
                      key={idx}
                      className={`env-feature ${isActive ? 'active' : ''} ${feature.type}`}
                    >
                      <div className="feature-header">
                        <FeatureIcon size={14} />
                        <span className="feature-name">{feature.name}</span>
                        <span className="feature-type-badge">{feature.type}</span>
                        {feature.cost && (
                          <span className="feature-cost">{feature.cost}</span>
                        )}

                        {isDM && (feature.type === 'hazard' || feature.type === 'action') && (
                          <button
                            className={`toggle-btn ${isActive ? 'active' : ''}`}
                            onClick={() => onToggleEffect(feature.name)}
                          >
                            {isActive ? 'Active' : 'Activate'}
                          </button>
                        )}
                      </div>
                      <p className="feature-description">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
