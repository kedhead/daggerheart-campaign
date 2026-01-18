import { useState } from 'react';
import {
  Zap, Play, Square, SkipForward, SkipBack, Plus, Trash2, GripVertical,
  User, Users, Skull, Edit2, ChevronUp, ChevronDown, RotateCcw
} from 'lucide-react';
import Modal from '../Modal';
import './InitiativeTracker.css';

export default function InitiativeTracker({
  campaign,
  initiative,
  startInitiative,
  updateInitiative,
  nextTurn,
  previousTurn,
  addParticipant,
  removeParticipant,
  updateParticipant,
  reorderParticipants,
  endInitiative,
  characters = [],
  npcs = [],
  isDM
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    type: 'custom',
    entityId: null,
    initiative: 10,
    hp: null,
    maxHp: null,
    isHidden: false
  });
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleStartCombat = async () => {
    // Start with empty participant list
    await startInitiative([]);
  };

  const handleEndCombat = async () => {
    if (confirm('End combat and clear the initiative tracker?')) {
      await endInitiative();
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    await addParticipant(newParticipant);
    setNewParticipant({
      name: '',
      type: 'custom',
      entityId: null,
      initiative: 10,
      hp: null,
      maxHp: null,
      isHidden: false
    });
    setIsAddModalOpen(false);
  };

  const handleAddFromEntity = async (entity, type) => {
    const participant = {
      name: entity.name,
      type: type,
      entityId: entity.id,
      initiative: 10,
      hp: null,
      maxHp: null,
      isHidden: type === 'npc' && entity.hidden
    };
    await addParticipant(participant);
    setIsAddModalOpen(false);
  };

  const handleRemoveParticipant = async (participantId) => {
    await removeParticipant(participantId);
  };

  const handleUpdateParticipant = async (participantId, updates) => {
    await updateParticipant(participantId, updates);
  };

  const handleMoveUp = async (index) => {
    if (index <= 0) return;
    const participants = [...initiative.participants];
    [participants[index], participants[index - 1]] = [participants[index - 1], participants[index]];
    await reorderParticipants(participants.map(p => p.id));
  };

  const handleMoveDown = async (index) => {
    if (index >= initiative.participants.length - 1) return;
    const participants = [...initiative.participants];
    [participants[index], participants[index + 1]] = [participants[index + 1], participants[index]];
    await reorderParticipants(participants.map(p => p.id));
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const participants = [...initiative.participants];
    const [removed] = participants.splice(draggedIndex, 1);
    participants.splice(dropIndex, 0, removed);

    await reorderParticipants(participants.map(p => p.id));
    setDraggedIndex(null);
  };

  const getParticipantIcon = (type) => {
    switch (type) {
      case 'character': return User;
      case 'npc': return Skull;
      default: return Users;
    }
  };

  // Combat not started
  if (!initiative || !initiative.active) {
    return (
      <div className="initiative-tracker">
        <div className="view-header">
          <div>
            <h2>Initiative Tracker</h2>
            <p className="view-subtitle">Manage combat turn order</p>
          </div>
        </div>

        <div className="empty-state card">
          <Zap size={64} />
          <p>No active combat</p>
          <p className="empty-hint">Start a combat encounter to track initiative</p>
          {isDM && (
            <button className="btn btn-primary" onClick={handleStartCombat}>
              <Play size={20} />
              Start Combat
            </button>
          )}
        </div>
      </div>
    );
  }

  // Combat active
  const { currentTurn, round, participants } = initiative;

  return (
    <div className="initiative-tracker">
      <div className="view-header">
        <div>
          <h2>Initiative Tracker</h2>
          <p className="view-subtitle">Round {round} • {participants.length} participants</p>
        </div>
        {isDM && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={20} />
              Add
            </button>
            <button className="btn btn-danger" onClick={handleEndCombat}>
              <Square size={20} />
              End Combat
            </button>
          </div>
        )}
      </div>

      {/* Turn Controls */}
      <div className="initiative-controls card">
        <button
          className="btn btn-secondary"
          onClick={previousTurn}
          disabled={!isDM || (currentTurn === 0 && round === 1)}
        >
          <SkipBack size={20} />
          Previous
        </button>

        <div className="round-display">
          <span className="round-label">Round</span>
          <span className="round-number">{round}</span>
        </div>

        <button
          className="btn btn-primary"
          onClick={nextTurn}
          disabled={!isDM || participants.length === 0}
        >
          Next
          <SkipForward size={20} />
        </button>
      </div>

      {/* Participants List */}
      {participants.length === 0 ? (
        <div className="empty-participants card">
          <Users size={40} />
          <p>No participants yet</p>
          {isDM && (
            <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} />
              Add Participant
            </button>
          )}
        </div>
      ) : (
        <div className="participants-list">
          {participants.map((participant, index) => {
            const Icon = getParticipantIcon(participant.type);
            const isCurrentTurn = index === currentTurn;

            return (
              <div
                key={participant.id}
                className={`participant-card card ${isCurrentTurn ? 'current-turn' : ''} ${participant.isHidden ? 'hidden-participant' : ''}`}
                draggable={isDM}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                {isDM && (
                  <div className="drag-handle">
                    <GripVertical size={16} />
                  </div>
                )}

                <div className="turn-indicator">
                  {isCurrentTurn ? (
                    <div className="current-marker">
                      <Zap size={16} />
                    </div>
                  ) : (
                    <span className="turn-number">{index + 1}</span>
                  )}
                </div>

                <div className={`participant-icon ${participant.type}`}>
                  <Icon size={20} />
                </div>

                <div className="participant-info">
                  <h4>{participant.name}</h4>
                  <div className="participant-meta">
                    <span className={`type-badge ${participant.type}`}>
                      {participant.type}
                    </span>
                    <span className="initiative-value">
                      Init: {participant.initiative}
                    </span>
                  </div>
                </div>

                {isDM && (
                  <div className="participant-actions">
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === participants.length - 1}
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-danger-hover"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Participant Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Participant"
        size="medium"
      >
        <div className="add-participant-content">
          {/* Quick Add from Characters */}
          {characters.length > 0 && (
            <div className="quick-add-section">
              <h4>Characters</h4>
              <div className="entity-buttons">
                {characters.map(char => (
                  <button
                    key={char.id}
                    className="entity-button"
                    onClick={() => handleAddFromEntity(char, 'character')}
                  >
                    <User size={16} />
                    {char.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Add from NPCs */}
          {npcs.length > 0 && (
            <div className="quick-add-section">
              <h4>NPCs</h4>
              <div className="entity-buttons">
                {npcs.map(npc => (
                  <button
                    key={npc.id}
                    className="entity-button"
                    onClick={() => handleAddFromEntity(npc, 'npc')}
                  >
                    <Skull size={16} />
                    {npc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Entry */}
          <div className="custom-add-section">
            <h4>Custom Entry</h4>
            <form onSubmit={handleAddParticipant}>
              <div className="form-row">
                <div className="input-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                    placeholder="Goblin 1, Mysterious Figure..."
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Initiative</label>
                  <input
                    type="number"
                    value={newParticipant.initiative}
                    onChange={(e) => setNewParticipant({ ...newParticipant, initiative: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newParticipant.isHidden}
                    onChange={(e) => setNewParticipant({ ...newParticipant, isHidden: e.target.checked })}
                  />
                  <span>Hidden from players</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newParticipant.name}>
                  <Plus size={16} />
                  Add Participant
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
