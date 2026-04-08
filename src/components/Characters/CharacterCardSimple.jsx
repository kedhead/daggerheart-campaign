import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit3, Trash2, ExternalLink, EyeOff, Shield, Zap, Sparkles } from 'lucide-react';
import './CharacterCard.css';

export default function CharacterCardSimple({ character, onEdit, onDelete, isDM, canEdit, campaign }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`
      group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-700 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:-translate-y-2
      ${isExpanded ? 'ring-2 ring-white/10 bg-white/[0.07]' : ''}
    `}>
      {/* Heroic Visual Header */}
      <div className="relative h-80 overflow-hidden bg-gradient-to-br from-blue-950/20 to-black/60 border-b border-white/5 group-hover:h-[22rem] transition-all duration-700">
        <div className="absolute inset-0 bg-white/[0.01] flex items-center justify-center">
          <span className="text-[12rem] font-serif font-black text-white/[0.02] select-none italic lowercase transform -rotate-12">{character.name.charAt(0)}</span>
        </div>
        {character.avatarUrl && (
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-[3s] z-10"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1126] via-[#0d1126]/20 to-transparent z-20" />

        {/* Heroic Status Badge */}
        <div className="absolute top-6 left-6 z-30">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md bg-black/40 text-emerald-400 ring-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
            <Sparkles size={14} strokeWidth={3} className="animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Active Hero</span>
          </div>
        </div>

        {/* Player Attribution */}
        <div className="absolute bottom-6 left-8 z-30">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] block mb-1">Player Character</span>
          <span className="text-sm font-bold text-white/60 tracking-widest">{character.playerName || 'Unknown Player'}</span>
        </div>
      </div>

      <div className="p-8 cursor-pointer relative" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h3 className="text-4xl font-serif font-black text-white/95 leading-none italic lowercase tracking-tighter">
              {character.name}
            </h3>
            <div className="flex flex-wrap gap-3 pt-3">
              {(character.class || character.ancestry) && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.02] text-[10px] font-bold text-white/30 uppercase tracking-widest">
                  <Shield size={10} className="text-blue-400/50" />
                  {character.class} {character.ancestry && `• ${character.ancestry}`}
                </div>
              )}
              {character.demiplaneLink && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">
                  <Zap size={10} />
                  Demiplane Sheet
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-6 duration-700">
            {character.demiplaneLink && (
              <a
                href={character.demiplaneLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link block relative p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all duration-500 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover/link:scale-110 transition-transform">
                      <ExternalLink size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.3em] block mb-1">Character Sheet</span>
                      <span className="text-sm font-bold text-emerald-400 tracking-wide uppercase">Open on Demiplane</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-emerald-500/40 group-hover/link:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/[0.02] to-emerald-500/0 -translate-x-full group-hover/link:translate-x-full transition-transform duration-1000" />
              </a>
            )}

            {character.playerNotes && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.3em] font-sans">Character Notes</h4>
                <div className="prose prose-invert prose-sm font-sans font-medium text-white/50 leading-relaxed max-w-none">
                  <p>{character.playerNotes}</p>
                </div>
              </div>
            )}

            {character.backstory && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.3em] font-sans">Backstory</h4>
                <div className="prose prose-invert prose-sm font-sans font-medium text-white/40 leading-relaxed max-w-none italic">
                  <p>{character.backstory}</p>
                </div>
              </div>
            )}

            {isDM && character.dmNotes && (
              <div className="space-y-3 p-5 rounded-2xl bg-white/[0.02] border border-white/5 border-dashed">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-rose-400/60 uppercase tracking-[0.3em] font-sans">
                  <EyeOff size={10} />
                  DM Notes
                </h4>
                <div className="prose prose-invert prose-sm font-sans font-medium text-white/30 leading-relaxed max-w-none">
                  <p>{character.dmNotes}</p>
                </div>
              </div>
            )}

            {canEdit && (
              <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all group/btn"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                  <Edit3 size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                  Edit Character
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
    </div>
  );
}
