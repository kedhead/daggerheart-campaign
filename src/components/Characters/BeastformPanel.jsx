import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Zap, Shield, Swords } from 'lucide-react';
import { BEASTFORMS, getBeastformsByTier, getBeastformByName } from '../../data/daggerheartBeastforms';
import { getTierForLevel } from '../../data/systems/daggerheart';
import './BeastformPanel.css';

export default function BeastformPanel({ character, canEdit, updateCharacter }) {
  const [showPicker, setShowPicker] = useState(false);
  const level = character.level || 1;
  const tier = getTierForLevel(level);
  const activeName = character.activeBeastform || null;
  const knownForms = character.knownBeastforms || [];

  const activeBeastform = useMemo(() =>
    activeName ? getBeastformByName(activeName) : null,
    [activeName]
  );

  const availableForms = useMemo(() => getBeastformsByTier(tier), [tier]);

  const handleTransform = (formName) => {
    if (!canEdit || !updateCharacter) return;
    updateCharacter(character.id, { activeBeastform: formName });
    setShowPicker(false);
  };

  const handleDropForm = () => {
    if (!canEdit || !updateCharacter) return;
    updateCharacter(character.id, { activeBeastform: null });
  };

  return (
    <div className="bf-panel">
      <div className="bf-header">
        <span className="bf-section-label">Beastform</span>
        {canEdit && !activeBeastform && (
          <button className="bf-transform-btn" onClick={() => setShowPicker(true)}>
            <Zap size={14} /> Transform
          </button>
        )}
        {canEdit && activeBeastform && (
          <button className="bf-drop-btn" onClick={handleDropForm}>
            Drop Form
          </button>
        )}
      </div>

      {/* Active beastform display */}
      {activeBeastform && (
        <div className="bf-active">
          <div className="bf-active-header">
            <span className="bf-active-name">{activeBeastform.name}</span>
            <span className="bf-active-tier">Tier {activeBeastform.tier}</span>
          </div>
          <div className="bf-active-examples">{activeBeastform.examples}</div>

          <div className="bf-stats-row">
            <div className="bf-stat">
              <Shield size={14} />
              <span>+{activeBeastform.evasionBonus} Evasion</span>
            </div>
            <div className="bf-stat">
              <span className="bf-stat-trait">+{activeBeastform.traitBonus} {activeBeastform.trait}</span>
            </div>
            <div className="bf-stat">
              <Swords size={14} />
              <span>{activeBeastform.range} · {activeBeastform.damageDie} {activeBeastform.damageType}</span>
            </div>
          </div>

          {activeBeastform.advantages.length > 0 && (
            <div className="bf-advantages">
              <span className="bf-advantages-label">Advantages:</span>
              {activeBeastform.advantages.map(a => (
                <span key={a} className="bf-advantage-badge">{a}</span>
              ))}
            </div>
          )}

          <div className="bf-features">
            {activeBeastform.features.map((f, i) => (
              <div key={i} className="bf-feature">
                <span className="bf-feature-name">{f.name}:</span> {f.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeBeastform && !showPicker && (
        <div className="bf-inactive">Not currently transformed.</div>
      )}

      {/* Picker modal — rendered via portal so it escapes any ancestor stacking context */}
      {showPicker && createPortal(
        <div className="bf-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="bf-picker" onClick={e => e.stopPropagation()}>
            <div className="bf-picker-header">
              <h3>Choose Beastform</h3>
              <button className="bf-picker-close" onClick={() => setShowPicker(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="bf-picker-body">
              {[1, 2, 3, 4].filter(t => t <= tier).map(t => (
                <div key={t} className="bf-picker-tier">
                  <div className="bf-picker-tier-label">Tier {t}</div>
                  <div className="bf-picker-grid">
                    {availableForms.filter(f => f.tier === t).map(form => (
                      <button
                        key={form.name}
                        className="bf-picker-card"
                        onClick={() => handleTransform(form.name)}
                      >
                        <div className="bf-picker-card-name">{form.name}</div>
                        <div className="bf-picker-card-examples">{form.examples}</div>
                        <div className="bf-picker-card-stats">
                          +{form.traitBonus} {form.trait} · +{form.evasionBonus} Evasion · {form.damageDie}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
