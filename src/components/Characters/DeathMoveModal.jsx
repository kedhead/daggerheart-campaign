import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Skull, Check, Flame, Shield, Dices } from 'lucide-react';
import './LevelUpWizard.css';

const d12 = () => Math.floor(Math.random() * 12) + 1;

export default function DeathMoveModal({ character, onApply, onClose }) {
  const level = character.level || 1;
  const scars = character.scars || 0;
  const hopeSlotCount = (character.hopeSlots || [false, false, false, false, false, false]).length;

  const [outcome, setOutcome] = useState(null);
  // Risk It All splitting state
  const [riskPool, setRiskPool] = useState(null); // { hopeDie, fearDie, result }
  const [hpSplit, setHpSplit] = useState(0);

  const chooseBlaze = () => {
    setOutcome({
      title: 'Blaze of Glory',
      lines: [
        'Take one final action (at the GM\'s discretion) — it automatically CRITICALLY SUCCEEDS.',
        'Then your character crosses through the veil of death.',
        'When you\'re ready, use "Mark as Fallen" on the Characters page to memorialize them, and work with the GM to build a new character at the party\'s current level.',
      ],
      deadly: true,
    });
  };

  const chooseAvoid = () => {
    const roll = d12();
    const scarred = roll <= level;
    const updates = {};
    const lines = [
      'Your character temporarily drops unconscious. They can\'t move or act, and can\'t be targeted by an attack.',
      'They return to consciousness when an ally clears 1 or more of their marked Hit Points, or when the party finishes a long rest.',
      `Hope Die roll: ${roll} vs level ${level} — ${scarred ? 'SCAR! The roll is equal to or under your level.' : 'no scar (roll is above your level).'}`,
    ];
    if (scarred) {
      const newScars = scars + 1;
      updates.scars = newScars;
      lines.push(`Cross out a Hope slot permanently (${hopeSlotCount - newScars} usable Hope slots remain). Describe the scar's narrative impact.`);
      if (newScars >= hopeSlotCount) {
        lines.push('That was your character\'s LAST Hope slot — their journey ends here. Work with the GM on what comes next.');
      }
    }
    if (Object.keys(updates).length) onApply(updates);
    setOutcome({ title: 'Avoid Death', lines, deadly: scars + (scarred ? 1 : 0) >= hopeSlotCount });
  };

  const chooseRisk = () => {
    const hopeDie = d12();
    const fearDie = d12();
    if (hopeDie === fearDie) {
      // Critical success — clear all HP and Stress
      const hp = (character.hpSlots || []).map(() => true);
      const stress = (character.stressSlots || []).map(() => false);
      onApply({ hpSlots: hp, stressSlots: stress });
      setOutcome({
        title: 'Risk It All — CRITICAL SUCCESS!',
        lines: [
          `Duality roll: Hope ${hopeDie} = Fear ${fearDie} — doubles!`,
          'Your character stays on their feet and clears ALL Hit Points and Stress.',
        ],
      });
    } else if (hopeDie > fearDie) {
      setRiskPool({ hopeDie, fearDie });
      setHpSplit(Math.min(hopeDie, (character.hpSlots || []).filter(s => !s).length));
    } else {
      setOutcome({
        title: 'Risk It All — the Fear Die wins',
        lines: [
          `Duality roll: Hope ${hopeDie} vs Fear ${fearDie}.`,
          'Your character crosses through the veil of death.',
          'Use "Mark as Fallen" on the Characters page to memorialize them, and work with the GM to build a new character at the party\'s current level.',
        ],
        deadly: true,
      });
    }
  };

  const applyRiskSplit = () => {
    const { hopeDie } = riskPool;
    const stressSplit = hopeDie - hpSplit;
    const hp = [...(character.hpSlots || [])];
    const stress = [...(character.stressSlots || [])];
    let hpCleared = 0;
    for (let i = 0; i < hp.length && hpCleared < hpSplit; i++) {
      if (!hp[i]) { hp[i] = true; hpCleared++; }
    }
    let stressCleared = 0;
    for (let i = stress.length - 1; i >= 0 && stressCleared < stressSplit; i--) {
      if (stress[i]) { stress[i] = false; stressCleared++; }
    }
    onApply({ hpSlots: hp, stressSlots: stress });
    setOutcome({
      title: 'Risk It All — the Hope Die wins',
      lines: [
        `Duality roll: Hope ${riskPool.hopeDie} vs Fear ${riskPool.fearDie}.`,
        `Your character stays on their feet and clears ${hpCleared} Hit Points and ${stressCleared} Stress.`,
      ],
    });
    setRiskPool(null);
  };

  const renderMoves = () => (
    <div className="luw-step-content">
      <h3 className="luw-step-title">You marked your last Hit Point</h3>
      <p className="luw-step-desc">You must make a death move. Choose your character's fate:</p>
      <div className="luw-options-list">
        <div className="luw-option">
          <button className="luw-option-btn" onClick={chooseBlaze}>
            <div className="luw-option-header">
              <span className="luw-option-label"><Flame size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />Blaze of Glory</span>
            </div>
            <div className="luw-option-desc">
              Embrace death and go out in a blaze of glory. Take one final action, which critically succeeds — then cross through the veil of death.
            </div>
          </button>
        </div>
        <div className="luw-option">
          <button className="luw-option-btn" onClick={chooseAvoid}>
            <div className="luw-option-header">
              <span className="luw-option-label"><Shield size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />Avoid Death</span>
            </div>
            <div className="luw-option-desc">
              Avoid death and face the consequences: drop unconscious and the situation worsens. Roll your Hope Die —
              on your level or under, you gain a scar (permanently cross out a Hope slot).
            </div>
          </button>
        </div>
        <div className="luw-option">
          <button className="luw-option-btn" onClick={chooseRisk}>
            <div className="luw-option-header">
              <span className="luw-option-label"><Dices size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />Risk It All</span>
            </div>
            <div className="luw-option-desc">
              Roll your Duality Dice. Hope higher: stay up and clear that many HP/Stress (split as you like).
              Fear higher: cross through the veil of death. Doubles: clear ALL HP and Stress.
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderRiskSplit = () => {
    const { hopeDie, fearDie } = riskPool;
    const markedHP = (character.hpSlots || []).filter(s => !s).length;
    const markedStress = (character.stressSlots || []).filter(s => s).length;
    const maxHp = Math.min(hopeDie, markedHP);
    const stressSplit = Math.min(hopeDie - hpSplit, markedStress);
    return (
      <div className="luw-step-content">
        <h3 className="luw-step-title">The Hope Die wins! ({hopeDie} vs {fearDie})</h3>
        <p className="luw-step-desc">
          Your character stays on their feet. Divide {hopeDie} points between clearing Hit Points and Stress.
        </p>
        <div className="luw-input-group">
          <label className="luw-label">Hit Points to clear ({markedHP} marked): {hpSplit}</label>
          <input
            type="range"
            min={0}
            max={maxHp}
            value={hpSplit}
            onChange={e => setHpSplit(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div className="luw-hint">Remaining {hopeDie - hpSplit} points go to Stress (clears {stressSplit} of {markedStress} marked).</div>
        </div>
      </div>
    );
  };

  const renderOutcome = () => (
    <div className="luw-step-content">
      <h3 className="luw-step-title" style={outcome.deadly ? { color: '#e66' } : undefined}>{outcome.title}</h3>
      {outcome.lines.map((l, i) => (
        <div key={i} className="luw-achievement-item" style={outcome.deadly ? { background: 'rgba(170,58,58,0.1)', borderColor: 'rgba(170,58,58,0.25)', color: '#c8b0b0' } : undefined}>
          <Check size={16} className="luw-check-icon" style={outcome.deadly ? { color: '#e66' } : undefined} />
          <span>{l}</span>
        </div>
      ))}
    </div>
  );

  // Portal to <body>: ancestor transforms/filters in the app shell would
  // otherwise re-anchor this "fixed" overlay and strand it off-viewport on
  // phones. Server rendering (smoke tests) has no document — render inline.
  const overlay = (
    <div className="luw-overlay" onClick={onClose}>
      <div className="luw-modal" onClick={e => e.stopPropagation()}>
        <div className="luw-header">
          <h2 className="luw-title" style={{ color: '#e66' }}>
            <Skull size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />Death Move
          </h2>
          <button className="luw-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="luw-body">
          {outcome ? renderOutcome() : riskPool ? renderRiskSplit() : renderMoves()}
        </div>

        <div className="luw-footer">
          {outcome ? (
            <>
              <span />
              <button className="luw-btn luw-btn-primary" onClick={onClose}><Check size={16} /> Close</button>
            </>
          ) : riskPool ? (
            <>
              <span />
              <button className="luw-btn luw-btn-primary" onClick={applyRiskSplit}><Check size={16} /> Apply</button>
            </>
          ) : (
            <>
              <button className="luw-btn luw-btn-secondary" onClick={onClose}>Not yet</button>
              <span />
            </>
          )}
        </div>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
