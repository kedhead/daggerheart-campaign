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
    <form className="p-4 bg-[var(--bg-secondary)] border-t border-white/5" onSubmit={handleSubmit}>
      <div
        className={`
          flex gap-2 items-end bg-[var(--bg-tertiary)] border rounded-lg p-2 transition-colors duration-200
          ${content ? 'border-[rgb(var(--color-primary))/40]' : 'border-white/10'}
          ${isHighlight ? 'ring-1 ring-amber-500/50 border-amber-500/50' : ''}
          focus-within:border-[rgb(var(--color-primary))] focus-within:ring-1 focus-within:ring-[rgb(var(--color-primary))/50]
        `}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note... (Enter to send, Ctrl+Enter for highlight)"
          disabled={disabled || isSubmitting}
          rows={1}
          className="flex-1 bg-transparent border-0 text-[var(--text-primary)] text-[0.95rem] leading-relaxed resize-none min-h-[24px] max-h-[100px] p-1.5 focus:outline-none placeholder:text-white/30"
        />
        <div className="flex gap-1 items-center">
          <button
            type="button"
            className={`
              p-2 rounded-md transition-all duration-200
              ${isHighlight
                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                : 'text-white/40 hover:bg-white/10 hover:text-amber-500'}
            `}
            onClick={() => setIsHighlight(!isHighlight)}
            title={isHighlight ? 'Remove highlight' : 'Mark as highlight'}
            disabled={disabled || isSubmitting}
          >
            <Star size={18} fill={isHighlight ? 'currentColor' : 'none'} />
          </button>
          <button
            type="submit"
            className={`
              p-2 bg-[rgb(var(--color-primary))] border-0 rounded-md text-white transition-all duration-200
              hover:bg-[rgb(var(--color-primary-light))] hover:-translate-y-0.5
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
            `}
            disabled={!content.trim() || disabled || isSubmitting}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
      <div className="min-h-[20px] mt-1 text-xs px-1">
        {isHighlight && (
          <span className="inline-flex items-center gap-1 text-amber-500 font-medium animate-in fade-in duration-200">
            <Star size={10} fill="currentColor" /> Will be highlighted
          </span>
        )}
      </div>
    </form>
  );
}
