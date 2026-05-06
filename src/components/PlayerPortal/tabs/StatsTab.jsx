import { useRef, useState } from 'react';
import { TRAIT_ABBREV, formatTraitValue } from '../../../utils/daggerheartRollUtils';
import { getBaseProficiency } from '../../../data/systems/daggerheart';
import { RollResultBanner } from '../../../dice';

const BONUS_OPTS = [
  { key: null,        label: 'Normal',      color: '#eab308' },
  { key: 'advantage', label: '+ Advantage', color: '#22c55e' },
  { key: 'hindrance', label: '− Hindrance', color: '#f87171' },
];

const TRAIT_FLAVOR = {
  agility:  'Sprint · Leap',
  strength: 'Lift · Smash',
  finesse:  'Aim · Sneak',
  instinct: 'Sense · Track',
  presence: 'Charm · Sway',
  knowledge: 'Recall · Lore',
};
const TRAIT_ORDER = ['agility', 'strength', 'finesse', 'instinct', 'presence', 'knowledge'];

export default function StatsTab({ character, rollBonus, setRollBonus, roll, campaignId }) {
  const [rollingKey, setRollingKey] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const timerRef = useRef(null);

  const traits = character.traits || {};
  const level = character.level || 1;
  const proficiency = character.proficiency || getBaseProficiency(level);
  const evasion = character.evasion ?? 10;
  const thresholds = character.thresholds;

  const showResult = (doc) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLastRoll(doc);
    timerRef.current = setTimeout(() => setLastRoll(null), 6000);
  };

  const handleTraitRoll = async (traitName) => {
    if (!campaignId) return;
    const mod = traits[traitName] ?? 0;
    const bonus = rollBonus;
    if (rollBonus) setRollBonus(null);
    setRollingKey(traitName);
    const doc = await roll({
      label: traitName.charAt(0).toUpperCase() + traitName.slice(1),
      modifier: mod,
      advantage: bonus === 'advantage',
      disadvantage: bonus === 'hindrance',
    });
    setRollingKey(null);
    if (doc) showResult(doc);
  };

  const experiences = character.experiences || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {lastRoll && (
        <div className="lrp-roll-overlay">
          <RollResultBanner roll={lastRoll} />
        </div>
      )}

      {/* Roll modifier */}
      <div>
        <div className="lrp-section-label">Roll Modifier</div>
        <div className="lrp-bonus-toggle">
          {BONUS_OPTS.map(o => {
            const active = rollBonus === o.key;
            return (
              <button key={String(o.key)} onClick={() => setRollBonus(o.key)} className="lrp-bonus-seg"
                style={{
                  background: active ? o.color : 'transparent',
                  color: active ? '#0d0a1f' : 'rgba(255,255,255,0.55)',
                }}>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Traits — tap to roll */}
      <div>
        <div className="lrp-section-label">Traits — tap to roll</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {TRAIT_ORDER.map(name => {
            const val = traits[name] ?? 0;
            const isRolling = rollingKey === name;
            return (
              <button key={name} onClick={() => handleTraitRoll(name)}
                className={`lrp-trait-btn${isRolling ? ' lrp-rolling' : ''}`}>
                <div className="lrp-trait-name">{TRAIT_ABBREV[name]}</div>
                <div className="lrp-cinzel lrp-trait-value">
                  {val >= 0 ? '+' : ''}{val}
                </div>
                <div className="lrp-trait-flavor">{TRAIT_FLAVOR[name]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Evasion + Proficiency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="lrp-card">
          <div style={{ fontSize: 10, color: '#60a5fa', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800 }}>Evasion</div>
          <div className="lrp-cinzel" style={{ fontSize: 36, fontWeight: 900, color: '#fdf6dc', lineHeight: 1, marginTop: 6 }}>
            {evasion}
          </div>
        </div>
        <div className="lrp-card">
          <div style={{ fontSize: 10, color: '#60a5fa', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 800 }}>Proficiency</div>
          <div className="lrp-cinzel" style={{ fontSize: 36, fontWeight: 900, color: '#fdf6dc', lineHeight: 1, marginTop: 6 }}>
            +{proficiency}
          </div>
        </div>
      </div>

      {/* Damage thresholds */}
      {thresholds && (
        <div>
          <div className="lrp-section-label">Damage Thresholds</div>
          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', minWidth: 50 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Minor</div>
                <div className="lrp-cinzel" style={{ fontSize: 18, color: '#fdf6dc', fontWeight: 800, marginTop: 2 }}>1 HP</div>
              </div>
              <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #22c55e, #eab308)', margin: '0 8px', borderRadius: 1 }} />
              <div style={{ textAlign: 'center', minWidth: 50 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Major</div>
                <div className="lrp-cinzel" style={{ fontSize: 22, color: '#fdf6dc', fontWeight: 800, marginTop: 2 }}>{thresholds.major}</div>
              </div>
              <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #eab308, #ef4444)', margin: '0 8px', borderRadius: 1 }} />
              <div style={{ textAlign: 'center', minWidth: 50 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Severe</div>
                <div className="lrp-cinzel" style={{ fontSize: 22, color: '#fdf6dc', fontWeight: 800, marginTop: 2 }}>{thresholds.severe}</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 12, lineHeight: 1.45 }}>
              Damage at or above each threshold marks <span style={{ color: '#f5c543' }}>1 / 2 / 3</span> HP.
            </div>
          </div>
        </div>
      )}

      {/* Experiences */}
      {experiences.length > 0 && (
        <div>
          <div className="lrp-section-label">Experiences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {experiences.map((e, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
              }}>
                <span style={{ fontSize: 12, color: '#fdf6dc', fontWeight: 600 }}>{e.name || e}</span>
                <span className="lrp-cinzel" style={{ fontSize: 16, fontWeight: 800, color: '#eab308' }}>+2</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
