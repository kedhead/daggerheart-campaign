import { useState } from 'react';
import { Heart, Zap, Skull, ChevronDown, ChevronRight, Shield, Swords, Target, X, Check } from 'lucide-react';
import { DAGGERHEART_CONDITIONS } from '../../hooks/useActiveEncounter';

export default function ParticipantCard({
  participant,
  onApplyDamage,
  onApplyHealing,
  onAddCondition,
  onRemoveCondition,
  onToggleDefeated,
  isDM,
  isExpanded,
  onToggleExpand
}) {
  const [showConditionPicker, setShowConditionPicker] = useState(false);

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
    features
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
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

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

  return (
    <div
      className={`
        bg-[var(--bg-secondary)] border rounded-xl overflow-hidden transition-all duration-200
        ${isDefeated
          ? 'border-white/5 opacity-60'
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
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {evasion && (
              <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-white/5 flex flex-col items-center gap-1">
                <Shield size={14} className="text-blue-400" />
                <span className="text-xs text-white/60 uppercase tracking-wide">Evasion</span>
                <span className="font-bold text-white">{evasion}</span>
              </div>
            )}
            {attack && (
              <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-white/5 flex flex-col items-center gap-1">
                <Swords size={14} className="text-red-400" />
                <span className="text-xs text-white/60 uppercase tracking-wide">Attack</span>
                <span className="font-bold text-white">+{attack}</span>
              </div>
            )}
            {damage && (
              <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-white/5 flex flex-col items-center gap-1">
                <Target size={14} className="text-amber-400" />
                <span className="text-xs text-white/60 uppercase tracking-wide">Damage</span>
                <span className="font-bold text-white">{damage}</span>
              </div>
            )}
          </div>

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
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-white text-sm">{feature.name}</span>
                      {feature.type && <span className="text-[10px] uppercase text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{feature.type}</span>}
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
