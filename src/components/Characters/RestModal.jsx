import { useState } from 'react';
import { X, Sun, Moon, Check, Dices } from 'lucide-react';
import { getTierForLevel } from '../../data/systems/daggerheart';
import './LevelUpWizard.css';

const d4 = () => Math.floor(Math.random() * 4) + 1;

const SHORT_MOVES = [
  { id: 'tendWounds', name: 'Tend to Wounds', desc: 'Hastily patch yourself up — clear 1d4 + tier Hit Points.' },
  { id: 'clearStress', name: 'Clear Stress', desc: 'Blow off steam or pull yourself together — clear 1d4 + tier Stress.' },
  { id: 'repairArmor', name: 'Repair Armor', desc: 'Quickly repair your armor — clear 1d4 + tier Armor Slots.' },
  { id: 'prepare', name: 'Prepare', desc: 'Prepare for the path ahead — gain a Hope (2 Hope if you prepare with allies).' },
];

const LONG_MOVES = [
  { id: 'tendAllWounds', name: 'Tend to All Wounds', desc: 'Patch yourself up — clear all Hit Points.' },
  { id: 'clearAllStress', name: 'Clear All Stress', desc: 'Blow off steam — clear all Stress.' },
  { id: 'repairAllArmor', name: 'Repair All Armor', desc: 'Spend time on repairs — clear all Armor Slots.' },
  { id: 'prepare', name: 'Prepare', desc: 'Prepare for the next day — gain a Hope (2 Hope if you prepare with allies).' },
  { id: 'workProject', name: 'Work on a Project', desc: 'Establish or continue a long-term project (tick its countdown).' },
];

