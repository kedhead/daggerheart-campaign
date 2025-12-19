import { useState } from 'react';
import { MessageSquare, Megaphone, Plus, User } from 'lucide-react';
import './MessagingView.css';

export default function ConversationList({
  conversations,
  selectedConversation,
  currentUserId,
  isDM,
  members,
  hasUnread,
  onSelectConversation,
  onCreateDMConversation,
  onCreateAnnouncements
}) {
  const [showNewConversation, setShowNewConversation] = useState(false);

  // Separate announcements from other conversations
  const announcements = conversations.find(c => c.type === 'announcement');
  const dmConversations = conversations.filter(c => c.type === 'dm-player');

  // Get members who don't have conversations yet
  const existingConversationUserIds = new Set();
  dmConversations.forEach(c => {
    // Extract other participant's ID from conversation participants
    const otherUserId = c.participants?.find(id => id !== currentUserId);
    if (otherUserId) {
      existingConversationUserIds.add(otherUserId);
    }
  });

  // Show all members except current user (both DM and players can message each other)
  const availableMembers = members.filter(
    m => m.userId !== currentUserId && !existingConversationUserIds.has(m.userId)
  );

  const handleCreateConversation = async (playerId, playerName) => {
    const conversationId = await onCreateDMConversation(playerId, playerName);
    if (conversationId) {
      onSelectConversation(conversationId);
      setShowNewConversation(false);
    }
  };

  const handleCreateAnnouncements = async () => {
    const conversationId = await onCreateAnnouncements(members);
    if (conversationId) {
      onSelectConversation(conversationId);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="conversation-sidebar">
      <div className="conversation-header">
        <div>
          <h2>Messages</h2>
          <p className="view-subtitle">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn btn-icon"
          onClick={() => setShowNewConversation(!showNewConversation)}
          title="New conversation"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* New conversation menu */}
      {showNewConversation && (
        <div className="new-conversation-menu card">
          {isDM && !announcements && (
            <button
              className="new-conversation-option"
              onClick={handleCreateAnnouncements}
            >
              <Megaphone size={20} />
              <div>
                <strong>Create Announcements</strong>
                <small>Broadcast to all members</small>
              </div>
            </button>
          )}

          {availableMembers.length > 0 ? (
            availableMembers.map(member => (
              <button
                key={member.userId}
                className="new-conversation-option"
                onClick={() => handleCreateConversation(member.userId, member.displayName)}
              >
                <User size={20} />
                <div>
                  <strong>{member.displayName}</strong>
                  <small>{member.role === 'dm' ? 'DM' : 'Player'}</small>
                </div>
              </button>
            ))
          ) : (
            <div className="empty-state-small">
              <p>No new conversations available</p>
            </div>
          )
          )}
        </div>
      )}

      <div className="conversation-list">
        {/* Announcements (pinned to top) */}
        {announcements && (
          <button
            className={`conversation-item ${
              selectedConversation === announcements.id ? 'active' : ''
            } ${hasUnread(announcements.id) ? 'unread' : ''}`}
            onClick={() => onSelectConversation(announcements.id)}
          >
            <div className="conversation-icon announcement">
              <Megaphone size={20} />
            </div>
            <div className="conversation-info">
              <div className="conversation-name">
                <strong>Announcements</strong>
                {hasUnread(announcements.id) && <span className="unread-badge"></span>}
              </div>
              <p className="conversation-preview">
                {announcements.lastMessage || 'No messages yet'}
              </p>
            </div>
            <span className="conversation-time">
              {formatTimestamp(announcements.lastMessageAt)}
            </span>
          </button>
        )}

        {/* DM Conversations */}
        {dmConversations.length > 0 ? (
          dmConversations.map(conversation => {
            const otherUserId = conversation.participants?.find(id => id !== currentUserId);
            const otherUserName = otherUserId
              ? conversation.participantNames?.[otherUserId]
              : 'Unknown';

            return (
              <button
                key={conversation.id}
                className={`conversation-item ${
                  selectedConversation === conversation.id ? 'active' : ''
                } ${hasUnread(conversation.id) ? 'unread' : ''}`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="conversation-icon dm">
                  <User size={20} />
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    <strong>{otherUserName}</strong>
                    {hasUnread(conversation.id) && <span className="unread-badge"></span>}
                  </div>
                  <p className="conversation-preview">
                    {conversation.lastMessage || 'No messages yet'}
                  </p>
                </div>
                <span className="conversation-time">
                  {formatTimestamp(conversation.lastMessageAt)}
                </span>
              </button>
            );
          })
        ) : (
          !announcements && (
            <div className="empty-state card">
              <MessageSquare size={48} />
              <p>No conversations yet</p>
              {isDM && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowNewConversation(true)}
                >
                  <Plus size={16} />
                  Start a conversation
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
