import { useState } from 'react';
import { ArrowLeft, Save, Eye, Trash2, RefreshCw, Image as ImageIcon, Users, FileText, Wand2 } from 'lucide-react';
import MediaUploader from './MediaUploader';
import { regenerateScene, STORYBOOK_STYLES, DEFAULT_STYLE_KEY } from '../../services/storybookGenerator';
import { stripAppendedClauses } from '../../utils/storybookPrompt';
import { currentLook, lookForScene } from '../../utils/characterState';
import { useNotify } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const TABS = [
  { id: 'prose', label: 'Prose', icon: FileText },
  { id: 'scenes', label: 'Scenes', icon: ImageIcon },
  { id: 'spotlights', label: 'Spotlights', icon: Users },
  { id: 'media', label: 'Media', icon: ImageIcon }
];

export default function ChapterEditor({
  chapter,
  campaignId,
  campaign,
  characters,
  npcs,
  adversaries,
  storybook,
  apiKey,
  onBack,
  onView
}) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('prose');
  const [title, setTitle] = useState(chapter.title || '');
  const [prose, setProse] = useState(chapter.prose || '');
  const [saving, setSaving] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);

  // Per-scene editable prompts. We keep edits in local state and only persist
  // them on Regenerate or explicit Save, so a stray keystroke doesn't write
  // to Firestore on every character.
  const [editedPrompts, setEditedPrompts] = useState({});
  // Image model used for any in-editor regeneration. Defaults to nano-banana-2
  // (Gemini 2.5 Flash Image v2) — reference-capable and the freshest model.
  const [regenModel, setRegenModel] = useState('nano-banana-2');

  // The chapter keeps the style it was drawn in, so redraws match its other
  // scenes — but that also locked in a wrong style for good. The picker on the
  // Scenes tab changes it, and saves it to the chapter so later redraws agree.
  const [styleKey, setStyleKey] = useState(chapter.styleKey || campaign?.storybookStyle || DEFAULT_STYLE_KEY);
  const [styleCustom, setStyleCustom] = useState(chapter.styleCustom || campaign?.storybookStyleCustom || '');
  const campaignStyleKey = campaign?.storybookStyle || DEFAULT_STYLE_KEY;
  const campaignStyleCustom = campaign?.storybookStyleCustom || '';
  const matchesCampaignStyle = styleKey === campaignStyleKey
    && (styleKey !== 'custom' || styleCustom === campaignStyleCustom);
  const [redrawProgress, setRedrawProgress] = useState(null); // { done, total } while redrawing every scene
  const gameSystem = campaign?.gameSystem || 'daggerheart';

  const isDirty = title !== chapter.title || prose !== chapter.prose;

  const handleSave = async () => {
    setSaving(true);
    try {
      await storybook.updateChapter(chapter.id, { title, prose });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (isDirty) await storybook.updateChapter(chapter.id, { title, prose });
    await storybook.publishChapter(chapter.id);
    onView();
  };

  const handleDelete = async () => {
    if (!await confirm({ message: 'Delete this chapter? This cannot be undone.', confirmLabel: 'Delete', danger: true })) return;
    await storybook.deleteChapter(chapter.id);
    onBack();
  };

  const handleSceneCaptionChange = async (sceneId, caption) => {
    const nextScenes = (chapter.scenes || []).map(s => s.id === sceneId ? { ...s, caption } : s);
    await storybook.updateChapter(chapter.id, { scenes: nextScenes });
  };

  const handleSceneDelete = async (sceneId) => {
    if (!await confirm({ message: 'Remove this scene illustration?', confirmLabel: 'Remove', danger: true })) return;
    const nextScenes = (chapter.scenes || []).filter(s => s.id !== sceneId);
    await storybook.updateChapter(chapter.id, { scenes: nextScenes });
  };

  // Chapters generated before the composed prompt stopped being persisted carry
  // the appended clauses in their stored text; show what the author wrote.
  const promptValue = (scene) =>
    Object.prototype.hasOwnProperty.call(editedPrompts, scene.id)
      ? editedPrompts[scene.id]
      : stripAppendedClauses(scene.prompt);

  const handlePromptChange = (sceneId, value) => {
    setEditedPrompts(prev => ({ ...prev, [sceneId]: value }));
  };

  const handlePromptSave = async (scene) => {
    const next = (chapter.scenes || []).map(s =>
      s.id === scene.id ? { ...s, prompt: promptValue(scene) } : s
    );
    await storybook.updateChapter(chapter.id, { scenes: next });
    setEditedPrompts(prev => {
      const copy = { ...prev };
      delete copy[scene.id];
      return copy;
    });
  };

  // Which entities appear in a scene. This drives the reference portraits sent
  // to the image model, so it — not the prompt text — is what actually controls
  // who gets drawn. Naming someone in the prompt without listing them here
  // leaves the model to invent their face.
  // Who in this chapter looks different from their portrait — now, or when the
  // chapter was written. The chapter's own record wins on redraw (see
  // lookForScene), so an early chapter keeps Pippin alive after he dies; this
  // lets the DM switch any of them to how they look now, or back.
  const featuredIds = [...new Set((chapter.scenes || []).flatMap(sc => sc.featuredEntityIds || []))];
  const stateRows = featuredIds
    .map(id => [...(characters || []), ...(npcs || []), ...(adversaries || [])].find(e => e.id === id))
    .filter(Boolean)
    .map(entity => ({ entity, now: currentLook(entity), drawn: lookForScene(entity, chapter.castStates) }))
    .filter(r => r.now || r.drawn);
  const setDrawnLook = async (entityId, look) => {
    await storybook.updateChapter(chapter.id, { castStates: { ...(chapter.castStates || {}), [entityId]: look } });
  };

  const castOptions = [
    ...(characters || []).map(c => ({ id: c.id, name: c.name, group: 'Characters' })),
    ...(npcs || []).map(n => ({ id: n.id, name: n.name, group: 'NPCs' })),
    ...(adversaries || []).map(a => ({ id: a.id, name: a.name, group: 'Adversaries' })),
  ].filter(o => o.id && o.name);

  const toggleSceneCast = async (scene, entityId) => {
    const current = scene.featuredEntityIds || [];
    const next = current.includes(entityId)
      ? current.filter(id => id !== entityId)
      : [...current, entityId];
    const scenes = (chapter.scenes || []).map(s =>
      s.id === scene.id ? { ...s, featuredEntityIds: next } : s
    );
    await storybook.updateChapter(chapter.id, { scenes });
  };

  const saveStyle = async (key, custom) => {
    await storybook.updateChapter(chapter.id, {
      styleKey: key,
      styleCustom: key === 'custom' ? custom : ''
    });
  };

  const handleStyleChange = async (key) => {
    setStyleKey(key);
    await saveStyle(key, styleCustom);
  };

  const useCampaignStyle = async () => {
    setStyleKey(campaignStyleKey);
    setStyleCustom(campaignStyleCustom);
    await saveStyle(campaignStyleKey, campaignStyleCustom);
  };

  // Redraw every scene in the chosen style, one at a time. Each finished scene
  // is saved straight away, so a failure part-way keeps the ones already done
  // and the rest can be retried individually.
  const handleRedrawAll = async () => {
    const targets = (chapter.scenes || []).filter(s => s.prompt || editedPrompts[s.id]);
    if (targets.length === 0) return;
    const styleLabel = STORYBOOK_STYLES.find(st => st.key === styleKey)?.label || styleKey;
    if (!await confirm({
      message: `Redraw all ${targets.length} illustration${targets.length === 1 ? '' : 's'} in "${styleLabel}"? The current images will be replaced.`,
      confirmLabel: 'Redraw'
    })) return;

    await saveStyle(styleKey, styleCustom);
    let scenes = [...(chapter.scenes || [])];
    let failed = 0;
    setRedrawProgress({ done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      const scene = targets[i];
      setRegeneratingId(scene.id);
      try {
        const newScene = await regenerateScene({
          scene: { ...scene, prompt: promptValue(scene) },
          chapter,
          entities: { characters, npcs, adversaries },
          campaignId,
          apiKey,
          gameSystem,
          styleKey,
          styleCustom,
          imageModel: regenModel
        });
        scenes = scenes.map(s => s.id === scene.id ? { ...newScene, id: scene.id } : s);
        await storybook.updateChapter(chapter.id, { scenes });
      } catch (err) {
        failed += 1;
        console.warn(`Redraw failed for scene ${scene.id}:`, err);
      }
      setRedrawProgress({ done: i + 1, total: targets.length });
    }
    setRegeneratingId(null);
    setRedrawProgress(null);
    setEditedPrompts({});
    if (failed) notify.error(`${failed} of ${targets.length} illustrations failed to redraw — use Regenerate on those to retry.`);
    else notify.success(`All ${targets.length} illustrations redrawn.`);
  };

  const handleSceneRegenerate = async (scene) => {
    setRegeneratingId(scene.id);
    try {
      // Pass the (possibly edited) prompt through; the new image will be
      // generated from this exact text. Saving the prompt onto the chapter
      // happens after the regeneration succeeds so a failed call doesn't
      // overwrite the previous prompt.
      const sceneWithPrompt = { ...scene, prompt: promptValue(scene) };
      const newScene = await regenerateScene({
        scene: sceneWithPrompt,
        chapter,
        entities: { characters, npcs, adversaries },
        campaignId,
        apiKey,
        gameSystem,
        styleKey,
        styleCustom,
        imageModel: regenModel
      });
      const nextScenes = (chapter.scenes || []).map(s => s.id === scene.id ? { ...newScene, id: scene.id } : s);
      await storybook.updateChapter(chapter.id, { scenes: nextScenes });
      setEditedPrompts(prev => {
        const copy = { ...prev };
        delete copy[scene.id];
        return copy;
      });
    } catch (err) {
      notify.error(`Regeneration failed: ${err.message}`);
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 lr-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6" style={{ borderBottom: '1px solid var(--line)' }}>
        <button
          type="button"
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 text-lr-text-muted hover:text-white text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-lr-text-muted hover:bg-white/10 text-sm font-semibold"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-lr-text-muted text-sm font-semibold border disabled:opacity-40"
            style={{
              background: isDirty ? 'color-mix(in srgb, var(--primary) 18%, transparent)' : 'transparent',
              borderColor: 'var(--line-strong)'
            }}
          >
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
          {chapter.status !== 'published' && (
            <button
              type="button"
              onClick={handlePublish}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-bold"
              style={{
                background: 'rgba(34, 197, 94, 0.22)',
                border: '1px solid rgba(34, 197, 94, 0.4)'
              }}
            >
              Publish
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-300 text-sm font-semibold"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </header>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white text-2xl font-cinzel focus:outline-none focus:border-[color:var(--primary)]"
        />
      </div>

      <nav className="flex flex-wrap gap-2" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 0 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition"
              style={{
                color: active ? 'var(--text)' : 'var(--text-muted)',
                borderColor: active ? 'var(--primary)' : 'transparent'
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === 'prose' && (
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim">
            Prose (markdown supported)
          </label>
          <textarea
            value={prose}
            onChange={(e) => setProse(e.target.value)}
            rows={22}
            className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-lr-text text-sm focus:outline-none focus:border-[color:var(--primary)]"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
          />
        </div>
      )}

      {activeTab === 'scenes' && (
        <div className="space-y-4">
          {/* Art style for this chapter — saved on the chapter, used by every redraw */}
          <div
            className="space-y-3 p-3 rounded-lg border"
            style={{
              background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
              borderColor: matchesCampaignStyle ? 'var(--line)' : 'rgba(251, 191, 36, 0.45)'
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-lr-text-dim">
                Art style
              </label>
              <select
                value={styleKey}
                onChange={(e) => handleStyleChange(e.target.value)}
                disabled={!!redrawProgress}
                className="p-2 rounded bg-black/20 border border-white/10 text-white text-xs"
              >
                {STORYBOOK_STYLES.map(st => (
                  <option key={st.key} value={st.key}>
                    {st.label}{st.key === campaignStyleKey ? ' (campaign style)' : ''}
                  </option>
                ))}
              </select>
              {!matchesCampaignStyle && (
                <button
                  type="button"
                  onClick={useCampaignStyle}
                  disabled={!!redrawProgress}
                  className="text-xs font-semibold text-amber-200 hover:text-white px-2 py-1 rounded border border-amber-300/40"
                >
                  Match the campaign style
                </button>
              )}
              <button
                type="button"
                onClick={handleRedrawAll}
                disabled={!!redrawProgress || !!regeneratingId || (chapter.scenes || []).length === 0}
                className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-40"
                style={{
                  background: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--primary) 55%, transparent)'
                }}
              >
                <Wand2 size={13} className={redrawProgress ? 'animate-spin' : ''} />
                {redrawProgress
                  ? `Redrawing ${Math.min(redrawProgress.done + 1, redrawProgress.total)} of ${redrawProgress.total}…`
                  : 'Redraw all illustrations'}
              </button>
            </div>
            {styleKey === 'custom' && (
              <textarea
                value={styleCustom}
                onChange={(e) => setStyleCustom(e.target.value)}
                onBlur={() => saveStyle(styleKey, styleCustom)}
                disabled={!!redrawProgress}
                placeholder="Describe the art style, e.g. muted gouache with heavy ink outlines"
                rows={2}
                className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-xs"
              />
            )}
            <p className="text-[11px] text-lr-text-dim">
              {matchesCampaignStyle
                ? 'Regenerate and Redraw use this style.'
                : 'This chapter is set to a different style from the rest of the campaign. Pick the style you want, then Redraw all illustrations.'}
            </p>
          </div>

          {stateRows.length > 0 && (
            <div
              className="space-y-2 p-3 rounded-lg border"
              style={{ background: 'color-mix(in srgb, var(--surface) 60%, transparent)', borderColor: 'var(--line)' }}
            >
              <label className="block text-[11px] font-bold uppercase tracking-widest text-lr-text-dim">
                How they're drawn in this chapter
              </label>
              {stateRows.map(({ entity, now, drawn }) => (
                <div key={entity.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-white min-w-[7rem]">{entity.name}</span>
                  <select
                    value={drawn === now ? 'now' : drawn ? 'then' : 'portrait'}
                    onChange={(e) => setDrawnLook(entity.id, e.target.value === 'now' ? now : e.target.value === 'then' ? drawn : '')}
                    disabled={!!redrawProgress}
                    className="flex-1 min-w-[12rem] p-2 rounded bg-black/20 border border-white/10 text-white text-xs"
                  >
                    {now && <option value="now">As they are now: {now.split(':')[0]}</option>}
                    {drawn && drawn !== now && <option value="then">As when this chapter was written: {drawn.split(':')[0]}</option>}
                    <option value="portrait">As in their portrait</option>
                  </select>
                </div>
              ))}
              <p className="text-[11px] text-lr-text-dim">
                Applies to Regenerate and Redraw. Set a character back to their portrait for chapters from before they changed.
              </p>
            </div>
          )}

          {/* Image-model selector applied to every regeneration in this session */}
          <div
            className="flex flex-wrap items-center gap-3 p-3 rounded-lg border"
            style={{
              background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
              borderColor: 'var(--line)'
            }}
          >
            <label className="text-[11px] font-bold uppercase tracking-widest text-lr-text-dim">
              Regenerate using
            </label>
            <select
              value={regenModel}
              onChange={(e) => setRegenModel(e.target.value)}
              className="p-2 rounded bg-black/20 border border-white/10 text-white text-xs"
            >
              <option value="nano-banana-2">Gemini 2.5 Flash Image v2 — references portraits (recommended)</option>
              <option value="nano-banana">Gemini 2.5 Flash Image v1 — references portraits</option>
              <option value="gpt-image-2">OpenAI GPT Image (newest available) — references portraits</option>
              <option value="flux-pro">Flux 1.1 Pro — stylised, no references</option>
            </select>
          </div>

          {(chapter.scenes || []).length === 0 && (
            <p className="text-sm text-lr-text-dim italic">No scenes on this chapter yet.</p>
          )}
          {(chapter.scenes || []).map((scene, idx) => {
            const promptDirty = Object.prototype.hasOwnProperty.call(editedPrompts, scene.id)
              && editedPrompts[scene.id] !== (scene.prompt || '');
            return (
            <div
              key={scene.id}
              className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 p-4 rounded-xl border"
              style={{
                background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
                borderColor: 'var(--line)'
              }}
            >
              <div className="aspect-[16/9] md:aspect-auto rounded-lg overflow-hidden" style={{ background: 'var(--surface-hi)' }}>
                {scene.imageUrl && <img src={scene.imageUrl} alt={scene.caption} className="w-full h-full object-cover" />}
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-lr-text-dim uppercase tracking-widest">
                  Scene {idx + 1}
                  {!scene.imageUrl && (
                    <span className="ml-2 text-amber-300 normal-case tracking-normal">
                      · No illustration yet{scene.artNote ? ` — ${scene.artNote}` : ''}
                    </span>
                  )}
                </div>
                <textarea
                  value={scene.caption || ''}
                  onChange={(e) => handleSceneCaptionChange(scene.id, e.target.value)}
                  placeholder="Caption"
                  rows={2}
                  className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-lr-text-dim">
                      Image prompt {promptDirty && <span className="text-amber-300 ml-1">(unsaved)</span>}
                    </label>
                    {promptDirty && (
                      <button
                        type="button"
                        onClick={() => handlePromptSave(scene)}
                        className="text-[11px] font-semibold text-lr-text-muted hover:text-white px-2 py-0.5 rounded border border-white/15"
                      >
                        Save prompt
                      </button>
                    )}
                  </div>
                  <textarea
                    value={promptValue(scene)}
                    onChange={(e) => handlePromptChange(scene.id, e.target.value)}
                    placeholder="Visual prompt — what should appear in this scene?"
                    rows={4}
                    className="w-full p-2 rounded-lg bg-black/30 border border-white/10 text-lr-text-muted text-xs font-mono"
                    style={{ lineHeight: 1.5 }}
                  />
                  <p className="text-[11px] text-lr-text-dim">
                    Edit the prompt to fine-tune the image. Regenerate uses whatever's in this box and saves it back to the chapter.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-lr-text-dim">
                    Who's in this scene ({(scene.featuredEntityIds || []).length})
                  </label>
                  <div
                    className="flex flex-wrap gap-1.5 p-2 rounded-lg max-h-32 overflow-y-auto"
                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line)' }}
                  >
                    {castOptions.length === 0 && (
                      <span className="text-[11px] text-lr-text-dim">No characters, NPCs or adversaries in this campaign yet.</span>
                    )}
                    {castOptions.map(opt => {
                      const on = (scene.featuredEntityIds || []).includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleSceneCast(scene, opt.id)}
                          title={opt.group}
                          className="text-[11px] font-semibold px-2 py-1 rounded-full border transition-colors"
                          style={{
                            background: on ? 'color-mix(in srgb, var(--primary) 30%, transparent)' : 'rgba(255,255,255,0.04)',
                            borderColor: on ? 'color-mix(in srgb, var(--primary) 60%, transparent)' : 'rgba(255,255,255,0.12)',
                            color: on ? '#fff' : 'rgba(255,255,255,0.55)',
                          }}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-lr-text-dim">
                    This is what actually controls who gets drawn — each selected character's
                    portrait is sent to the image model as a reference. Naming someone in the
                    prompt without selecting them here leaves the model to invent their face.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSceneRegenerate(scene)}
                    disabled={regeneratingId === scene.id || !!redrawProgress}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-lr-text-muted bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={regeneratingId === scene.id ? 'animate-spin' : ''} />
                    {regeneratingId === scene.id ? 'Regenerating…' : 'Regenerate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSceneDelete(scene.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            </div>
          );})}
        </div>
      )}

      {activeTab === 'spotlights' && (
        <div className="space-y-3">
          {(chapter.spotlights || []).length === 0 && (
            <p className="text-sm text-lr-text-dim italic">No spotlight cards on this chapter.</p>
          )}
          {(chapter.spotlights || []).map((s, idx) => (
            <div
              key={`${s.entityType}-${s.entityId || idx}`}
              className="flex gap-3 p-3 rounded-xl border"
              style={{
                background: 'color-mix(in srgb, var(--surface) 70%, transparent)',
                borderColor: 'var(--line)'
              }}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--surface-hi)' }}>
                {s.portraitUrl
                  ? <img src={s.portraitUrl} alt={s.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lr-text-dim text-xs">{(s.name || '?').slice(0, 1)}</div>}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white font-cinzel">{s.name}</div>
                <div className="text-[11px] uppercase tracking-widest text-lr-text-dim mb-1">{s.entityType}</div>
                <input
                  type="text"
                  value={s.moment || ''}
                  onChange={async (e) => {
                    const next = (chapter.spotlights || []).map(x => x === s ? { ...x, moment: e.target.value } : x);
                    await storybook.updateChapter(chapter.id, { spotlights: next });
                  }}
                  className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
                  placeholder="Moment"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!await confirm({ message: 'Remove this spotlight?', confirmLabel: 'Remove', danger: true })) return;
                  const next = (chapter.spotlights || []).filter(x => x !== s);
                  await storybook.updateChapter(chapter.id, { spotlights: next });
                }}
                className="self-start text-lr-text-dim hover:text-red-400"
                aria-label="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'media' && (
        <MediaUploader chapter={chapter} storybook={storybook} />
      )}
    </div>
  );
}
