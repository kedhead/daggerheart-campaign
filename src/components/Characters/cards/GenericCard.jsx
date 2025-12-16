import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, ExternalLink, EyeOff, Heart } from 'lucide-react';
import './GenericCard.css';
import '../CharacterCard.css';

export default function GenericCard({ character, onEdit, onDelete, isDM, canEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const systemData = character.systemData || {};

  return (
    <div className="character-card generic-card card">
      <div className="character-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="character-avatar">
          {character.avatarUrl ? (
            <img src={character.avatarUrl} alt={character.name} />
          ) : (
            <span>{character.name.charAt(0)}</span>
          )}
        </div>
        <div className="character-info">
          <h3>{character.name}</h3>
          {character.playerName && (
            <p className="player-name">Played by {character.playerName}</p>
          )}
          {systemData.characterClass && (
            <p className="character-class">{systemData.characterClass}</p>
          )}
          {systemData.level && (
            <p className="character-level">Level {systemData.level}</p>
          )}
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="character-details">
          {/* Character Sheet Link */}
          {systemData.characterSheetLink && (
            <div className="character-sheet-link">
              <a
                href={systemData.characterSheetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary full-width"
              >
                <ExternalLink size={18} />
                Open Character Sheet
              </a>
            </div>
          )}

          {/* Vitals */}
          <div className="stats-section vitals-section">
            <h4>Vitals</h4>
            <div className="vitals-grid">
              <div className="vital-box">
                <div className="vital-icon">
                  <Heart size={20} />
                </div>
                <div className="vital-info">
                  <span className="vital-label">HP</span>
                  <span className="vital-value">{systemData.hp || 0} / {systemData.maxHp || 10}</span>
                </div>
              </div>
              <div className="vital-box">
                <div className="vital-info">
                  <span className="vital-label">AC/Defense</span>
                  <span className="vital-value">{systemData.armorClass || 10}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attributes */}
          {systemData.attributes && systemData.attributes.length > 0 && (
            <div className="stats-section">
              <h4>Attributes</h4>
              <div className="attributes-grid">
                {systemData.attributes.map((attr, index) => (
                  <div key={index} className="attribute-box">
                    <span className="attribute-label">{attr.name}</span>
                    <span className="attribute-value">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {systemData.skills && systemData.skills.length > 0 && (
            <div className="stats-section">
              <h4>Skills</h4>
              <div className="skills-list">
                {systemData.skills.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <span className="skill-name">{skill.name}</span>
                    <span className="skill-value">
                      {skill.value >= 0 ? '+' : ''}{skill.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abilities */}
          {systemData.abilities && systemData.abilities.length > 0 && (
            <div className="stats-section">
              <h4>Special Abilities</h4>
              <div className="abilities-list">
                {systemData.abilities.map((ability, index) => (
                  <div key={index} className="ability-item">
                    <strong className="ability-name">{ability.name}</strong>
                    <p className="ability-description">{ability.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Background */}
          {systemData.background && (
            <div className="notes-section">
              <h4>Background</h4>
              <p>{systemData.background}</p>
            </div>
          )}

          {/* Equipment */}
          {systemData.equipment && (
            <div className="notes-section">
              <h4>Equipment & Inventory</h4>
              <p>{systemData.equipment}</p>
            </div>
          )}

          {/* Player Notes */}
          {systemData.playerNotes && (
            <div className="notes-section">
              <h4>Player Notes</h4>
              <p>{systemData.playerNotes}</p>
            </div>
          )}

          {/* Backstory */}
          {character.backstory && (
            <div className="backstory-section">
              <h4>Backstory</h4>
              <p>{character.backstory}</p>
            </div>
          )}

          {/* DM Notes */}
          {isDM && character.dmNotes && (
            <div className="dm-notes-section">
              <h4>
                <EyeOff size={16} />
                DM Notes
              </h4>
              <p>{character.dmNotes}</p>
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="character-actions">
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
    </div>
  );
}
