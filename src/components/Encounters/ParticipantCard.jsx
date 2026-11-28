import { useState, useRef } from 'react';
import { fearCost, stressCost } from '../../utils/dualityAutomation';
import { Heart, Zap, Skull, ChevronDown, ChevronRight, Shield, Swords, Target, X, Check, Crown } from 'lucide-react';
import ConditionsBar from '../Conditions/ConditionsBar';
import { parseDamageNotation } from '../../dice';
import { marksForDamage } from '../../utils/thresholdDamage';

// The catalog's **bold** and _italic_ marks, shown as such rather than as symbols.
function richText(text) {
  return String(text).split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>;
    if (/^_[^_]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function ParticipantCard({
  participant,
  onApplyDamage,
  onApplyHealing,
  onSetConditions,
  onToggleDefeated,
  onRemove,
  onRollDamage,
  isDM,
  isExpanded,
  onToggleExpand,
  // The GM's Fear pool, so features that cost Fear can be paid for in one tap.
  fearCount = 0,
  onSpendFear
}) {
  const [damageInput, setDamageInput] = useState('');
  const [lastAttackResult, setLastAttackResult] = useState(null);
  const [lastDamageResult, setLastDamageResult] = useState(null);
  const attackTimer = useRef(null);
  const damageTimer = useRef(null);

  const {
    name,
    currentHP,
    maxHP,
    currentStress,
    maxStress,
    conditions,
    isDefeated,
    thresholds,
    role,
    tier,
    evasion,
    difficulty,
    attack,
    damage,
    attackName,
    attackRange,
    motives,
    features,
    isBoss,
    bossPhases,
    triggeredPhaseIds,
    currentPhaseName
  } = participant;

  // Calculate HP percentage
  const hpPercent = maxHP > 0 ? Math.max(0, Math.min(100, (currentHP / maxHP) * 100)) : 0;
  const stressPercent = maxStress > 0 ? Math.max(0, Math.min(100, (currentStress / maxStress) * 100)) : 0;
  const stressLeft = Math.max(0, (maxStress || 0) - (currentStress || 0));
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Damage thresholds use legacy field names: `minor` holds the Major
  // threshold and `major` holds Severe. They gate damage per hit (1/2/3 HP),
  // so they are not comparable to remaining HP.
  const majorThreshold = thresholds?.minor;
  const severeThreshold = thresholds?.major;

  // HP bar color from remaining HP fraction
  const getHPColor = () => {
    if (currentHP <= 0) return 'bg-gray-500';
    const frac = maxHP > 0 ? currentHP / maxHP : 0;
    if (frac <= 0.25) return 'bg-red-500';
    if (frac <= 0.5) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Get role color class
  const getRoleColorClass = () => {
    switch (role?.toLowerCase()) {
      case 'minion':
      case 'horde':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'standard':
      case 'bruiser':
      case 'skulk':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'leader':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'solo':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'boss':
        return 'bg-amber-500/30 text-amber-300 border-amber-500/60';
      default:
        return 'bg-white/10 text-lr-text-muted border-white/20';
    }
  };

  // Boss phase dots: sorted highest % first (last to trigger)
  const sortedPhases = isBoss && bossPhases
    ? [...bossPhases].sort((a, b) => b.triggerPercent - a.triggerPercent)
    : [];

  const handleQuickDamage = (amount) => {
    if (isDM && onApplyDamage) {
      onApplyDamage(participant.id, amount, 'hp');
    }
  };

  // Daggerheart: an incoming attack marks HP by threshold (see thresholdDamage.js).
  const marks = (dmg) => marksForDamage(dmg, {
    major: majorThreshold, severe: severeThreshold,
    isMinion: role?.toLowerCase() === 'minion', minionHp: maxHP || 1,
  });
  const applyThresholdDamage = () => {
    const dmg = parseInt(damageInput, 10);
    if (!isDM || !onApplyDamage || !(dmg > 0)) return;
    onApplyDamage(participant.id, marks(dmg), 'hp');
    setDamageInput('');
  };

  const handleQuickHeal = (amount) => {
    if (isDM && onApplyHealing) {
      onApplyHealing(participant.id, amount, 'hp');
    }
  };

  const handleStressDamage = (amount) => {
    if (isDM && onApplyDamage) {
      onApplyDamage(participant.id, amount, 'stress');
    }
  };
  const handleStressClear = (amount) => {
    if (isDM && onApplyHealing) {
      onApplyHealing(participant.id, amount, 'stress');
    }
  };

  // Roll the GM's d20 + attack modifier
  const handleRollAttack = async () => {
    if (!onRollDamage || attack === undefined) return;
    const result = await onRollDamage({
      label: `${name} Attack`,
      dieType: 20,
      quantity: 1,
      modifier: attack || 0,
    });
    if (!result) return;
    const isCrit = result.rolls?.[0] === 20;
    if (attackTimer.current) clearTimeout(attackTimer.current);
    setLastAttackResult({ ...result, isCrit });
    attackTimer.current = setTimeout(() => setLastAttackResult(null), 8000);
  };

  // Roll the adversary's damage dice
  const handleRollDamage = async () => {
    if (!onRollDamage || !damage) return;
    const parsed = parseDamageNotation(damage);
    if (!parsed) return;
    const result = await onRollDamage({ label: `${name} Damage`, ...parsed });
    if (!result) return;
    if (damageTimer.current) clearTimeout(damageTimer.current);
    setLastDamageResult(result);
    damageTimer.current = setTimeout(() => setLastDamageResult(null), 8000);
  };

  return (
    <div
      className={`
        bg-[var(--bg-secondary)] border rounded-xl overflow-hidden transition-all duration-200
        ${isDefeated
          ? 'border-white/5 opacity-60'
          : isBoss
            ? 'border-amber-500/60 hover:border-amber-400/80 hover:shadow-lg hover:shadow-amber-500/10'
            : 'border-white/10 hover:border-white/20 hover:shadow-lg'}
        ${isExpanded ? 'ring-1 ring-[rgb(var(--color-primary))]' : ''}
      `}
    >
      {/* One compact row: who it is, how hurt, and the everyday controls.
          Opening the row is only for the full stat block and features. */}
      <div className="px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          className="flex items-center gap-1.5 min-w-0 text-left hover:text-white"
          title={isExpanded ? 'Hide details' : 'Show stat block and features'}
        >
          {isExpanded ? <ChevronDown size={16} className="text-lr-text-dim shrink-0" /> : <ChevronRight size={16} className="text-lr-text-dim shrink-0" />}
          {isBoss && <Crown size={14} className="text-amber-400 shrink-0" />}
          {isDefeated && <Skull size={14} className="text-lr-text-dim shrink-0" />}
          <span className={`font-bold truncate max-w-[12rem] ${isDefeated ? 'text-lr-text-dim line-through' : 'text-white'}`}>{name}</span>
        </button>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleColorClass()}`}>{role}</span>
        <span className="text-[11px] font-mono text-lr-text-dim">T{tier}</span>
        {(difficulty ?? evasion) != null && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-lr-text-muted" title="Difficulty: what an attack must beat">
            <Shield size={11} className="text-blue-400" />{difficulty ?? evasion}
          </span>
        )}
        {currentPhaseName && (
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] border border-amber-500/40 font-medium">{currentPhaseName}</span>
        )}

        {/* HP and Stress */}
        <div className="flex items-center gap-3 flex-1 min-w-[180px]">
          <div className="flex items-center gap-1.5 flex-1 min-w-[90px]" title={`${currentHP} of ${maxHP} HP left`}>
            <Heart size={12} className="text-red-400 shrink-0" />
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative">
              <div className={`h-full transition-all duration-300 ${getHPColor()}`} style={{ width: `${hpPercent}%` }} />
              {isBoss && sortedPhases.map(ph => (
                <div key={ph.id}
                  className={`absolute top-0 bottom-0 w-0.5 z-10 ${(triggeredPhaseIds || []).includes(ph.id) ? 'bg-amber-400/40' : 'bg-amber-400/80'}`}
                  style={{ left: `${ph.triggerPercent}%` }} title={`${ph.name} (${ph.triggerPercent}%)`} />
              ))}
            </div>
            <span className="text-xs font-mono text-white whitespace-nowrap">{currentHP}/{maxHP}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-lr-text-muted whitespace-nowrap" title={`${currentStress} of ${maxStress} Stress marked`}>
            <Zap size={12} className="text-amber-400" />{currentStress}/{maxStress}
          </span>
        </div>

        {/* Everyday controls */}
        {isDM && !isDefeated && (
          <div className="flex flex-wrap items-center gap-1">
            {thresholds && (
              <form className="flex items-center" onSubmit={(e) => { e.preventDefault(); applyThresholdDamage(); }}>
                <input
                  type="number" min={1} value={damageInput} onChange={(e) => setDamageInput(e.target.value)}
                  placeholder="dmg" aria-label={`Damage to ${name}`}
                  title={`Type the damage roll: under ${majorThreshold} marks 1 HP, ${majorThreshold}+ marks 2, ${severeThreshold}+ marks 3`}
                  className="w-14 bg-white/5 border border-white/10 rounded-l px-1.5 py-1 text-xs text-white focus:outline-none focus:border-red-400/50"
                />
                <button type="submit" disabled={!(parseInt(damageInput, 10) > 0)}
                  className="px-2 py-1 text-xs rounded-r bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-l-0 border-white/10 disabled:opacity-40"
                  title={parseInt(damageInput, 10) > 0 ? `Marks ${marks(parseInt(damageInput, 10))} HP` : 'Apply damage by threshold'}>
                  {parseInt(damageInput, 10) > 0 ? `−${marks(parseInt(damageInput, 10))} HP` : 'Hit'}
                </button>
              </form>
            )}
            <button type="button" onClick={() => handleQuickDamage(1)} className="px-1.5 py-1 text-xs rounded bg-white/5 text-red-400 hover:bg-red-500/20 border border-white/10" title="Mark 1 HP">−1 HP</button>
            <button type="button" onClick={() => handleStressDamage(1)} className="px-1.5 py-1 text-xs rounded bg-white/5 text-amber-400 hover:bg-amber-500/20 border border-white/10"
              title={stressLeft < 1 ? 'No Stress left: it marks 1 HP instead' : 'Mark 1 Stress'}>+1 St</button>
            {attack !== undefined && onRollDamage && (
              <button type="button" onClick={handleRollAttack} className="px-1.5 py-1 text-xs rounded bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border border-blue-500/25 inline-flex items-center gap-1" title={`Roll attack: d20+${attack || 0}`}>
                <Swords size={11} /> +{attack || 0}
              </button>
            )}
            {damage && parseDamageNotation(damage) && onRollDamage && (
              <button type="button" onClick={handleRollDamage} className="px-1.5 py-1 text-xs rounded bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/25 font-mono" title={`Roll damage: ${damage}`}>
                {String(damage).replace(/\s*(phy|mag)\w*$/i, '')}
              </button>
            )}
          </div>
        )}

        {/* Rolled results, right on the row */}
        {(lastAttackResult || lastDamageResult) && (
          <div className="w-full flex flex-wrap items-center gap-2 text-xs">
            {lastAttackResult && (
              <span className={`px-2 py-0.5 rounded border ${lastAttackResult.isCrit ? 'bg-amber-500/20 border-amber-500/40 text-amber-200' : 'bg-black/30 border-white/10 text-white'}`}>
                Attack {lastAttackResult.rolls?.[0]}{lastAttackResult.modifier ? ` ${lastAttackResult.modifier > 0 ? '+' : ''}${lastAttackResult.modifier}` : ''} = <b>{lastAttackResult.total}</b>{lastAttackResult.isCrit ? ' · Critical!' : ''}
              </span>
            )}
            {lastDamageResult && (
              <span className="px-2 py-0.5 rounded border bg-black/30 border-white/10 text-white">
                Damage {lastDamageResult.rolls?.join(' + ')}{lastDamageResult.modifier ? ` ${lastDamageResult.modifier > 0 ? '+' : ''}${lastDamageResult.modifier}` : ''} = <b>{lastDamageResult.total}</b>
              </span>
            )}
          </div>
        )}

        {/* Conditions: the core three, every unique one from the catalog, or any by name. */}
        {(isDM || (conditions || []).length > 0) && (
          <div className="w-full">
            <ConditionsBar
              conditions={conditions || []}
              forAdversary
              onChange={isDM && onSetConditions ? (next) => onSetConditions(participant.id, next) : undefined}
            />
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/5 p-3 bg-black/20 grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4 min-w-0">

          {/* Difficulty + Motives row.
              Adversaries store their evasion-equivalent stat as `difficulty`
              (the number attackers must beat); PCs would carry `evasion`. */}
          <div className="flex flex-wrap items-center gap-4">
            {(difficulty ?? evasion) != null && (
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-blue-400" />
                <span className="text-xs text-lr-text-muted uppercase tracking-wide">Difficulty</span>
                <span className="font-bold text-white">{difficulty ?? evasion}</span>
              </div>
            )}
            {motives && (
              <p className="text-xs text-lr-text-dim italic">
                <span className="not-italic font-bold text-lr-text-dim uppercase tracking-wide text-[11px]">Motives: </span>
                {motives}
              </p>
            )}
          </div>

          {/* Attack Block */}
          {(attack !== undefined || damage) && (
            <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-white/5 space-y-3">
              <h5 className="text-xs font-bold text-lr-text-dim uppercase tracking-widest">Attack</h5>

              {/* Stat line */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {attack !== undefined && (
                  <span className="font-bold text-white">+{attack}</span>
                )}
                {attackName && <span className="text-lr-text-muted">{attackName}</span>}
                {attackRange && (
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20">
                    {attackRange}
                  </span>
                )}
                {damage && (
                  <span className="text-amber-400 font-mono text-xs">{damage}</span>
                )}
              </div>

            </div>
          )}

          {/* Damage Thresholds (per-hit damage → HP marked) */}
          {thresholds && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold text-lr-text-dim uppercase tracking-widest pl-1">Damage Thresholds</h5>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[var(--bg-primary)] p-2 rounded border border-white/5">
                  <div className="text-lr-text-dim uppercase tracking-wide mb-1">Minor</div>
                  <div className="font-bold text-white">&lt; {majorThreshold}</div>
                  <div className="text-lr-text-dim mt-0.5">−1 HP</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-2 rounded border border-white/5">
                  <div className="text-lr-text-dim uppercase tracking-wide mb-1">Major</div>
                  <div className="font-bold text-white">≥ {majorThreshold}</div>
                  <div className="text-lr-text-dim mt-0.5">−2 HP</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-2 rounded border border-white/5">
                  <div className="text-lr-text-dim uppercase tracking-wide mb-1">Severe</div>
                  <div className="font-bold text-white">≥ {severeThreshold}</div>
                  <div className="text-lr-text-dim mt-0.5">−3 HP</div>
                </div>
              </div>
            </div>
          )}

          {/* DM Controls */}
          {isDM && (
            <div className="space-y-4 p-4 bg-[var(--bg-primary)] rounded-lg border border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-lr-text-dim uppercase w-12 shrink-0" title="Manual HP adjustment">Manual</span>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => handleQuickDamage(1)} className="btn-xs btn-secondary text-red-400 hover:bg-red-500/20">-1</button>
                  <button onClick={() => handleQuickDamage(2)} className="btn-xs btn-secondary text-red-400 hover:bg-red-500/20">-2</button>
                  <button onClick={() => handleQuickDamage(3)} className="btn-xs btn-secondary text-red-400 hover:bg-red-500/20">-3</button>
                  <div className="w-px h-6 bg-white/10 mx-2" />
                  <button onClick={() => handleQuickHeal(1)} className="btn-xs btn-secondary text-emerald-400 hover:bg-emerald-500/20">+1</button>
                  <button onClick={() => handleQuickHeal(3)} className="btn-xs btn-secondary text-emerald-400 hover:bg-emerald-500/20">+3</button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-lr-text-dim uppercase w-12 shrink-0">Stress</span>
                <div className="flex flex-wrap items-center gap-1">
                  <button onClick={() => handleStressDamage(1)} className="btn-xs btn-secondary text-amber-400 hover:bg-amber-500/20" title={stressLeft < 1 ? 'No Stress left: it marks 1 HP instead' : 'Mark 1 Stress'}>+1</button>
                  <button onClick={() => handleStressDamage(2)} className="btn-xs btn-secondary text-amber-400 hover:bg-amber-500/20" title={stressLeft < 2 ? `Only ${stressLeft} Stress left: the rest marks HP` : 'Mark 2 Stress'}>+2</button>
                  <div className="w-px h-6 bg-white/10 mx-2" />
                  <button onClick={() => handleStressClear(1)} disabled={!(currentStress > 0)} className="btn-xs btn-secondary text-sky-300 hover:bg-sky-500/20 disabled:opacity-40" title="Clear 1 Stress">−1</button>
                  {stressLeft === 0 && <span className="text-[11px] text-amber-300 ml-1">Full: more Stress marks HP</span>}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
                <button
                  className={`btn btn-sm flex-1 justify-center ${isDefeated ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                  onClick={() => onToggleDefeated(participant.id)}
                >
                  <Skull size={14} />
                  <span className="whitespace-nowrap">{isDefeated ? 'Revive Unit' : 'Defeat Unit'}</span>
                </button>
              </div>
              {onRemove && (
                <div className="flex justify-end">
                  {confirmRemove ? (
                    <span className="inline-flex items-center gap-2 text-xs text-red-300">
                      Take {name} out of the fight?
                      <button type="button" className="btn-xs bg-red-500/80 hover:bg-red-500 text-white rounded px-2 py-0.5" onClick={() => { setConfirmRemove(false); onRemove(participant.id); }}>Remove</button>
                      <button type="button" className="btn-xs btn-secondary" onClick={() => setConfirmRemove(false)}>Keep</button>
                    </span>
                  ) : (
                    <button type="button" className="text-[11px] text-lr-text-dim hover:text-red-300" onClick={() => setConfirmRemove(true)} title="For one added by mistake; a defeated foe stays in the Defeated list instead">
                      Remove from fight
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          </div>
          <div className="space-y-4 min-w-0">
          {/* Features */}
          {features && features.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-lr-text-dim uppercase tracking-widest pl-1">Features</h5>
              <div className="space-y-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="bg-[var(--bg-primary)] p-3 rounded-lg border border-white/5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white text-sm">{feature.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(() => {
                          // A one-tap "Spend N Fear" for features that print a
                          // fixed Fear cost — 238 of them in the core catalog.
                          // Shown whatever the feature's type: many Fear-costing
                          // features are reactions. Disabled when the pool can't
                          // cover it, rather than silently clamping at zero.
                          const cost = fearCost(`${feature.name || ''} ${feature.description || ''}`);
                          if (!cost || !isDM || !onSpendFear) return null;
                          const affordable = fearCount >= cost;
                          return (
                            <button
                              type="button"
                              className="px-2.5 py-1 text-[11px] font-bold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded border border-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ minHeight: 28 }}
                              disabled={!affordable}
                              onClick={(e) => { e.stopPropagation(); onSpendFear(cost); }}
                              aria-label={`Spend ${cost} Fear for ${feature.name}`}
                              title={affordable ? `Spend ${cost} Fear` : `Needs ${cost} Fear — you have ${fearCount}`}
                            >
                              Spend {cost} Fear
                            </button>
                          );
                        })()}
                        {(() => {
                          // Only features whose text costs Stress ("Mark a Stress to…"),
                          // whatever their type; most actions cost nothing.
                          const cost = stressCost(`${feature.description || ''}`);
                          if (!cost || !isDM || !onApplyDamage) return null;
                          const short = stressLeft < cost;
                          return (
                            <button
                              type="button"
                              className="px-2 py-0.5 text-[11px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded border border-amber-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={short}
                              onClick={(e) => { e.stopPropagation(); onApplyDamage(participant.id, cost, 'stress'); }}
                              title={short ? `Needs ${cost} Stress — only ${stressLeft} left` : `Use ${feature.name}: mark ${cost} Stress`}
                            >
                              Mark {cost} Stress
                            </button>
                          );
                        })()}
                        {feature.type && (
                          <span className="text-[11px] uppercase text-lr-text-dim bg-white/5 px-1.5 py-0.5 rounded">
                            {feature.type}
                          </span>
                        )}
                      </div>
                    </div>
                    {feature.description && (
                      <p className="text-xs text-lr-text-muted leading-relaxed">{richText(feature.description)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {!(features && features.length) && <p className="text-xs text-lr-text-dim italic">No features.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
