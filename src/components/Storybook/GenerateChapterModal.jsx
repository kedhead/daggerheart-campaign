import { useState, useMemo, useEffect } from 'react';
import { Wand2, Sparkles } from 'lucide-react';
import Modal from '../Modal';
import { generateChapter, STORYBOOK_STYLES, DEFAULT_STYLE_KEY } from '../../services/storybookGenerator';
import { sessionNotesText, mentionedEntityIds } from '../../utils/storybookCast';

export default function GenerateChapterModal({
  isOpen,
  onClose,
  campaign,
  campaignId,
  sessions,
  characters,
  npcs,
  adversaries,
  locations,
  lore,
  encounters,
  campaignFrame,
  priorChapters,
  apiKey,
  currentUserId,
  addChapter
}) {
  const defaultStyle = campaign?.storybookStyle || DEFAULT_STYLE_KEY;
  const defaultCustom = campaign?.storybookStyleCustom || '';

  const usedSessionIds = useMemo(
    () => new Set((priorChapters || []).map(c => c.sessionId).filter(Boolean)),
    [priorChapters]
  );

  const completedSessions = useMemo(() => {
    return (sessions || [])
      .filter(s => s.status === 'completed' || s.summary || s.highlights?.length)
      .sort((a, b) => (b.sessionNumber || b.number || 0) - (a.sessionNumber || a.number || 0));
  }, [sessions]);

  const [sessionId, setSessionId] = useState(
    completedSessions.find(s => !usedSessionIds.has(s.id))?.id || completedSessions[0]?.id || ''
  );
  const [includeIllustrations, setIncludeIllustrations] = useState(true);
  const [sceneCount, setSceneCount] = useState(3);
  const [styleKey, setStyleKey] = useState(defaultStyle);
  const [styleCustom, setStyleCustom] = useState(defaultCustom);
  // Default to nano-banana-2 (Gemini 2.5 Flash Image v2) since it accepts the
  // original character portraits as references and preserves likeness.
  const [imageModel, setImageModel] = useState('nano-banana-2');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  // Non-fatal shortfalls (missing illustrations). The chapter still saved, so
  // these are reported without discarding it — the modal stays open so the DM
  // actually sees why the chapter came out with less art than they asked for.
  const [warnings, setWarnings] = useState([]);

  const selectedSession = completedSessions.find(s => s.id === sessionId);

  // ── Cast ───────────────────────────────────────────────────────────────────
  // Only these entities are shown to the chapter writer, and only these can end
  // up in a scene. Without this the writer saw the whole campaign and would
  // happily cast someone the session never mentioned — whose portrait then went
  // to the image model as a reference, so they got drawn.
  const castPool = useMemo(() => ({
    characters: (characters || []).filter(c => c.id && c.name),
    npcs: (npcs || []).filter(n => n.id && n.name),
    adversaries: (adversaries || []).filter(a => a.id && a.name),
  }), [characters, npcs, adversaries]);

  const [castIds, setCastIds] = useState([]);
  const [castOpen, setCastOpen] = useState(false);

  // Re-seed from the notes whenever the session changes. Anyone named in the
  // notes starts ticked; deceased characters never do (mentionedEntityIds).
  useEffect(() => {
    setCastIds(mentionedEntityIds(castPool, sessionNotesText(selectedSession)));
  }, [sessionId, castPool, selectedSession]);

  const toggleCast = (id) => {
    setCastIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const castGroups = [
    { key: 'characters', label: 'Characters', list: castPool.characters },
    { key: 'npcs', label: 'NPCs', list: castPool.npcs },
    { key: 'adversaries', label: 'Adversaries', list: castPool.adversaries },
  ].filter(g => g.list.length > 0);
  const alreadyHasChapter = selectedSession && usedSessionIds.has(selectedSession.id);

  const handleGenerate = async () => {
    if (!selectedSession) return;
    setError(null);
    setWarnings([]);
    setRunning(true);

    try {
      const chapter = await generateChapter({
        campaign,
        session: selectedSession,
        priorChapters: (priorChapters || []).slice(0, 4),
        entities: { characters, npcs, adversaries, locations, lore, sessions, encounters, campaignFrame },
        campaignId,
        apiKey,
        gameSystem: campaign?.gameSystem || 'daggerheart',
        styleKey,
        styleCustom,
        sceneCount,
        castIds,
        includeIllustrations,
        imageModel,
        generatedBy: currentUserId,
        onProgress: setProgress
      });

      await addChapter(chapter);
      // The chapter is saved either way; if art went missing, stay open and say
      // so rather than closing on what looks like a clean success.
      if (chapter.warnings?.length) setWarnings(chapter.warnings);
      else onClose();
    } catch (err) {
      console.error('[storybook] generate failed:', err);
      setError(err.message || 'Generation failed');
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={running ? () => {} : onClose} title="Generate Chapter" size="large">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
            Session
          </label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            disabled={running}
            className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-[color:var(--primary)]"
          >
            {completedSessions.length === 0 && <option value="">No completed sessions found</option>}
            {completedSessions.map(s => (
              <option key={s.id} value={s.id}>
                {usedSessionIds.has(s.id) ? '⚠ ' : ''}
                {s.sessionNumber || s.number ? `S${s.sessionNumber || s.number} — ` : ''}{s.title}
              </option>
            ))}
          </select>
          {alreadyHasChapter && (
            <p className="text-xs text-amber-300">This session already has a chapter. Generating will create a second one.</p>
          )}
        </div>

        {/* Cast — the writer only sees these entities, and only these can be
            drawn into a scene. Seeded from names found in the session notes. */}
        {castGroups.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setCastOpen(o => !o)}
              disabled={running}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/10 text-left disabled:opacity-50"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                Cast · {castIds.length} selected
              </span>
              <span className="text-xs text-white/40">{castOpen ? 'Hide' : 'Edit'}</span>
            </button>
            <p className="text-xs text-white/40">
              Pre-ticked from names in the session notes. Only these can appear in the chapter or its art.
            </p>
            {castIds.length === 0 && (
              <p className="text-xs text-amber-300">
                Nobody selected — scenes will be scenery only, with no characters.
              </p>
            )}
            {castOpen && (
              <div className="max-h-64 overflow-y-auto space-y-3 p-3 rounded-xl bg-black/20 border border-white/10">
                {castGroups.map(group => (
                  <div key={group.key} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                      {group.label}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {group.list.map(e => (
                        <label
                          key={e.id}
                          className="flex items-center gap-2 text-sm text-white/80 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={castIds.includes(e.id)}
                            onChange={() => toggleCast(e.id)}
                            disabled={running}
                          />
                          <span className={e.deceased ? 'opacity-60' : ''}>
                            {e.name}{e.deceased ? ' (fallen)' : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
              Art style
            </label>
            <select
              value={styleKey}
              onChange={(e) => setStyleKey(e.target.value)}
              disabled={running}
              className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-[color:var(--primary)]"
            >
              {STORYBOOK_STYLES.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            {styleKey === 'custom' && (
              <input
                type="text"
                value={styleCustom}
                onChange={(e) => setStyleCustom(e.target.value)}
                disabled={running}
                placeholder="Custom style preamble (e.g. 'Vintage pulp fantasy illustration, gouache, warm sepia tones')"
                className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
              Scene illustrations
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={includeIllustrations}
                  onChange={(e) => setIncludeIllustrations(e.target.checked)}
                  disabled={running}
                />
                Include
              </label>
              <select
                value={sceneCount}
                onChange={(e) => setSceneCount(Number(e.target.value))}
                disabled={!includeIllustrations || running}
                className="p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
              >
                {[2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>{n} scenes</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-white/40">
              {includeIllustrations
                ? 'Each featured character gets a one-time styled portrait (cached for reuse).'
                : 'Text-only chapter — fastest and cheapest.'}
            </p>
          </div>

          {includeIllustrations && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/50">
                Image model
              </label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                disabled={running}
                className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-[color:var(--primary)]"
              >
                <option value="nano-banana-2">Gemini 2.5 Flash Image v2 — uses portraits as references (recommended)</option>
                <option value="nano-banana">Gemini 2.5 Flash Image v1 — uses portraits as references</option>
                <option value="gpt-image-2">OpenAI gpt-image-2 — uses portraits as references</option>
                <option value="gpt-image-1">OpenAI gpt-image-1 — uses portraits as references</option>
                <option value="flux-pro">Flux 1.1 Pro — fast, stylised</option>
              </select>
              <p className="text-[11px] text-white/40">
                {imageModel === 'nano-banana-2'
                  ? 'Passes each character\'s existing portrait to Google\'s newest Gemini Flash Image (v2) via Replicate — best for preserving actual likeness. Requires REPLICATE_API_TOKEN.'
                  : imageModel === 'nano-banana'
                  ? 'Original Gemini 2.5 Flash Image via Replicate — also reference-capable. Use if v2 isn\'t cooperating.'
                  : imageModel === 'gpt-image-2'
                  ? 'OpenAI\'s newest reference-capable image model. Requires a verified OpenAI organisation with image-2 access.'
                  : imageModel === 'gpt-image-1'
                  ? 'Original OpenAI gpt-image-1 with portrait references. Requires a verified OpenAI organisation.'
                  : imageModel === 'flux-pro'
                  ? 'Flux 1.1 Pro via Replicate — stylised but text-only (no reference images).'
                  : ''}
              </p>
            </div>
          )}

        </div>

        {progress && (
          <div
            className="rounded-xl border p-4 space-y-2"
            style={{
              background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
              borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)'
            }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles size={14} className="animate-pulse" />
              {progress.message}
            </div>
            {progress.total > 1 && (
              <div className="h-1.5 rounded-full overflow-hidden bg-black/40">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.round(((progress.current + 1) / progress.total) * 100)}%`,
                    background: 'var(--primary)'
                  }}
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5'
            }}
          >
            {error}
          </div>
        )}

        {warnings.length > 0 && (
          <div
            className="p-3 rounded-lg text-sm space-y-1"
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fcd34d'
            }}
          >
            <p className="font-bold">Chapter saved, but some artwork is missing.</p>
            {warnings.map((w, i) => (
              <p key={i} className="text-xs leading-relaxed">{w}</p>
            ))}
            <p className="text-xs leading-relaxed opacity-80">
              You can regenerate individual scenes from the chapter view.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className="px-4 py-2 rounded-lg text-white/70 font-semibold hover:text-white disabled:opacity-40"
          >
            {warnings.length > 0 ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={running || !sessionId || warnings.length > 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-bold disabled:opacity-40"
            style={{
              background: 'color-mix(in srgb, var(--primary) 28%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 50%, transparent)'
            }}
          >
            <Wand2 size={14} />
            {running ? 'Weaving the tale…' : 'Generate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
