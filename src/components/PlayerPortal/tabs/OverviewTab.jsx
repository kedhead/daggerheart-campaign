import { useState, useEffect } from 'react';
import PortalSlotTracker from '../PortalSlotTracker';

const DEFAULT_SLOTS = (n, val) => Array(n).fill(val);

export default function OverviewTab({ character, updateCharacter }) {
  const [localHp, setLocalHp] = useState(null);
  const [localStress, setLocalStress] = useState(null);
  const [localArmor, setLocalArmor] = useState(null);
  const [localHope, setLocalHope] = useState(null);
  const [localSlayerDice, setLocalSlayerDice] = useState(null);

  // Reset local state when server data changes
  useEffect(() => {
    setLocalHp(null);
    setLocalStress(null);
    setLocalArmor(null);
    setLocalHope(null);
    setLocalSlayerDice(null);
  }, [character.hpSlots, character.stressSlots, character.armorSlots, character.hopeSlots, character.slayerDice]);

  const hpSlots = localHp || character.hpSlots || DEFAULT_SLOTS(6, false);
  const stressSlots = localStress || character.stressSlots || DEFAULT_SLOTS(6, false);
  const armorSlots = localArmor || character.armorSlots || DEFAULT_SLOTS(6, false);
  const hopeSlots = localHope || character.hopeSlots || DEFAULT_SLOTS(6, false);
  const slayerDice = localSlayerDice ?? character.slayerDice ?? null;

  const handleToggle = (type, setter, current, index) => {
    if (!updateCharacter) return;
    const next = [...current];
    next[index] = !next[index];
    setter(next);
    updateCharacter(character.id, { [type]: next });
  };

  const handleSlayerAdjust = (delta) => {
    if (!updateCharacter) return;
    const max = character.maxSlayerDice ?? 4;
    const current = slayerDice ?? 0;
    const next = Math.max(0, Math.min(max, current + delta));
    if (next === current) return;
    setLocalSlayerDice(next);
    updateCharacter(character.id, { slayerDice: next });
  };

  const evasion = character.evasion ?? 10;
  const armor = character.armor ?? 0;

  return (
    <div>
      {/* Character portrait + identity */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
        {character.avatarUrl ? (
          <div className="lrp-avatar">
            <img src={character.avatarUrl} alt={character.name} />
          </div>
        ) : (
          <div className="lrp-avatar">
            {(character.name || '?')[0].toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
            {character.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            {[character.class, character.subclass, character.ancestry].filter(Boolean).join(' · ')}
          </div>
          <div style={{
            display: 'inline-block',
            marginTop: 4,
            padding: '2px 8px',
            borderRadius: 99,
            background: 'var(--primary-soft, rgba(99,102,241,0.15))',
            color: 'var(--primary, #6366f1)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}>
            LVL {character.level || 1}
          </div>
        </div>
      </div>

      {/* HP — true = marked/damaged; false = healthy */}
      <PortalSlotTracker
        slots={hpSlots}
        label="Hit Points"
        activeColor="rgba(52, 211, 153, 0.7)"
        inactiveColor="rgba(248, 113, 113, 0.25)"
        onToggle={(i) => handleToggle('hpSlots', setLocalHp, hpSlots, i)}
      />

      <PortalSlotTracker
        slots={stressSlots}
        label="Stress"
        activeColor="rgba(251, 191, 36, 0.0)"
        inactiveColor="rgba(251, 191, 36, 0.35)"
        onToggle={(i) => handleToggle('stressSlots', setLocalStress, stressSlots, i)}
      />

      <PortalSlotTracker
        slots={hopeSlots}
        label="Hope"
        activeColor="rgba(99, 102, 241, 0.7)"
        inactiveColor="rgba(99, 102, 241, 0.12)"
        onToggle={(i) => handleToggle('hopeSlots', setLocalHope, hopeSlots, i)}
      />

      <PortalSlotTracker
        slots={armorSlots}
        label="Armor"
        activeColor="rgba(56, 189, 248, 0.7)"
        inactiveColor="rgba(56, 189, 248, 0.12)"
        onToggle={(i) => handleToggle('armorSlots', setLocalArmor, armorSlots, i)}
      />

      {/* Slayer dice — only shown when character has this feature */}
      {slayerDice !== null && (
        <div className="lrp-slayer-row">
          <span className="lrp-slayer-label">Slayer Dice</span>
          <button className="lrp-stepper-btn" onClick={() => handleSlayerAdjust(-1)}>−</button>
          <span className="lrp-slayer-count">{slayerDice}</span>
          <button className="lrp-stepper-btn" onClick={() => handleSlayerAdjust(1)}>+</button>
        </div>
      )}

      {/* Evasion + Armor score */}
      <div className="lrp-stat-row">
        <div className="lrp-stat-chip">
          <span className="lrp-stat-value">{evasion}</span>
          <span className="lrp-stat-label">Evasion</span>
        </div>
        <div className="lrp-stat-chip">
          <span className="lrp-stat-value">{armor}</span>
          <span className="lrp-stat-label">Armor</span>
        </div>
      </div>
    </div>
  );
}
