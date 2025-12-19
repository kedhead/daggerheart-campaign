import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useMessaging } from '../../hooks/useMessaging';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import './MessagingView.css';

export default function MessagingView({ campaign, currentUserId, isDM }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const {
    conversations,
    messages,
    loading,
    subscribeToMessages,
    sendMessage,
    markAsRead,
    getOrCreateDMConversation,
    getOrCreateAnnouncements,
    hasUnread
  } = useMessaging(campaign?.id);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-select announcements on first load for DM
  useEffect(() => {
    if (!loading && conversations.length > 0 && !selectedConversation && isDM) {
      const announcements = conversations.find(c => c.type === 'announcement');
      if (announcements) {
        setSelectedConversation(announcements.id);
      }
    }
  }, [loading, conversations, selectedConversation, isDM]);

  // Filter conversations based on user role
  const visibleConversations = isDM
    ? conversations
    : conversations.filter(c =>
        c.type === 'announcement' ||
        c.participants?.includes(currentUserId)
      );

  const handleSelectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
    markAsRead(conversationId);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  // Get campaign members for creating conversations
  const campaignMembers = campaign?.members || {};
  const membersList = Object.entries(campaignMembers).map(([userId, data]) => ({
    userId,
    displayName: data.displayName || data.email,
    role: data.role
  }));

  return (
    <div className="messaging-view">
      {loading ? (
        <div className="empty-state card">
          <MessageSquare size={64} />
          <p>Loading messages...</p>
        </div>
      ) : (
        <>
          {/* Mobile: Show either list or chat */}
          {isMobileView ? (
            selectedConversation ? (
              <ChatWindow
                conversationId={selectedConversation}
                conversation={conversations.find(c => c.id === selectedConversation)}
                messages={messages[selectedConversation] || []}
                currentUserId={currentUserId}
                isDM={isDM}
                onSendMessage={sendMessage}
                subscribeToMessages={subscribeToMessages}
                onBack={handleBack}
                isMobile={true}
              />
            ) : (
              <ConversationList
                conversations={visibleConversations}
                selectedConversation={selectedConversation}
                currentUserId={currentUserId}
                isDM={isDM}
                members={membersList}
                hasUnread={hasUnread}
                onSelectConversation={handleSelectConversation}
                onCreateDMConversation={getOrCreateDMConversation}
                onCreateAnnouncements={getOrCreateAnnouncements}
              />
            )
          ) : (
            /* Desktop: Show both side by side */
            <>
              <ConversationList
                conversations={visibleConversations}
                selectedConversation={selectedConversation}
                currentUserId={currentUserId}
                isDM={isDM}
                members={membersList}
                hasUnread={hasUnread}
                onSelectConversation={handleSelectConversation}
                onCreateDMConversation={getOrCreateDMConversation}
                onCreateAnnouncements={getOrCreateAnnouncements}
              />

              {selectedConversation ? (
                <ChatWindow
                  conversationId={selectedConversation}
                  conversation={conversations.find(c => c.id === selectedConversation)}
                  messages={messages[selectedConversation] || []}
                  currentUserId={currentUserId}
                  isDM={isDM}
                  onSendMessage={sendMessage}
                  subscribeToMessages={subscribeToMessages}
                  isMobile={false}
                />
              ) : (
                <div className="chat-placeholder">
                  <MessageSquare size={64} />
                  <h3>Select a conversation</h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
