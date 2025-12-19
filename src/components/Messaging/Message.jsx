import './MessagingView.css';

export default function Message({ message, isOwn }) {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      <div className="message-bubble">
        {!isOwn && (
          <div className="message-sender">{message.senderName}</div>
        )}
        <div className="message-content">{message.content}</div>
        <div className="message-timestamp">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
}
