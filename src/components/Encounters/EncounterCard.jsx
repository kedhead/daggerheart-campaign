import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, ExternalLink, Swords, Play, Users, Skull, Target, MessageCircle, Compass, Puzzle, Sparkles, Loader2 } from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import EntityViewer from '../EntityViewer/EntityViewer';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import { useDice, parseDamageNotation } from '../../dice';
import SceneSpecView, { PuzzleSpecView } from './SceneSpecView';
import { isNonCombat, buildSceneSpecPrompt, parseSceneSpec } from '../../utils/sceneSpec';
import { aiService } from '../../services/aiService';
import { textProvider } from '../../services/cinematicsGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useOptionalCampaignData } from '../../contexts/CampaignDataContext';
import { currentStorySnapshot } from '../../utils/currentStory';

// Icon, colours and label for the kind of scene, so a social or exploration
// encounter no longer looks like a fight with a "MEDIUM" badge.
const TYPE_STYLE = {
  social: { Icon: MessageCircle, box: 'bg-sky-500/10 text-sky-400 border-sky-500/20', hover: 'group-hover:text-sky-400' },
  exploration: { Icon: Compass, box: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', hover: 'group-hover:text-emerald-400' },
  puzzle: { Icon: Puzzle, box: 'bg-amber-500/10 text-amber-400 border-amber-500/20', hover: 'group-hover:text-amber-400' },
  combat: { Icon: Swords, box: 'bg-red-500/10 text-red-500 border-red-500/20', hover: 'group-hover:text-red-400' }
};

export default function EncounterCard({ encounter, onEdit, onDelete, onRun, onUpdate, isDM, campaign, isEmbedded = false, entities, adversaries = [], environments = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nonCombat = isNonCombat(encounter);
  const kind = encounter.encounterType || (nonCombat ? 'social' : 'combat');
  const typeStyle = TYPE_STYLE[kind] || TYPE_STYLE.combat;

  const [viewingEntity, setViewingEntity] = useState(null);
  const { getByName } = useEntityRegistry(campaign, entities);
  const { rollDamage } = useDice(campaign?.id);

  // Check if this is a BP-based encounter
  const hasBPData = encounter.adversarySlots?.length > 0;

  // Get environment details
  const environment = encounter.environmentId
    ? environments.find(e => e.id === encounter.environmentId)
    : null;

  // Get adversary details for slots
  const getAdversaryFromSlot = (slot) => adversaries.find(a => a.id === slot.adversaryId);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return { text: 'text-emerald-400', bg: 'bg-emerald-400/10' };
      case 'medium':
        return { text: 'text-amber-400', bg: 'bg-amber-400/10' };
      case 'hard':
        return { text: 'text-orange-400', bg: 'bg-orange-400/10' };
      case 'deadly':
        return { text: 'text-red-400', bg: 'bg-red-400/10' };
      default:
        return { text: 'text-slate-400', bg: 'bg-slate-400/10' };
    }
  };

  const difficultyColors = getDifficultyColor(encounter.difficulty);

  return (
    <div className="group relative bg-[var(--bg-secondary)] border border-white/5 rounded-xl hover:border-white/10 transition-all duration-300">
      <div
        className="p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors rounded-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`p-3 rounded-xl border h-fit ${typeStyle.box}`}>
          <typeStyle.Icon size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className={`text-lg font-bold text-white transition-colors ${typeStyle.hover}`}>
                {encounter.name}
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                {hasBPData ? (
                  <>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-white/5 text-lr-text-muted">
                      <Skull size={12} />
                      {encounter.usedBP || 0} / {encounter.calculatedBP || 0} BP
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
                      <Users size={12} />
                      {encounter.partySize || 4} PCs
                    </span>
                  </>
                ) : kind !== 'combat' ? (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${typeStyle.box}`}>
                    {kind}
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${difficultyColors.bg} ${difficultyColors.text}`}>
                    {encounter.difficulty || 'medium'}
                  </span>
                )}

                {encounter.partyLevel && (
                  <span className="text-xs text-lr-text-dim">
                    Lvl {encounter.partyLevel}
                  </span>
                )}
              </div>
            </div>

            <button className="p-1 text-white/20 hover:text-white transition-colors">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-6">
          {encounter.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lr-text-dim uppercase tracking-wider">Description</h4>
              <div className="text-lr-text-muted text-sm leading-relaxed">
                <WikiText
                  text={encounter.description}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {encounter.sceneSpec && <SceneSpecView spec={encounter.sceneSpec} />}

          {encounter.puzzleSpec && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lr-text-dim uppercase tracking-wider">Puzzle</h4>
              <PuzzleSpecView spec={encounter.puzzleSpec} />
            </div>
          )}

          {isDM && nonCombat && onUpdate && !isEmbedded && (
            <FleshOutScene encounter={encounter} campaign={campaign} onUpdate={onUpdate} />
          )}

          {encounter.enemies && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lr-text-dim uppercase tracking-wider">Opponents</h4>
              <div className="text-lr-text-muted text-sm leading-relaxed">
                <WikiText
                  text={encounter.enemies}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {/* Environment from catalog */}
          {environment && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lr-text-dim uppercase tracking-wider">Environment</h4>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{environment.name}</span>
                  <span className="text-xs text-lr-text-dim font-mono">T{environment.tier} • {environment.type} • DC {environment.difficulty}</span>
                </div>
                <p className="text-sm text-lr-text-muted italic">{environment.description}</p>
              </div>
            </div>
          )}

          {/* Legacy environment text field */}
          {!environment && encounter.environment && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lr-text-dim uppercase tracking-wider">Environment</h4>
              <div className="text-lr-text-muted text-sm leading-relaxed">
                <WikiText
                  text={encounter.environment}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {/* Adversary Slots */}
          {hasBPData && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lr-text-dim uppercase tracking-wider">Adversaries</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {encounter.adversarySlots.map((slot, idx) => {
                  const adv = getAdversaryFromSlot(slot);
                  if (!adv) return null;
                  return (
                    <div key={idx} className="p-2 rounded bg-white/5 border border-white/5 space-y-1.5">
                      {/* Name row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lr-text-muted text-xs px-1.5 py-0.5 rounded bg-white/5">{slot.quantity}x</span>
                          <span className="text-sm text-white font-medium">{adv.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-lr-text-dim">{adv.role}</span>
                          <span className="text-amber-400 font-mono">T{adv.tier}</span>
                        </div>
                      </div>

                      {/* Stats sub-row */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-lr-text-dim pl-1">
                        <span><span className="text-lr-text-dim">HP </span>{adv.hp}</span>
                        {adv.thresholds && (
                          <span>
                            <span className="text-lr-text-dim">Thresholds </span>
                            {adv.thresholds.minor} / {adv.thresholds.major} / {adv.thresholds.severe}
                          </span>
                        )}
                        {adv.attackDamage && (
                          <span>
                            <span className="text-lr-text-dim">Dmg </span>
                            {adv.attackName ? `${adv.attackName} · ` : ''}{adv.attackDamage}
                          </span>
                        )}
                      </div>

                      {/* Roll buttons */}
                      {(adv.attack !== undefined || adv.attackDamage) && rollDamage && (
                        <div className="flex gap-1.5 flex-wrap">
                          {adv.attack !== undefined && (
                            <button
                              className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                rollDamage({ label: `${adv.name} Attack`, dieType: 20, quantity: 1, modifier: adv.attack || 0 });
                              }}
                            >
                              Roll Attack (d20)
                            </button>
                          )}
                          {adv.attackDamage && parseDamageNotation(adv.attackDamage) && (
                            <button
                              className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                const parsed = parseDamageNotation(adv.attackDamage);
                                rollDamage({ label: `${adv.name} Damage`, ...parsed });
                              }}
                            >
                              Roll Damage
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {encounter.tactics && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lr-text-dim uppercase tracking-wider">Tactics</h4>
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                <WikiText
                  text={encounter.tactics}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {encounter.rewards && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lr-text-dim uppercase tracking-wider">Rewards</h4>
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <WikiText
                  text={encounter.rewards}
                  onLinkClick={setViewingEntity}
                  getEntity={getByName}
                />
              </div>
            </div>
          )}

          {encounter.freshcutgrassLink && (
            <div>
              <a
                href={encounter.freshcutgrassLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full justify-center"
              >
                <ExternalLink size={16} />
                Open in FreshCutGrass
              </a>
            </div>
          )}

          {isDM && !isEmbedded && (
            <div className="pt-4 mt-2 border-t border-white/5 flex flex-wrap gap-3 justify-end items-center">
              {hasBPData && onRun && (
                <button className="btn btn-primary mr-auto" onClick={onRun}>
                  <Play size={16} />
                  Run Scenario
                </button>
              )}
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-lr-text-muted hover:text-white text-sm font-medium transition-all"
                onClick={onEdit}
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-all"
                onClick={onDelete}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Entity viewer modal for wiki links */}
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

/**
 * Turn a generic non-combat encounter into a playable scene: goal, stakes,
 * rolls with Difficulties and results, countdown, NPCs, twist. Its own
 * component so the key lookup only runs for an open card, not all of them.
 */
function FleshOutScene({ encounter, campaign, onUpdate }) {
  const [fleshing, setFleshing] = useState(false);
  const [error, setError] = useState(null);
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const campaignData = useOptionalCampaignData();

  const fleshOut = async (e) => {
    e?.stopPropagation?.();
    setFleshing(true);
    setError(null);
    try {
      const story = currentStorySnapshot({ sessions: campaignData?.sessions, chapters: campaignData?.storybookChapters, quests: campaignData?.quests });
      const storyNow = [...story.sessions, ...story.chapters].map(x => x.text).slice(-2).join(' ');
      const { apiKey, provider } = textProvider(getEffectiveKey);
      const text = await aiService.generate(
        buildSceneSpecPrompt(encounter, { campaignName: campaign?.name, storyNow, characters: campaignData?.characters }),
        apiKey,
        provider
      );
      const sceneSpec = parseSceneSpec(text);
      if (!sceneSpec) throw new Error('The AI did not come back with a scene. Try again.');
      await onUpdate(encounter.id, { sceneSpec });
    } catch (err) {
      setError(err.message || 'Could not flesh out this scene.');
    } finally {
      setFleshing(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={fleshOut}
        disabled={fleshing}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-500/15 text-indigo-200 border border-indigo-500/25 hover:bg-indigo-500/25 disabled:opacity-50"
      >
        {fleshing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {fleshing ? 'Building the scene…' : encounter.sceneSpec ? 'Rework this scene' : 'Flesh out this scene'}
      </button>
      {!encounter.sceneSpec && !fleshing && (
        <p className="text-[11px] text-lr-text-dim">Adds goal and stakes, rolls with Difficulties and results, a countdown, who's here and a twist.</p>
      )}
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
