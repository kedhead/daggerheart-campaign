import { useState } from 'react';
import { Play, Pause, StopCircle, RotateCcw, Skull, Heart, Users, ChevronLeft } from 'lucide-react';
import ParticipantCard from './ParticipantCard';
import EnvironmentEffectsPanel from './EnvironmentEffectsPanel';
import { useActiveEncounter } from '../../hooks/useActiveEncounter';
import './LiveEncounterTracker.css';

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

  const [expandedParticipant, setExpandedParticipant] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (loading) {
    return (
      <div className="live-tracker loading">
        <div className="loading-spinner" />
        <p>Loading encounter...</p>
      </div>
    );
  }

  if (!activeEncounter) {
    return (
      <div className="live-tracker no-encounter">
        <Skull size={48} />
        <h3>No Active Encounter</h3>
        <p>Start an encounter from the Encounters page to begin tracking.</p>
        {onClose && (
          <button className="btn btn-secondary" onClick={onClose}>
            <ChevronLeft size={16} />
            Back to Encounters
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
  const hpPercent = Math.round((currentTotalHP / totalHP) * 100);

  const handleEndEncounter = async () => {
    await endEncounter();
    setShowEndConfirm(false);
    if (onClose) onClose();
  };

  return (
    <div className="live-tracker">
      {/* Header */}
      <div className="tracker-header">
        <div className="header-left">
          {onClose && (
            <button className="btn btn-ghost" onClick={onClose}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="encounter-info">
            <h2>{encounterName}</h2>
            <div className="encounter-meta">
              <span className={`status-badge ${status}`}>
                {status === 'active' ? 'Live' : status}
              </span>
              <span className="round-badge">Round {round}</span>
              <span className="party-info">
                <Users size={14} />
                {partySize} PCs
              </span>
            </div>
          </div>
        </div>

        {isDM && (
          <div className="header-controls">
            {status === 'active' ? (
              <button className="btn btn-secondary" onClick={pauseEncounter}>
                <Pause size={16} />
                Pause
              </button>
            ) : (
              <button className="btn btn-primary" onClick={resumeEncounter}>
                <Play size={16} />
                Resume
              </button>
            )}

            <button className="btn btn-primary" onClick={nextRound}>
              <RotateCcw size={16} />
              Next Round
            </button>

            <button
              className="btn btn-danger"
              onClick={() => setShowEndConfirm(true)}
            >
              <StopCircle size={16} />
              End
            </button>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="tracker-summary">
        <div className="summary-stat">
          <Skull size={18} />
          <span className="stat-label">Enemies</span>
          <span className="stat-value">
            {activeParticipants.length} / {participants.length}
          </span>
        </div>
        <div className="summary-stat">
          <Heart size={18} />
          <span className="stat-label">Total HP</span>
          <span className="stat-value">{hpPercent}%</span>
          <div className="mini-bar">
            <div
              className="mini-bar-fill"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="tracker-content">
        {/* Environment Panel */}
        {environment && (
          <EnvironmentEffectsPanel
            environment={environment}
            activeEffects={activeEnvironmentEffects}
            onToggleEffect={toggleEnvironmentEffect}
            isDM={isDM}
          />
        )}

        {/* Participants Grid */}
        <div className="participants-section">
          <h3>
            <Skull size={18} />
            Adversaries ({activeParticipants.length} active)
          </h3>

          <div className="participants-grid">
            {activeParticipants.map(participant => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onApplyDamage={applyDamage}
                onApplyHealing={applyHealing}
                onAddCondition={addCondition}
                onRemoveCondition={removeCondition}
                onToggleDefeated={toggleDefeated}
                isDM={isDM}
                isExpanded={expandedParticipant === participant.id}
                onToggleExpand={() => setExpandedParticipant(
                  expandedParticipant === participant.id ? null : participant.id
                )}
              />
            ))}
          </div>

          {/* Defeated Section */}
          {defeatedParticipants.length > 0 && (
            <div className="defeated-section">
              <h4>Defeated ({defeatedParticipants.length})</h4>
              <div className="participants-grid defeated">
                {defeatedParticipants.map(participant => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    onApplyDamage={applyDamage}
                    onApplyHealing={applyHealing}
                    onAddCondition={addCondition}
                    onRemoveCondition={removeCondition}
                    onToggleDefeated={toggleDefeated}
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
      </div>

      {/* End Confirmation Modal */}
      {showEndConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>End Encounter?</h3>
            <p>Are you sure you want to end this encounter? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleEndEncounter}
              >
                End Encounter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
