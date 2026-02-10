import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';

export default function TimelineEventCard({ event, onEdit, onDelete, isDM, campaign, isEmbedded = false, entities }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);

  const getTypeStyles = (type) => {
    switch (type) {
      case 'event': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'quest': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'milestone': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default: return 'bg-white/5 text-slate-400 border-white/10';
    }
  };

  return (
    <div className="bg-transparent">
      {/* Header */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h3 className="text-lg font-bold text-white leading-tight">{event.title}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${getTypeStyles(event.type)}`}>
              {event.type || 'other'}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/50">
            {event.date && (
              <p className="flex items-center gap-1.5">
                <CalendarIcon size={14} />
                {event.date}
              </p>
            )}
            {event.location && (
              <p className="flex items-center gap-1.5">
                <MapPin size={14} />
                {event.location}
              </p>
            )}
          </div>
        </div>

        <button className="text-white/40 hover:text-white transition-colors p-1">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-white/5 mt-2 pt-4">
          {event.description && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider">Description</h4>
              <div className="text-white/80 leading-relaxed text-sm">
                <WikiText
                  text={event.description}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {event.participants && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider">Participants</h4>
              <div className="text-white/80 leading-relaxed text-sm">
                <WikiText
                  text={event.participants}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {event.outcome && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-white/40 uppercase tracking-wider">Outcome</h4>
              <div className="text-white/80 leading-relaxed text-sm">
                <WikiText
                  text={event.outcome}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {isDM && !isEmbedded && (
            <div className="flex gap-2 pt-2 mt-2 border-t border-white/5">
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white border border-[rgb(var(--color-accent))] rounded hover:bg-white/5 transition-colors"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Entity viewer modal for wiki links */}
      {viewingEntity && (
        <EntityViewer
          entity={viewingEntity}
          isOpen={!!viewingEntity}
          onClose={() => setViewingEntity(null)}
          isDM={isDM}
          campaign={campaign}
          entities={entities}
        />
      )}
    </div>
  );
}
