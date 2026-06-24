import { useState, useRef } from 'react';
import { Heart, Zap, Skull, ChevronDown, ChevronRight, Shield, Swords, Target, X, Check, Crown } from 'lucide-react';
import { DAGGERHEART_CONDITIONS } from '../../hooks/useActiveEncounter';
import { parseDamageNotation } from '../../dice';

export default function ParticipantCard({
  participant,
  onApplyDamage,
  onApplyHealing,
  onAddCondition,
  onRemoveCondition,
  onToggleDefeated,
  onRollDamage,
  isDM,
  isExpanded,
  onToggleExpand
}) {
  const [showConditionPicker, setShowConditionPicker] = useState(false);
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
  const hpPercent = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));
  const stressPercent = Math.max(0, Math.min(100, (currentStress / maxStress) * 100));

  // Determine HP color based on thresholds
  const getHPColor = () => {
    if (currentHP <= 0) return 'bg-gray-500';
    if (thresholds) {
      if (currentHP <= thresholds.minor) return 'bg-red-500';
      if (currentHP <= thresholds.major) return 'bg-amber-500';
    }
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
        return 'bg-white/10 text-white/60 border-white/20';
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
      {/* Header / Main Row */}
      <div
        className="p-4 cursor-pointer flex items-center gap-4 hover:bg-white/5 transition-colors"
        onClick={onToggleExpand}
      >
        {/* Name & Role */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isBoss && <Crown size={16} className="text-amber-400 shrink-0" />}
            {isDefeated && <Skull size={16} className="text-white/40" />}
            <span className={`font-bold text-lg ${isDefeated ? 'text-white/40 line-through' : 'text-white'}`}>
              {name}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${getRoleColorClass()}`}>
              {role}
            </span>
            <span className="bg-white/10 text-white/60 px-1.5 py-0.5 rounded text-xs font-mono border border-white/10">
              T{tier}
            </span>
            {currentPhaseName && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs border border-amber-500/40 font-medium">
                {currentPhaseName}
              </span>
            )}
          </div>

          {/* Stats Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* HP Bar */}
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-red-400 shrink-0" />
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 ${getHPColor()}`}
                  style={{ width: `${hpPercent}%` }}
                />
                {/* Threshold markers */}
                {thresholds && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10"
                      style={{ left: `${(thresholds.minor / maxHP) * 100}%` }}
                      title={`Minor: ${thresholds.minor}`}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10"
                      style={{ left: `${(thresholds.major / maxHP) * 100}%` }}
                      title={`Major: ${thresholds.major}`}
                    />
                  </>
                )}
                {/* Boss phase threshold markers */}
                {isBoss && sortedPhases.map(ph => (
                  <div
                    key={ph.id}
                    className={`absolute top-0 bottom-0 w-0.5 z-10 ${
                      (triggeredPhaseIds || []).includes(ph.id) ? 'bg-amber-400/40' : 'bg-amber-400/80'
                    }`}
                    style={{ left: `${ph.triggerPercent}%` }}
                    title={`${ph.name} (${ph.triggerPercent}%)`}
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-white/60 min-w-[3ch] text-right">{currentHP}</span>
            </div>

            {/* Stress Bar */}
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400 shrink-0" />
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${stressPercent}%` }}
                />
              </div>
              <span className="text-xs font-mono text-white/60 min-w-[3ch] text-right">{currentStress}</span>
            </div>
          </div>

          {/* Boss phase progress dots */}
          {isBoss && sortedPhases.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Crown size={10} className="text-amber-400/60 shrink-0" />
              {sortedPhases.map(ph => (
                <div
                  key={ph.id}
                  className={`w-2.5 h-2.5 rounded-full border transition-colors ${
                    (triggeredPhaseIds || []).includes(ph.id)
                      ? 'bg-amber-400 border-amber-300'
                      : 'bg-transparent border-amber-500/60'
                  }`}
                  title={`${ph.name} — ${ph.triggerPercent}%${(triggeredPhaseIds || []).includes(ph.id) ? ' (triggered)' : ''}`}
                />
              ))}
            </div>
          )}

          {/* Conditions */}
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {conditions.map(condition => (
                <span
                  key={condition}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-xs border border-purple-500/30"
                >
                  {condition}
                  {isDM && (
                    <button
                      className="p-0.5 hover:bg-purple-500/20 rounded-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCondition(participant.id, condition);
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <button className="text-white/40 hover:text-white transition-colors">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/5 p-4 space-y-4 bg-black/20 animate-in slide-in-from-top-2 duration-200">

          {/* Evasion + Motives row */}
          <div className="flex flex-wrap items-center gap-4">
            {evasion && (
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-blue-400" />
                <span className="text-xs text-white/60 uppercase tracking-wide">Evasion</span>
                <span className="font-bold text-white">{evasion}</span>
              </div>
            )}
            {motives && (
              <p className="text-xs text-white/50 italic">
                <span className="not-italic font-bold text-white/30 uppercase tracking-wide text-[10px]">Motives: </span>
                {motives}
              </p>
            )}
          </div>

          {/* Attack Block */}
          {(attack !== undefined || damage) && (
            <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-white/5 space-y-3">
              <h5 className="text-xs font-bold text-white/40 uppercase tracking-widest">Attack</h5>

              {/* Stat line */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {attack !== undefined && (
                  <span className="font-bold text-white">+{attack}</span>
                )}
                {attackName && <span className="text-white/80">{attackName}</span>}
                {attackRange && (
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20">
                    {attackRange}
                  </span>
                )}
                {damage && (
                  <span className="text-amber-400 font-mono text-xs">{damage}</span>
                )}
              </div>

              {/* Roll buttons */}
              <div className="flex gap-2 flex-wrap">
                {attack !== undefined && onRollDamage && (
                  <button
                    className="btn btn-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-colors"
                    onClick={handleRollAttack}
                  >
                    Roll Attack (d20)
                  </button>
                )}
                {damage && parseDamageNotation(damage) && onRollDamage && (
                  <button
                    className="btn btn-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
                    onClick={handleRollDamage}
                  >
                    Roll Damage
                  </button>
                )}
              </div>

              {/* Attack roll inline result */}
              {lastAttackResult && (
                <div className={`p-2 rounded border text-xs animate-in slide-in-from-top-1 duration-150 ${
                  lastAttackResult.isCrit
                    ? 'bg-amber-500/20 border-amber-500/40'
                    : 'bg-black/30 border-white/10'
                }`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-white px-2 py-1 bg-white/10 rounded">
                      {lastAttackResult.rolls?.[0]}
                    </span>
                    {lastAttackResult.modifier !== 0 && (
                      <span className="text-white/60">
                        {lastAttackResult.modifier > 0 ? '+' : ''}{lastAttackResult.modifier}
                      </span>
                    )}
                    <span className="font-bold text-white">= {lastAttackResult.total}</span>
                    {lastAttackResult.isCrit && (
                      <span className="font-bold text-amber-400 uppercase tracking-wide text-[10px]">
                        Critical Hit!
                      </span>
                    )}
                    <button
                      className="ml-auto text-white/30 hover:text-white transition-colors"
                      onClick={() => setLastAttackResult(null)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Damage roll inline result */}
              {lastDamageResult && (
                <div className="p-2 rounded bg-black/30 border border-white/10 text-xs animate-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center gap-2 flex-wrap">
                    {lastDamageResult.rolls?.map((r, i) => (
                      <span key={i} className="px-2 py-1 bg-white/10 rounded font-mono text-white">{r}</span>
                    ))}
                    {lastDamageResult.modifier !== 0 && (
                      <span className="text-white/60">
                        {lastDamageResult.modifier > 0 ? '+' : ''}{lastDamageResult.modifier}
                      </span>
                    )}
                    <span className="font-bold text-white">= {lastDamageResult.total}</span>
                    <button
                      className="ml-auto text-white/30 hover:text-white transition-colors"
                      onClick={() => setLastDamageResult(null)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Damage Thresholds */}
          {thresholds && (
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Damage Thresholds</h5>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[var(--bg-primary)] p-2 rounded border border-white/5">
                  <div className="text-white/40 uppercase tracking-wide mb-1">Minor</div>
                  <div className="font-bold text-white">{thresholds.minor}</div>
                  <div className="text-white/30 mt-0.5">−1 HP</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-2 rounded border border-white/5">
                  <div className="text-white/40 uppercase tracking-wide mb-1">Major</div>
                  <div className="font-bold text-white">{thresholds.major}</div>
                  <div className="text-white/30 mt-0.5">−2 HP</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-2 rounded border border-white/5">
                  <div className="text-white/40 uppercase tracking-wide mb-1">Severe</div>
                  <div className="font-bold text-white">{thresholds.severe}</div>
                  <div className="text-white/30 mt-0.5">−3 HP</div>
                </div>
              </div>
            </div>
          )}

          {/* DM Controls */}
          {isDM && (
            <div className="space-y-4 p-4 bg-[var(--bg-primary)] rounded-lg border border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-white/40 uppercase w-12 shrink-0">Health</span>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => handleQuickDamage(1)} className="btn-xs btn-secondary text-red-400 hover:bg-red-500/20">-1</button>
                  <button onClick={() => handleQuickDamage(5)} className="btn-xs btn-secondary text-red-400 hover:bg-red-500/20">-5</button>
                  <button onClick={() => handleQuickDamage(10)} className="btn-xs btn-secondary text-red-400 hover:bg-red-500/20">-10</button>
                  <div className="w-px h-6 bg-white/10 mx-2" />
                  <button onClick={() => handleQuickHeal(5)} className="btn-xs btn-secondary text-emerald-400 hover:bg-emerald-500/20">+5</button>
                  <button onClick={() => handleQuickHeal(10)} className="btn-xs btn-secondary text-emerald-400 hover:bg-emerald-500/20">+10</button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-white/40 uppercase w-12 shrink-0">Stress</span>
                <div className="flex gap-1">
                  <button onClick={() => handleStressDamage(1)} className="btn-xs btn-secondary text-amber-400 hover:bg-amber-500/20">+1</button>
                  <button onClick={() => handleStressDamage(2)} className="btn-xs btn-secondary text-amber-400 hover:bg-amber-500/20">+2</button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-white/5">
                <div className="relative flex-1">
                  <button
                    className="btn btn-sm btn-secondary w-full justify-between"
                    onClick={() => setShowConditionPicker(!showConditionPicker)}
                  >
                    <span>+ Add Condition</span>
                    <ChevronDown size={14} />
                  </button>

                  {showConditionPicker && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--bg-secondary)] border border-white/10 rounded-lg shadow-xl p-2 grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95 duration-200">
                      {DAGGERHEART_CONDITIONS.filter(c => !conditions.includes(c)).map(condition => (
                        <button
                          key={condition}
                          className="px-2 py-1.5 text-xs text-left text-white/80 hover:bg-white/10 rounded transition-colors"
                          onClick={() => {
                            onAddCondition(participant.id, condition);
                            setShowConditionPicker(false);
                          }}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  className={`btn btn-sm flex-1 justify-center ${isDefeated ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                  onClick={() => onToggleDefeated(participant.id)}
                >
                  <Skull size={14} />
                  {isDefeated ? 'Revive Unit' : 'Defeat Unit'}
                </button>
              </div>
            </div>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Features</h5>
              <div className="space-y-2">
                {features.map((feature, idx) => (
                  <div key={idx} className="bg-[var(--bg-primary)] p-3 rounded-lg border border-white/5 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white text-sm">{feature.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {feature.type === 'action' && isDM && onApplyDamage && (
                          <button
                            className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded border border-amber-500/30 transition-colors"
                            onClick={(e) => { e.stopPropagation(); onApplyDamage(participant.id, 1, 'stress'); }}
                            title="Use this action — mark 1 stress"
                          >
                            Mark Stress
                          </button>
                        )}
                        {feature.type && (
                          <span className="text-[10px] uppercase text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                            {feature.type}
                          </span>
                        )}
                      </div>
                    </div>
                    {feature.description && (
                      <p className="text-xs text-white/70 leading-relaxed">{feature.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
