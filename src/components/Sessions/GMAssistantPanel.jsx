import { useState, useMemo, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, X, Bot, User, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '../../config/firebase';
import { useAPIKey } from '../../hooks/useAPIKey';
import { buildCampaignContext } from '../../services/campaignContext';
import {
  generateSessionPlan,
  buildPreviewFromPlan,
  commitPreview
} from '../../services/sessionPlanGenerator';
import SessionPlanCard from './SessionPlanCard';
import SessionPreviewModal from './SessionPreviewModal';

const SAMPLE_PROMPTS = [
  'Plan tonight\'s session at the Siphon Pits — 4–5 encounters with 2 puzzle challenges, 3 hours, party of 6 at level appropriate.',
  'I need a low-stakes city intrigue session for the party tomorrow. ~2.5 hours. 3 encounters, mostly social, one optional combat.',
  'Wilderness survival session. The party crosses the blighted moors. 3 hours, mix of exploration and one tense ambush.',
];

/**
 * GM Assistant: a DM-only conversational session planner.
 *
 * Flow: brief → refine (multi-turn) → SessionPlanCard → Build Preview
 *       → SessionPreviewModal (edit) → Save All → Firestore.
 */
export default function GMAssistantPanel({
  campaign,
  campaignFrame,
  characters,
  npcs,
  adversaries,
  locations,
  lore,
  sessions,
  encounters,
  items = [],
  maps = [],
  battleMaps = [],
  storybookChapters = [],
  isDM,
  currentUserId,
  handlers, // { addLocation, addNPC, addAdversary, addEncounter, addSession }
  onClose,
  onSaved
}) {
  const { keys, sharedConfig, hasKey, getEffectiveKey } = useAPIKey(currentUserId);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Tell me about the session you want to plan. Include the location, party size & level, time budget, and the mix of encounter types you want.' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [latestPlan, setLatestPlan] = useState(null);
  const [selectedMaps, setSelectedMaps] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isBuildingPreview, setIsBuildingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(null);
  const [preview, setPreview] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);

  const mergedMaps = useMemo(() => [
    ...maps.map(m => ({ ...m, tag: 'map' })),
    ...battleMaps.map(m => ({ ...m, tag: 'battle-map' }))
  ], [maps, battleMaps]);

  const campaignContext = useMemo(
    () => buildCampaignContext(campaign, {
      campaignFrame, characters, npcs, adversaries, locations, lore, sessions, encounters,
      items, maps: mergedMaps, storybookChapters
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign?.id, characters?.length, npcs?.length, adversaries?.length,
     locations?.length, lore?.length, sessions?.length, encounters?.length,
     items.length, mergedMaps.length, storybookChapters.length]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, latestPlan, isThinking]);

  if (!isDM) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-6 text-center">
        <p className="text-white/60">GM Assistant is available to Dungeon Masters only.</p>
      </div>
    );
  }

  const resolveProvider = () => {
    // Prefer using user's own key if available (Anthropic first, then OpenAI).
    // If no client key is configured, pass an empty apiKey — the Vercel backend
    // will use its own server-side ANTHROPIC_API_KEY / OPENAI_API_KEY env vars.
    for (const provider of ['anthropic', 'openai']) {
      if (hasKey(provider)) {
        const { key } = getEffectiveKey(provider);
        if (key) return { provider, apiKey: key };
      }
    }
    // No client key — let the server use its env vars (always valid on Vercel).
    return { provider: 'anthropic', apiKey: '' };
  };

  const sendBrief = async (briefText) => {
    if (!briefText.trim() || isThinking) return;
    setErrorMsg(null);
    const userMessage = briefText.trim();
    const newHistory = [...messages, { role: 'user', content: userMessage }];
    setMessages(newHistory);
    setInput('');
    setIsThinking(true);

    try {
      const { provider, apiKey } = resolveProvider();
      const { plan, raw } = await generateSessionPlan({
        brief: userMessage,
        history: messages.slice(-10),
        campaignContext,
        gameSystem: campaign?.gameSystem || 'daggerheart',
        apiKey,
        provider
      });

      if (plan) {
        setLatestPlan(plan);
        setSelectedMaps([]);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Here's a draft plan for **${plan.sessionTitle}**. Review it below — refine it by sending another message, or build a preview to flesh out every entity.` }
        ]);
      } else {
        // Show raw text if we couldn't extract a plan
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: raw || 'I could not produce a plan. Try giving me more specifics about the session.' }
        ]);
      }
    } catch (err) {
      console.error('GM Assistant plan error:', err);
      setErrorMsg(err.message || 'Failed to generate plan.');
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleBuildPreview = async () => {
    if (!latestPlan) return;
    setIsBuildingPreview(true);
    setPreviewProgress({ step: 0, total: 1, label: 'Starting…' });
    setErrorMsg(null);

    try {
      const { provider, apiKey } = resolveProvider();
      const built = await buildPreviewFromPlan({
        plan: latestPlan,
        campaign,
        campaignFrame,
        adversaries,
        locations,
        npcs,
        apiKey,
        provider,
        generateMapsFor: selectedMaps,
        onProgress: (step, total, label) => setPreviewProgress({ step, total, label })
      });
      setPreview(built);
    } catch (err) {
      console.error('Build preview error:', err);
      setErrorMsg(err.message || 'Failed to build preview.');
    } finally {
      setIsBuildingPreview(false);
      setPreviewProgress(null);
    }
  };

  const handleSaveAll = async (edited) => {
    setIsSaving(true);
    setSaveProgress({ step: 0, total: 1, label: 'Starting…' });
    setErrorMsg(null);

    // Handler that uploads a generated image URL (gpt-image-1 / Replicate) to
    // Firebase Storage and saves a doc in the maps subcollection so the
    // image appears in Maps & Files and the Player Display.
    const addMapFile = async ({ name, url, tag }) => {
      try {
        // Download via the existing server-side proxy (avoids CORS on external image URLs)
        const resp = await fetch('/api/download-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url })
        });
        if (!resp.ok) throw new Error(`Proxy fetch failed: ${resp.status}`);
        const { dataUrl } = await resp.json();
        if (!dataUrl) throw new Error('No dataUrl returned from proxy');

        // Upload the base64 data URL to Firebase Storage (mirrors FilesView.handleGenerateMap)
        const timestamp = Date.now();
        const storagePath = `campaigns/${campaign.id}/maps/${timestamp}-${name.replace(/\s+/g, '_')}.png`;
        const storageRef = ref(storage, storagePath);
        await uploadString(storageRef, dataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(storageRef);

        // Save metadata doc to maps subcollection (same schema as FilesView)
        const mapDoc = {
          id: timestamp.toString(),
          name: `${name}.png`,
          size: 0,
          contentType: 'image/png',
          dataUrl: downloadUrl,
          downloadUrl,
          storagePath,
          timeCreated: new Date().toISOString(),
          uploadedBy: 'GM Assistant',
          isGeneratedMap: true,
          mapType: tag || 'battle-map',
          tag
        };
        const mapsRef = collection(db, `campaigns/${campaign.id}/maps`);
        await addDoc(mapsRef, mapDoc);
        return downloadUrl;
      } catch (err) {
        console.error('addMapFile failed for', name, err);
        return url; // fall back to original URL
      }
    };

    try {
      const result = await commitPreview({
        preview: edited,
        handlers: { ...handlers, addMapFile },
        onProgress: (step, total, label) => setSaveProgress({ step, total, label })
      });

      if (result.errors.length > 0) {
        setErrorMsg(`Saved with ${result.errors.length} error(s). See console for details.`);
      }

      setPreview(null);
      setLatestPlan(null);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Saved **${edited.sessionDraft.title}** to your campaign — ${result.encounterIds.length} encounter(s), ${edited.adversaries.length} adversary stat block(s), ${edited.npcs.length} NPC(s), ${edited.locations.length} location(s)${result.mapCount ? `, ${result.mapCount} map/handout(s) added to Maps & Files` : ''}.` }
      ]);
      onSaved?.(result);
    } catch (err) {
      console.error('Commit preview error:', err);
      setErrorMsg(err.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendBrief(input);
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[rgb(var(--color-primary))]/30 rounded-xl p-5 space-y-4 shadow-lg">
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[rgb(var(--color-primary))]" />
            <h3 className="text-xl font-bold text-white font-cinzel">GM Assistant</h3>
          </div>
          <p className="text-sm text-white/60 mt-1">
            Describe the session you want to run. I'll draft a plan you can refine, then build all the encounters, adversaries, NPCs, and notes.
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {latestPlan && !preview && (
        <SessionPlanCard
          plan={latestPlan}
          selectedMaps={selectedMaps}
          setSelectedMaps={setSelectedMaps}
          onBuildPreview={handleBuildPreview}
          onRefine={() => inputRef.current?.focus()}
          onDiscard={() => { setLatestPlan(null); setSelectedMaps([]); }}
          isLoading={isBuildingPreview}
        />
      )}

      {isBuildingPreview && previewProgress && (
        <div className="bg-black/20 rounded-lg border border-white/10 p-3">
          <div className="flex items-center justify-between text-sm text-white/70 mb-1">
            <span>{previewProgress.label}</span>
            <span>{previewProgress.step}/{previewProgress.total}</span>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-[rgb(var(--color-primary))] transition-all"
              style={{ width: `${Math.round((previewProgress.step / Math.max(previewProgress.total, 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!latestPlan && !isThinking && messages.length <= 1 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/40">Try one of these</p>
          <div className="flex flex-col gap-1.5">
            {SAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendBrief(p)}
                className="text-left text-sm text-white/70 px-3 py-2 rounded-lg bg-black/20 border border-white/5 hover:border-white/20 hover:text-white transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-white/10">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={latestPlan ? 'Refine the plan… (e.g. "make encounter 3 a stealth challenge")' : 'Describe the session…'}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={isThinking || isBuildingPreview || isSaving}
          className="flex-1 p-3 bg-black/30 border border-white/10 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-[rgb(var(--color-primary))]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking || isBuildingPreview || isSaving}
          className="btn btn-primary self-stretch px-4 flex items-center"
        >
          {isThinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>

      <SessionPreviewModal
        isOpen={!!preview}
        preview={preview}
        onCancel={() => setPreview(null)}
        onSave={handleSaveAll}
        isSaving={isSaving}
        saveProgress={saveProgress}
      />
    </div>
  );
}

function Message({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUser ? 'bg-[rgb(var(--color-primary))]/30' : 'bg-white/5'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white/70" />}
      </div>
      <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${isUser ? 'bg-[rgb(var(--color-primary))]/20 text-white' : 'bg-black/20 text-white/85 border border-white/5'}`}>
        {isUser ? content : <ReactMarkdown>{content}</ReactMarkdown>}
      </div>
    </div>
  );
}
