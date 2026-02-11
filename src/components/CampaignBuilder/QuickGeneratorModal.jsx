import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import GenerationModeSelector from './GenerationModeSelector';
import TemplateGenerator from './generators/TemplateGenerator';
import PromptGenerator from './generators/PromptGenerator';
import DirectAPIGenerator from './generators/DirectAPIGenerator';
import { useAIGeneration } from '../../hooks/useAIGeneration';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateNPCPortrait } from '../../services/portraitGenerator';
import { Wand2, AlertCircle, ImageIcon, Loader2 } from 'lucide-react';

/**
 * Quick Generator Modal
 * Reusable modal for quick content generation
 * Supports NPC, Location, and Encounter generation
 */
export default function QuickGeneratorModal({
  isOpen,
  onClose,
  type,
  campaign,
  campaignFrame,
  existingContent = [],
  onSave
}) {
  const [mode, setMode] = useState('template');
  const [editableResult, setEditableResult] = useState(null);
  const [generatePortrait, setGeneratePortrait] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [portraitError, setPortraitError] = useState(null);

  const {
    generating,
    result,
    error,
    generatedPrompt,
    generateFromTemplate,
    generatePrompt,
    parsePastedResponse,
    generateWithAPI,
    clearGeneration
  } = useAIGeneration();

  const { keys, hasKey, getEffectiveKey } = useAPIKey(campaign?.createdBy);

  // Check if OpenAI key is available (own or shared)
  const openaiKeyInfo = getEffectiveKey('openai');
  const hasOpenAIKey = !!openaiKeyInfo?.key;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      clearGeneration();
      setEditableResult(null);
      setMode('template');
      setGeneratePortrait(false);
      setGeneratingPortrait(false);
      setPortraitError(null);
    }
  }, [isOpen]);

  // Update editable result when generation completes
  useEffect(() => {
    if (result) {
      setEditableResult(result);

      // Auto-generate portrait if enabled and it's an NPC
      if (type === 'npc' && generatePortrait && hasOpenAIKey && !result.avatarUrl) {
        handleGeneratePortrait(result);
      }
    }
  }, [result]);

  // Generate portrait for NPC
  const handleGeneratePortrait = async (npcData = null) => {
    const npc = npcData || editableResult;
    const keyInfo = getEffectiveKey('openai');

    if (!npc || !keyInfo?.key) {
      setPortraitError('OpenAI API key required for portrait generation');
      return;
    }

    setGeneratingPortrait(true);
    setPortraitError(null);

    try {
      const gameSystem = campaign?.gameSystem || 'daggerheart';
      const campaignId = campaign?.id;
      const avatarUrl = await generateNPCPortrait(npc, keyInfo.key, gameSystem, campaignId);

      setEditableResult(prev => ({
        ...prev,
        avatarUrl
      }));
    } catch (err) {
      console.error('Portrait generation failed:', err);
      setPortraitError(err.message || 'Failed to generate portrait');
    } finally {
      setGeneratingPortrait(false);
    }
  };

  const getTypeLabel = () => {
    const labels = {
      npc: 'NPC',
      location: 'Location',
      encounter: 'Encounter'
    };
    return labels[type] || 'Content';
  };

  const handleTemplateGenerate = async (context) => {
    try {
      await generateFromTemplate(type, context);
    } catch (err) {
      console.error('Template generation failed:', err);
    }
  };

  const handlePromptGenerate = () => {
    const context = {
      campaign,
      campaignFrame,
      existingNPCs: type === 'npc' ? existingContent : undefined,
      existingLocations: type === 'location' ? existingContent : undefined,
      requirements: {}
    };
    generatePrompt(type, context);
  };

  const handleParseResponse = (responseText) => {
    try {
      parsePastedResponse(type, responseText);
    } catch (err) {
      console.error('Parse failed:', err);
    }
  };

  const handleAPIGenerate = async (requirements) => {
    const context = {
      campaign,
      campaignFrame,
      existingNPCs: type === 'npc' ? existingContent : undefined,
      existingLocations: type === 'location' ? existingContent : undefined,
      requirements
    };

    try {
      await generateWithAPI(type, context, keys[keys.provider], keys.provider);
    } catch (err) {
      console.error('API generation failed:', err);
    }
  };

  const handleSave = () => {
    if (editableResult) {
      onSave(editableResult);
      onClose();
    }
  };

  const handleFieldChange = (field, value) => {
    setEditableResult({
      ...editableResult,
      [field]: value
    });
  };

  const renderGenerator = () => {
    switch (mode) {
      case 'template':
        return (
          <TemplateGenerator
            type={type}
            requirements={{}}
            onGenerate={handleTemplateGenerate}
            generating={generating}
          />
        );

      case 'prompt':
        return (
          <PromptGenerator
            type={type}
            prompt={generatedPrompt}
            onGeneratePrompt={handlePromptGenerate}
            onParseResponse={handleParseResponse}
            generating={generating}
          />
        );

      case 'api':
        return (
          <DirectAPIGenerator
            type={type}
            apiKey={keys[keys.provider]}
            provider={keys.provider}
            onGenerateWithAPI={handleAPIGenerate}
            onOpenAPISettings={() => alert('API Settings not yet implemented')}
            generating={generating}
          />
        );

      default:
        return null;
    }
  };

  const renderResultsPreview = () => {
    if (!editableResult) return null;

    if (type === 'npc') {
      return (
        <div className="mt-6 p-4 bg-[var(--bg-secondary)] border border-[rgb(var(--color-primary))] rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Wand2 size={20} className="text-[rgb(var(--color-primary))]" />
            Generated NPC
          </h3>
          <div className="space-y-4">
            {/* Portrait Section */}
            <div className="border-b border-white/10 pb-4 mb-2">
              <label className="block text-sm font-semibold text-white/60 mb-2">Portrait</label>
              <div className="flex justify-center">
                {editableResult.avatarUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={editableResult.avatarUrl} alt={editableResult.name} className="w-36 h-36 object-cover rounded-lg border-2 border-white/10" />
                    <button
                      className="btn btn-sm btn-secondary text-xs"
                      onClick={() => handleGeneratePortrait()}
                      disabled={generatingPortrait || !hasOpenAIKey}
                    >
                      {generatingPortrait ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <ImageIcon size={14} />
                          Regenerate
                        </>
                      )}
                    </button>
                  </div>
                ) : generatingPortrait ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-8 text-white/40">
                    <Loader2 size={32} className="animate-spin" />
                    <span>Generating portrait...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 text-white/40 bg-black/20 border-2 border-dashed border-white/10 rounded-lg min-w-[150px]">
                    <ImageIcon size={32} className="opacity-50" />
                    <span>No portrait</span>
                    {hasOpenAIKey && (
                      <button
                        className="btn btn-sm btn-secondary text-xs"
                        onClick={() => handleGeneratePortrait()}
                      >
                        <ImageIcon size={14} />
                        Generate Portrait
                      </button>
                    )}
                    {!hasOpenAIKey && (
                      <span className="text-xs opacity-70">OpenAI key required</span>
                    )}
                  </div>
                )}
              </div>
              {portraitError && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={14} />
                  {portraitError}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Name *</label>
              <input
                type="text"
                value={editableResult.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Occupation</label>
              <input
                type="text"
                value={editableResult.occupation || ''}
                onChange={(e) => handleFieldChange('occupation', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Location</label>
              <input
                type="text"
                value={editableResult.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Relationship</label>
              <select
                value={editableResult.relationship || 'neutral'}
                onChange={(e) => handleFieldChange('relationship', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              >
                <option value="ally">Ally</option>
                <option value="neutral">Neutral</option>
                <option value="enemy">Enemy</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Description</label>
              <textarea
                value={editableResult.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Notes</label>
              <textarea
                value={editableResult.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">First Met</label>
              <textarea
                value={editableResult.firstMet || ''}
                onChange={(e) => handleFieldChange('firstMet', e.target.value)}
                rows={2}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === 'location') {
      return (
        <div className="mt-6 p-4 bg-[var(--bg-secondary)] border border-[rgb(var(--color-primary))] rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Wand2 size={20} className="text-[rgb(var(--color-primary))]" />
            Generated Location
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Name *</label>
              <input
                type="text"
                value={editableResult.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Type</label>
              <select
                value={editableResult.type || 'other'}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              >
                <option value="city">City</option>
                <option value="town">Town</option>
                <option value="village">Village</option>
                <option value="dungeon">Dungeon</option>
                <option value="wilderness">Wilderness</option>
                <option value="landmark">Landmark</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Region</label>
              <input
                type="text"
                value={editableResult.region || ''}
                onChange={(e) => handleFieldChange('region', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Description</label>
              <textarea
                value={editableResult.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Notable Features</label>
              <textarea
                value={editableResult.notableFeatures || ''}
                onChange={(e) => handleFieldChange('notableFeatures', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Secrets</label>
              <textarea
                value={editableResult.secrets || ''}
                onChange={(e) => handleFieldChange('secrets', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Inhabitants</label>
              <textarea
                value={editableResult.inhabitants || ''}
                onChange={(e) => handleFieldChange('inhabitants', e.target.value)}
                rows={2}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === 'encounter') {
      return (
        <div className="mt-6 p-4 bg-[var(--bg-secondary)] border border-[rgb(var(--color-primary))] rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Wand2 size={20} className="text-[rgb(var(--color-primary))]" />
            Generated Encounter
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Name *</label>
              <input
                type="text"
                value={editableResult.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Difficulty</label>
              <select
                value={editableResult.difficulty || 'medium'}
                onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="deadly">Deadly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Environment</label>
              <textarea
                value={editableResult.environment || ''}
                onChange={(e) => handleFieldChange('environment', e.target.value)}
                rows={2}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Description</label>
              <textarea
                value={editableResult.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Enemies</label>
              <textarea
                value={editableResult.enemies || ''}
                onChange={(e) => handleFieldChange('enemies', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Tactics</label>
              <textarea
                value={editableResult.tactics || ''}
                onChange={(e) => handleFieldChange('tactics', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[80px]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Rewards</label>
              <textarea
                value={editableResult.rewards || ''}
                onChange={(e) => handleFieldChange('rewards', e.target.value)}
                rows={2}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generate ${getTypeLabel()}`}
      size="large"
    >
      <div className="flex flex-col gap-6 min-h-[400px]">
        <GenerationModeSelector
          mode={mode}
          onModeChange={setMode}
          hasAPIKey={hasKey}
        />

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {/* Portrait generation option for NPCs */}
          {type === 'npc' && !editableResult && (
            <div className="p-3 bg-[var(--bg-secondary)] border border-white/10 rounded-lg mb-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-white select-none">
                <input
                  type="checkbox"
                  checked={generatePortrait}
                  onChange={(e) => setGeneratePortrait(e.target.checked)}
                  disabled={!hasOpenAIKey}
                  className="w-4 h-4 rounded border-gray-600 bg-black/40 text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
                />
                <ImageIcon size={16} />
                <span>Generate AI Portrait</span>
                {!hasOpenAIKey && (
                  <span className="text-sm text-white/50 ml-1">(OpenAI key required)</span>
                )}
              </label>
            </div>
          )}

          {renderGenerator()}
          {renderResultsPreview()}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {editableResult && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setEditableResult(null)}
              >
                Clear & Regenerate
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
              >
                Save {getTypeLabel()}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
