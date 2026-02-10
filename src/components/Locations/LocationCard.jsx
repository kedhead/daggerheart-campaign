import { useState } from 'react';
import { ChevronDown, Edit3, Trash2, MapPin, Map, Loader2 } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import InlineEdit from '../InlineEdit/InlineEdit';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import { useToast } from '../../contexts/ToastContext';

export default function LocationCard({ location, onEdit, onDelete, onUpdate, onGenerateMap, isDM, generatingMapFor, campaign, isEmbedded = false, entities }) {
  const { success, error } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);
  const isGeneratingMap = generatingMapFor === location.id;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'city': return 'text-blue-400 ring-blue-400/20 bg-blue-400/5 shadow-[0_0_15px_rgba(96,165,250,0.1)]';
      case 'town': return 'text-emerald-400 ring-emerald-400/20 bg-emerald-400/5';
      case 'village': return 'text-slate-400 ring-slate-400/20 bg-slate-400/5';
      case 'dungeon': return 'text-rose-400 ring-rose-400/20 bg-rose-400/5 shadow-[0_0_15px_rgba(251,113,133,0.1)]';
      case 'wilderness': return 'text-amber-400 ring-amber-400/20 bg-amber-400/5';
      case 'landmark': return 'text-indigo-400 ring-indigo-400/20 bg-indigo-400/5 shadow-[0_0_15px_rgba(129,140,248,0.1)]';
      default: return 'text-slate-500 ring-slate-500/20 bg-slate-500/5';
    }
  };

  return (
    <div className={`
      group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-700 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:-translate-y-2
      ${isExpanded ? 'ring-2 ring-white/10 bg-white/[0.07]' : ''}
    `}>
      {/* High-Impact Photographic Background or Map Preview */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-indigo-950/20 to-black/60 border-b border-white/5">
        {location.mapUrl ? (
          <img src={location.mapUrl} alt={`Map of ${location.name}`} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-[4s]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02]">
            <MapPin size={80} className="text-white/[0.03] animate-pulse" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1126] via-[#0d1126]/40 to-transparent" />

        {/* Floating Sector ID */}
        <div className="absolute top-6 left-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-xl bg-black/40 ${getTypeStyles(location.type)}`}>
            <MapPin size={12} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{location.type || 'Sector'}</span>
          </div>
        </div>

        {/* Region Overprint */}
        {location.region && (
          <div className="absolute bottom-6 left-8">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] block mb-1">Regional Sector</span>
            <span className="text-sm font-bold text-white/60 tracking-widest">{location.region}</span>
          </div>
        )}
      </div>

      <div className="p-8 cursor-pointer relative" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="space-y-4">
          <InlineEdit
            value={location.name}
            onSave={async (newName) => {
              if (onUpdate) {
                try {
                  await onUpdate(location.id, { ...location, name: newName });
                  success('Map Coordinate Updated');
                } catch (e) {
                  error('Update Failed');
                  throw e;
                }
              }
            }}
            disabled={!isDM || isEmbedded || !onUpdate}
            as="h3"
            className="text-4xl font-serif font-black text-white/95 tracking-tighter italic lowercase leading-none"
          />

          {isExpanded && (
            <div className="space-y-10 mt-10 animate-in fade-in slide-in-from-top-6 duration-700">
              {location.description && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.3em] font-sans">Topography/Atmosphere</h4>
                  <div className="prose prose-invert prose-sm font-sans font-medium text-white/60 leading-relaxed max-w-none">
                    <WikiText
                      text={location.description}
                      onLinkClick={setViewingEntity}
                      getEntity={getByName}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {location.notableFeatures && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.3em] font-sans">Landmarks</h4>
                    <div className="text-xs text-white/50 leading-relaxed font-sans font-medium">
                      <WikiText
                        text={location.notableFeatures}
                        onLinkClick={setViewingEntity}
                        getEntity={getByName}
                      />
                    </div>
                  </div>
                )}
                {location.inhabitants && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.3em] font-sans">Population</h4>
                    <div className="text-xs text-white/50 leading-relaxed font-sans font-medium">
                      <WikiText
                        text={location.inhabitants}
                        onLinkClick={setViewingEntity}
                        getEntity={getByName}
                      />
                    </div>
                  </div>
                )}
              </div>

              {location.secrets && isDM && (
                <div className="space-y-3 p-6 rounded-3xl bg-red-500/5 border border-red-500/10 border-dashed">
                  <h4 className="text-[10px] font-black text-red-400/60 uppercase tracking-[0.3em] font-sans">Restricted Intel</h4>
                  <div className="prose prose-invert prose-sm italic text-white/40 leading-relaxed">
                    <WikiText
                      text={location.secrets}
                      onLinkClick={setViewingEntity}
                      getEntity={getByName}
                    />
                  </div>
                </div>
              )}

              {isDM && !isEmbedded && (
                <div className="flex flex-wrap items-center gap-3 pt-8 border-t border-white/5">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all group/btn"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  >
                    <Edit3 size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                    Re-Map
                  </button>
                  {onGenerateMap && (
                    <button
                      className="flex-[1.5] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                      onClick={(e) => { e.stopPropagation(); onGenerateMap(location); }}
                      disabled={isGeneratingMap}
                    >
                      {isGeneratingMap ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Rendering Atlas...
                        </>
                      ) : (
                        <>
                          <Map size={16} />
                          {location.mapUrl ? 'Regenerate Atlas' : 'Generate Atlas'}
                        </>
                      )}
                    </button>
                  )}
                  <button
                    className="flex items-center justify-center p-4 rounded-2xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white transition-all shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`absolute top-8 right-8 p-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-white/10 group-hover:text-white group-hover:bg-white/10 transition-all duration-500 ${isExpanded ? 'rotate-180 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' : ''}`}>
          <ChevronDown size={24} />
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
