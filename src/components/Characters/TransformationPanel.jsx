import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Moon } from 'lucide-react';
import { HF_TRANSFORMATIONS } from '../../data/hopeFear';
import './TransformationPanel.css';

const TYPE_LABEL = { passive: 'Passive', action: 'Action', reaction: 'Reaction' };

/**
 * Transformations — a Hope & Fear mechanic. Unlike Beastform (a tier-gated
 * Druid class feature), a transformation is a narrative state the GM grants a
 * character (Vampire, Werewolf, Ghost, …). The panel lets a player adopt one,
 * see its features, and revert. Gated by the caller on the campaign having the
 * Hope & Fear source enabled, so core-only tables never see it.
 */
export default function TransformationPanel({ character, canEdit, updateCharacter }) {
  const [showPicker, setShowPicker] = useState(false);
  const activeKey = character.activeTransformation || null;

  const active = useMemo(
    () => (activeKey ? HF_TRANSFORMATIONS.find(t => t.key === activeKey) : null),
    [activeKey]
  );

  const apply = (key) => {
    if (!canEdit || !updateCharacter) return;
    updateCharacter(character.id, { activeTransformation: key });
    setShowPicker(false);
  };

  const revert = () => {
    if (!canEdit || !updateCharacter) return;
    updateCharacter(character.id, { activeTransformation: null });
  };

  const mods = active?.modifiers || null;
  const modEntries = mods
    ? Object.entries(mods).filter(([, v]) => v !== undefined && v !== null && v !== 0)
    : [];

  return (
    <div className="tf-panel">
      <div className="tf-header">
        <span className="tf-section-label">Transformation</span>
        {canEdit && !active && (
          <button className="tf-transform-btn" onClick={() => setShowPicker(true)}>
            <Sparkles size={14} /> Transform
          </button>
        )}
        {canEdit && active && (
          <button className="tf-revert-btn" onClick={revert}>Revert</button>
        )}
      </div>

      {active && (
        <div className="tf-active">
          <div className="tf-active-header">
            <span className="tf-active-name"><Moon size={14} /> {active.name}</span>
          </div>
          <div className="tf-active-desc">{active.description}</div>

          {modEntries.length > 0 && (
            <div className="tf-mods">
              {modEntries.map(([k, v]) => (
                <span key={k} className="tf-mod-badge">
                  {typeof v === 'number' && v > 0 ? '+' : ''}{typeof v === 'object' ? JSON.stringify(v) : v} {k}
                </span>
              ))}
            </div>
          )}

          <div className="tf-features">
            {active.features.map((f, i) => (
              <div key={i} className="tf-feature">
                <div className="tf-feature-head">
                  <span className="tf-feature-name">{f.name}</span>
                  {f.type && <span className={`tf-type-badge tf-type-${f.type}`}>{TYPE_LABEL[f.type] || f.type}</span>}
                </div>
                <div className="tf-feature-desc">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!active && !showPicker && (
        <div className="tf-inactive">Not currently transformed.</div>
      )}

      {showPicker && createPortal(
        <div className="tf-picker-overlay" onClick={() => setShowPicker(false)}>
          <div className="tf-picker" onClick={e => e.stopPropagation()}>
            <div className="tf-picker-header">
              <h3>Choose Transformation</h3>
              <button className="tf-picker-close" onClick={() => setShowPicker(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="tf-picker-body">
              <div className="tf-picker-grid">
                {HF_TRANSFORMATIONS.map(t => (
                  <button key={t.key} className="tf-picker-card" onClick={() => apply(t.key)}>
                    <div className="tf-picker-card-name">{t.name}</div>
                    <div className="tf-picker-card-desc">{t.description}</div>
                    <div className="tf-picker-card-meta">
                      {t.features.length} feature{t.features.length === 1 ? '' : 's'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
