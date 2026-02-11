import { useState } from 'react';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import WizardProgress from './wizard/WizardProgress';
import StepNavigation from './wizard/StepNavigation';
import PitchStep from './wizard/steps/PitchStep';
import ToneFeelStep from './wizard/steps/ToneFeel Step';
import ThemesStep from './wizard/steps/ThemesStep';
import TouchstonesStep from './wizard/steps/TouchstonesStep';
import OverviewStep from './wizard/steps/OverviewStep';
import CommunitiesStep from './wizard/steps/CommunitiesStep';
import AncestriesStep from './wizard/steps/AncestriesStep';
import ClassesStep from './wizard/steps/ClassesStep';
import PlayerPrinciplesStep from './wizard/steps/PlayerPrinciplesStep';
import GMPrinciplesStep from './wizard/steps/GMPrinciplesStep';
import DistinctionsStep from './wizard/steps/DistinctionsStep';
import IncitingIncidentStep from './wizard/steps/IncitingIncidentStep';
import StartingQuestsStep from './wizard/steps/StartingQuestsStep';
import CampaignMechanicsStep from './wizard/steps/CampaignMechanicsStep';
import SessionZeroStep from './wizard/steps/SessionZeroStep';
import { useAPIKey } from '../../hooks/useAPIKey';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { generateCampaignContent } from '../../services/campaignGenerator';
import { generateMap } from '../../services/mapGenerator';

