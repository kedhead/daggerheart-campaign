import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Dices, ArrowRight } from 'lucide-react';
import { useDice, useRollHistory } from '../../dice';
import {
  getParryDice,
  formatParryDice,
  isParryableRoll,
  parryTargetFromRoll,
  parryTargetFromManualDice,
} from '../../utils/daggerheartParry';
import './LevelUpWizard.css';
import './ParryModal.css';

/**
 * Parrying Dagger — "When you are attacked, roll this weapon's damage dice.
 * If any of the attacker's damage dice rolled the same value as your dice,
 * the matching results are discarded before the damage you take is totaled."
 *
 * The feature needs the ATTACKER's individual dice, which is why this can't be
 * a plain roll button: the player picks the incoming damage roll first. Rolls
 * the GM made in the app show up in the list on their own; damage rolled with
 * physical dice can be typed in.
 *
 * The parry is published through the normal dice service, so the tray, the
 * banner and the roll log all show it and the GM can see the reduced number
 * without being told.
 */
export default function ParryModal({ campaignId, weapon, level = 1, proficiency = 1, onClose }) {
  const { rollParry } = useDice(campaignId);
  const { rolls } = useRollHistory(campaignId, 40);

  const [selectedId, setSelectedId] = useState(null);
  const [manualDice, setManualDice] = useState('');
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const dice = useMemo(() => getParryDice(weapon, level, proficiency), [weapon, level, proficiency]);

  // Recent damage rolls, most recent first. A parry is a reaction to the
  // attack that just happened, so a short list beats a full history.
  const candidates = useMemo(
    () => (rolls || []).filter(isParryableRoll).slice(0, 8),
    [rolls]
  );

  const manualTarget = useMemo(
    () => parryTargetFromManualDice(manualDice, { label: 'Incoming damage' }),
    [manualDice]
  );

  const target = useMemo(() => {
    if (selectedId === 'manual') return manualTarget;
    const roll = candidates.find(r => r.id === selectedId);
    return roll ? parryTargetFromRoll(roll) : null;
  }, [selectedId, manualTarget, candidates]);

  const handleRoll = async () => {
    if (!target || rolling || !dice) return;
    setError('');
    setRolling(true);
    try {
      const doc = await rollParry({
        label: `Parry: ${weapon.name}`,
        dieType: dice.dieType,
        quantity: dice.quantity,
        target,
      });
      if (!doc?.parry) {
        setError('The parry roll could not be published. Check your connection and try again.');
      } else {
        setResult(doc);
      }
    } catch (err) {
      console.error('[ParryModal] parry roll failed:', err);
      setError('The parry roll could not be published. Check your connection and try again.');
    } finally {
      setRolling(false);
    }
  };

  const renderPick = () => (
    <div className="luw-step-content">
      <p className="luw-step-desc">
        Pick the attack coming at you, then roll {formatParryDice(dice)}. Any of the attacker's dice
        showing a value you matched are discarded before the damage is totaled.
      </p>

      <div className="pry-list">
        {candidates.map(r => {
          const values = (r.dice || []).map(d => d.value);
          return (
            <button
              key={r.id}
              type="button"
              className={`pry-option ${selectedId === r.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(r.id)}
            >
              <div className="pry-option-head">
                <span className="pry-option-label">{r.label || 'Damage roll'}</span>
                <span className="pry-option-total">{r.total}</span>
              </div>
              <div className="pry-option-meta">
                <span style={{ color: r.rollerColor || undefined }}>{r.rollerName || 'Someone'}</span>
                <span className="pry-dice-line">
                  {values.map((v, i) => <span key={i} className="pry-die">{v}</span>)}
                  {r.modifier ? <span className="pry-mod">+{r.modifier}</span> : null}
                </span>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          className={`pry-option ${selectedId === 'manual' ? 'selected' : ''}`}
          onClick={() => setSelectedId('manual')}
        >
          <div className="pry-option-head">
            <span className="pry-option-label">Type the attacker's dice</span>
          </div>
          <div className="pry-option-meta">For damage the GM rolled with real dice</div>
        </button>
      </div>

      {selectedId === 'manual' && (
        <div className="luw-input-group">
          <label className="luw-label">Each die the attacker rolled</label>
          <input
            className="luw-input"
            value={manualDice}
            onChange={e => setManualDice(e.target.value)}
            placeholder="e.g. 6, 4, 3"
            inputMode="numeric"
          />
          <div className="luw-hint">
            {manualTarget
              ? `${manualTarget.dice.length} dice · ${manualTarget.total} damage before the parry`
              : 'Separate the faces with commas or spaces.'}
          </div>
        </div>
      )}

      {candidates.length === 0 && (
        <div className="luw-hint">No damage rolls in the log yet — type the attacker's dice instead.</div>
      )}
      {error && <div className="pry-error">{error}</div>}
    </div>
  );

  const renderResult = () => {
    const parry = result.parry;
    const mine = (result.dice || []).map(d => d.value);
    const stopped = parry.discardedCount > 0;
    return (
      <div className="luw-step-content">
        <h3 className="luw-step-title" style={{ color: stopped ? '#6ea' : '#8899aa' }}>
          {stopped
            ? `Parried ${parry.discardedCount} ${parry.discardedCount === 1 ? 'die' : 'dice'}`
            : 'Nothing matched'}
        </h3>

        <div className="pry-row">
          <span className="pry-row-label">Your dagger</span>
          <span className="pry-dice-line">
            {mine.map((v, i) => <span key={i} className="pry-die pry-die-mine">{v}</span>)}
          </span>
        </div>

        <div className="pry-row">
          <span className="pry-row-label">{parry.targetLabel || 'Attacker'}</span>
          <span className="pry-dice-line">
            {parry.attackerDice.map((d, i) => (
              <span key={i} className={`pry-die ${d.discarded ? 'pry-die-out' : ''}`}>{d.value}</span>
            ))}
            {parry.attackerDice.length === 0 && <span className="luw-hint">no dice</span>}
          </span>
        </div>

        <div className="pry-total">
          <span className={stopped ? 'pry-total-before' : ''}>{parry.originalTotal}</span>
          {stopped && (
            <>
              <ArrowRight size={18} className="pry-total-arrow" />
              <span className="pry-total-after">{parry.reducedTotal}</span>
            </>
          )}
          <span className="pry-total-unit">damage</span>
        </div>

        <div className="luw-hint">
          Everyone at the table sees this in the roll log — mark HP against {parry.reducedTotal} damage.
        </div>
      </div>
    );
  };

  const overlay = (
    <div className="luw-overlay" onClick={onClose}>
      <div className="luw-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="luw-header">
          <h2 className="luw-title">
            <Shield size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />
            Parry — {weapon?.name}
          </h2>
          <button className="luw-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="luw-body">
          {!dice
            ? <div className="luw-hint">This weapon has no damage dice at your tier, so there's nothing to parry with.</div>
            : result ? renderResult() : renderPick()}
        </div>

        <div className="luw-footer">
          {result ? (
            <>
              <button className="luw-btn luw-btn-secondary" onClick={() => { setResult(null); setSelectedId(null); }}>
                Parry another
              </button>
              <button className="luw-btn luw-btn-primary" onClick={onClose}>Done</button>
            </>
          ) : (
            <>
              <button className="luw-btn luw-btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="luw-btn luw-btn-primary"
                onClick={handleRoll}
                disabled={!target || rolling || !dice}
              >
                <Dices size={16} /> {rolling ? 'Rolling…' : `Roll ${formatParryDice(dice)}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Portal to <body> for the same reason DeathMoveModal does: a transformed
  // ancestor would re-anchor this fixed overlay off-viewport on phones.
  // Server rendering (smoke tests) has no document — render inline.
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
