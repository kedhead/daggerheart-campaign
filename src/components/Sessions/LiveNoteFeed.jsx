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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-4 text-white/40">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">No notes yet. Start capturing what happens!</p>
          <p className="text-sm opacity-70">Everyone can add notes during the session.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20"
      ref={feedRef}
    >
      {notes.map((note, index) => {
        const isOwnNote = note.authorId === currentUserId;
        const showAuthor = index === 0 || notes[index - 1]?.authorId !== note.authorId;

        return (
          <div
            key={note.id}
            className={`
              relative p-2 pl-3 rounded-lg transition-all duration-200 group border-l-[3px]
              ${isOwnNote ? 'border-[rgb(var(--color-primary))]' : 'border-transparent'}
              ${note.isHighlight
                ? 'bg-[var(--bg-tertiary)] bg-gradient-to-br from-[var(--bg-tertiary)] to-amber-500/10 border-l-amber-500'
                : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]'}
            `}
          >
            {note.isHighlight && (
              <div className="absolute right-2 top-2 text-amber-500/60 text-xs flex items-center gap-1">
                <Star size={10} fill="currentColor" />
              </div>
            )}

            {showAuthor && (
              <div className="flex items-center gap-2 mb-1 text-xs text-white/50">
                <User size={12} />
                <span className={`font-semibold ${isOwnNote ? 'text-[rgb(var(--color-primary-light))]' : 'text-white/70'}`}>
                  {note.authorName}
                </span>
                <span className="ml-auto text-[0.65rem] opacity-70">{formatTime(note.timestamp)}</span>
              </div>
            )}

            <div className="text-[0.95rem] leading-relaxed text-white/90 break-words pr-8">
              <WikiText
                text={note.content}
                entities={entities}
                campaign={campaign}
                isDM={isDM}
                currentUserId={currentUserId}
              />
            </div>

            <div className={`
                absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                ${note.isHighlight ? 'right-7' : ''}
              `}>
              <button
                className={`
                  p-1 rounded bg-[var(--bg-primary)] border border-white/10 text-white/40 cursor-pointer transition-colors
                  hover:text-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-primary))]
                  ${note.isHighlight ? 'text-amber-500 border-amber-500/30' : ''}
                `}
                onClick={() => onToggleHighlight(note.id)}
                title={note.isHighlight ? 'Remove from highlights' : 'Add to highlights'}
              >
                <Star size={12} fill={note.isHighlight ? 'currentColor' : 'none'} />
              </button>

              {canDelete(note) && (
                <button
                  className="p-1 rounded bg-[var(--bg-primary)] border border-white/10 text-white/40 cursor-pointer transition-colors hover:text-red-500 hover:border-red-500"
                  onClick={() => onDeleteNote(note.id)}
                  title="Delete note"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {!showAuthor && (
              <span className="absolute right-3 bottom-2 text-[0.65rem] text-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {formatTime(note.timestamp)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
