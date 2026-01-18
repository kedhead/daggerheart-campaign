import Modal from '../Modal';
import NPCCard from '../NPCs/NPCCard';
import LocationCard from '../Locations/LocationCard';
import LoreCard from '../Lore/LoreCard';
import SessionCard from '../Sessions/SessionCard';
import TimelineEventCard from '../Timeline/TimelineEventCard';
import EncounterCard from '../Encounters/EncounterCard';
import NoteCard from '../Notes/NoteCard';
import QuestCard from '../Quests/QuestCard';
import './EntityViewer.css';

export default function EntityViewer({ entity, onClose, campaign, currentUserId, isDM, entities }) {
  if (!entity) return null;

  const renderEntityContent = () => {
    switch (entity.type) {
      case 'npc':
        return (
          <NPCCard
            npc={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
            entities={entities}
          />
        );

      case 'location':
        return (
          <LocationCard
            location={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
            entities={entities}
          />
        );

      case 'lore':
        return (
          <LoreCard
            lore={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
            entities={entities}
          />
        );

      case 'session':
        return (
          <SessionCard
            session={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
            entities={entities}
          />
        );

      case 'timelineEvent':
        return (
          <TimelineEventCard
            event={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
            entities={entities}
          />
        );

      case 'encounter':
        return (
          <EncounterCard
            encounter={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
            entities={entities}
          />
        );

      case 'note':
        return (
          <NoteCard
            note={entity.data}
            currentUserId={currentUserId}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
            entities={entities}
          />
        );

      case 'quest':
        return (
          <QuestCard
            quest={entity.data}
            isDM={isDM}
            entityData={entities}
          />
        );

      default:
        return (
          <div className="entity-viewer-error">
            <p>Unknown entity type: {entity.type}</p>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="entity-viewer-title">
          <span className="entity-type-badge">{entity.subtitle || entity.type}</span>
          <span>{entity.displayName || entity.name}</span>
        </div>
      }
      size="medium"
    >
      <div className="entity-viewer-content">
        {renderEntityContent()}
      </div>
    </Modal>
  );
}
