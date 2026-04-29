import { useState } from 'react';
import { Play, Pause, StopCircle, RotateCcw, Skull, Heart, Users, ChevronLeft, AlertTriangle } from 'lucide-react';
import ParticipantCard from './ParticipantCard';
import EnvironmentEffectsPanel from './EnvironmentEffectsPanel';
import { useActiveEncounter } from '../../hooks/useActiveEncounter';
import { useDice } from '../../dice';

export default function LiveEncounterTracker({
  campaignId,
  isDM,
  onClose
}) {
  const {
    activeEncounter,
    loading,
    applyDamage,
    applyHealing,
    addCondition,
    removeCondition,
    toggleDefeated,
    nextRound,
    toggleEnvironmentEffect,
    pauseEncounter,
    resumeEncounter,
    endEncounter
  } = useActiveEncounter(campaignId);

  const { rollDamage } = useDice(campaignId);

  const [expandedParticipant, setExpandedParticipant] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in">
        <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-lg font-medium">Loading encounter...</p>
      </div>
    );
  }

  if (!activeEncounter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center animate-in fade-in">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20">
          <Skull size={48} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">No Active Scenario</h3>
          <p className="text-white/60 max-w-md mx-auto">Start an encounter from the Scenarios page to begin tracking combat.</p>
        </div>
        {onClose && (
          <button className="btn btn-secondary" onClick={onClose}>
            <ChevronLeft size={16} />
            Back to Scenarios
          </button>
        )}
      </div>
    );
  }

  const {
    encounterName,
    status,
    round,
    participants,
    environment,
    activeEnvironmentEffects,
    partySize
  } = activeEncounter;

  // Separate active and defeated participants
  const activeParticipants = participants.filter(p => !p.isDefeated);
  const defeatedParticipants = participants.filter(p => p.isDefeated);

  // Calculate summary stats
  const totalHP = participants.reduce((sum, p) => sum + p.maxHP, 0);
  const currentTotalHP = participants.reduce((sum, p) => sum + p.currentHP, 0);
  const hpPercent = totalHP > 0 ? Math.round((currentTotalHP / totalHP) * 100) : 0;

  const handleEndEncounter = async () => {
    await endEncounter();
    setShowEndConfirm(false);
    if (onClose) onClose();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-[var(--bg-secondary)] p-6 rounded-xl border border-white/5 shadow-lg relative overflow-hidden">
        {/* Living background effect */}
        <div className={`absolute inset-0 opacity-10 pointer-events-none transition-colors duration-1000 ${status === 'active' ? 'bg-red-500/20' : 'bg-blue-500/10'}`} />

        <div className="flex items-start gap-4 z-10 relative">
          {onClose && (
            <button className="btn btn-ghost p-2 h-auto" onClick={onClose}>
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white leading-tight">{encounterName}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${status === 'active'
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                {status === 'active' ? 'Live Combat' : status}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/80 border border-white/5">
                Round {round}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 flex items-center gap-1.5">
                <Users size={12} />
                {partySize} PCs
              </span>
            </div>
          </div>
        </div>

        {isDM && (
          <div className="flex flex-wrap items-center gap-2 z-10 relative w-full md:w-auto">
            {status === 'active' ? (
              <button className="btn btn-secondary flex-1 md:flex-none justify-center" onClick={pauseEncounter}>
                <Pause size={18} />
                Pause
              </button>
            ) : (
              <button className="btn btn-primary flex-1 md:flex-none justify-center" onClick={resumeEncounter}>
                <Play size={18} />
                Resume
              </button>
            )}

            <button className="btn btn-primary flex-1 md:flex-none justify-center" onClick={nextRound}>
              <RotateCcw size={18} />
              Next Round
            </button>

            <button
              className="btn btn-danger flex-1 md:flex-none justify-center"
              onClick={() => setShowEndConfirm(true)}
            >
              <StopCircle size={18} />
              End
            </button>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 rounded-lg">
            <Skull size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">Active Hostiles</p>
            <p className="text-xl font-bold text-white">{activeParticipants.length} <span className="text-white/40 text-sm">/ {participants.length}</span></p>
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-white/5 p-4 rounded-xl flex items-center gap-4 col-span-1 md:col-span-2">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Heart size={24} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-end">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">Total Vitality</p>
              <p className="text-sm font-bold text-emerald-400">{hpPercent}%</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Participants Grid */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Skull className="text-red-500" size={24} />
              Adversaries <span className="text-white/40 text-base font-normal">({activeParticipants.length} active)</span>
            </h3>

            {activeParticipants.length === 0 ? (
              <div className="p-8 text-center bg-[var(--bg-secondary)] border border-white/5 rounded-xl border-dashed">
                <p className="text-white/40 italic">All adversaries defined.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeParticipants.map(participant => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    onApplyDamage={applyDamage}
                    onApplyHealing={applyHealing}
                    onAddCondition={addCondition}
                    onRemoveCondition={removeCondition}
                    onToggleDefeated={toggleDefeated}
                    onRollDamage={rollDamage}
                    isDM={isDM}
                    isExpanded={expandedParticipant === participant.id}
                    onToggleExpand={() => setExpandedParticipant(
                      expandedParticipant === participant.id ? null : participant.id
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Defeated Section */}
          {defeatedParticipants.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="text-sm font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                Defeated <span className="bg-white/10 px-2 py-0.5 rounded-full text-white/60">{defeatedParticipants.length}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60 hover:opacity-100 transition-opacity">
                {defeatedParticipants.map(participant => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    onApplyDamage={applyDamage}
                    onApplyHealing={applyHealing}
                    onAddCondition={addCondition}
                    onRemoveCondition={removeCondition}
                    onToggleDefeated={toggleDefeated}
                    onRollDamage={rollDamage}
                    isDM={isDM}
                    isExpanded={expandedParticipant === participant.id}
                    onToggleExpand={() => setExpandedParticipant(
                      expandedParticipant === participant.id ? null : participant.id
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Environment */}
        <div className="lg:col-span-1 space-y-6">
          {environment ? (
            <EnvironmentEffectsPanel
              environment={environment}
              activeEffects={activeEnvironmentEffects}
              onToggleEffect={toggleEnvironmentEffect}
              isDM={isDM}
            />
          ) : (
            <div className="p-6 bg-[var(--bg-secondary)] border border-white/5 rounded-xl text-center">
              <p className="text-white/40 text-sm">No environment active.</p>
            </div>
          )}
        </div>
      </div>

      {/* End Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-secondary)] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-6 shadow-2xl">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">End Scenario?</h3>
              <p className="text-white/60">Are you sure you want to end this combat scenario? This action cannot be undone.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="btn btn-secondary justify-center"
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger justify-center"
                onClick={handleEndEncounter}
              >
                End Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
