import { useRef, useState } from 'react';
import { RollResultBanner } from '../../../dice';
import { TRAIT_ABBREV, formatTraitValue, getWeaponDamage, parseDamageString } from '../../../utils/daggerheartRollUtils';
import { getBaseProficiency } from '../../../data/systems/daggerheart';

const BONUS_OPTS = [
  { key: null,        label: 'Normal',    color: '#eab308' },
  { key: 'advantage', label: '+ Advantage', color: '#22c55e' },
  { key: 'hindrance', label: '− Hindrance', color: '#f87171' },
];

function RollPill({ label, formula, onClick, kind, isRolling }) {
  const colorMap = { weapon: '#f5c543', spell: '#a78bfa', stat: '#60a5fa', generic: '#eab308' };
  const c = colorMap[kind] || colorMap.generic;
  return (
    <button
      onClick={onClick}
      className={`lrp-roll-pill${isRolling ? ' lrp-rolling' : ''}`}
      style={{
        background: `linear-gradient(180deg, ${c}22, ${c}11)`,
        border: `1px solid ${c}55`,
        color: c,
      }}
    >
      <span style={{ fontSize: 14 }}>🎲</span>
      <span>{label}</span>
      {formula && <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85, fontWeight: 600 }}>{formula}</span>}
    </button>
  );
}

export default function ActionsTab({ character, rollBonus, setRollBonus, roll, rollDamage, campaignId }) {
  const [rollingKey, setRollingKey] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const timerRef = useRef(null);

  const traits = character.traits || {};
  const level = character.level || 1;
  const proficiency = getBaseProficiency(level);
  const equippedItems = character.equippedItems || [];

  const showResult = (doc) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLastRoll(doc);
    timerRef.current = setTimeout(() => setLastRoll(null), 6000);
  };

  const handleWeaponAttack = async (item) => {
    if (!campaignId) return;
    const traitKey = (item.systemData?.trait || item.trait || 'agility').toLowerCase();
    const traitMod = traits[traitKey] ?? 0;
    const mod = traitMod + proficiency;
    setRollingKey(`atk-${item.id}`);
    const bonus = rollBonus;
    if (rollBonus) setRollBonus(null);
    const doc = await roll({
      label: `${item.name} Attack`,
      modifier: mod,
      advantage: bonus === 'advantage',
      disadvantage: bonus === 'hindrance',
    });
    setRollingKey(null);
    if (doc) showResult(doc);
  };

  const handleWeaponDamage = async (item) => {
    if (!campaignId) return;
    const dmgStr = getWeaponDamage(item, level) || item.damage;
    const parsed = dmgStr ? parseDamageString(dmgStr) : null;
    if (!parsed) return;
    setRollingKey(`dmg-${item.id}`);
    const doc = await rollDamage({ label: `${item.name} Damage`, ...parsed });
    setRollingKey(null);
    if (doc) showResult(doc);
  };

  const traitKey = (item) => (item.systemData?.trait || item.trait || 'AGI').toUpperCase().slice(0, 3);
  const traitMod = (item) => {
    const k = (item.systemData?.trait || item.trait || 'agility').toLowerCase();
    const v = (traits[k] ?? 0) + proficiency;
    return v >= 0 ? `+${v}` : `${v}`;
  };
  const dmgStr = (item) => getWeaponDamage(item, level) || item.damage || item.systemData?.damage || '';

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

      {/* Weapons */}
      {equippedItems.length > 0 && (
        <div>
          <div className="lrp-section-label">Weapons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {equippedItems.map((item, idx) => (
              <div key={item.id || idx} className="lrp-card" style={{ borderColor: 'rgba(245,197,67,0.18)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fdf6dc', letterSpacing: '0.02em' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>
                      {traitKey(item)} · {item.range || item.systemData?.range || ''} · {dmgStr(item)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <RollPill kind="weapon" label="Attack" formula={traitMod(item)}
                    isRolling={rollingKey === `atk-${item.id}`}
                    onClick={() => handleWeaponAttack(item)} />
                  {dmgStr(item) && (
                    <RollPill kind="weapon" label="Damage" formula={dmgStr(item)}
                      isRolling={rollingKey === `dmg-${item.id}`}
                      onClick={() => handleWeaponDamage(item)} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combat actions */}
      <div>
        <div className="lrp-section-label">Combat Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { name: 'Tag Team',    desc: "Spend a Hope to assist an ally's roll" },
            { name: 'Help an Ally', desc: 'Grant +d6 to ally\'s next roll' },
            { name: 'Make a Move', desc: 'Move within Close range' },
            { name: 'Take Cover',  desc: '+1 to Defense until next turn' },
          ].map((a, i) => (
            <div key={i} className="lrp-card" style={{ padding: 11 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fdf6dc' }}>{a.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 1.35 }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
