import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, HeartCrack, Shield } from 'lucide-react';
import { damageOutcome, armorSlotsFree } from '../../utils/playerDamage';
import { hpRemaining } from '../../utils/daggerheartVitals';
import './LevelUpWizard.css';

const SEVERITY_LABEL = { none: 'No damage', minor: 'Minor', major: 'Major', severe: 'Severe', massive: 'Massive' };
const QUICK = [-5, -1, 1, 5];

/**
 * Enter a damage number; see what it does; apply it.
 *
 * Players used to compare damage to their thresholds in their heads and then
 * tap HP pips. The rules (thresholds, resistance, one Armor Slot per hit, the
 * optional Massive rule) live in playerDamage.js, tested; this only collects
 * the inputs and shows the result before anything is written.
 *
 * @param {{ major: number, severe: number }} thresholds - from computeDefenses
 * @param {number} armorTotal - the armor track's real length (armorSlotCount)
 * @param {boolean} massiveRule - the campaign uses the optional Massive rule
 * @param {(updates: object) => void} onApply
 */
export default function TakeDamageModal({ character, thresholds, armorTotal = 0, massiveRule = false, onApply, onClose }) {
  const [damage, setDamage] = useState('');
  const [resistant, setResistant] = useState(false);
  const freeArmor = armorSlotsFree(character, armorTotal);
  const [useArmor, setUseArmor] = useState(false);

  const major = Number(thresholds?.major) || 0;
  const severe = Number(thresholds?.severe) || 0;
  const amount = Math.max(0, parseInt(damage, 10) || 0);

  const outcome = useMemo(
    () => damageOutcome(amount, { major, severe, resistant, massiveRule, useArmor, armorAvailable: freeArmor }),
    [amount, major, severe, resistant, massiveRule, useArmor, freeArmor]
  );
  const left = hpRemaining(character);
  const willMark = Math.min(outcome.marks, left);

  const nudge = (n) => setDamage(String(Math.max(0, amount + n)));

  const apply = () => {
    onApply?.(outcome);
    onClose?.();
  };

  const overlay = (
    <div className="luw-overlay" onClick={onClose}>
      <div className="luw-modal" role="dialog" aria-modal="true" aria-labelledby="take-damage-title" onClick={e => e.stopPropagation()}>
        <div className="luw-header">
          <h2 className="luw-title" id="take-damage-title">
            <HeartCrack size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />Take Damage
          </h2>
          <button className="luw-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="luw-body">
          <div className="luw-input-group">
            <label className="luw-label" htmlFor="take-damage-amount">Incoming damage</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                id="take-damage-amount"
                className="luw-input"
                type="number"
                inputMode="numeric"
                min="0"
                autoFocus
                value={damage}
                onChange={e => setDamage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && amount > 0) apply(); }}
                placeholder="0"
                style={{ fontSize: '1.5rem', textAlign: 'center', flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {QUICK.map(n => (
                <button key={n} type="button" className="luw-btn luw-btn-secondary" style={{ flex: 1, padding: '8px 0' }} onClick={() => nudge(n)}>
                  {n > 0 ? `+${n}` : n}
                </button>
              ))}
            </div>
            <p className="luw-hint">
              Your thresholds: Major {major || '—'} · Severe {severe || '—'}{massiveRule && severe ? ` · Massive ${severe * 2}` : ''}
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0', cursor: 'pointer' }}>
            <input type="checkbox" checked={resistant} onChange={e => setResistant(e.target.checked)} />
            <span>Resistant to this damage <span className="luw-hint" style={{ display: 'inline' }}>(halve it first)</span></span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0', cursor: freeArmor ? 'pointer' : 'not-allowed', opacity: freeArmor ? 1 : 0.6 }}>
            <input type="checkbox" checked={useArmor && freeArmor > 0} disabled={freeArmor === 0} onChange={e => setUseArmor(e.target.checked)} />
            <span>
              <Shield size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Mark an Armor Slot <span className="luw-hint" style={{ display: 'inline' }}>({freeArmor} free — drops it one step)</span>
            </span>
          </label>

          <div
            aria-live="polite"
            style={{
              marginTop: 16, padding: 14, borderRadius: 12,
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center',
            }}
          >
            {amount === 0 ? (
              <span className="luw-hint">Enter the damage to see what it does.</span>
            ) : (
              <>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {resistant && `${amount} halved to ${outcome.taken} · `}
                  {SEVERITY_LABEL[outcome.rawSeverity]}
                  {outcome.armorUsed && ` → ${SEVERITY_LABEL[outcome.severity]} with armor`}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4 }}>
                  {willMark === 0 ? 'No HP marked' : `Mark ${willMark} HP`}
                </div>
                {willMark > 0 && left - willMark === 0 && (
                  <div style={{ marginTop: 6, color: '#fca5a5', fontWeight: 600 }}>That's your last Hit Point — make a Death Move.</div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="luw-footer">
          <button className="luw-btn luw-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="luw-btn luw-btn-primary" disabled={amount === 0} onClick={apply}>
            <Check size={16} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
  // Same as RestModal: portal to <body> so app-shell transforms can't strand
  // the overlay; server rendering (smoke tests) has no document.
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
