import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './TimelineView.css';

export default function TimelineEventCard({ event, onEdit, onDelete, isDM, campaign, isEmbedded = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign);

  const getTypeColor = (type) => {
    switch (type) {
      case 'event':
        return 'type-event';
      case 'quest':
        return 'type-quest';
      case 'milestone':
        return 'type-milestone';
      default:
        return 'type-other';
    }
  };

  return (
    <div className="timeline-event-card card">
      <div className="timeline-event-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="timeline-marker"></div>
        <div className="timeline-event-info">
          <h3>{event.title}</h3>
          {event.date && (
            <p className="event-date">
              <CalendarIcon size={14} />
              {event.date}
            </p>
          )}
          {event.location && (
            <p className="event-location">
              <MapPin size={14} />
              {event.location}
            </p>
          )}
          <span className={`type-badge ${getTypeColor(event.type)}`}>
            {event.type || 'other'}
          </span>
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="timeline-event-details">
          {event.description && (
            <div className="event-section">
              <h4>Description</h4>
              <WikiText
                text={event.description}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {event.participants && (
            <div className="event-section">
              <h4>Participants</h4>
              <WikiText
                text={event.participants}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {event.outcome && (
            <div className="event-section">
              <h4>Outcome</h4>
              <WikiText
                text={event.outcome}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {isDM && !isEmbedded && (
            <div className="event-actions">
              <button className="btn btn-secondary" onClick={onEdit}>
                <Edit3 size={16} />
                Edit
              </button>
              <button className="btn btn-danger" onClick={onDelete}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Entity viewer modal for wiki links */}
      {viewingEntity && (
        <EntityViewer
          entity={viewingEntity}
          isOpen={!!viewingEntity}
          onClose={() => setViewingEntity(null)}
          isDM={isDM}
          campaign={campaign}
        />
      )}
    </div>
  );
}
