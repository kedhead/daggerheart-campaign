import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, Calendar, EyeOff, Link as LinkIcon } from 'lucide-react';
import './SessionCard.css';

export default function SessionCard({ session, onEdit, onDelete, isDM }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'status-planned';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      default: return 'status-completed';
    }
  };

  return (
    <div className="session-card card">
      <div className="session-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="session-number">
          Session {session.number}
          {session.status && session.status !== 'completed' && (
            <span className={`session-status-badge ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
          )}
        </div>
        <div className="session-info">
          <h3>{session.title}</h3>
          <p className="session-date">
            <Calendar size={14} />
            {formattedDate}
          </p>
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="session-details">
          <div className="session-summary">
            <h4>Summary</h4>
            <p>{session.summary}</p>
          </div>

          {isDM && session.encounterLinks && (
            <div className="session-encounters">
              <h4>
                <LinkIcon size={16} />
                Encounter Links
              </h4>
              <div className="encounter-links">
                {session.encounterLinks.split(',').map((link, index) => (
                  <a
                    key={index}
                    href={link.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="encounter-link"
                  >
                    Encounter {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {session.highlights && session.highlights.length > 0 && (
            <div className="session-highlights">
              <h4>Highlights</h4>
              <ul>
                {session.highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}

          {isDM && session.dmNotes && (
            <div className="session-dm-notes">
              <h4>
                <EyeOff size={16} />
                DM Notes
              </h4>
              <p>{session.dmNotes}</p>
            </div>
          )}

          {isDM && (
            <div className="session-actions">
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
