import { useState } from 'react';
import { Send, Star, Loader2 } from 'lucide-react';
import './LiveNoteInput.css';

export default function LiveNoteInput({ onSubmit, disabled = false }) {
  const [content, setContent] = useState('');
  const [isHighlight, setIsHighlight] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    await onSubmit(content, isHighlight);
    setContent('');
    setIsHighlight(false);
    setIsSubmitting(false);
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to submit with highlight
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      setIsHighlight(true);
      setTimeout(() => handleSubmit(e), 0);
    }
    // Enter to submit normally (without shift for newline)
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="live-note-input" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note... (Enter to send, Ctrl+Enter for highlight)"
          disabled={disabled || isSubmitting}
          rows={1}
        />
        <div className="input-actions">
          <button
            type="button"
            className={`highlight-toggle ${isHighlight ? 'active' : ''}`}
            onClick={() => setIsHighlight(!isHighlight)}
            title={isHighlight ? 'Remove highlight' : 'Mark as highlight'}
            disabled={disabled || isSubmitting}
          >
            <Star size={18} fill={isHighlight ? 'currentColor' : 'none'} />
          </button>
          <button
            type="submit"
            className="send-btn"
            disabled={!content.trim() || disabled || isSubmitting}
          >
            {isSubmitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
      <div className="input-hint">
        {isHighlight && <span className="highlight-badge">⭐ Will be highlighted</span>}
      </div>
    </form>
  );
}
