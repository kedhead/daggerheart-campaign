import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, Calendar, EyeOff, Link as LinkIcon, Radio, ScrollText, Play } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './SessionCard.css';

export default function SessionCard({ session, onEdit, onDelete, onGoLive, isDM, campaign, isEmbedded = false, entities }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);

  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getStatusStyles = (status) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  return (
    <div className={`
      relative overflow-hidden rounded-xl transition-all duration-300
      ${isExpanded ? 'bg-[var(--bg-secondary)] border border-[rgb(var(--color-primary))/50] ring-1 ring-[rgb(var(--color-primary))/50]' : 'bg-[var(--bg-secondary)] border border-white/5 hover:border-white/20'}
    `}>
      {/* Selection/Hover Highlight */}
      <div className={`absolute inset-0 bg-gradient-to-r from-[rgb(var(--color-primary))/10] to-transparent opacity-0 transition-opacity duration-300 pointer-events-none ${isExpanded ? 'opacity-100' : 'group-hover:opacity-50'}`} />

      <div
        className="relative p-5 flex items-center justify-between gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-black/40 border border-white/10 shrink-0">
            <span className="text-xs text-white/40 uppercase font-bold">Ses</span>
            <span className="text-xl font-bold text-white font-cinzel">{session.number}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-bold text-white truncate">{session.title}</h3>
              {session.isLive && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-500 border border-red-500/30 flex items-center gap-1 animate-pulse">
                  <Radio size={10} />
                  LIVE
                </span>
              )}
              {session.status && session.status !== 'completed' && !session.isLive && (
                <span className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center gap-1 uppercase ${getStatusStyles(session.status)}`}>
                  {session.status}
                </span>
              )}
            </div>

            <p className="text-sm text-white/50 flex items-center gap-1.5">
              <Calendar size={12} />
              {formattedDate}
            </p>
          </div>
        </div>

        <button className={`p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors ${isExpanded ? 'bg-white/10 text-white' : ''}`}>
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="relative p-6 pt-0 border-t border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-200">

          {/* Summary Section */}
          <div className="space-y-2 pt-6">
            <h4 className="text-sm font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
              <ScrollText size={14} />
              Summary
            </h4>
            <div className="bg-black/20 rounded-lg p-4 border border-white/5 text-white/80 leading-relaxed whitespace-pre-wrap">
              <WikiText
                text={session.summary}
                onLinkClick={setViewingEntity}
                getEntity={getByName}
              />
            </div>
          </div>

          {/* Highlights Section */}
          {session.highlights && session.highlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white/40 uppercase tracking-wider flex items-center gap-2">
                Highlights
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {session.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-white/70 bg-white/5 p-2 rounded-md border border-white/5">
                    <span className="text-[rgb(var(--color-primary))] mt-0.5">•</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Encounter Links (DM Only) */}
          {isDM && session.encounterLinks && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-[rgb(var(--color-primary-light))]/60 uppercase tracking-wider flex items-center gap-2">
                <LinkIcon size={14} />
                Linked Encounters
              </h4>
              <div className="flex flex-wrap gap-2">
                {session.encounterLinks.split(',').map((link, index) => {
                  // Strip the internal encounter:// scheme — these are Firestore IDs, not URLs
                  const encounterId = link.trim().replace(/^encounter:\/\//, '');
                  if (!encounterId) return null;
                  return (
                    <span
                      key={index}
                      title={`Encounter ID: ${encounterId}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[rgb(var(--color-primary))/10] border border-[rgb(var(--color-primary))/30] rounded-md text-[rgb(var(--color-primary-light))] text-sm"
                    >
                      <LinkIcon size={12} />
                      Encounter {index + 1}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* DM Notes (DM Only) */}
          {isDM && session.dmNotes && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-amber-400/60 uppercase tracking-wider flex items-center gap-2">
                <EyeOff size={14} />
                DM Notes
              </h4>
              <div className="bg-amber-950/20 rounded-lg p-4 border border-amber-900/40 text-amber-100/80 leading-relaxed whitespace-pre-wrap text-sm italic">
                <WikiText
                  text={session.dmNotes}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          {!isEmbedded && (
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
              {onGoLive && (
                <button
                  className={`btn ${session.isLive ? 'btn-primary animate-pulse' : 'btn-secondary'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoLive();
                  }}
                >
                  {session.isLive ? <Radio size={16} /> : <Play size={16} />}
                  {session.isLive ? 'Resume Live' : 'Go Live'}
                </button>
              )}
              {isDM && (
                <>
                  <button className="btn btn-secondary" onClick={onEdit}>
                    <Edit3 size={16} />
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={onDelete}>
                    <Trash2 size={16} />
                    Delete
                  </button>
                </>
              )}
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
