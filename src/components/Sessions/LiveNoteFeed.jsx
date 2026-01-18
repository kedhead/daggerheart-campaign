import { useRef, useEffect } from 'react';
import { Star, Trash2, User } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import './LiveNoteFeed.css';

export default function LiveNoteFeed({
  notes,
  currentUserId,
  isDM,
  onToggleHighlight,
  onDeleteNote,
  entities,
  campaign,
  autoScroll = true
}) {
  const feedRef = useRef(null);

  // Auto-scroll to bottom when new notes arrive
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [notes, autoScroll]);

  const formatTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const canDelete = (note) => {
    return isDM || note.authorId === currentUserId;
  };

  if (notes.length === 0) {
    return (
      <div className="live-note-feed empty">
        <div className="empty-state">
          <p>No notes yet. Start capturing what happens!</p>
          <p className="hint">Everyone can add notes during the session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-note-feed" ref={feedRef}>
      {notes.map((note, index) => {
        const isOwnNote = note.authorId === currentUserId;
        const showAuthor = index === 0 || notes[index - 1]?.authorId !== note.authorId;

        return (
          <div
            key={note.id}
            className={`live-note ${isOwnNote ? 'own' : ''} ${note.isHighlight ? 'highlighted' : ''}`}
          >
            {showAuthor && (
              <div className="note-author">
                <User size={14} />
                <span>{note.authorName}</span>
                <span className="note-time">{formatTime(note.timestamp)}</span>
              </div>
            )}

            <div className="note-content">
              <WikiText
                text={note.content}
                entities={entities}
                campaign={campaign}
                isDM={isDM}
                currentUserId={currentUserId}
              />
            </div>

            <div className="note-actions">
              <button
                className={`action-btn highlight-btn ${note.isHighlight ? 'active' : ''}`}
                onClick={() => onToggleHighlight(note.id)}
                title={note.isHighlight ? 'Remove from highlights' : 'Add to highlights'}
              >
                <Star size={14} fill={note.isHighlight ? 'currentColor' : 'none'} />
              </button>

              {canDelete(note) && (
                <button
                  className="action-btn delete-btn"
                  onClick={() => onDeleteNote(note.id)}
                  title="Delete note"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {!showAuthor && (
              <span className="inline-time">{formatTime(note.timestamp)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
