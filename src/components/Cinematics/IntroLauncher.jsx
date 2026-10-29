import { useState } from 'react';
import { Sparkles, Film, Loader2, Play, Monitor, Trash2, ExternalLink } from 'lucide-react';
import Modal from '../Modal';
import CinematicStage from './CinematicStage';
import { introFromEntity } from './cinematicPlan';
import { playOnMonitor, openMonitorWindow } from './cinematicChannel';
import { audioContext } from './cinematicSfx';
import { writeIntroSubtitles, animateToClip, textProvider } from '../../services/cinematicsGenerator';
import { deleteStoredFile } from '../../services/audioStorage';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useOptionalCampaignData } from '../../contexts/CampaignDataContext';
import { currentStorySnapshot } from '../../utils/currentStory';
import { useNotify } from '../../contexts/ToastContext';

const MOTION_PROMPT = 'Character intro idle animation: the figure breathes, shifts its weight and glares at the viewer, cloth and hair moving slightly, magical particles drifting. Static camera, keep the exact art style and colours of the source image, no text.';

/**
 * Set up and play a Borderlands-style intro for an NPC or adversary: pick a
 * subtitle (or let the AI suggest some), optionally animate the portrait into
 * a short AI clip, preview it here, and send it to the battle map monitor.
 *
 * @param {object} props
 * @param {object} props.entity - the NPC or adversary
 * @param {'npc'|'adversary'} props.kind
 * @param {(id: string, fields: object) => Promise<void>} props.onSave - updateNPC / updateAdversary
 */
export default function IntroLauncher({ isOpen, onClose, entity, kind, campaign, onSave }) {
  const notify = useNotify();
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const campaignData = useOptionalCampaignData();
  const saved = entity?.intro || {};
  const [subtitle, setSubtitle] = useState(saved.subtitle || '');
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [animating, setAnimating] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);

  const campaignId = campaign?.id;
  const portrait = kind === 'adversary' ? entity?.imageUrl : entity?.avatarUrl;
  const intro = { ...introFromEntity(entity, kind), subtitle: subtitle.trim() };

  const saveIntro = async (fields) => {
    await onSave(entity.id, { intro: { ...saved, subtitle: subtitle.trim(), ...fields } });
  };

  const suggest = async () => {
    setSuggesting(true);
    try {
      const story = currentStorySnapshot({ sessions: campaignData?.sessions, chapters: campaignData?.storybookChapters, quests: campaignData?.quests });
      const storyNow = [...story.sessions, ...story.chapters].map(s => s.text).slice(-2).join(' ');
      const list = await writeIntroSubtitles({ entity, kind, campaign, storyNow, ...textProvider(getEffectiveKey) });
      setSuggestions(list);
      if (!subtitle.trim()) setSubtitle(list[0]);
    } catch (err) {
      notify.error(err.message || 'Could not write subtitles.');
    } finally {
      setSuggesting(false);
    }
  };

  const animate = async () => {
    if (!portrait || !campaignId) return;
    setAnimating('Starting…');
    try {
      const clip = await animateToClip({
        campaignId,
        imageUrl: portrait,
        prompt: MOTION_PROMPT,
        fileName: `intro-${kind}-${entity.id}-${Date.now()}`,
        onStatus: setAnimating
      });
      if (saved.videoStoragePath) await deleteStoredFile(saved.videoStoragePath);
      await saveIntro({ videoUrl: clip.url, videoStoragePath: clip.storagePath });
      notify.success('Portrait animated. It plays in every intro from now on.');
    } catch (err) {
      notify.error(err.message || 'Animation failed.');
    } finally {
      setAnimating(null);
    }
  };

  const removeClip = async () => {
    if (saved.videoStoragePath) await deleteStoredFile(saved.videoStoragePath);
    await saveIntro({ videoUrl: '', videoStoragePath: '' });
  };

  const showPreview = () => {
    audioContext()?.resume?.().catch(() => {});
    setPreview({ id: `preview-${Date.now()}`, kind: 'boss', data: intro });
  };

  const sendToMonitor = async () => {
    if (!campaignId) return;
    setSending(true);
    try {
      if (subtitle.trim() !== (saved.subtitle || '')) await saveIntro({});
      await playOnMonitor(campaignId, 'boss', intro);
      notify.success(`${entity.name}'s intro is playing on the monitor.`);
    } catch (err) {
      notify.error(`Could not reach the monitor: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Boss Intro: ${entity?.name || ''}`} size="medium">
        <div className="space-y-5">
          <p className="text-sm text-lr-text-muted leading-relaxed">
            The battle map monitor freezes, {entity?.name || 'they'} slam onto the screen, and their name and a subtitle stamp in,
            Borderlands style. Great for a boss's first appearance, or anyone who deserves an entrance.
          </p>

          <div className="flex gap-4 items-start">
            <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
              {saved.videoUrl ? (
                <video src={saved.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : portrait ? (
                <img src={portrait} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-lr-text-dim text-center px-2">No portrait yet</span>
              )}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <label className="block text-xs font-bold uppercase tracking-widest text-lr-text-dim">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                maxLength={60}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Three Times Great, Zero Times Serious"
                className="w-full p-2.5 rounded-lg bg-black/20 border border-white/10 text-white"
              />
              <button type="button" className="btn btn-secondary btn-sm inline-flex items-center gap-2" onClick={suggest} disabled={suggesting}>
                {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {suggesting ? 'Writing…' : 'Suggest subtitles'}
              </button>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubtitle(s)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${subtitle === s ? 'border-[color:var(--primary)] text-white bg-white/10' : 'border-white/10 text-lr-text-muted hover:text-white'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-white/10 bg-black/20 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white"><Film size={16} /> Animated portrait (optional)</div>
            <p className="text-xs text-lr-text-dim leading-relaxed">
              Turns the portrait into a short AI video clip that moves in the intro. Takes 1–3 minutes and costs one video generation;
              the clip is saved, so it only happens once.
            </p>
            {saved.videoUrl ? (
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={animate} disabled={!!animating || !portrait}>Re-animate</button>
                <button type="button" className="btn btn-ghost btn-sm inline-flex items-center gap-1" onClick={removeClip} disabled={!!animating}>
                  <Trash2 size={14} /> Use the still instead
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary btn-sm inline-flex items-center gap-2" onClick={animate} disabled={!!animating || !portrait}>
                {animating ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
                {animating || (portrait ? 'Animate portrait' : 'Generate a portrait first')}
              </button>
            )}
            {animating && saved.videoUrl && <p className="text-xs text-lr-text-dim">{animating}</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost inline-flex items-center gap-2" onClick={() => openMonitorWindow(campaignId)}>
              <ExternalLink size={16} /> Open monitor
            </button>
            <button type="button" className="btn btn-secondary inline-flex items-center gap-2" onClick={showPreview}>
              <Play size={16} /> Preview here
            </button>
            <button type="button" className="btn btn-primary inline-flex items-center gap-2" onClick={sendToMonitor} disabled={sending || !campaignId}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Monitor size={16} />}
              Play on monitor
            </button>
          </div>
        </div>
      </Modal>
      {preview && <CinematicStage key={preview.id} cue={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
