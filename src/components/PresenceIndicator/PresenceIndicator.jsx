import { useState } from 'react';
import { Users } from 'lucide-react';
import './PresenceIndicator.css';

/**
 * Displays a stack of user avatars showing who's online
 * @param {Array} presenceList - List of present users
 * @param {string} currentUserId - Current user's ID to exclude from display
 * @param {number} maxDisplay - Max avatars to show before "+X"
 */
export default function PresenceIndicator({ presenceList = [], currentUserId, maxDisplay = 4, isStatusBar = false }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Filter out current user and offline users
  const otherUsers = presenceList.filter(
    (p) => p.userId !== currentUserId && p.computedStatus !== 'offline'
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
      case 'away': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
      default: return 'bg-white/20';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isStatusBar) {
    return (
      <div className="flex items-center gap-1.5 transition-all duration-300">
        <div className={`w-1.5 h-1.5 rounded-full ${otherUsers.length > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-white/20'}`}></div>
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
          {otherUsers.length} Active
        </span>
      </div>
    );
  }

  if (otherUsers.length === 0) return null;

  const displayUsers = otherUsers.slice(0, maxDisplay);
  const remainingCount = otherUsers.length - maxDisplay;

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => (
          <div
            key={user.id}
            className="w-7 h-7 rounded-lg border-2 border-[#0d1126] bg-white/5 relative group/avatar transition-transform hover:scale-110 hover:z-20 cursor-pointer"
            style={{ zIndex: displayUsers.length - index }}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-md" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/60 uppercase">
                {getInitials(user.displayName)}
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#0d1126] ${getStatusColor(user.computedStatus)}`} />
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-7 h-7 rounded-lg border-2 border-[#0d1126] bg-white/10 flex items-center justify-center text-[9px] font-black text-white/60 z-0">
            +{remainingCount}
          </div>
        )}
      </div>

      {showTooltip && (
        <div className="absolute top-full mt-2 left-0 w-48 bg-[#0d1126]/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Users size={12} className="text-white/40" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{otherUsers.length} Online Now</span>
          </div>
          <div className="space-y-2">
            {otherUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(user.computedStatus)}`} />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white/90 truncate">{user.displayName}</span>
                  {user.currentView && (
                    <span className="text-[9px] font-medium text-white/20 uppercase tracking-wide truncate">
                      Viewing {formatViewName(user.currentView)}
                    </span>
                  )}
                </div>
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
