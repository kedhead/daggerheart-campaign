import Modal from '../Modal';
import NPCCard from '../NPCs/NPCCard';
import LocationCard from '../Locations/LocationCard';
import LoreCard from '../Lore/LoreCard';
import SessionCard from '../Sessions/SessionCard';
import TimelineEventCard from '../Timeline/TimelineEventCard';
import EncounterCard from '../Encounters/EncounterCard';
import NoteCard from '../Notes/NoteCard';
import './EntityViewer.css';

export default function EntityViewer({ entity, onClose, campaign, currentUserId, isDM }) {
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
          />
        );

      case 'location':
        return (
          <LocationCard
            location={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
          />
        );

      case 'lore':
        return (
          <LoreCard
            lore={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
          />
        );

      case 'session':
        return (
          <SessionCard
            session={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
          />
        );

      case 'timelineEvent':
        return (
          <TimelineEventCard
            event={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
          />
        );

      case 'encounter':
        return (
          <EncounterCard
            encounter={entity.data}
            isDM={isDM}
            campaign={campaign}
            isEmbedded={true}
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
