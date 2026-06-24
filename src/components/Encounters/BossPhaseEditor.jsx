import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Crown } from 'lucide-react';

const FEATURE_TYPES = ['passive', 'action', 'reaction'];

const fieldClass = 'w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500/50';

const Lbl = ({ text, sub }) => (
  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
    {text}{sub && <span className="font-normal normal-case text-[var(--text-muted)] ml-1">{sub}</span>}
  </label>
);

export default function BossPhaseEditor({ phases, onChange, campaignAdversaries = [] }) {
  const [expandedPhase, setExpandedPhase] = useState(null);

  const addPhase = () => {
    const percents = phases.map(p => p.triggerPercent);
    const defaultPct = percents.length === 0 ? 66 : Math.max(10, Math.min(...percents) - 25);
    const newPhase = {
      id: `phase-${Date.now()}`,
      name: `Phase ${phases.length + 2}`,
      description: '',
      triggerPercent: defaultPct,
      attackName: '',
      attackDamage: '',
      attack: null,
      newFeatures: [],
      replaceFeatures: false,
      summons: [],
      healPercent: 0
    };
    const updated = [...phases, newPhase].sort((a, b) => b.triggerPercent - a.triggerPercent);
    onChange(updated);
    setExpandedPhase(newPhase.id);
  };

  const updatePhase = (id, field, value) =>
    onChange(phases.map(p => p.id === id ? { ...p, [field]: value } : p));

  const removePhase = (id) => {
    onChange(phases.filter(p => p.id !== id));
    if (expandedPhase === id) setExpandedPhase(null);
  };

  const addPhaseFeature = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    updatePhase(phaseId, 'newFeatures', [
      ...(phase.newFeatures || []),
      { name: '', type: 'passive', description: '' }
    ]);
  };

  const updatePhaseFeature = (phaseId, idx, field, value) => {
    const phase = phases.find(p => p.id === phaseId);
    const feats = [...(phase.newFeatures || [])];
    feats[idx] = { ...feats[idx], [field]: value };
    updatePhase(phaseId, 'newFeatures', feats);
  };

  const removePhaseFeature = (phaseId, idx) => {
    const phase = phases.find(p => p.id === phaseId);
    updatePhase(phaseId, 'newFeatures', (phase.newFeatures || []).filter((_, i) => i !== idx));
  };

  const addSummon = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    updatePhase(phaseId, 'summons', [...(phase.summons || []), { adversaryId: '', quantity: 1 }]);
  };

  const updateSummon = (phaseId, idx, field, value) => {
    const phase = phases.find(p => p.id === phaseId);
    const summons = [...(phase.summons || [])];
    summons[idx] = { ...summons[idx], [field]: value };
    updatePhase(phaseId, 'summons', summons);
  };

  const removeSummon = (phaseId, idx) => {
    const phase = phases.find(p => p.id === phaseId);
    updatePhase(phaseId, 'summons', (phase.summons || []).filter((_, i) => i !== idx));
  };

  const sorted = [...phases].sort((a, b) => b.triggerPercent - a.triggerPercent);

  return (
    <div className="space-y-3 pt-2 border-t border-amber-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown size={14} className="text-amber-400" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Boss Phases</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Define what happens when the boss crosses HP thresholds</p>
          </div>
        </div>
        <button
          type="button"
          onClick={addPhase}
          className="flex items-center gap-1 text-xs text-amber-400 hover:opacity-80 transition-opacity"
        >
          <Plus size={12} /> Add Phase
        </button>
      </div>

      {phases.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] italic py-3 text-center bg-amber-500/5 rounded-lg border border-amber-500/10">
          No phases yet. A boss with no phases is just a very tough solo adversary.
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((phase, idx) => {
          const isExpanded = expandedPhase === phase.id;

          return (
            <div key={phase.id} className="border border-amber-500/30 rounded-lg bg-amber-500/5 overflow-hidden">
              {/* Phase header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-amber-500/10 transition-colors"
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold shrink-0">
                  {idx + 2}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-amber-300 truncate block">
                    {phase.name || `Phase ${idx + 2}`}
                  </span>
                  <span className="text-[10px] text-amber-400/60">Triggers at ≤{phase.triggerPercent}% HP</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhase(phase.id); }}
                  className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={12} />
                </button>
                {isExpanded
                  ? <ChevronDown size={14} className="text-amber-400 shrink-0" />
                  : <ChevronRight size={14} className="text-amber-400/60 shrink-0" />}
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-amber-500/20 pt-4 bg-black/10">

                  {/* Name + Trigger % */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Lbl text="Phase Name" />
                      <input
                        value={phase.name}
                        onChange={e => updatePhase(phase.id, 'name', e.target.value)}
                        placeholder="e.g. Enraged Form"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <Lbl text="Trigger at ≤ % HP" />
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={phase.triggerPercent}
                        onChange={e => updatePhase(phase.id, 'triggerPercent', Number(e.target.value))}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Lbl text="Announcement Text" sub="— shown to GM when this phase fires" />
                    <textarea
                      value={phase.description}
                      onChange={e => updatePhase(phase.id, 'description', e.target.value)}
                      placeholder='Dramatic flavor text shown when this phase triggers… e.g. "The dragon roars, scales splitting open to reveal pulsing veins of molten rage."'
                      rows={2}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  {/* Attack overrides + Heal */}
                  <div>
                    <Lbl text="Optional Overrides" sub="— leave blank to keep the current values" />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Lbl text="New Attack Name" />
                        <input
                          value={phase.attackName || ''}
                          onChange={e => updatePhase(phase.id, 'attackName', e.target.value)}
                          placeholder="Keep current"
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <Lbl text="New Damage Dice" />
                        <input
                          value={phase.attackDamage || ''}
                          onChange={e => updatePhase(phase.id, 'attackDamage', e.target.value)}
                          placeholder="e.g. 2d10+6 phy"
                          className={`${fieldClass} font-mono`}
                        />
                      </div>
                      <div>
                        <Lbl text="Heal on Trigger %" />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={phase.healPercent || 0}
                          onChange={e => updatePhase(phase.id, 'healPercent', Number(e.target.value))}
                          className={fieldClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* New Features */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Lbl text="New Features Gained" />
                        <label className="flex items-center gap-1 cursor-pointer -mt-1">
                          <input
                            type="checkbox"
                            checked={phase.replaceFeatures || false}
                            onChange={e => updatePhase(phase.id, 'replaceFeatures', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-[10px] text-[var(--text-muted)]">Replace all existing features</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => addPhaseFeature(phase.id)}
                        className="flex items-center gap-1 text-xs text-[var(--hope-color)] hover:opacity-80 transition-opacity"
                      >
                        <Plus size={10} /> Add
                      </button>
                    </div>

                    {(phase.newFeatures || []).length === 0 && (
                      <p className="text-[10px] text-[var(--text-muted)] italic py-1">
                        No new features — boss keeps its current abilities at this phase.
                      </p>
                    )}

                    <div className="space-y-2">
                      {(phase.newFeatures || []).map((feat, fIdx) => (
                        <div key={fIdx} className="bg-[var(--bg-secondary)] rounded border border-[var(--border)] p-2 space-y-1.5">
                          <div className="flex gap-2">
                            <input
                              value={feat.name}
                              onChange={e => updatePhaseFeature(phase.id, fIdx, 'name', e.target.value)}
                              placeholder="Feature name"
                              className={`${fieldClass} flex-1`}
                            />
                            <select
                              value={feat.type}
                              onChange={e => updatePhaseFeature(phase.id, fIdx, 'type', e.target.value)}
                              className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-primary)]"
                            >
                              {FEATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <button
                              type="button"
                              onClick={() => removePhaseFeature(phase.id, fIdx)}
                              className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <textarea
                            value={feat.description}
                            onChange={e => updatePhaseFeature(phase.id, fIdx, 'description', e.target.value)}
                            placeholder="Feature description using Daggerheart terms…"
                            rows={2}
                            className={`${fieldClass} resize-none`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summons */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Lbl text="Summon Minions on Trigger" />
                      <button
                        type="button"
                        onClick={() => addSummon(phase.id)}
                        className="flex items-center gap-1 text-xs text-[var(--hope-color)] hover:opacity-80 transition-opacity"
                      >
                        <Plus size={10} /> Add Summon
                      </button>
                    </div>

                    {campaignAdversaries.length === 0 && (
                      <p className="text-[10px] text-[var(--text-muted)] italic py-1">
                        Create campaign adversaries first to select them as summons.
                      </p>
                    )}

                    {(phase.summons || []).length === 0 && campaignAdversaries.length > 0 && (
                      <p className="text-[10px] text-[var(--text-muted)] italic py-1">
                        No minions summoned at this phase.
                      </p>
                    )}

                    <div className="space-y-2">
                      {(phase.summons || []).map((summon, sIdx) => (
                        <div key={sIdx} className="flex gap-2 items-center">
                          <select
                            value={summon.adversaryId || ''}
                            onChange={e => updateSummon(phase.id, sIdx, 'adversaryId', e.target.value)}
                            className={`${fieldClass} flex-1`}
                          >
                            <option value="">Select adversary…</option>
                            {campaignAdversaries.filter(a => !a.isBoss).map(a => (
                              <option key={a.id} value={a.id}>{a.name} (T{a.tier} {a.role})</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={summon.quantity}
                            onChange={e => updateSummon(phase.id, sIdx, 'quantity', Number(e.target.value))}
                            className={`${fieldClass} w-16 text-center`}
                          />
                          <button
                            type="button"
                            onClick={() => removeSummon(phase.id, sIdx)}
                            className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
