import { useEffect, useRef } from 'react';
import { ArrowLeft, Megaphone, User } from 'lucide-react';
import Message from './Message';
import MessageInput from './MessageInput';
import './MessagingView.css';

export default function ChatWindow({
  conversationId,
  conversation,
  messages,
  currentUserId,
  isDM,
  onSendMessage,
  subscribeToMessages,
  onBack,
  isMobile
}) {
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Subscribe to messages for this conversation
  useEffect(() => {
    if (conversationId && subscribeToMessages) {
      unsubscribeRef.current = subscribeToMessages(conversationId);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversationId, subscribeToMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="chat-area">
        <div className="empty-state card">
          <p>Conversation not found</p>
        </div>
      </div>
    );
  }

  const isAnnouncement = conversation.type === 'announcement';
  const canSend = isDM || !isAnnouncement;

  // Get conversation title
  const getConversationTitle = () => {
    if (isAnnouncement) return 'Announcements';

    const otherUserId = conversation.participants?.find(id => id !== currentUserId);
    return otherUserId
      ? conversation.participantNames?.[otherUserId] || 'Unknown'
      : 'Unknown';
  };

  const handleSend = async (content) => {
    await onSendMessage(conversationId, content);
  };

  return (
    <div className="chat-area">
      {/* Chat Header */}
      <div className="chat-header">
        {isMobile && onBack && (
          <button className="btn btn-icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="chat-header-icon">
          {isAnnouncement ? (
            <Megaphone size={20} />
          ) : (
            <User size={20} />
          )}
        </div>
        <div className="chat-header-info">
          <h3>{getConversationTitle()}</h3>
          <p className="chat-subtitle">
            {isAnnouncement
              ? 'DM announcements to all players'
              : isDM
              ? 'Private conversation'
              : 'Private conversation with DM'}
          </p>
        </div>
      </div>

      {/* Messages Display */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state-small">
            <p>No messages yet</p>
            <p className="empty-subtitle">
              {canSend
                ? 'Start the conversation!'
                : 'Waiting for DM to post an announcement'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      {canSend ? (
        <MessageInput onSend={handleSend} />
      ) : (
        <div className="message-input-disabled">
          <p>Only the DM can post announcements</p>
        </div>
      )}
    </div>
  );
}
