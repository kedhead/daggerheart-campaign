import { useState } from 'react';
import { ChevronDown, Edit3, Trash2, StickyNote } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';

export default function NoteCard({ note, onEdit, onDelete, currentUserId, isDM, campaign, isEmbedded = false, entities }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);

  const canEdit = note.createdBy === currentUserId || isDM;

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'quest': return 'text-amber-400 ring-amber-400/20 bg-amber-400/5';
      case 'npc': return 'text-emerald-400 ring-emerald-400/20 bg-emerald-400/5';
      case 'location': return 'text-blue-400 ring-blue-400/20 bg-blue-400/5';
      case 'combat': return 'text-red-400 ring-red-400/20 bg-red-400/5';
      default: return 'text-slate-400 ring-slate-400/20 bg-slate-400/5';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`
      group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md transition-all duration-500 hover:bg-white/[0.06] hover:border-white/10 hover:shadow-2xl hover:-translate-y-1
      ${isExpanded ? 'ring-1 ring-white/10 bg-white/[0.08]' : ''}
    `}>
      {/* Cover Image Placeholder/Support */}
      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-indigo-950/50 to-slate-900/50 border-b border-white/5">
        {note.coverImage ? (
          <img src={note.coverImage} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <StickyNote size={64} className="text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1126] to-transparent" />

        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${getCategoryStyles(note.category)}`}>
            {note.category || 'other'}
          </span>
          {note.createdAt && (
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{formatDate(note.createdAt)}</span>
          )}
        </div>
      </div>

      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-bold text-white/90 leading-tight group-hover:text-white transition-colors">
              {note.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-medium text-white/20">by {note.createdByName || 'Unknown'}</span>
            </div>
          </div>
          <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all ${isExpanded ? 'rotate-180 bg-white/10 text-white' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed font-sans font-medium">
              <WikiText
                text={note.content}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>

            {canEdit && !isEmbedded && (
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-white/60 hover:text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                  <Edit3 size={14} />
                  Modify
                </button>
                <button
                  className="flex items-center justify-center p-2 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entity viewer modal */}
      {viewingEntity && (
        <EntityViewer
          entity={viewingEntity}
          isOpen={!!viewingEntity}
          onClose={() => setViewingEntity(null)}
          isDM={isDM}
          campaign={campaign}
          currentUserId={currentUserId}
          entities={entities}
        />
      )}
    </div>
  );
}
