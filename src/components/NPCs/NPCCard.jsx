import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, MapPin, Briefcase, Heart, Skull, Minus } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './NPCsView.css';

export default function NPCCard({ npc, onEdit, onDelete, isDM, campaign, isEmbedded = false, entities }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);

  const getRelationshipIcon = (relationship) => {
    switch (relationship) {
      case 'ally':
        return <Heart size={16} />;
      case 'enemy':
        return <Skull size={16} />;
      default:
        return <Minus size={16} />;
    }
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case 'ally':
        return 'relationship-ally';
      case 'enemy':
        return 'relationship-enemy';
      default:
        return 'relationship-neutral';
    }
  };

  return (
    <div className="npc-card card">
      <div className="npc-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="npc-avatar">
          {npc.avatarUrl ? (
            <img src={npc.avatarUrl} alt={npc.name} />
          ) : (
            <span>{npc.name.charAt(0)}</span>
          )}
        </div>
        <div className="npc-info">
          <h3>{npc.name}</h3>
          {npc.occupation && (
            <p className="npc-occupation">
              <Briefcase size={14} />
              {npc.occupation}
            </p>
          )}
          {npc.location && (
            <p className="npc-location">
              <MapPin size={14} />
              {npc.location}
            </p>
          )}
          <span className={`relationship-badge ${getRelationshipColor(npc.relationship)}`}>
            {getRelationshipIcon(npc.relationship)}
            {npc.relationship || 'neutral'}
          </span>
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="npc-details">
          {npc.description && (
            <div className="npc-section">
              <h4>Description</h4>
              <WikiText
                text={npc.description}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {npc.notes && (
            <div className="npc-section">
              <h4>Notes</h4>
              <WikiText
                text={npc.notes}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {npc.firstMet && (
            <div className="npc-section">
              <h4>First Met</h4>
              <p>{npc.firstMet}</p>
            </div>
          )}

          {isDM && !isEmbedded && (
            <div className="npc-actions">
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
          entities={entities}
        />
      )}
    </div>
  );
}
