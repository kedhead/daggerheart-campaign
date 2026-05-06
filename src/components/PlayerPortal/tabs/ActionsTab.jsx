import { useState } from 'react';
import { TRAIT_ABBREV, getWeaponDamage, parseDamageString } from '../../../utils/daggerheartRollUtils';
import { getFeatureName, getFeatureDescription } from '../../../utils/itemFeatures';
import { getBaseProficiency } from '../../../data/systems/daggerheart';

const BONUS_OPTS = [
  { key: null,        label: 'Normal',      color: '#eab308' },
  { key: 'advantage', label: '+ Advantage', color: '#22c55e' },
  { key: 'hindrance', label: '− Hindrance', color: '#f87171' },
];

function RollPill({ label, formula, onClick, kind, isRolling }) {
  const colorMap = { weapon: '#f5c543', spell: '#a78bfa', stat: '#60a5fa', generic: '#eab308' };
  const c = colorMap[kind] || colorMap.generic;
  return (
    <button onClick={onClick} className={`lrp-roll-pill${isRolling ? ' lrp-rolling' : ''}`}
      style={{ background: `linear-gradient(180deg, ${c}22, ${c}11)`, border: `1px solid ${c}55`, color: c }}>
      <span style={{ fontSize: 14 }}>🎲</span>
      <span>{label}</span>
      {formula && <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85, fontWeight: 600 }}>{formula}</span>}
    </button>
  );
}

export default function ActionsTab({ character, rollBonus, setRollBonus, roll, rollDamage, campaignId, items }) {
  const [rollingKey, setRollingKey] = useState(null);

  const traits = character.traits || {};
  const level = character.level || 1;
  const proficiency = getBaseProficiency(level);

  // Resolve equippedItems refs against the catalog, filter to weapons only
  const weapons = Array.isArray(character.equippedItems)
    ? character.equippedItems
        .map(ei => {
          const full = items?.find(i => i.id === ei.itemId);
          return full ? { ...full, ...ei } : (ei.name ? ei : null);
        })
        .filter(item => item && item.type === 'weapon' && item.equipped !== false)
    : [];

  const handleWeaponAttack = async (weapon) => {
    if (!campaignId) return;
    const traitKey = (weapon.systemData?.trait || 'agility').toLowerCase();
    const mod = (traits[traitKey] ?? 0) + proficiency;
    const bonus = rollBonus;
    if (rollBonus) setRollBonus(null);
    setRollingKey(`atk-${weapon.id}`);
    const doc = await roll({
      label: `${weapon.name} Attack`,
      modifier: mod,
      advantage: bonus === 'advantage',
      disadvantage: bonus === 'hindrance',
    });
    setRollingKey(null);
  };

  const handleWeaponDamage = async (weapon) => {
    if (!campaignId) return;
    const dmgStr = getWeaponDamage(weapon, level) || weapon.systemData?.damage || weapon.damage;
    const parsed = dmgStr ? parseDamageString(dmgStr) : null;
    if (!parsed) return;
    setRollingKey(`dmg-${weapon.id}`);
    await rollDamage({ label: `${weapon.name} Damage`, ...parsed });
    setRollingKey(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Roll modifier */}
      <div>
        <div className="lrp-section-label">Roll Modifier</div>
        <div className="lrp-bonus-toggle">
          {BONUS_OPTS.map(o => {
            const active = rollBonus === o.key;
            return (
              <button key={String(o.key)} onClick={() => setRollBonus(o.key)} className="lrp-bonus-seg"
                style={{ background: active ? o.color : 'transparent', color: active ? '#0d0a1f' : 'rgba(255,255,255,0.55)' }}>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weapons */}
      {weapons.length > 0 && (
        <div>
          <div className="lrp-section-label">Weapons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {weapons.map((weapon, idx) => {
              const sd = weapon.systemData || {};
              const dmg = getWeaponDamage(weapon, level) || sd.damage || '';
              const traitKey = (sd.trait || '').toLowerCase();
              const traitMod = (traits[traitKey] ?? 0) + proficiency;
              const atkLabel = `${TRAIT_ABBREV[traitKey] || sd.trait || 'AGI'} ${traitMod >= 0 ? '+' : ''}${traitMod}`;
              const features = sd.features || [];
              const customFeatures = features.filter(f => getFeatureDescription(f));
              return (
                <div key={weapon.id || idx} className="lrp-card" style={{ borderColor: 'rgba(245,197,67,0.22)', padding: '14px 14px 12px' }}>
                  {/* Name + stats row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fdf6dc' }}>{weapon.name}</div>
                    {sd.tier && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#eab308', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 6, padding: '2px 7px', letterSpacing: '0.05em', flexShrink: 0 }}>
                        T{sd.tier}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: features.length ? 10 : 0 }}>
                    {[sd.trait, sd.range, dmg, sd.damageType, sd.burden].filter(Boolean).join(' · ')}
                  </div>

                  {/* Feature badges */}
                  {features.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: customFeatures.length ? 10 : 0 }}>
                      {features.map((f, fi) => {
                        const name = getFeatureName(f);
                        if (!name) return null;
                        return (
                          <span key={fi} style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                            color: '#c4b5fd', letterSpacing: '0.04em',
                          }}>
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom feature descriptions */}
                  {customFeatures.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                      {customFeatures.map((f, fi) => (
                        <div key={fi} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
                          <span style={{ fontWeight: 700, color: '#c4b5fd' }}>{getFeatureName(f)}:</span>
                          {' '}{getFeatureDescription(f)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Flavor text */}
                  {weapon.description && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 10 }}>
                      {weapon.description}
                    </div>
                  )}

                  {/* Roll buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <RollPill kind="weapon" label="Attack" formula={atkLabel}
                      isRolling={rollingKey === `atk-${weapon.id}`}
                      onClick={() => handleWeaponAttack(weapon)} />
                    {dmg && (
                      <RollPill kind="weapon" label={dmg}
                        isRolling={rollingKey === `dmg-${weapon.id}`}
                        onClick={() => handleWeaponDamage(weapon)} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Combat actions */}
      <div>
        <div className="lrp-section-label">Combat Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { name: 'Tag Team',     desc: "Spend a Hope to assist an ally's roll" },
            { name: 'Help an Ally', desc: "Grant +d6 to ally's next roll" },
            { name: 'Make a Move',  desc: 'Move within Close range' },
            { name: 'Take Cover',   desc: '+1 to Defense until next turn' },
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
