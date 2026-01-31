import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import InlineEdit from '../InlineEdit/InlineEdit';
import { useToast } from '../../contexts/ToastContext';
import './CharacterCard.css';

export default function CharacterCard({ character, onEdit, onDelete, onUpdate, isDM }) {
  const { success, error } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const renderSlots = (slots, type) => {
    return (
      <div className="slots">
        {slots.map((filled, index) => (
          <div key={index} className={`slot ${filled ? 'filled' : 'empty'} ${type}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="character-card card">
      <div className="character-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="character-avatar">
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} />
          ) : (
            <span>{character.name.charAt(0)}</span>
          )}
        </div>
        <div className="character-info">
          <InlineEdit
            value={character.name}
            onSave={async (newName) => {
              if (onUpdate) {
                try {
                  await onUpdate(character.id, { ...character, name: newName });
                  success('Character name updated');
                } catch (e) {
                  error('Failed to update character name');
                  throw e;
                }
              }
            }}
            disabled={!isDM || !onUpdate}
            as="h3"
            className="large"
          />
          {character.playerName && (
            <p className="player-name">Played by {character.playerName}</p>
          )}
          <p className="character-class">
            {character.class} {character.subclass && `(${character.subclass})`} • Level {character.level}
          </p>
          <p className="character-ancestry">{character.ancestry} • {character.community}</p>
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="character-details">
          <div className="stats-section">
            <h4>Traits</h4>
            <div className="traits-grid">
              <div className="trait">
                <span className="trait-label">Agility</span>
                <span className="trait-value">{character.traits.agility >= 0 ? '+' : ''}{character.traits.agility}</span>
              </div>
              <div className="trait">
                <span className="trait-label">Strength</span>
                <span className="trait-value">{character.traits.strength >= 0 ? '+' : ''}{character.traits.strength}</span>
              </div>
              <div className="trait">
                <span className="trait-label">Finesse</span>
                <span className="trait-value">{character.traits.finesse >= 0 ? '+' : ''}{character.traits.finesse}</span>
              </div>
              <div className="trait">
                <span className="trait-label">Instinct</span>
                <span className="trait-value">{character.traits.instinct >= 0 ? '+' : ''}{character.traits.instinct}</span>
              </div>
              <div className="trait">
                <span className="trait-label">Presence</span>
                <span className="trait-value">{character.traits.presence >= 0 ? '+' : ''}{character.traits.presence}</span>
              </div>
              <div className="trait">
                <span className="trait-label">Knowledge</span>
                <span className="trait-value">{character.traits.knowledge >= 0 ? '+' : ''}{character.traits.knowledge}</span>
              </div>
            </div>
          </div>

          <div className="vitals-section">
            <div className="vital">
              <h4>HP</h4>
              {renderSlots(character.hpSlots, 'hp')}
            </div>
            <div className="vital">
              <h4>Stress</h4>
              {renderSlots(character.stressSlots, 'stress')}
            </div>
          </div>

          <div className="combat-stats">
            <div className="stat-box">
              <span className="stat-label">Evasion</span>
              <span className="stat-value">{character.evasion}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Armor</span>
              <span className="stat-value">{character.armor}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Primary Domain</span>
              <span className="stat-value">{character.primaryDomain}</span>
            </div>
          </div>

          {character.experiences && character.experiences.length > 0 && (
            <div className="experiences-section">
              <h4>Experiences</h4>
              <div className="experiences-list">
                {character.experiences.map((exp, index) => (
                  <span key={index} className="badge">{exp}</span>
                ))}
              </div>
            </div>
          )}

          {character.backstory && (
            <div className="backstory-section">
              <h4>Backstory</h4>
              <p>{character.backstory}</p>
            </div>
          )}

          {isDM && character.dmNotes && (
            <div className="dm-notes-section">
              <h4>
                <EyeOff size={16} />
                DM Notes
              </h4>
              <p>{character.dmNotes}</p>
            </div>
          )}

          <div className="character-actions">
            {character.demiplaneLink && (
              <a
                href={character.demiplaneLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={16} />
                View Sheet
              </a>
            )}
            {isDM && (
              <>
                <button className="btn btn-secondary" onClick={onEdit}>
                  <Edit3 size={16} />
                  Edit
                </button>
                <button className="btn btn-danger" onClick={onDelete}>
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
