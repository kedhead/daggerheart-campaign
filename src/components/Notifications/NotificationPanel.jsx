import { MessageSquare, UserPlus, BellOff, X } from 'lucide-react';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationPanel({ unreadConversations, pendingJoinRequests, onNavigate, onClose }) {
  const hasNotifications = unreadConversations.length > 0 || pendingJoinRequests.length > 0;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#0d1126]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-xs font-black text-white/60 uppercase tracking-widest">Notifications</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {!hasNotifications ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-white/20">
            <BellOff size={28} strokeWidth={1.5} />
            <span className="text-xs font-bold uppercase tracking-widest">All caught up</span>
          </div>
        ) : (
          <div className="py-2">
            {/* Unread Messages */}
            {unreadConversations.length > 0 && (
              <div>
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-black text-white/25 uppercase tracking-widest">Messages</span>
                </div>
                {unreadConversations.map(conv => {
                  const otherName = conv.type === 'announcement'
                    ? 'Announcement'
                    : (conv.participantNames
                        ? Object.values(conv.participantNames).join(', ')
                        : 'Message');
                  return (
                    <button
                      key={conv.id}
                      onClick={() => { onNavigate('messaging'); onClose(); }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-all duration-200 text-left group"
                    >
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/30 transition-colors">
                        <MessageSquare size={14} className="text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white/90 truncate">{otherName}</p>
                        <p className="text-[11px] text-white/40 truncate mt-0.5">
                          {conv.lastMessage || 'New message'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
                        <span className="text-[10px] text-white/25">{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pending Join Requests (DM only) */}
            {pendingJoinRequests.length > 0 && (
              <div>
                <div className="px-4 py-1.5 mt-1">
                  <span className="text-[10px] font-black text-white/25 uppercase tracking-widest">Join Requests</span>
                </div>
                {pendingJoinRequests.map(req => (
                  <button
                    key={req.userId}
                    onClick={() => { onNavigate('members'); onClose(); }}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-all duration-200 text-left group"
                  >
                    <div className="mt-0.5 w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/30 transition-colors">
                      <UserPlus size={14} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white/90 truncate">
                        {req.displayName || req.email}
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5">Wants to join the campaign</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                      <span className="text-[10px] text-white/25">{timeAgo(req.requestedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
