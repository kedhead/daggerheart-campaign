import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, ExternalLink, Swords, Play, Users, Skull } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './EncountersView.css';

export default function EncounterCard({ encounter, onEdit, onDelete, onRun, isDM, campaign, isEmbedded = false, entities, adversaries = [], environments = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);

  // Check if this is a BP-based encounter
  const hasBPData = encounter.adversarySlots?.length > 0;

  // Get environment details
  const environment = encounter.environmentId
    ? environments.find(e => e.id === encounter.environmentId)
    : null;

  // Get adversary details for slots
  const getAdversaryFromSlot = (slot) => adversaries.find(a => a.id === slot.adversaryId);

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
          {hasBPData ? (
            <div className="encounter-badges">
              <span className="bp-badge">
                <Skull size={14} />
                {encounter.usedBP || 0} / {encounter.calculatedBP || 0} BP
              </span>
              <span className="party-badge">
                <Users size={14} />
                {encounter.partySize || 4} PCs
              </span>
            </div>
          ) : (
            <span className={`difficulty-badge ${getDifficultyColor(encounter.difficulty)}`}>
              {encounter.difficulty || 'medium'}
            </span>
          )}
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

          {/* Environment from catalog */}
          {environment && (
            <div className="encounter-section environment-section">
              <h4>Environment</h4>
              <div className="environment-summary">
                <span className="env-name">{environment.name}</span>
                <span className="env-meta">T{environment.tier} • {environment.type} • DC {environment.difficulty}</span>
              </div>
              <p className="env-desc">{environment.description}</p>
            </div>
          )}

          {/* Legacy environment text field */}
          {!environment && encounter.environment && (
            <div className="encounter-section">
              <h4>Environment</h4>
              <WikiText
                text={encounter.environment}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {/* Adversary Slots */}
          {hasBPData && (
            <div className="encounter-section adversary-slots-section">
              <h4>Adversaries</h4>
              <div className="adversary-slots-list">
                {encounter.adversarySlots.map((slot, idx) => {
                  const adv = getAdversaryFromSlot(slot);
                  if (!adv) return null;
                  return (
                    <div key={idx} className="adversary-slot-item">
                      <span className="slot-qty">{slot.quantity}x</span>
                      <span className="slot-name">{adv.name}</span>
                      <span className="slot-role">{adv.role}</span>
                      <span className="slot-tier">T{adv.tier}</span>
                    </div>
                  );
                })}
              </div>
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
              {hasBPData && onRun && (
                <button className="btn btn-primary" onClick={onRun}>
                  <Play size={16} />
                  Run Encounter
                </button>
              )}
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
