import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, ExternalLink, EyeOff } from 'lucide-react';
import './CharacterCard.css';

export default function CharacterCardSimple({ character, onEdit, onDelete, isDM }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="character-card character-card-simple card">
      <div className="character-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="character-avatar">
          {character.name.charAt(0)}
        </div>
        <div className="character-info">
          <h3>{character.name}</h3>
          <p className="character-link-status">
            <ExternalLink size={14} />
            Linked to Demiplane
          </p>
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="character-details">
          <div className="character-sheet-link">
            <a
              href={character.demiplaneLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary full-width"
            >
              <ExternalLink size={18} />
              Open Character Sheet on Demiplane
            </a>
          </div>

          {character.playerNotes && (
            <div className="notes-section">
              <h4>Character Notes</h4>
              <p>{character.playerNotes}</p>
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

          {isDM && (
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
