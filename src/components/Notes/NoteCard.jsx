import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './NotesView.css';

export default function NoteCard({ note, onEdit, onDelete, currentUserId, isDM, campaign }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign);

  // Only allow editing if user owns the note or is DM
  const canEdit = note.createdBy === currentUserId || isDM;

  const getCategoryColor = (category) => {
    switch (category) {
      case 'quest':
        return 'category-quest';
      case 'npc':
        return 'category-npc';
      case 'location':
        return 'category-location';
      case 'combat':
        return 'category-combat';
      default:
        return 'category-other';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="note-card card">
      <div className="note-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="note-info">
          <h3>{note.title}</h3>
          <div className="note-meta">
            <span className={`category-badge ${getCategoryColor(note.category)}`}>
              {note.category || 'other'}
            </span>
            {note.createdAt && (
              <span className="note-date">{formatDate(note.createdAt)}</span>
            )}
            {note.createdByName && (
              <span className="note-author">by {note.createdByName}</span>
            )}
          </div>
        </div>
        <button className="btn btn-icon expand-btn">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="note-details">
          {note.content && (
            <div className="note-content">
              <WikiText
                text={note.content}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          )}

          {canEdit && (
            <div className="note-actions">
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