export default function RestModal({ character, onApply, onClose }) {
  const level = character.level || 1;
  const tier = getTierForLevel(level);
  const scars = character.scars || 0;

  const [restType, setRestType] = useState(null); // 'short' | 'long'
  const [picks, setPicks] = useState([]); // up to 2 move ids (repeats allowed)
  const [withParty, setWithParty] = useState(false);
  const [results, setResults] = useState(null); // array of strings after applying

  const moves = restType === 'short' ? SHORT_MOVES : LONG_MOVES;

  const addPick = (id) => picks.length < 2 && setPicks([...picks, id]);
  const removePick = (idx) => setPicks(picks.filter((_, i) => i !== idx));

  const applyRest = () => {
    // Work on copies of the slot arrays. Conventions (matching the sheet):
    // hpSlots: true = HP remaining · stressSlots/armorSlots: true = marked · hopeSlots: true = Hope held
    const hp = [...(character.hpSlots || [true, true, true, true, true, true])];
    const stress = [...(character.stressSlots || [false, false, false, false, false, false])];
    const armor = [...(character.armorSlots || [false, false, false, false, false, false])];
    const hope = [...(character.hopeSlots || [false, false, false, false, false, false])];
    const usableHope = hope.length - scars;
    const log = [];

    const clearHP = (n) => {
      let cleared = 0;
      for (let i = 0; i < hp.length && cleared < n; i++) {
        if (!hp[i]) { hp[i] = true; cleared++; }
      }
      return cleared;
    };
    const clearStress = (n) => {
      let cleared = 0;
      for (let i = stress.length - 1; i >= 0 && cleared < n; i--) {
        if (stress[i]) { stress[i] = false; cleared++; }
      }
      return cleared;
    };
    const clearArmor = (n) => {
      let cleared = 0;
      for (let i = armor.length - 1; i >= 0 && cleared < n; i--) {
        if (armor[i]) { armor[i] = false; cleared++; }
      }
      return cleared;
    };
    const gainHope = (n) => {
      let gained = 0;
      for (let i = 0; i < usableHope && gained < n; i++) {
        if (!hope[i]) { hope[i] = true; gained++; }
      }
      return gained;
    };

    picks.forEach((id) => {
      switch (id) {
        case 'tendWounds': {
          const roll = d4();
          const cleared = clearHP(roll + tier);
          log.push(`Tend to Wounds — rolled 1d4+${tier} = ${roll + tier}, cleared ${cleared} HP`);
          break;
        }
        case 'clearStress': {
          const roll = d4();
          const cleared = clearStress(roll + tier);
          log.push(`Clear Stress — rolled 1d4+${tier} = ${roll + tier}, cleared ${cleared} Stress`);
          break;
        }
        case 'repairArmor': {
          const roll = d4();
          const cleared = clearArmor(roll + tier);
          log.push(`Repair Armor — rolled 1d4+${tier} = ${roll + tier}, cleared ${cleared} Armor Slots`);
          break;
        }
        case 'tendAllWounds': {
          const cleared = clearHP(hp.length);
          log.push(`Tend to All Wounds — cleared ${cleared} HP (fully healed)`);
          break;
        }
        case 'clearAllStress': {
          const cleared = clearStress(stress.length);
          log.push(`Clear All Stress — cleared ${cleared} Stress`);
          break;
        }
        case 'repairAllArmor': {
          const cleared = clearArmor(armor.length);
          log.push(`Repair All Armor — cleared ${cleared} Armor Slots`);
          break;
        }
        case 'prepare': {
          const amount = withParty ? 2 : 1;
          const gained = gainHope(amount);
          log.push(`Prepare${withParty ? ' (with allies)' : ''} — gained ${gained} Hope`);
          break;
        }
        case 'workProject': {
          log.push('Work on a Project — tick your project countdown (coordinate with the GM)');
          break;
        }
        default:
          break;
      }
    });

    onApply({ hpSlots: hp, stressSlots: stress, armorSlots: armor, hopeSlots: hope });
    setResults(log);
  };

  const renderTypePicker = () => (
    <div className="luw-step-content">
      <h3 className="luw-step-title">Take a Rest</h3>
      <p className="luw-step-desc">
        Choose a rest type. You can take up to three short rests before your next rest must be a long rest.
      </p>
      <div className="luw-options-list">
        <div className="luw-option">
          <button className="luw-option-btn" onClick={() => { setRestType('short'); setPicks([]); }}>
            <div className="luw-option-header">
              <span className="luw-option-label"><Sun size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />Short Rest (~1 hour)</span>
            </div>
            <div className="luw-option-desc">Catch your breath. Swap domain cards, then choose two downtime moves. The GM gains 1d4 Fear.</div>
          </button>
        </div>
        <div className="luw-option">
          <button className="luw-option-btn" onClick={() => { setRestType('long'); setPicks([]); }}>
            <div className="luw-option-header">
              <span className="luw-option-label"><Moon size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />Long Rest (camp for the night)</span>
            </div>
            <div className="luw-option-desc">Make camp and recover. Swap domain cards, then choose two downtime moves. The GM gains 1d4 + PCs Fear and can advance a long-term countdown.</div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMovePicker = () => (
    <div className="luw-step-content">
      <h3 className="luw-step-title">{restType === 'short' ? 'Short Rest' : 'Long Rest'} — Choose 2 Moves ({picks.length}/2)</h3>
      <p className="luw-step-desc">
        You can swap any domain cards between your loadout and vault during a rest.
        Choose two moves — you may pick the same move twice.
      </p>

      {picks.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {picks.map((id, i) => {
            const mv = moves.find(m => m.id === id);
            return (
              <button key={i} className="luw-trait-btn selected" onClick={() => removePick(i)} title="Remove">
                {mv?.name} ✕
              </button>
            );
          })}
        </div>
      )}

      <div className="luw-options-list">
        {moves.map(mv => {
          const count = picks.filter(p => p === mv.id).length;
          const disabled = picks.length >= 2;
          return (
            <div key={mv.id} className={`luw-option ${count > 0 ? 'selected' : ''} ${disabled && count === 0 ? 'disabled' : ''}`}>
              <button className="luw-option-btn" onClick={() => addPick(mv.id)} disabled={disabled}>
                <div className="luw-option-header">
                  <span className="luw-option-label">{mv.name}{count > 0 ? ` ×${count}` : ''}</span>
                </div>
                <div className="luw-option-desc">{mv.desc}</div>
              </button>
              {mv.id === 'prepare' && count > 0 && (
                <div className="luw-detail-panel">
                  <label className="luw-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={withParty} onChange={e => setWithParty(e.target.checked)} />
                    Preparing together with one or more allies (+2 Hope each instead of +1)
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="luw-step-content">
      <h3 className="luw-step-title">Rest Complete</h3>
      {results.map((r, i) => (
        <div key={i} className="luw-achievement-item">
          <Check size={16} className="luw-check-icon" />
          <span>{r}</span>
        </div>
      ))}
      <p className="luw-hint" style={{ marginTop: '0.75rem' }}>
        Remember: features that refresh per rest are available again{restType === 'long' ? ', including once-per-long-rest features' : ''}.
        The GM gains {restType === 'short' ? '1d4 Fear' : '1d4 + the number of PCs in Fear'}.
      </p>
    </div>
  );

  return (
    <div className="luw-overlay" onClick={onClose}>
      <div className="luw-modal" onClick={e => e.stopPropagation()}>
        <div className="luw-header">
          <h2 className="luw-title"><Dices size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />Downtime</h2>
          <button className="luw-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="luw-body">
          {results ? renderResults() : restType ? renderMovePicker() : renderTypePicker()}
        </div>

        <div className="luw-footer">
          {results ? (
            <>
              <span />
              <button className="luw-btn luw-btn-primary" onClick={onClose}><Check size={16} /> Done</button>
            </>
          ) : restType ? (
            <>
              <button className="luw-btn luw-btn-secondary" onClick={() => { setRestType(null); setPicks([]); }}>Back</button>
              <button className="luw-btn luw-btn-primary" disabled={picks.length !== 2} onClick={applyRest}>
                <Check size={16} /> Take {restType === 'short' ? 'Short' : 'Long'} Rest
              </button>
            </>
          ) : (
            <>
              <button className="luw-btn luw-btn-secondary" onClick={onClose}>Cancel</button>
              <span />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
