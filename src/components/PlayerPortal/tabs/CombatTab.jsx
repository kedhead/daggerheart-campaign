import { useState, useRef } from 'react';
import { Dices, Sword } from 'lucide-react';
import { TRAIT_ABBREV, TRAIT_NAMES, formatTraitValue, getWeaponDamage, parseDamageString } from '../../../utils/daggerheartRollUtils';
import { RollResultBanner } from '../../../dice';

const DEFAULT_TRAITS = { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 };

export default function CombatTab({ character, roll, rollDamage, campaignId }) {
  const [rollingKey, setRollingKey] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const [rollBonus, setRollBonus] = useState(null); // 'advantage' | 'hindrance' | null
  const timerRef = useRef(null);

  const traits = { ...DEFAULT_TRAITS, ...character.traits };
  const level = character.level || 1;
  const equippedItems = character.equippedItems || [];

  const showResult = (doc) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLastRoll(doc);
    timerRef.current = setTimeout(() => setLastRoll(null), 6000);
  };

  const flashRoll = (key) => {
    setRollingKey(key);
    setTimeout(() => setRollingKey(null), 500);
  };

  const handleTraitRoll = async (traitName) => {
    if (!campaignId) return;
    const mod = traits[traitName] ?? 0;
    const label = `${traitName.charAt(0).toUpperCase() + traitName.slice(1)} (${TRAIT_ABBREV[traitName]})`;
    const advantage = rollBonus === 'advantage';
    const disadvantage = rollBonus === 'hindrance';
    flashRoll(`trait-${traitName}`);
    setRollBonus(null);
    const doc = await roll({ label, modifier: mod, advantage, disadvantage });
    if (doc) showResult(doc);
  };

  const handleWeaponRoll = async (item, type) => {
    if (!campaignId) return;
    const dmgStr = type === 'weapon-damage'
      ? (getWeaponDamage(item, level) || item.damage)
      : null;
    const parsed = dmgStr ? parseDamageString(dmgStr) : null;
    flashRoll(`${type}-${item.id || item.name}`);

    if (type === 'weapon-attack') {
      const traitKey = item.systemData?.trait?.toLowerCase() || 'agility';
      const mod = traits[traitKey] ?? 0;
      const doc = await roll({ label: `${item.name} Attack`, modifier: mod });
      if (doc) showResult(doc);
    } else if (parsed) {
      const doc = await rollDamage({
        label: `${item.name} Damage`,
        dieType: parsed.dieType,
        quantity: parsed.quantity,
        modifier: parsed.modifier,
      });
      if (doc) showResult(doc);
    }
  };

  const toggleBonus = (type) => {
    setRollBonus(prev => prev === type ? null : type);
  };

  return (
    <div>
      {/* Roll result overlay */}
      {lastRoll && (
        <div className="lrp-roll-overlay">
          <RollResultBanner roll={lastRoll} />
        </div>
      )}

      {/* Advantage / Hindrance toggle */}
      <div className="lrp-bonus-row">
        <button
          className={`lrp-bonus-btn${rollBonus === 'advantage' ? ' active-advantage' : ''}`}
          onClick={() => toggleBonus('advantage')}
        >
          + Advantage
        </button>
        <button
          className={`lrp-bonus-btn${rollBonus === 'hindrance' ? ' active-hindrance' : ''}`}
          onClick={() => toggleBonus('hindrance')}
        >
          − Hindrance
        </button>
      </div>

      {/* Trait grid */}
      <div className="lrp-traits-grid">
        {TRAIT_NAMES.map((name) => {
          const val = traits[name] ?? 0;
          const isRolling = rollingKey === `trait-${name}`;
          return (
            <button
              key={name}
              className={`lrp-trait-btn${isRolling ? ' lrp-rolling' : ''}`}
              onClick={() => handleTraitRoll(name)}
              aria-label={`Roll ${name}: ${formatTraitValue(val)}`}
            >
              <span className="lrp-trait-name">{TRAIT_ABBREV[name]}</span>
              <span
                className="lrp-trait-mod"
                style={{ color: val > 0 ? '#34d399' : val < 0 ? '#f87171' : 'var(--text)' }}
              >
                {formatTraitValue(val)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Evasion */}
      <div className="lrp-stat-row" style={{ marginBottom: 20 }}>
        <div className="lrp-stat-chip">
          <span className="lrp-stat-value">{character.evasion ?? 10}</span>
          <span className="lrp-stat-label">Evasion</span>
        </div>
      </div>

      {/* Equipped weapons */}
      {equippedItems.length > 0 && (
        <div>
          <div className="lrp-section-heading">Weapons</div>
          {equippedItems.map((item, idx) => {
            const dmgStr = getWeaponDamage(item, level) || item.damage || item.systemData?.damage;
            const traitKey = item.systemData?.trait || item.trait || 'AGI';
            const isAttackRolling = rollingKey === `weapon-attack-${item.id || item.name}`;
            const isDmgRolling = rollingKey === `weapon-damage-${item.id || item.name}`;
            return (
              <div key={item.id || idx} className="lrp-weapon-card">
                <div className="lrp-weapon-name">{item.name}</div>
                <div className="lrp-weapon-meta">
                  {traitKey && <span>{traitKey}</span>}
                  {item.range && <span>{item.range}</span>}
                  {dmgStr && <span>{dmgStr}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`lrp-action-btn lrp-action-btn-primary${isAttackRolling ? ' lrp-rolling' : ''}`}
                    onClick={() => handleWeaponRoll(item, 'weapon-attack')}
                  >
                    <Sword size={14} /> Attack
                  </button>
                  {dmgStr && (
                    <button
                      className={`lrp-action-btn lrp-action-btn-secondary${isDmgRolling ? ' lrp-rolling' : ''}`}
                      onClick={() => handleWeaponRoll(item, 'weapon-damage')}
                    >
                      <Dices size={14} /> {dmgStr}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
