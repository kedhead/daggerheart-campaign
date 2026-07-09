import { ExternalLink, Edit, Trash2, Zap } from 'lucide-react';
import { ATTRIBUTES } from '../../../data/systems/starwarsd6';

export default function StarWarsD6Card({ character, onEdit, onDelete, isDM, canEdit }) {
  const systemData = character.systemData || {};
  const attributes = systemData.attributes || {};
  const hasAttributes = ATTRIBUTES.some(a => attributes[a.toLowerCase()]?.dice);

  return (
    <div className="character-card">
      <div className="character-header">
        {character.avatarUrl && (
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="character-avatar"
          />
        )}
        <div className="character-info">
          <div className="character-name-row">
            <h3>{character.name}</h3>
            {systemData.forceSensitive && (
              <span className="badge" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#000' }}>
                <Zap size={14} />
                Force Sensitive
              </span>
            )}
          </div>
          <p className="character-player">Played by {character.playerName}</p>
          {systemData.species && (
            <p className="character-detail">{systemData.species}</p>
          )}
          {systemData.template && (
            <p className="character-detail">{systemData.template}</p>
          )}
        </div>

        {canEdit && (
          <div className="character-actions">
            <button
              className="btn btn-icon"
              onClick={() => onEdit(character)}
              title="Edit character"
            >
              <Edit size={18} />
            </button>
            <button
              className="btn btn-icon btn-danger"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${character.name}?`)) {
                  onDelete(character.id);
                }
              }}
              title="Delete character"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {hasAttributes && (
        <div className="character-section">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.4rem',
            }}
          >
            {ATTRIBUTES.map(attrName => {
              const attr = attributes[attrName.toLowerCase()];
              if (!attr?.dice) return null;
              return (
                <div
                  key={attrName}
                  style={{
                    textAlign: 'center',
                    padding: '0.35rem 0.25rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 215, 0, 0.06)',
                    border: '1px solid rgba(255, 215, 0, 0.18)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'rgba(255, 215, 0, 0.7)',
                    }}
                  >
                    {attrName.slice(0, 4)}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{attr.dice}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {systemData.characterSheetLink && (
        <div className="character-section">
          <a
            href={systemData.characterSheetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="character-link"
          >
            <ExternalLink size={16} />
            Open Character Sheet
          </a>
        </div>
      )}

      {systemData.playerNotes && (
        <div className="character-section">
          <h4>Player Notes</h4>
          <p className="character-notes">{systemData.playerNotes}</p>
        </div>
      )}

      {character.backstory && (
        <div className="character-section">
          <h4>Backstory</h4>
          <p className="character-backstory">{character.backstory}</p>
        </div>
      )}

      {isDM && character.dmNotes && (
        <div className="character-section dm-notes">
          <h4>DM Notes (Private)</h4>
          <p>{character.dmNotes}</p>
        </div>
      )}
    </div>
  );
}
