import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Save, Plus, Monitor, Radio, Volume2, Wand2, Loader2, Sparkles, CloudRain, Film, FolderOpen,
  Trash2, RotateCcw, Check, MapPin, Send, History, AlertTriangle, X
} from 'lucide-react';
import { useBattleMapStore } from '../../stores/battleMapStore';
import { useBattleMap } from '../../hooks/useBattleMap';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { generateAiMap, refineAiMap, mapPromptTemplates } from '../../services/battleMapGenerator';
import MapAnimationOverlay, { AVAILABLE_EFFECTS } from './Canvas/MapAnimationOverlay';
import AnimatedMapLibrary from './Panels/AnimatedMapLibrary';
import DMSoundboard from '../Soundboard/DMSoundboard';

/* ─────────────────────────────────────────────────────────────────────────────
   Battle Map Studio — an AI map maker.

   Describe a place, pick a look, and GPT Image 2.5 paints a 2560x1440 map
   for the battle map monitor; refine it a change at a time; dress it with
   weather; show it to the players. The manual canvas tools (tokens, fog,
   grid, drawing, asset placement) are gone — this is for making the scene.
   ──────────────────────────────────────────────────────────────────────────── */

const STYLES = [
  { key: 'painted', label: 'Painted' },
  { key: 'realistic', label: 'Realistic' },
  { key: 'inked', label: 'Inked' },
  { key: 'grim', label: 'Grim' },
  { key: 'storybook', label: 'Storybook' }
];

const LIGHTING = [
  { key: 'day', label: 'Daylight' },
  { key: 'golden', label: 'Golden hour' },
  { key: 'overcast', label: 'Overcast' },
  { key: 'night', label: 'Moonlit night' },
  { key: 'torchlit', label: 'Torchlit' },
  { key: 'eerie', label: 'Eerie glow' }
];

const QUALITY = [
  { key: 'standard', label: 'Standard', hint: 'Faster' },
  { key: 'high', label: 'High', hint: 'Best detail' },
  { key: 'premium', label: 'Premium', hint: 'Slowest, finest' }
];

const qualityParams = (q) => q === 'standard' ? { quality: 'medium', premium: false }
  : q === 'premium' ? { quality: 'high', premium: true }
  : { quality: 'high', premium: false };

