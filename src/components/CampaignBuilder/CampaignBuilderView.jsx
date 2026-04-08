import { useState } from 'react';
import { Wand2, FileText, Sparkles, Edit, Eye, CheckCircle, Info, RefreshCw } from 'lucide-react';
import CampaignBuilderWizard from './CampaignBuilderWizard';
import { useCampaignBuilder } from '../../hooks/useCampaignBuilder';
import { getAvailableTemplates } from '../../data/campaignFrameTemplates';
import { getGameSystem } from '../../data/systems/index.js';

export default function CampaignBuilderView({
  userId,
  campaign,
  campaignFrame,
  campaignFrameDraft,
  saveCampaignFrameDraft,
  completeCampaignFrame,
  deleteCampaignFrameDraft,
  updateCampaign,
  onBack,
  addNPC,
  addLocation,
  addLore,
  addEncounter,
  addTimelineEvent,
  addQuest,
  addAdversary,
  addEnvironment
}) {
  const [wizardStarted, setWizardStarted] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [viewingFrame, setViewingFrame] = useState(false);
  const [regenerateMode, setRegenerateMode] = useState(false);

  const wizardState = useCampaignBuilder(
    campaign?.id,
    campaignFrameDraft,
    saveCampaignFrameDraft,
    completeCampaignFrame
  );

  // Check if the current game system supports campaign frames
  const gameSystem = getGameSystem(campaign?.gameSystem);
  // Daggerheart always supports frames (templates in separate file)
  // Other systems support frames if they have the campaignFrameTemplates property
  const supportsCampaignFrames = campaign?.gameSystem === 'daggerheart' || gameSystem?.campaignFrameTemplates !== undefined;

  const templates = getAvailableTemplates(campaign?.gameSystem);
  const hasDraft = !!campaignFrameDraft;

  const handleStartWizard = (template = null) => {
    if (template) {
      wizardState.loadTemplate(template);
    }
    setWizardStarted(true);
  };

  const handleContinueDraft = () => {
    setWizardStarted(true);
  };

  const handleDeleteDraft = async () => {
    if (confirm('Are you sure you want to delete your draft? This cannot be undone.')) {
      await deleteCampaignFrameDraft();
    }
  };

  const handleComplete = () => {
    setWizardStarted(false);
    setRegenerateMode(false);
    if (onBack) {
      onBack();
    }
  };

  const handleRegenerateContent = () => {
    // Pre-populate wizard data with existing campaign frame, then jump to the review/generate step
    wizardState.loadTemplate(campaignFrame);
    wizardState.goToStep(15);
    setRegenerateMode(true);
    setWizardStarted(true);
  };

  // For systems without campaign frames, show freeform AI generation
  if (!supportsCampaignFrames) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
            <Wand2 size={32} className="text-[rgb(var(--color-primary))]" />
            Campaign Builder
          </h1>
          <p className="text-lg text-white/60">AI-Powered Campaign Generation for {gameSystem?.name || 'your game'}</p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-amber-400" />
              Freeform AI Generation
            </h3>
            <p className="text-white/60">
              {gameSystem?.name || 'This game system'} doesn't use structured campaign frames. Instead, you can use AI to generate
              campaign elements directly using the Quick Generator in each section:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Generate NPCs', desc: 'Go to the NPCs tab and use "Generate with AI" to create characters, villains, and allies', icon: Wand2 },
              { label: 'Generate Locations', desc: 'Use the Locations tab to generate cities, dungeons, and maps with AI', icon: Wand2 },
              { label: 'Generate Lore & Story', desc: 'Use the Lore tab to create world history, factions, and story hooks', icon: Wand2 },
              { label: 'Generate Encounters', desc: 'Use the Encounters tab to create battles, challenges, and plot events', icon: Wand2 }
            ].map((item, i) => (
              <div key={i} className="bg-black/20 rounded-lg p-4 border border-white/5">
                <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <item.icon size={16} className="text-[rgb(var(--color-primary))]" />
                  {item.label}
                </h4>
                <p className="text-sm text-white/60 m-0">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-lg border border-indigo-500/30">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              💡 Pro Tip
            </h4>
            <p className="text-sm text-white/60 m-0">
              Each "Generate with AI" button lets you provide custom prompts to get exactly what you need for your campaign.
              You have full creative control without being locked into a specific framework!
            </p>
          </div>

          {onBack && (
            <div className="flex justify-center pt-4">
              <button className="btn btn-primary" onClick={onBack}>
                Start Building Your Campaign
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If viewing completed campaign frame
  if (viewingFrame && campaignFrame) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CheckCircle size={32} className="text-emerald-400" />
              Campaign Frame
            </h1>
            <p className="text-white/60">Your completed campaign frame for {campaign.name}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setViewingFrame(false)}>
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Pitch */}
          {campaignFrame.pitch && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Campaign Pitch</h3>
              <p className="text-white/80 leading-relaxed">{campaignFrame.pitch}</p>
            </div>
          )}

          {/* Tone & Feel */}
          {campaignFrame.toneAndFeel && campaignFrame.toneAndFeel.length > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Tone & Feel</h3>
              <div className="flex flex-wrap gap-2">
                {campaignFrame.toneAndFeel.map((tone, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm border border-white/10">{tone}</span>
                ))}
              </div>
            </div>
          )}

          {/* Themes */}
          {campaignFrame.themes && campaignFrame.themes.length > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Themes</h3>
              <div className="flex flex-wrap gap-2">
                {campaignFrame.themes.map((theme, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[rgb(var(--color-primary))/20] text-[rgb(var(--color-primary-light))] text-sm border border-[rgb(var(--color-primary))/30]">{theme}</span>
                ))}
              </div>
            </div>
          )}

          {/* Touchstones */}
          {campaignFrame.touchstones && campaignFrame.touchstones.length > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Touchstones</h3>
              <ul className="list-disc pl-5 space-y-1 text-white/80">
                {campaignFrame.touchstones.map((touchstone, i) => (
                  <li key={i}>{touchstone}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Overview */}
          {campaignFrame.overview && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Campaign Overview</h3>
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{campaignFrame.overview}</p>
            </div>
          )}

          {/* Inciting Incident */}
          {campaignFrame.incitingIncident && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Inciting Incident</h3>
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{campaignFrame.incitingIncident}</p>
            </div>
          )}

          {/* Principles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Principles */}
            {campaignFrame.playerPrinciples && campaignFrame.playerPrinciples.length > 0 && (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
                <h3 className="text-lg font-bold text-white mb-3">Player Principles</h3>
                <ul className="list-disc pl-5 space-y-2 text-white/80">
                  {campaignFrame.playerPrinciples.map((principle, i) => (
                    <li key={i}>{principle}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* GM Principles */}
            {campaignFrame.gmPrinciples && campaignFrame.gmPrinciples.length > 0 && (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
                <h3 className="text-lg font-bold text-white mb-3">GM Principles</h3>
                <ul className="list-disc pl-5 space-y-2 text-white/80">
                  {campaignFrame.gmPrinciples.map((principle, i) => (
                    <li key={i}>{principle}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Starting Quests */}
          {campaignFrame.startingQuests && campaignFrame.startingQuests.length > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Starting Quests</h3>
              <div className="space-y-3">
                {campaignFrame.startingQuests.map((quest, i) => (
                  <div key={i} className="p-4 bg-black/20 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <strong className="text-white">{quest.name}</strong>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${quest.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        quest.priority === 'medium' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                        {quest.priority}
                      </span>
                      {quest.hidden && <span className="text-xs text-white/40">(Hidden)</span>}
                    </div>
                    {quest.description && <p className="text-sm text-white/70 m-0">{quest.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Zero - Safety Tools */}
          {campaignFrame.sessionZero?.safetyTools && (
            (campaignFrame.sessionZero.safetyTools.lines?.length > 0 ||
              campaignFrame.sessionZero.safetyTools.veils?.length > 0 ||
              campaignFrame.sessionZero.safetyTools.otherBoundaries) && (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Safety Tools</h3>
                {campaignFrame.sessionZero.safetyTools.xCardEnabled && (
                  <div className="mb-4 inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                    <CheckCircle size={14} className="mr-2" /> X-Card Enabled
                  </div>
                )}

                <div className="space-y-4">
                  {campaignFrame.sessionZero.safetyTools.lines?.length > 0 && (
                    <div>
                      <strong className="text-red-400 block mb-2">Lines (Hard No)</strong>
                      <ul className="list-disc pl-5 space-y-1 text-white/80">
                        {campaignFrame.sessionZero.safetyTools.lines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {campaignFrame.sessionZero.safetyTools.veils?.length > 0 && (
                    <div>
                      <strong className="text-amber-400 block mb-2">Veils (Off-Screen)</strong>
                      <ul className="list-disc pl-5 space-y-1 text-white/80">
                        {campaignFrame.sessionZero.safetyTools.veils.map((veil, i) => (
                          <li key={i}>{veil}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {campaignFrame.sessionZero.safetyTools.otherBoundaries && (
                    <div>
                      <strong className="text-white block mb-2">Other Boundaries</strong>
                      <p className="text-white/80 whitespace-pre-wrap">{campaignFrame.sessionZero.safetyTools.otherBoundaries}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* Session Zero - Character Connections */}
          {campaignFrame.sessionZero?.characterConnections?.length > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Character Connections</h3>
              <div className="space-y-3">
                {campaignFrame.sessionZero.characterConnections.map((conn, i) => (
                  <div key={i} className="p-4 bg-black/20 rounded-lg border border-white/5">
                    <strong className="block text-white mb-1">{conn.question}</strong>
                    {conn.answer && <p className="text-sm text-white/70 italic m-0">{conn.answer}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Zero - World Facts */}
          {campaignFrame.sessionZero?.worldFacts?.length > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-4">World Facts</h3>
              <div className="space-y-2">
                {campaignFrame.sessionZero.worldFacts.map((fact, i) => (
                  <div key={i} className="p-3 bg-black/20 rounded-lg border border-white/5 flex flex-col gap-1">
                    <span className="text-white">{fact.fact}</span>
                    {(fact.category || fact.establishedBy) && (
                      <div className="text-xs text-white/40 flex items-center gap-2">
                        {fact.category && <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">{fact.category}</span>}
                        {fact.establishedBy && <span>by {fact.establishedBy}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Zero - Player Locations */}
          {campaignFrame.sessionZero?.playerLocations?.length > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Player Locations</h3>
              <div className="space-y-2">
                {campaignFrame.sessionZero.playerLocations.map((loc, i) => (
                  <div key={i} className={`p-3 bg-black/20 rounded-lg border ${loc.createAsLocation ? 'border-emerald-500/30' : 'border-white/5'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <strong className="text-white">{loc.name}</strong>
                      <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-white/60 uppercase tracking-wider">{loc.type}</span>
                      {loc.createAsLocation && <span className="text-xs text-emerald-400 font-medium">(Created as Location)</span>}
                    </div>
                    {loc.description && <p className="text-sm text-white/70 m-0">{loc.description}</p>}
                    {loc.mentionedBy && <div className="text-xs text-white/40 mt-1">Mentioned by {loc.mentionedBy}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Zero Questions (Legacy + New) */}
          {((campaignFrame.sessionZero?.questions?.length > 0) ||
            (campaignFrame.sessionZeroQuestions?.length > 0)) && (
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
                <h3 className="text-lg font-bold text-white mb-3">Session Zero Questions</h3>
                <ul className="list-disc pl-5 space-y-2 text-white/80">
                  {(campaignFrame.sessionZero?.questions || campaignFrame.sessionZeroQuestions || []).map((question, i) => (
                    <li key={i}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </div>
    );
  }

  // If wizard is started, show the wizard
  if (wizardStarted) {
    return (
      <CampaignBuilderWizard
        userId={userId}
        campaign={campaign}
        campaignFrame={campaignFrame}
        wizardState={wizardState}
        onComplete={handleComplete}
        addNPC={addNPC}
        addLocation={addLocation}
        addLore={addLore}
        addEncounter={addEncounter}
        addTimelineEvent={addTimelineEvent}
        updateCampaign={updateCampaign}
        addQuest={addQuest}
        addAdversary={addAdversary}
        addEnvironment={addEnvironment}
        regenerateMode={regenerateMode}
      />
    );
  }

  // Check if a completed campaign frame exists
  const hasCompletedFrame = campaignFrame && campaignFrame.status === 'completed';

  // Otherwise show the welcome/template selection screen
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-3 py-4">
        <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-4">
          <Wand2 size={40} className="text-[rgb(var(--color-primary))]" />
          Campaign Builder
        </h1>
        <p className="text-xl text-white/60">Create a complete campaign frame to guide your adventure</p>
      </div>

      {/* Completed Campaign Frame */}
      {hasCompletedFrame && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-emerald-400 mb-2 flex items-center gap-2">
            <CheckCircle size={24} />
            Campaign Frame Completed!
          </h3>
          <p className="text-white/70 mb-5">
            You have a completed campaign frame for this campaign.
          </p>
          <div className="flex gap-4 flex-wrap">
            <button className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-500" onClick={() => setViewingFrame(true)}>
              <Eye size={20} />
              View Campaign Frame
            </button>
            <button className="btn btn-secondary" onClick={handleRegenerateContent}>
              <RefreshCw size={18} />
              Regenerate Campaign Content
            </button>
          </div>
        </div>
      )}

      {/* Continue Draft */}
      {hasDraft && (
        <div className="bg-[rgb(var(--color-primary))/10] border border-[rgb(var(--color-primary))/30] rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-[rgb(var(--color-primary-light))] mb-2 flex items-center gap-2">
            <FileText size={24} />
            Resume Draft
          </h3>
          <p className="text-white/70 mb-5">
            You have an unfinished campaign frame. Continue where you left off!
          </p>
          <div className="flex gap-4">
            <button className="btn btn-primary" onClick={handleContinueDraft}>
              Continue Draft
            </button>
            <button className="btn btn-danger" onClick={handleDeleteDraft}>
              Delete Draft
            </button>
          </div>
        </div>
      )}

      {/* Start Fresh */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6">
        <h3 className="text-xl font-bold text-white mb-2">Start from Scratch</h3>
        <p className="text-white/60 mb-5">
          Build your campaign frame from the ground up with guidance at every step.
        </p>
        <button className="btn btn-primary" onClick={() => handleStartWizard()}>
          <Sparkles size={20} />
          Start Blank Campaign Frame
        </button>
      </div>

      {/* Templates */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Or Choose a Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`
                cursor-pointer transition-all duration-200 rounded-xl p-5 border
                ${selectedTemplate?.id === template.id
                  ? 'bg-[rgb(var(--color-primary))/10] border-[rgb(var(--color-primary))] ring-1 ring-[rgb(var(--color-primary))]'
                  : 'bg-[var(--bg-secondary)] border-white/5 hover:border-white/20 hover:bg-white/5'}
              `}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="mb-4">
                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-[rgb(var(--color-primary))] transition-colors">
                  {template.name}
                </h4>
                <div className="text-xs text-white/40 mb-3 flex items-center gap-1">
                  Complexity:
                  <div className="flex">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-2 h-2 rounded-full mx-0.5 ${i <= template.complexity ? 'bg-[rgb(var(--color-primary))]' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-white/60 line-clamp-3">
                  {template.pitch}
                </p>
              </div>
              {selectedTemplate?.id === template.id && (
                <button
                  className="btn btn-primary w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartWizard(template);
                  }}
                >
                  Use This Template
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-[var(--card-bg)] border-l-4 border-[rgb(var(--color-primary))] rounded-r-lg p-6 mt-8">
        <h4 className="text-lg font-bold text-white mb-2">What's a Campaign Frame?</h4>
        <p className="text-sm text-white/70 mb-2">
          A campaign frame is a structured guide that defines the core elements of your campaign:
        </p>
        <ul className="list-disc pl-5 text-sm text-white/70 mb-3 space-y-1">
          <li>Pitch, themes, and tone</li>
          <li>World overview and touchstones</li>
          <li>Player and GM principles</li>
          <li>Inciting incident and starting quests</li>
          <li>Campaign mechanics and session zero tools</li>
        </ul>
        <p className="text-sm text-white/70">
          The wizard will guide you through all 15 steps with AI assistance available at each stage!
        </p>
      </div>
    </div>
  );
}
