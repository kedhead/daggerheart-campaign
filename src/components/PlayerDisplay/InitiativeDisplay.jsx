import { Zap, User, Skull, Users, EyeOff } from 'lucide-react';
import './PlayerDisplay.css';

export default function InitiativeDisplay({ initiative, isDM = false }) {
  if (!initiative || !initiative.active) {
    return null;
  }

  const { currentTurn, round, participants } = initiative;

  // Filter hidden participants for non-DM view
  const visibleParticipants = isDM
    ? participants
    : participants.filter(p => !p.isHidden);

  // Adjust currentTurn index for visible participants
  const currentParticipant = participants[currentTurn];
  const visibleCurrentIndex = visibleParticipants.findIndex(
    p => p.id === currentParticipant?.id
  );

  const getParticipantIcon = (type) => {
    switch (type) {
      case 'character': return User;
      case 'npc': return Skull;
      default: return Users;
    }
  };

  return (
    <div className="initiative-display">
      <div className="initiative-header">
        <Zap size={20} />
        <span className="round-badge">Round {round}</span>
      </div>
      <div className="initiative-track">
        {visibleParticipants.map((participant, index) => {
          const Icon = getParticipantIcon(participant.type);
          const isCurrent = index === visibleCurrentIndex;

          return (
            <div
              key={participant.id}
              className={`initiative-participant ${isCurrent ? 'current' : ''} ${participant.isHidden ? 'hidden-participant' : ''}`}
            >
              <div className={`participant-icon ${participant.type}`}>
                <Icon size={16} />
              </div>
              <span className="participant-name">{participant.name}</span>
              {participant.isHidden && isDM && (
                <EyeOff size={12} className="hidden-icon" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
