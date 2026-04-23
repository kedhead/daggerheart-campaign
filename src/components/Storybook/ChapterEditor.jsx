import { useState } from 'react';
import { ArrowLeft, Save, Eye, Trash2, RefreshCw, Image as ImageIcon, Users, FileText, Wand2 } from 'lucide-react';
import MediaUploader from './MediaUploader';
import { regenerateScene, STORYBOOK_STYLES, DEFAULT_STYLE_KEY } from '../../services/storybookGenerator';

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
  const [activeTab, setActiveTab] = useState('prose');
  const [title, setTitle] = useState(chapter.title || '');
  const [prose, setProse] = useState(chapter.prose || '');
  const [saving, setSaving] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const styleKey = chapter.styleKey || campaign?.storybookStyle || DEFAULT_STYLE_KEY;
  const styleCustom = chapter.styleCustom || campaign?.storybookStyleCustom || '';
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
    if (!window.confirm('Delete this chapter? This cannot be undone.')) return;
    await storybook.deleteChapter(chapter.id);
    onBack();
  };

  const handleSceneCaptionChange = async (sceneId, caption) => {
    const nextScenes = (chapter.scenes || []).map(s => s.id === sceneId ? { ...s, caption } : s);
    await storybook.updateChapter(chapter.id, { scenes: nextScenes });
  };

  const handleSceneDelete = async (sceneId) => {
    if (!window.confirm('Remove this scene illustration?')) return;
    const nextScenes = (chapter.scenes || []).filter(s => s.id !== sceneId);
    await storybook.updateChapter(chapter.id, { scenes: nextScenes });
  };

  const handleSceneRegenerate = async (scene) => {
    setRegeneratingId(scene.id);
    try {
      const newScene = await regenerateScene({
        scene,
        chapter,
        entities: { characters, npcs, adversaries },
        campaignId,
        apiKey,
        gameSystem,
        styleKey,
        styleCustom
      });
      const nextScenes = (chapter.scenes || []).map(s => s.id === scene.id ? { ...newScene, id: scene.id } : s);
      await storybook.updateChapter(chapter.id, { scenes: nextScenes });
    } catch (err) {
      alert(`Regeneration failed: ${err.message}`);
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
          className="self-start inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 text-sm font-semibold"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 text-sm font-semibold border disabled:opacity-40"
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
        <label className="block text-xs font-bold uppercase tracking-widest text-white/40">Title</label>
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
          <label className="block text-xs font-bold uppercase tracking-widest text-white/40">
            Prose (markdown supported)
          </label>
          <textarea
            value={prose}
            onChange={(e) => setProse(e.target.value)}
            rows={22}
            className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white/90 text-sm focus:outline-none focus:border-[color:var(--primary)]"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
          />
        </div>
      )}

      {activeTab === 'scenes' && (
        <div className="space-y-4">
          {(chapter.scenes || []).length === 0 && (
            <p className="text-sm text-white/50 italic">No scenes on this chapter yet.</p>
          )}
          {(chapter.scenes || []).map((scene, idx) => (
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
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Scene {idx + 1}
                </div>
                <textarea
                  value={scene.caption || ''}
                  onChange={(e) => handleSceneCaptionChange(scene.id, e.target.value)}
                  placeholder="Caption"
                  rows={2}
                  className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSceneRegenerate(scene)}
                    disabled={regeneratingId === scene.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
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
                {scene.prompt && (
                  <details className="text-xs text-white/40">
                    <summary className="cursor-pointer hover:text-white/60">View prompt</summary>
                    <p className="mt-2 p-2 rounded bg-black/30 font-mono whitespace-pre-wrap text-white/50">{scene.prompt}</p>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'spotlights' && (
        <div className="space-y-3">
          {(chapter.spotlights || []).length === 0 && (
            <p className="text-sm text-white/50 italic">No spotlight cards on this chapter.</p>
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
                  : <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">{(s.name || '?').slice(0, 1)}</div>}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white font-cinzel">{s.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{s.entityType}</div>
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
                  if (!window.confirm('Remove this spotlight?')) return;
                  const next = (chapter.spotlights || []).filter(x => x !== s);
                  await storybook.updateChapter(chapter.id, { spotlights: next });
                }}
                className="self-start text-white/30 hover:text-red-400"
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
