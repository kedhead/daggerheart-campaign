import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, ExternalLink, Swords } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './EncountersView.css';

export default function EncounterCard({ encounter, onEdit, onDelete, isDM, campaign, isEmbedded = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
        return 'difficulty-hard';
      case 'deadly':
        return 'difficulty-deadly';
      default:
        return 'difficulty-medium';
    }
  };

  return (
    <div className="encounter-card card">
      <div className="encounter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="encounter-icon">
          <Swords size={24} />
        </div>
        <div className="encounter-info">
          <h3>{encounter.name}</h3>
          <span className={`difficulty-badge ${getDifficultyColor(encounter.difficulty)}`}>
            {encounter.difficulty || 'medium'}
          </span>
          {encounter.partyLevel && (
            <p className="encounter-level">Recommended for Level {encounter.partyLevel}</p>
          )}
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="encounter-details">
          {encounter.description && (
            <div className="encounter-section">
              <h4>Description</h4>
              <WikiText
                text={encounter.description}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {encounter.enemies && (
            <div className="encounter-section">
              <h4>Enemies</h4>
              <WikiText
                text={encounter.enemies}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {encounter.environment && (
            <div className="encounter-section">
              <h4>Environment</h4>
              <WikiText
                text={encounter.environment}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {encounter.tactics && (
            <div className="encounter-section">
              <h4>Tactics</h4>
              <WikiText
                text={encounter.tactics}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {encounter.rewards && (
            <div className="encounter-section">
              <h4>Rewards</h4>
              <WikiText
                text={encounter.rewards}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {encounter.freshcutgrassLink && (
            <div className="encounter-section">
              <a
                href={encounter.freshcutgrassLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary full-width"
              >
                <ExternalLink size={16} />
                Open in FreshCutGrass
              </a>
            </div>
          )}

          {isDM && !isEmbedded && (
            <div className="encounter-actions">
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
