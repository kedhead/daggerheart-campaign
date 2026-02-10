import { useState } from 'react';
import { ChevronDown, Edit3, Trash2, MapPin, UserCircle, Users, Package, BookOpen, Target, MoreHorizontal, EyeOff, Wand2, Loader2 } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './LoreCard.css';

const TYPE_ICONS = {
  location: MapPin,
  npc: UserCircle,
  faction: Users,
  item: Package,
  history: BookOpen,
  quest: Target,
  other: MoreHorizontal
};

const TYPE_STYLES = {
  location: 'text-blue-400 ring-blue-400/20 bg-blue-400/5',
  npc: 'text-emerald-400 ring-emerald-400/20 bg-emerald-400/5',
  faction: 'text-purple-400 ring-purple-400/20 bg-purple-400/5',
  item: 'text-amber-400 ring-amber-400/20 bg-amber-400/5',
  history: 'text-slate-400 ring-slate-400/20 bg-slate-400/5',
  quest: 'text-red-400 ring-red-400/20 bg-red-400/5',
  other: 'text-slate-500 ring-slate-500/20 bg-slate-500/5'
};

export default function LoreCard({ lore, onEdit, onDelete, onGenerateImage, generatingImage, isDM, campaign, isEmbedded = false, entities }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);

  const loreType = lore.type || lore.category || 'other';
  const Icon = TYPE_ICONS[loreType] || MoreHorizontal;
  const styleClass = TYPE_STYLES[loreType] || TYPE_STYLES.other;

  return (
    <div className={`
      group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl transition-all duration-700 hover:bg-white/[0.06] hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-1
      ${isExpanded ? 'ring-1 ring-white/10 bg-white/[0.08]' : ''}
      ${lore.hidden ? 'opacity-60' : ''}
    `}>
      {/* Cover Image with Deep Gradient */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-950/40 to-black/40 border-b border-white/5">
        {generatingImage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-10">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Visualizing...</span>
          </div>
        ) : lore.coverImage ? (
          <img src={lore.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
            <Icon size={120} className="text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1126] via-[#0d1126]/40 to-transparent" />

        {/* Floating Metadata */}
        <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
          <div className={`flex items-center gap-2 p-1.5 rounded-xl border border-white/10 backdrop-blur-md bg-black/20 ${styleClass}`}>
            <Icon size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{loreType}</span>
          </div>

          {lore.hidden && isDM && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-wider">
              <EyeOff size={10} />
              Incognito
            </div>
          )}
        </div>
      </div>

      <div className="p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-2xl font-black text-white/95 leading-tight group-hover:text-white transition-all tracking-tight italic lowercase">
              {lore.title || 'Untitled'}
            </h3>
            {lore.tags && Array.isArray(lore.tags) && lore.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {lore.tags.filter(tag => tag).map((tag, index) => (
                  <span key={index} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold text-white/30 uppercase tracking-tighter hover:text-white/60 transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className={`p-2 rounded-xl bg-white/5 border border-white/5 text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}`}>
            <ChevronDown size={20} />
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-white/60 prose-p:font-medium prose-strong:text-indigo-400 prose-sm max-w-none font-sans">
              {lore.content ? (
                <WikiText
                  text={lore.content}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              ) : (
                <span className="italic text-white/20">No manuscripts found for this entry.</span>
              )}
            </div>

            {isDM && !isEmbedded && (
              <div className="space-y-3 mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all group/btn"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  >
                    <Edit3 size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                    Edit Fragment
                  </button>
                  <button
                    className="flex items-center justify-center p-3 rounded-2xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white transition-all shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {onGenerateImage && (
                  <button
                    className={`
                      w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-500 group/gen
                      ${generatingImage
                        ? 'bg-indigo-500/20 text-indigo-300 cursor-not-allowed border border-indigo-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/20 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/30 active:scale-95'
                      }
                    `}
                    onClick={(e) => { e.stopPropagation(); onGenerateImage(); }}
                    disabled={generatingImage}
                  >
                    {generatingImage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Wand2 size={14} className="group-hover/gen:rotate-12 transition-transform" />
                    )}
                    <span className="text-xs font-black uppercase tracking-[0.2em]">
                      {generatingImage ? 'Visualizing History...' : 'Generate AI Visual'}
                    </span>
                  </button>
                )}
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
          entities={entities}
        />
      )}
    </div>
  );
}
