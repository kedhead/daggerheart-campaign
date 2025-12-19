import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import './MessagingView.css';

export default function MessageInput({ onSend }) {
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);

  const MAX_LENGTH = 500;

  const handleKeyDown = (e) => {
    // Enter without Shift = send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter = new line (default behavior)
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (trimmed && trimmed.length <= MAX_LENGTH) {
      onSend(trimmed);
      setContent('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setContent(value);

      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  const remainingChars = MAX_LENGTH - content.length;
  const isNearLimit = remainingChars < 50;

  return (
    <div className="message-input">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
        rows={1}
      />
      <div className="message-input-footer">
        <span className={`char-count ${isNearLimit ? 'warning' : ''}`}>
          {isNearLimit && `${remainingChars} characters remaining`}
        </span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSend}
          disabled={!content.trim()}
        >
          <Send size={16} />
          Send
        </button>
      </div>
    </div>
  );
}
