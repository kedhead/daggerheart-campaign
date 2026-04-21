import { useState } from 'react';
import { ChevronDown, Edit3, Trash2, MapPin, Briefcase, Heart, Skull, Minus, Download, User } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import InlineEdit from '../InlineEdit/InlineEdit';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import { useToast } from '../../contexts/ToastContext';

async function downloadPortrait(url, name) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-portrait.png`;
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error('Failed to download portrait:', err);
    alert('Failed to download portrait. Try right-clicking the image and saving it manually.');
  }
}

export default function NPCCard({ npc, onEdit, onDelete, onUpdate, isDM, campaign, isEmbedded = false, entities }) {
  const { success, error } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);

  const getRelationshipStyles = (relationship) => {
    switch (relationship) {
      case 'ally': return 'text-emerald-400 ring-emerald-400/20 bg-emerald-400/5 shadow-[0_0_15px_rgba(52,211,153,0.1)]';
      case 'enemy': return 'text-rose-400 ring-rose-400/20 bg-rose-400/5 shadow-[0_0_15px_rgba(251,113,133,0.1)]';
      default: return 'text-slate-400 ring-slate-400/20 bg-slate-400/5';
    }
  };

  return (
    <div className={`
      group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-700 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:-translate-y-2
      ${isExpanded ? 'ring-2 ring-white/10 bg-white/[0.07]' : ''}
    `}>
      {/* High Impact Visual Header */}
      <div className="relative h-80 overflow-hidden bg-gradient-to-br from-indigo-950/20 to-black/60 border-b border-white/5 group-hover:h-[22rem] transition-all duration-700">
        <div className="absolute inset-0 bg-white/[0.02] flex items-center justify-center">
          <span className="text-9xl font-serif font-black text-white/[0.02] select-none italic lowercase transform -rotate-12">{npc.name.charAt(0)}</span>
        </div>
        {npc.avatarUrl && (
          <img src={npc.avatarUrl} alt={npc.name} className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-[3s]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1126] via-[#0d1126]/20 to-transparent" />

        {/* Tactical ID Badge */}
        <div className="absolute top-6 left-6 z-20">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md bg-black/40 ${getRelationshipStyles(npc.relationship)}`}>
            {npc.relationship === 'ally' ? <Heart size={14} strokeWidth={3} className="animate-pulse" /> : npc.relationship === 'enemy' ? <Skull size={14} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{npc.relationship || 'Neutral'}</span>
          </div>
        </div>

        {/* Portrait Download Button */}
        {npc.avatarUrl && (
          <button
            className="absolute top-6 right-6 z-20 p-2 rounded-xl border border-white/10 backdrop-blur-md bg-black/40 text-white/40 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            title="Download portrait"
            onClick={(e) => { e.stopPropagation(); downloadPortrait(npc.avatarUrl, npc.name); }}
          >
            <Download size={14} />
          </button>
        )}
      </div>

      <div className="p-8 cursor-pointer relative" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <InlineEdit
              value={npc.name}
              onSave={async (newName) => {
                if (onUpdate) {
                  try {
                    await onUpdate(npc.id, { ...npc, name: newName });
                    success('Identity Re-scanned');
                  } catch (e) {
                    error('Scan Failed');
                    throw e;
                  }
                }
              }}
              disabled={!isDM || isEmbedded || !onUpdate}
              as="h3"
              className="text-3xl font-serif font-black text-white/95 leading-none italic lowercase tracking-tighter"
            />
            <div className="flex flex-wrap gap-3 pt-2">
              {npc.species && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.02] text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  <User size={10} className="text-amber-400/50" />
                  {npc.species}
                </div>
              )}
              {npc.occupation && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.02] text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  <Briefcase size={10} className="text-indigo-400/50" />
                  {npc.occupation}
                </div>
              )}
              {npc.location && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.02] text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  <MapPin size={10} className="text-rose-400/50" />
                  <WikiText text={npc.location} onLinkClick={setViewingEntity} getEntity={getByName} />
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-6 duration-700">
            {npc.description && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.3em] font-sans">Observations</h4>
                <div className="prose prose-invert prose-sm font-sans font-medium text-white/60 leading-relaxed max-w-none">
                  <WikiText
                    text={npc.description}
                    onLinkClick={setViewingEntity}
                    getEntity={getByName}
                  />
                </div>
              </div>
            )}

            {npc.notes && (
              <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 italic">
                <h4 className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.3em] font-sans not-italic">Encrypted Intel</h4>
                <div className="prose prose-invert prose-sm font-sans font-medium text-white/50 leading-relaxed max-w-none">
                  <WikiText
                    text={npc.notes}
                    onLinkClick={setViewingEntity}
                    getEntity={getByName}
                  />
                </div>
              </div>
            )}

            {npc.firstMet && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.3em] font-sans">First Encounter</h4>
                <div className="prose prose-invert prose-sm font-sans font-medium text-white/50 leading-relaxed max-w-none">
                  <WikiText
                    text={npc.firstMet}
                    onLinkClick={setViewingEntity}
                    getEntity={getByName}
                  />
                </div>
              </div>
            )}

            {isDM && !isEmbedded && (
              <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all group/btn"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                  <Edit3 size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                  Re-Profile
                </button>
                <button
                  className="flex items-center justify-center p-3 rounded-2xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white transition-all shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        <div className={`absolute top-8 right-8 p-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-white/10 group-hover:text-white group-hover:bg-white/10 transition-all duration-500 ${isExpanded ? 'rotate-180 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' : ''}`}>
          <ChevronDown size={20} />
        </div>
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
