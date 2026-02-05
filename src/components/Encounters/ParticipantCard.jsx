import { useState } from 'react';
import { Heart, Zap, Skull, ChevronDown, ChevronRight, Shield, Swords, Target, X } from 'lucide-react';
import { DAGGERHEART_CONDITIONS } from '../../hooks/useActiveEncounter';

export default function ParticipantCard({
  participant,
  onApplyDamage,
  onApplyHealing,
  onAddCondition,
  onRemoveCondition,
  onToggleDefeated,
  isDM,
  isExpanded,
  onToggleExpand
}) {
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const {
    name,
    currentHP,
    maxHP,
    currentStress,
    maxStress,
    conditions,
    isDefeated,
    thresholds,
    role,
    tier,
    evasion,
    attack,
    damage,
    features
  } = participant;

  // Calculate HP percentage
  const hpPercent = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
  const stressPercent = Math.max(0, Math.min(100, (currentStress / maxStress) * 100));

  // Determine HP color based on thresholds
  const getHPColor = () => {
    if (currentHP <= 0) return '#6b7280';
    if (thresholds) {
      if (currentHP <= thresholds.minor) return '#ef4444';
      if (currentHP <= thresholds.major) return '#f59e0b';
    }
    return '#22c55e';
  };

  // Get role color
  const getRoleColor = () => {
    switch (role?.toLowerCase()) {
      case 'minion':
      case 'horde':
        return '#22c55e';
      case 'standard':
      case 'bruiser':
      case 'skulk':
        return '#60a5fa';
      case 'leader':
        return '#f59e0b';
      case 'solo':
        return '#ef4444';
      default:
        return '#888';
    }
  };

  const handleQuickDamage = (amount) => {
    if (isDM && onApplyDamage) {
      onApplyDamage(participant.id, amount, 'hp');
    }
  };

  const handleQuickHeal = (amount) => {
    if (isDM && onApplyHealing) {
      onApplyHealing(participant.id, amount, 'hp');
    }
  };

  const handleStressDamage = (amount) => {
    if (isDM && onApplyDamage) {
      onApplyDamage(participant.id, amount, 'stress');
    }
  };

  return (
    <div className={`participant-card ${isDefeated ? 'defeated' : ''}`}>
      <div className="participant-header" onClick={onToggleExpand}>
        <div className="participant-info">
          <div className="participant-name-row">
            {isDefeated && <Skull size={16} className="defeated-icon" />}
            <span className="participant-name">{name}</span>
            <span
              className="role-badge"
              style={{ background: getRoleColor() }}
            >
              {role}
            </span>
            <span className="tier-badge">T{tier}</span>
          </div>

          {/* HP Bar */}
          <div className="stat-bar hp-bar">
            <div className="bar-icon">
              <Heart size={14} />
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${hpPercent}%`,
                  background: getHPColor()
                }}
              />
              {/* Threshold markers */}
              {thresholds && (
                <>
                  <div
                    className="threshold-marker minor"
                    style={{ left: `${(thresholds.minor / maxHP) * 100}%` }}
                    title={`Minor: ${thresholds.minor}`}
                  />
                  <div
                    className="threshold-marker major"
                    style={{ left: `${(thresholds.major / maxHP) * 100}%` }}
                    title={`Major: ${thresholds.major}`}
                  />
                </>
              )}
            </div>
            <div className="bar-value">{currentHP}/{maxHP}</div>
          </div>

          {/* Stress Bar */}
          <div className="stat-bar stress-bar">
            <div className="bar-icon">
              <Zap size={14} />
            </div>
            <div className="bar-track">
              <div
                className="bar-fill stress"
                style={{ width: `${stressPercent}%` }}
              />
            </div>
            <div className="bar-value">{currentStress}/{maxStress}</div>
          </div>

          {/* Conditions */}
          {conditions.length > 0 && (
            <div className="conditions-row">
              {conditions.map(condition => (
                <span key={condition} className="condition-badge">
                  {condition}
                  {isDM && (
                    <button
                      className="remove-condition"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCondition(participant.id, condition);
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <button className="expand-btn">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="participant-details">
          {/* Quick Stats */}
          <div className="quick-stats">
            {evasion && (
              <div className="quick-stat">
                <Shield size={14} />
                <span>Evasion: {evasion}</span>
              </div>
            )}
            {attack && (
              <div className="quick-stat">
                <Swords size={14} />
                <span>Attack: +{attack}</span>
              </div>
            )}
            {damage && (
              <div className="quick-stat">
                <Target size={14} />
                <span>Damage: {damage}</span>
              </div>
            )}
          </div>

          {/* DM Controls */}
          {isDM && (
            <div className="dm-controls">
              <div className="damage-controls">
                <span className="control-label">HP:</span>
                <div className="quick-buttons">
                  <button onClick={() => handleQuickDamage(1)}>-1</button>
                  <button onClick={() => handleQuickDamage(5)}>-5</button>
                  <button onClick={() => handleQuickDamage(10)}>-10</button>
                  <button className="heal" onClick={() => handleQuickHeal(5)}>+5</button>
                  <button className="heal" onClick={() => handleQuickHeal(10)}>+10</button>
                </div>
              </div>

              <div className="damage-controls">
                <span className="control-label">Stress:</span>
                <div className="quick-buttons">
                  <button onClick={() => handleStressDamage(1)}>+1</button>
                  <button onClick={() => handleStressDamage(2)}>+2</button>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className={`btn btn-sm ${isDefeated ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => onToggleDefeated(participant.id)}
                >
                  <Skull size={14} />
                  {isDefeated ? 'Revive' : 'Defeat'}
                </button>

                <div className="condition-picker-wrapper">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setShowConditionPicker(!showConditionPicker)}
                  >
                    + Condition
                  </button>

                  {showConditionPicker && (
                    <div className="condition-picker">
                      {DAGGERHEART_CONDITIONS.filter(c => !conditions.includes(c)).map(condition => (
                        <button
                          key={condition}
                          className="condition-option"
                          onClick={() => {
                            onAddCondition(participant.id, condition);
                            setShowConditionPicker(false);
                          }}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <div className="features-section">
              <h5>Features</h5>
              {features.map((feature, idx) => (
                <div key={idx} className="feature-item">
                  <span className="feature-name">{feature.name}</span>
                  {feature.type && <span className="feature-type">{feature.type}</span>}
                  {feature.description && (
                    <p className="feature-desc">{feature.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