export default function CampaignBuilderWizard({
  userId,
  campaign,
  campaignFrame,
  wizardState,
  onComplete,
  addNPC,
  addLocation,
  addLore,
  addEncounter,
  addTimelineEvent,
  updateCampaign,
  addQuest
}) {
  const { hasKey, keys, getEffectiveKey, recordUsage, sharedKeysEnabled, checkUsageLimit } = useAPIKey(userId);
  const {
    currentStep,
    completedSteps,
    data,
    updateData,
    goToStep,
    nextStep,
    previousStep,
    saveDraft,
    complete,
    canProceed,
    isComplete
  } = wizardState;

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [generationComplete, setGenerationComplete] = useState(false);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveDraft();
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setGenerating(true);

    try {
      // Save the campaign frame first
      setGenerationProgress('Step 1/6: Saving campaign frame...');
      await complete();

      // Generate campaign content
      setGenerationProgress('Step 2/6: Generating content...');

      // Get effective API key (user's own or shared)
      const anthropicResult = getEffectiveKey('anthropic');
      const openaiResult = getEffectiveKey('openai');

      let apiKey = null;
      let provider = 'anthropic';
      let isUsingSharedKey = false;

      if (anthropicResult.key) {
        apiKey = anthropicResult.key;
        provider = 'anthropic';
        isUsingSharedKey = anthropicResult.isShared;
      } else if (openaiResult.key) {
        apiKey = openaiResult.key;
        provider = 'openai';
        isUsingSharedKey = openaiResult.isShared;
      }

      // Check if we hit usage limits for shared keys
      if (!apiKey && (anthropicResult.usageCheck || openaiResult.usageCheck)) {
        const usageCheck = anthropicResult.usageCheck || openaiResult.usageCheck;
        setGenerationProgress(`Error: ${usageCheck.reason}`);
        setTimeout(() => {
          setGenerating(false);
          if (onComplete) onComplete();
        }, 3000);
        return;
      }

      console.log('Starting content generation with API key:', apiKey ? 'Yes' : 'No');
      const generatedContent = await generateCampaignContent(data, campaign, apiKey, provider);
      console.log('Generated content:', generatedContent);

      // Save NPCs
      setGenerationProgress(`Step 3/6: Saving ${generatedContent.npcs.length} NPCs...`);
      for (let i = 0; i < generatedContent.npcs.length; i++) {
        const npc = generatedContent.npcs[i];
        console.log(`Saving NPC ${i + 1}:`, npc);
        try {
          await addNPC(npc);
          console.log(`NPC ${i + 1} saved successfully`);
        } catch (err) {
          console.error(`Failed to save NPC ${i + 1}:`, err);
        }
      }

      // Save Locations
      setGenerationProgress(`Step 4/6: Saving ${generatedContent.locations.length} locations...`);
      for (let i = 0; i < generatedContent.locations.length; i++) {
        const location = generatedContent.locations[i];
        console.log(`Saving Location ${i + 1}:`, location);
        try {
          await addLocation(location);
          console.log(`Location ${i + 1} saved successfully`);
        } catch (err) {
          console.error(`Failed to save Location ${i + 1}:`, err);
        }
      }

      // Save Lore
      setGenerationProgress(`Step 5/6: Saving ${generatedContent.lore.length} lore entries...`);
      for (let i = 0; i < generatedContent.lore.length; i++) {
        const lore = generatedContent.lore[i];
        console.log(`Saving Lore ${i + 1}:`, lore);
        try {
          await addLore(lore);
          console.log(`Lore ${i + 1} saved successfully`);
        } catch (err) {
          console.error(`Failed to save Lore ${i + 1}:`, err);
        }
      }

      // Save Encounters
      setGenerationProgress(`Step 6/6: Saving ${generatedContent.encounters.length} encounters...`);
      for (let i = 0; i < generatedContent.encounters.length; i++) {
        const encounter = generatedContent.encounters[i];
        console.log(`Saving Encounter ${i + 1}:`, encounter);
        try {
          await addEncounter(encounter);
          console.log(`Encounter ${i + 1} saved successfully`);
        } catch (err) {
          console.error(`Failed to save Encounter ${i + 1}:`, err);
        }
      }

      // Save Timeline Events
      setGenerationProgress(`Step 6/6: Saving ${generatedContent.timelineEvents.length} timeline events...`);
      for (let i = 0; i < generatedContent.timelineEvents.length; i++) {
        const event = generatedContent.timelineEvents[i];
        console.log(`Saving Timeline Event ${i + 1}:`, event);
        try {
          await addTimelineEvent(event);
          console.log(`Timeline Event ${i + 1} saved successfully`);
        } catch (err) {
          console.error(`Failed to save Timeline Event ${i + 1}:`, err);
        }
      }

      // Save Starting Quests
      if (data.startingQuests?.length > 0 && addQuest) {
        setGenerationProgress(`Saving ${data.startingQuests.length} starting quests...`);
        for (let i = 0; i < data.startingQuests.length; i++) {
          const quest = data.startingQuests[i];
          console.log(`Saving Starting Quest ${i + 1}:`, quest);
          try {
            await addQuest({
              name: quest.name,
              description: quest.description,
              status: 'active',
              priority: quest.priority || 'medium',
              objectives: quest.objectives || [],
              rewards: quest.rewards || '',
              hidden: quest.hidden || false
            });
            console.log(`Starting Quest ${i + 1} saved successfully`);
          } catch (err) {
            console.error(`Failed to save Starting Quest ${i + 1}:`, err);
          }
        }
      }

      // Create Locations from Session Zero
      const playerLocations = data.sessionZero?.playerLocations?.filter(l => l.createAsLocation && l.name) || [];
      if (playerLocations.length > 0) {
        setGenerationProgress(`Creating ${playerLocations.length} player locations...`);
        for (let i = 0; i < playerLocations.length; i++) {
          const loc = playerLocations[i];
          console.log(`Creating Player Location ${i + 1}:`, loc);
          try {
            await addLocation({
              name: loc.name,
              type: loc.type || 'other',
              region: loc.region || '',
              description: loc.description || `Established during session zero${loc.mentionedBy ? ` by ${loc.mentionedBy}` : ''}.`,
              source: 'session-zero'
            });
            console.log(`Player Location ${i + 1} created successfully`);
          } catch (err) {
            console.error(`Failed to create Player Location ${i + 1}:`, err);
          }
        }
      }

      // Generate World Map
      setGenerationProgress('Bonus: Generating world map...');
      try {
        console.log('Generating world map with locations...');
        // Get OpenAI key for DALL-E image generation (user's own or shared)
        const openaiEffective = getEffectiveKey('openai');
        const openaiKey = openaiEffective.key;
        const generateImage = !!openaiKey; // Only generate image if we have OpenAI key

        const mapData = await generateMap(
          {
            campaign,
            locations: generatedContent.locations,
            mapType: 'world',
            mapName: `${campaign.name} World Map`
          },
          apiKey,
          provider,
          openaiKey,
          generateImage
        );

        console.log('World map generated:', mapData);

        // Save map to campaign
        if (updateCampaign) {
          // Upload image to Firebase Storage if we have one
          let imageDownloadUrl = '';
          const hasImage = !!mapData.imageUrl;

          if (hasImage) {
            try {
              console.log('Uploading world map image to Firebase Storage...');
              const timestamp = Date.now();
              const imagePath = `campaigns/${campaign.id}/maps/world-map-${timestamp}.png`;
              const imageRef = ref(storage, imagePath);

              // Upload base64 image to Storage
              await uploadString(imageRef, mapData.imageUrl, 'data_url');

              // Get the download URL
              imageDownloadUrl = await getDownloadURL(imageRef);
              console.log('World map image uploaded successfully:', imageDownloadUrl);
            } catch (error) {
              console.error('Failed to upload world map image to Storage:', error);
              // Continue without image - we still save the description
            }
          }

          await updateCampaign({
            worldMap: imageDownloadUrl || null, // Firebase Storage URL (small string) instead of base64
            mapDescription: mapData.description,
            // Stringify arrays to avoid Firestore nested entity errors
            mapRegions: JSON.stringify(mapData.regions || []),
            mapFeatures: JSON.stringify(mapData.features || [])
          });
          console.log('World map saved to campaign', imageDownloadUrl ? '(with image)' : '(description only)');
        }
      } catch (err) {
        console.error('Failed to generate world map (non-critical):', err);
        // Don't fail the whole process if map generation fails
      }

      setGenerationProgress('Complete! Campaign content and world map generated.');
      setGenerationComplete(true);

      // Record usage if using shared key
      if (isUsingSharedKey && recordUsage) {
        await recordUsage();
      }

      // Give user a moment to see the success message
      setTimeout(() => {
        setGenerating(false);
        if (onComplete) {
          onComplete();
        }
      }, 2000);
    } catch (error) {
      console.error('Error generating campaign content:', error);
      setGenerationProgress(`Error: ${error.message}`);
      setTimeout(() => {
        setGenerating(false);
        if (onComplete) {
          onComplete();
        }
      }, 3000);
    }
  };

  // Show generating screen
  if (generating) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
        {!generationComplete ? (
          <>
            <Loader2 size={64} className="text-[rgb(var(--color-primary))] mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Generating Your Campaign...</h2>
            <p className="text-lg text-white/60 mb-8 max-w-lg mx-auto">
              {generationProgress}
            </p>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              This may take a few moments. We're creating NPCs, locations, lore, encounters, and timeline events based on your campaign frame.
            </p>
          </>
        ) : (
          <>
            <Sparkles size={64} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Campaign Generated!</h2>
            <p className="text-lg text-white/60 mb-8 max-w-lg mx-auto">
              Your campaign is ready to play! Check out the NPCs, Locations, Lore, and other sections to see your generated content.
            </p>
          </>
        )}
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <CheckCircle size={64} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Campaign Frame Complete!</h2>
        <p className="text-white/60 mb-8 max-w-lg mx-auto">
          Your campaign frame has been saved and is now available throughout your campaign.
        </p>
        <button className="btn btn-primary px-8 py-3 text-lg" onClick={onComplete}>
          Back to Campaign
        </button>
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    const stepProps = {
      value: getStepData(currentStep, data),
      onChange: (value) => updateData(getStepKey(currentStep), value),
      campaign,
      userId,
      hasAPIKey: hasKey()
    };

    switch (currentStep) {
      case 0:
        return <PitchStep {...stepProps} />;
      case 1:
        return <ToneFeelStep {...stepProps} />;
      case 2:
        return <ThemesStep {...stepProps} />;
      case 3:
        return <TouchstonesStep {...stepProps} />;
      case 4:
        return <OverviewStep {...stepProps} />;
      case 5:
        return <CommunitiesStep {...stepProps} />;
      case 6:
        return <AncestriesStep {...stepProps} />;
      case 7:
        return <ClassesStep {...stepProps} />;
      case 8:
        return <PlayerPrinciplesStep {...stepProps} />;
      case 9:
        return <GMPrinciplesStep {...stepProps} />;
      case 10:
        return <DistinctionsStep {...stepProps} />;
      case 11:
        return <IncitingIncidentStep {...stepProps} />;
      case 12:
        return <StartingQuestsStep {...stepProps} campaign={campaign} />;
      case 13:
        return <CampaignMechanicsStep {...stepProps} />;
      case 14:
        return <SessionZeroStep {...stepProps} />;
      default:
        return null;
    }
  };

  // Review step (after step 14)
  if (currentStep === 15) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <WizardProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />

        <div className="bg-[var(--bg-secondary)] rounded-xl border border-white/5 p-6 md:p-8">
          <div className="mb-6 border-b border-white/5 pb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Review & Complete</h2>
            <p className="text-white/60">Review your campaign frame and complete the wizard.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-black/20 rounded-xl p-6 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4">Campaign Frame Summary</h3>
              <div className="space-y-4">
                <div>
                  <strong className="text-white/80 block mb-1">Pitch:</strong>
                  <p className="text-white/60 text-sm">{data.pitch || 'Not set'}</p>
                </div>
                <div>
                  <strong className="text-white/80 block mb-1">Tone & Feel:</strong>
                  <p className="text-white/60 text-sm">{data.toneAndFeel.length > 0 ? data.toneAndFeel.join(', ') : 'Not set'}</p>
                </div>
                <div>
                  <strong className="text-white/80 block mb-1">Themes:</strong>
                  <p className="text-white/60 text-sm">{data.themes.length > 0 ? data.themes.join(', ') : 'Not set'}</p>
                </div>
                <div>
                  <strong className="text-white/80 block mb-1">Touchstones:</strong>
                  <p className="text-white/60 text-sm">{data.touchstones.length > 0 ? data.touchstones.join(', ') : 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                className="btn btn-primary px-8 py-3 text-lg flex items-center gap-3"
                onClick={handleComplete}
              >
                <CheckCircle size={24} />
                Complete Campaign Frame
              </button>
            </div>
          </div>
        </div>

        <StepNavigation
          currentStep={currentStep}
          totalSteps={16}
          canProceed={true}
          onPrevious={previousStep}
          onNext={handleComplete}
          onSaveDraft={handleSaveDraft}
          saving={saving}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <WizardProgress
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      <StepNavigation
        currentStep={currentStep}
        totalSteps={15}
        canProceed={canProceed()}
        onPrevious={previousStep}
        onNext={nextStep}
        onSaveDraft={handleSaveDraft}
        saving={saving}
      />
    </div>
  );
}

// Helper functions
function getStepKey(stepIndex) {
  const keys = [
    'pitch',
    'toneAndFeel',
    'themes',
    'touchstones',
    'overview',
    'communities',
    'ancestries',
    'classes',
    'playerPrinciples',
    'gmPrinciples',
    'distinctions',
    'incitingIncident',
    'startingQuests',     // NEW - step 12
    'campaignMechanics',  // Was step 12, now 13
    'sessionZero'         // Changed from sessionZeroQuestions, now step 14
  ];
  return keys[stepIndex];
}

function getStepData(stepIndex, data) {
  return data[getStepKey(stepIndex)];
}
