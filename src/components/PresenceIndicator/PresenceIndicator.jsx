import { useState } from 'react';
import { Users } from 'lucide-react';
import './PresenceIndicator.css';

/**
 * Displays a stack of user avatars showing who's online
 * @param {Array} presenceList - List of present users
 * @param {string} currentUserId - Current user's ID to exclude from display
 * @param {number} maxDisplay - Max avatars to show before "+X"
 */
export default function PresenceIndicator({ presenceList = [], currentUserId, maxDisplay = 4 }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Filter out current user and offline users
  const otherUsers = presenceList.filter(
    (p) => p.userId !== currentUserId && p.computedStatus !== 'offline'
  );

  if (otherUsers.length === 0) {
    return null;
  }

  const displayUsers = otherUsers.slice(0, maxDisplay);
  const remainingCount = otherUsers.length - maxDisplay;

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#22c55e'; // Green
      case 'away':
        return '#f59e0b'; // Amber
      default:
        return '#6b7280'; // Gray
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div
      className="presence-indicator"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="presence-avatars">
        {displayUsers.map((user, index) => (
          <div
            key={user.id}
            className="presence-avatar"
            style={{ zIndex: displayUsers.length - index }}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} />
            ) : (
              <span className="presence-avatar-initials">
                {getInitials(user.displayName)}
              </span>
            )}
            <span
              className="presence-status-dot"
              style={{ backgroundColor: getStatusColor(user.computedStatus) }}
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="presence-avatar presence-more">
            <span>+{remainingCount}</span>
          </div>
        )}
      </div>

      {showTooltip && (
        <div className="presence-tooltip">
          <div className="presence-tooltip-header">
            <Users size={14} />
            <span>{otherUsers.length} online</span>
          </div>
          <div className="presence-tooltip-list">
            {otherUsers.map((user) => (
              <div key={user.id} className="presence-tooltip-item">
                <span
                  className="presence-tooltip-dot"
                  style={{ backgroundColor: getStatusColor(user.computedStatus) }}
                />
                <span className="presence-tooltip-name">{user.displayName}</span>
                {user.currentView && (
                  <span className="presence-tooltip-view">
                    {formatViewName(user.currentView)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatViewName(view) {
  const viewNames = {
    dashboard: 'Dashboard',
    characters: 'Characters',
    npcs: 'NPCs',
    locations: 'Locations',
    lore: 'Lore',
    sessions: 'Sessions',
    encounters: 'Encounters',
    notes: 'Notes',
    quests: 'Quests',
    items: 'Items',
    timeline: 'Timeline',
    files: 'Files',
    tools: 'Tools',
    help: 'Help',
    members: 'Members',
    apiSettings: 'Settings',
    initiative: 'Initiative',
    partyInventory: 'Party Inventory',
    campaignBuilder: 'Campaign Builder',
  };
  return viewNames[view] || view;
}