function Chip({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active
        ? 'bg-indigo-500/20 border-indigo-400/60 text-indigo-200'
        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'}`}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">{children}</div>;
}

export default function BattleMapStudio({ campaign, isDM, locations = [] }) {
  const confirm = useConfirm();
  const toast = useToast();
  const campaignId = campaign?.id;

  const {
    mapId, mapName, mapImage, isDirty,
    animationEffects, animationIntensity, animationEnabled,
    setMapName, setMapImage, resetMap, loadMapState, getSerializableState, markClean,
    toggleAnimationEffect, setAnimationIntensity, toggleAnimationEnabled, clearAnimationEffects
  } = useBattleMapStore();
  const { savedMaps, saveMap, loadMap, deleteMap, broadcastToPlayers } = useBattleMap(campaignId);

  // What to make. Pre-filled from the open map, so its recipe can be tweaked.
  const [description, setDescription] = useState(mapImage?.description || '');
  const [style, setStyle] = useState(mapImage?.style || 'painted');
  const [lighting, setLighting] = useState(mapImage?.lighting || 'day');
  const [quality, setQuality] = useState('high');
  const [ideaGroup, setIdeaGroup] = useState('dungeon');
  const [refineText, setRefineText] = useState('');
  const [job, setJob] = useState(null); // { kind: 'generate'|'refine', started } while painting
  const [error, setError] = useState(null);
  const [panel, setPanel] = useState('weather');
  const [isLive, setIsLive] = useState(false);
  const [sentAt, setSentAt] = useState(0);
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [, tick] = useState(0);

  // A ticking counter, so a long paint doesn't look frozen.
  useEffect(() => {
    if (!job) return;
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [job]);

  // Live mode keeps the monitor in step with every change.
  useEffect(() => {
    if (!isLive || !mapImage) return;
    const t = setTimeout(() => { broadcastToPlayers().catch(() => {}); }, 400);
    return () => clearTimeout(t);
  }, [isLive, mapImage, animationEffects, animationIntensity, animationEnabled, broadcastToPlayers]);

  const versions = mapImage?.history || [];
  const busy = !!job;

  const applyResult = useCallback((result, extra) => {
    const current = useBattleMapStore.getState().mapImage;
    // Keep earlier versions so a refine that goes wrong can be undone.
    const history = current?.url && current.generated
      ? [...(current.history || []), { url: current.url, width: current.width, height: current.height, label: current.label || 'Earlier version' }].slice(-12)
      : [];
    setMapImage({
      url: result.url,
      width: result.width,
      height: result.height,
      generated: true,
      model: result.model,
      description,
      style,
      lighting,
      history,
      ...extra
    });
  }, [setMapImage, description, style, lighting]);

  const handleGenerate = async () => {
    if (!description.trim() || busy) return;
    if (!campaignId) { setError('Open a campaign first.'); return; }
    setError(null);
    setJob({ kind: 'generate', started: Date.now() });
    try {
      const result = await generateAiMap({ campaignId, description: description.trim(), style, lighting, ...qualityParams(quality) });
      applyResult(result, { label: 'Original' });
      // Name it after the place: "Emberfall Docks (harbour): smoky…" → "Emberfall Docks".
      if (!mapName || mapName === 'Untitled Map') setMapName(description.trim().split(/[:,.(—–]/)[0].trim().slice(0, 40) || 'AI map');
    } catch (err) {
      setError(err.message);
    } finally {
      setJob(null);
    }
  };

  const handleRefine = async () => {
    if (!refineText.trim() || !mapImage?.url || busy) return;
    setError(null);
    setJob({ kind: 'refine', started: Date.now() });
    try {
      const result = await refineAiMap({ campaignId, imageUrl: mapImage.url, instruction: refineText.trim(), ...qualityParams(quality) });
      applyResult(result, { label: refineText.trim().slice(0, 40) });
      setRefineText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setJob(null);
    }
  };

  const restoreVersion = (index) => {
    const v = versions[index];
    if (!v || !mapImage) return;
    // Swap: the chosen version becomes current, the current one joins history.
    const rest = versions.filter((_, i) => i !== index);
    setMapImage({
      ...mapImage,
      url: v.url, width: v.width, height: v.height, label: v.label,
      history: [...rest, { url: mapImage.url, width: mapImage.width, height: mapImage.height, label: mapImage.label || 'Later version' }]
    });
  };

  const handleSave = async () => {
    if (!mapImage) return;
    try {
      await saveMap(mapId, getSerializableState());
      markClean();
      toast.success('Map saved');
    } catch (err) {
      toast.error(`Could not save map: ${err?.message || 'unknown error'}`);
    }
  };

  const handleNew = async () => {
    if (isDirty && !await confirm({ message: 'You have unsaved changes. Start a new map anyway?', confirmLabel: 'Discard changes', danger: true })) return;
    resetMap();
    setDescription('');
    setError(null);
  };

  const handleLoad = async (id) => {
    if (isDirty && !await confirm({ message: 'You have unsaved changes. Open a different map anyway?', confirmLabel: 'Discard changes', danger: true })) return;
    try {
      const data = await loadMap(id);
      if (!data) { toast.error('That map could not be found.'); return; }
      const { id: _id, ...state } = data;
      loadMapState({ mapId: id, ...state });
      setDescription(state.mapImage?.description || '');
      if (state.mapImage?.style) setStyle(state.mapImage.style);
      if (state.mapImage?.lighting) setLighting(state.mapImage.lighting);
    } catch (err) {
      toast.error(`Could not open map: ${err?.message || 'unknown error'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!await confirm({ message: 'Delete this map?', confirmLabel: 'Delete', danger: true })) return;
    await deleteMap(id);
    if (mapId === id) resetMap();
  };

  const handleSend = async () => {
    try {
      await broadcastToPlayers();
      setSentAt(Date.now());
      setTimeout(() => setSentAt(0), 2000);
    } catch (err) {
      toast.error(`Could not show the map: ${err?.message || 'unknown error'}`);
    }
  };

  const openMonitor = useCallback(() => {
    window.open(
      `${window.location.origin}?view=battleMapDisplay&campaign=${campaignId}`,
      'BattleMapDisplay',
      'width=2560,height=1440,menubar=no,toolbar=no,location=no,status=no'
    );
  }, [campaignId]);

  // Ctrl/Cmd+S saves; Ctrl/Cmd+Enter paints.
  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const placeOptions = useMemo(
    () => (locations || []).filter(l => l?.name && !l.hidden).slice(0, 80),
    [locations]
  );

  if (!isDM) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full text-zinc-400">
        <h2 className="text-xl font-bold mb-2">Battle Map Studio</h2>
        <p>This feature is only available to DMs</p>
      </div>
    );
  }

  const elapsed = job ? Math.round((Date.now() - job.started) / 1000) : 0;
  const groupedEffects = AVAILABLE_EFFECTS.reduce((acc, e) => { (acc[e.category] ||= []).push(e); return acc; }, {});

  return (
    // Desktop: three fixed columns that scroll on their own. Phones: one column, and the page scrolls.
    <div className="flex flex-col h-full min-h-0 overflow-y-auto lg:overflow-hidden bg-zinc-950 text-zinc-200">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Wand2 size={18} className="text-indigo-400 shrink-0" />
          <input
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-400 outline-none text-lg font-semibold min-w-0 flex-1 max-w-md"
            aria-label="Map name"
          />
          {isDirty && <span className="text-amber-400 text-xs font-medium px-2 py-0.5 bg-amber-500/10 rounded-full shrink-0">Unsaved</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md" onClick={handleNew} title="New map"><Plus size={18} /></button>
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md" onClick={() => setShowSoundboard(true)} title="Soundboard"><Volume2 size={18} /></button>
          <button className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md flex items-center gap-2" onClick={openMonitor} title="Open the battle map monitor window">
            <Monitor size={16} /> Open monitor
          </button>
          <button
            className={`px-3 py-2 text-sm rounded-md flex items-center gap-2 border ${isLive ? 'bg-red-500/15 border-red-500/50 text-red-300' : 'border-zinc-700 text-zinc-300 hover:text-white'}`}
            onClick={() => setIsLive(v => !v)}
            disabled={!mapImage}
            title="Keep the monitor in sync with every change"
          >
            <Radio size={16} className={isLive ? 'animate-pulse' : ''} /> {isLive ? 'Live' : 'Go live'}
          </button>
          <button className="px-3 py-2 text-sm rounded-md flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40" onClick={handleSend} disabled={!mapImage}>
            {sentAt ? <Check size={16} className="text-emerald-400" /> : <Send size={16} />} Show on monitor
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-40" onClick={handleSave} disabled={!mapImage}>
            <Save size={16} /> Save
          </button>
        </div>
      </header>

      <div className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_300px] xl:grid-cols-[380px_minmax(0,1fr)_320px]">
        {/* ── Create ─────────────────────────────────────────────────── */}
        <aside className="order-2 lg:order-1 lg:border-r border-zinc-800 lg:overflow-y-auto p-4 space-y-5 bg-zinc-900/40">
          <div>
            <SectionLabel>Describe the map</SectionLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleGenerate(); }}
              rows={5}
              placeholder="A ruined chapel half-sunk in a swamp: broken pews, a collapsed bell tower, a dry altar on a raised dais, reeds and black water all around…"
              className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-700 focus:border-indigo-400 outline-none text-sm leading-relaxed resize-y"
            />
            <p className="text-[11px] text-zinc-500 mt-1">The more you describe (layout, landmarks, cover, hazards), the better the map.</p>
          </div>

          {placeOptions.length > 0 && (
            <div>
              <SectionLabel>Start from a place in your campaign</SectionLabel>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <select
                  value=""
                  onChange={(e) => {
                    const loc = placeOptions.find(l => l.id === e.target.value);
                    if (loc) setDescription(`${loc.name}${loc.type ? ` (${loc.type})` : ''}: ${(loc.description || '').replace(/\[\[([^\]]+)\]\]/g, '$1').slice(0, 700)}`);
                  }}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
                >
                  <option value="">Choose a location…</option>
                  {placeOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <SectionLabel>Quick ideas</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {Object.entries(mapPromptTemplates).map(([key, g]) => (
                <Chip key={key} active={ideaGroup === key} onClick={() => setIdeaGroup(key)}>{g.label}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mapPromptTemplates[ideaGroup]?.templates.map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setDescription(t.prompt)}
                  className="px-2.5 py-1 rounded-md text-xs bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1"
                >
                  <Sparkles size={11} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Style</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map(s => <Chip key={s.key} active={style === s.key} onClick={() => setStyle(s.key)}>{s.label}</Chip>)}
            </div>
          </div>

          <div>
            <SectionLabel>Lighting</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {LIGHTING.map(l => <Chip key={l.key} active={lighting === l.key} onClick={() => setLighting(l.key)}>{l.label}</Chip>)}
            </div>
          </div>

          <div>
            <SectionLabel>Quality</SectionLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {QUALITY.map(q => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => setQuality(q.key)}
                  className={`px-2 py-2 rounded-lg border text-left ${quality === q.key ? 'border-indigo-400/70 bg-indigo-500/15' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'}`}
                >
                  <div className="text-xs font-semibold">{q.label}</div>
                  <div className="text-[10px] text-zinc-500">{q.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy || !description.trim()}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2"
          >
            {job?.kind === 'generate' ? <><Loader2 size={18} className="animate-spin" /> Painting your map… {elapsed}s</> : <><Wand2 size={18} /> {mapImage?.generated ? 'Paint a new map' : 'Paint the map'}</>}
          </button>
          <p className="text-[11px] text-zinc-500 text-center -mt-3">2560 × 1440, made for a 16:9 monitor · usually 20–50 seconds</p>
        </aside>

        {/* ── Stage ──────────────────────────────────────────────────── */}
        <main className="order-1 lg:order-2 lg:min-h-0 flex flex-col p-4 gap-3 lg:overflow-y-auto">
          {/* 16:9, like the monitor, so what you see is what the players see. */}
          <div className="relative w-full aspect-video max-h-[calc(100vh-240px)] mx-auto rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl" style={{ maxWidth: 'calc((100vh - 240px) * 16 / 9)' }}>
            {mapImage?.url && !mapImage.isVideo && (
              <img src={mapImage.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {mapImage?.isVideo && (
              <video src={mapImage.url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
            )}
            <MapAnimationOverlay effects={animationEffects} intensity={animationIntensity} enabled={animationEnabled} />
            {!mapImage && !busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                <Wand2 size={40} className="mb-3 text-zinc-600" />
                <p className="text-lg text-zinc-300 font-medium">Describe a place and paint it</p>
                <p className="text-sm max-w-md mt-1">Or open one from the Animated or My maps tabs.</p>
              </div>
            )}
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
                <Loader2 size={36} className="animate-spin text-indigo-400 mb-3" />
                <p className="text-zinc-200 font-medium">{job.kind === 'refine' ? 'Repainting…' : 'Painting your map…'} {elapsed}s</p>
                <p className="text-xs text-zinc-500 mt-1">High-resolution maps take a little while</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm max-w-4xl mx-auto w-full">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}

          {mapImage?.generated && (
            <div className="max-w-4xl mx-auto w-full space-y-3">
              <div className="flex gap-2">
                <input
                  value={refineText}
                  onChange={(e) => setRefineText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRefine(); }}
                  placeholder="Change something: add a rope bridge over the chasm, make it night, flood the lower room…"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-indigo-400 outline-none text-sm"
                  disabled={busy}
                />
                <button
                  onClick={handleRefine}
                  disabled={busy || !refineText.trim()}
                  className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-sm font-medium flex items-center gap-2"
                >
                  {job?.kind === 'refine' ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Refine
                </button>
              </div>
              {versions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5"><History size={12} /> Earlier versions</div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {versions.map((v, i) => (
                      <button key={v.url} onClick={() => restoreVersion(i)} title={`Go back to: ${v.label}`} className="group relative shrink-0 w-32 aspect-video rounded-md overflow-hidden border border-zinc-700 hover:border-indigo-400">
                        <img src={v.url} alt="" className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 px-1.5 py-0.5 text-[10px] bg-black/70 truncate text-left">{v.label}</span>
                        <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50"><RotateCcw size={16} /></span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── Weather, animated maps, saved maps ─────────────────────── */}
        <aside className="order-3 lg:border-l border-t lg:border-t-0 border-zinc-800 lg:min-h-0 flex flex-col bg-zinc-900/40">
          <div className="flex p-1 gap-1 border-b border-zinc-800 shrink-0">
            {[
              { id: 'weather', label: 'Weather', Icon: CloudRain },
              { id: 'animated', label: 'Animated', Icon: Film },
              { id: 'maps', label: 'My maps', Icon: FolderOpen }
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setPanel(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium ${panel === id ? 'bg-zinc-800 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 lg:overflow-y-auto p-4">
            {panel === 'weather' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer">
                  <span className="text-sm font-medium">{animationEnabled ? 'Effects on' : 'Effects off'}</span>
                  <input type="checkbox" checked={animationEnabled} onChange={toggleAnimationEnabled} className="w-5 h-5 accent-indigo-500" />
                </label>
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1"><span>Intensity</span><span>{Math.round(animationIntensity * 100)}%</span></div>
                  <input type="range" min="0.2" max="2" step="0.1" value={animationIntensity} onChange={(e) => setAnimationIntensity(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
                </div>
                {Object.entries(groupedEffects).map(([cat, list]) => (
                  <div key={cat}>
                    <SectionLabel>{cat}</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map(e => (
                        <Chip
                          key={e.id}
                          active={animationEffects.includes(e.id)}
                          onClick={() => {
                            toggleAnimationEffect(e.id);
                            if (!animationEnabled) toggleAnimationEnabled();
                          }}
                        >
                          {e.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
                {animationEffects.length > 0 && (
                  <button onClick={clearAnimationEffects} className="text-xs text-zinc-500 hover:text-zinc-300 underline">Clear all effects</button>
                )}
              </div>
            )}

            {panel === 'animated' && <AnimatedMapLibrary />}

            {panel === 'maps' && (
              <div className="grid grid-cols-2 gap-2">
                {savedMaps.length === 0 && <p className="col-span-2 text-sm text-zinc-500">No saved maps yet. Paint one and press Save.</p>}
                {savedMaps.map(m => (
                  <div key={m.id} className={`group relative rounded-lg overflow-hidden border ${m.id === mapId ? 'border-indigo-400' : 'border-zinc-800 hover:border-zinc-600'}`}>
                    <button onClick={() => handleLoad(m.id)} className="block w-full text-left">
                      <div className="aspect-video bg-zinc-800">
                        {m.mapImage?.url && !m.mapImage.isVideo && <img src={m.mapImage.url} alt="" loading="lazy" className="w-full h-full object-cover" />}
                        {m.mapImage?.isVideo && <div className="w-full h-full flex items-center justify-center text-zinc-500"><Film size={20} /></div>}
                      </div>
                      <div className="px-2 py-1.5 text-xs truncate">{m.mapName || 'Untitled'}</div>
                    </button>
                    <button onClick={() => handleDelete(m.id)} title="Delete map" className="absolute top-1 right-1 p-1 rounded bg-black/60 text-zinc-300 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {showSoundboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSoundboard(false)}>
          <div className="relative max-w-3xl w-full max-h-[85vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowSoundboard(false)} className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:text-white" aria-label="Close soundboard">
              <X size={16} />
            </button>
            <DMSoundboard campaignId={campaignId} />
          </div>
        </div>
      )}
    </div>
  );
}
