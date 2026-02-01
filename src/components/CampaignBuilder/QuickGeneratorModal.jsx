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
import './CampaignBuilder.css';

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
      const avatarUrl = await generateNPCPortrait(npc, keyInfo.key, gameSystem);

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
        <div className="results-preview">
          <h3>
            <Wand2 size={20} />
            Generated NPC
          </h3>
          <div className="preview-fields">
            {/* Portrait Section */}
            <div className="preview-field portrait-section">
              <label>Portrait</label>
              <div className="portrait-container">
                {editableResult.avatarUrl ? (
                  <div className="portrait-preview">
                    <img src={editableResult.avatarUrl} alt={editableResult.name} />
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleGeneratePortrait()}
                      disabled={generatingPortrait || !hasOpenAIKey}
                    >
                      {generatingPortrait ? (
                        <>
                          <Loader2 size={14} className="spinner" />
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
                  <div className="portrait-generating">
                    <Loader2 size={32} className="spinner" />
                    <span>Generating portrait...</span>
                  </div>
                ) : (
                  <div className="portrait-empty">
                    <ImageIcon size={32} />
                    <span>No portrait</span>
                    {hasOpenAIKey && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleGeneratePortrait()}
                      >
                        <ImageIcon size={14} />
                        Generate Portrait
                      </button>
                    )}
                    {!hasOpenAIKey && (
                      <span className="portrait-hint">OpenAI key required</span>
                    )}
                  </div>
                )}
              </div>
              {portraitError && (
                <div className="portrait-error">
                  <AlertCircle size={14} />
                  {portraitError}
                </div>
              )}
            </div>

            <div className="preview-field">
              <label>Name *</label>
              <input
                type="text"
                value={editableResult.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Occupation</label>
              <input
                type="text"
                value={editableResult.occupation || ''}
                onChange={(e) => handleFieldChange('occupation', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Location</label>
              <input
                type="text"
                value={editableResult.location || ''}
                onChange={(e) => handleFieldChange('location', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Relationship</label>
              <select
                value={editableResult.relationship || 'neutral'}
                onChange={(e) => handleFieldChange('relationship', e.target.value)}
              >
                <option value="ally">Ally</option>
                <option value="neutral">Neutral</option>
                <option value="enemy">Enemy</option>
              </select>
            </div>
            <div className="preview-field">
              <label>Description</label>
              <textarea
                value={editableResult.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Notes</label>
              <textarea
                value={editableResult.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>First Met</label>
              <textarea
                value={editableResult.firstMet || ''}
                onChange={(e) => handleFieldChange('firstMet', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === 'location') {
      return (
        <div className="results-preview">
          <h3>
            <Wand2 size={20} />
            Generated Location
          </h3>
          <div className="preview-fields">
            <div className="preview-field">
              <label>Name *</label>
              <input
                type="text"
                value={editableResult.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Type</label>
              <select
                value={editableResult.type || 'other'}
                onChange={(e) => handleFieldChange('type', e.target.value)}
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
            <div className="preview-field">
              <label>Region</label>
              <input
                type="text"
                value={editableResult.region || ''}
                onChange={(e) => handleFieldChange('region', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Description</label>
              <textarea
                value={editableResult.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Notable Features</label>
              <textarea
                value={editableResult.notableFeatures || ''}
                onChange={(e) => handleFieldChange('notableFeatures', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Secrets</label>
              <textarea
                value={editableResult.secrets || ''}
                onChange={(e) => handleFieldChange('secrets', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Inhabitants</label>
              <textarea
                value={editableResult.inhabitants || ''}
                onChange={(e) => handleFieldChange('inhabitants', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>
      );
    }

    if (type === 'encounter') {
      return (
        <div className="results-preview">
          <h3>
            <Wand2 size={20} />
            Generated Encounter
          </h3>
          <div className="preview-fields">
            <div className="preview-field">
              <label>Name *</label>
              <input
                type="text"
                value={editableResult.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Difficulty</label>
              <select
                value={editableResult.difficulty || 'medium'}
                onChange={(e) => handleFieldChange('difficulty', e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="deadly">Deadly</option>
              </select>
            </div>
            <div className="preview-field">
              <label>Environment</label>
              <textarea
                value={editableResult.environment || ''}
                onChange={(e) => handleFieldChange('environment', e.target.value)}
                rows={2}
              />
            </div>
            <div className="preview-field">
              <label>Description</label>
              <textarea
                value={editableResult.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Enemies</label>
              <textarea
                value={editableResult.enemies || ''}
                onChange={(e) => handleFieldChange('enemies', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Tactics</label>
              <textarea
                value={editableResult.tactics || ''}
                onChange={(e) => handleFieldChange('tactics', e.target.value)}
              />
            </div>
            <div className="preview-field">
              <label>Rewards</label>
              <textarea
                value={editableResult.rewards || ''}
                onChange={(e) => handleFieldChange('rewards', e.target.value)}
                rows={2}
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
      <div className="quick-generator-modal">
        <GenerationModeSelector
          mode={mode}
          onModeChange={setMode}
          hasAPIKey={hasKey}
        />

        {error && (
          <div className="generator-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="generator-content">
          {/* Portrait generation option for NPCs */}
          {type === 'npc' && !editableResult && (
            <div className="portrait-option">
              <label className="checkbox-control">
                <input
                  type="checkbox"
                  checked={generatePortrait}
                  onChange={(e) => setGeneratePortrait(e.target.checked)}
                  disabled={!hasOpenAIKey}
                />
                <ImageIcon size={16} />
                <span>Generate AI Portrait</span>
                {!hasOpenAIKey && (
                  <span className="option-hint">(OpenAI key required)</span>
                )}
              </label>
            </div>
          )}

          {renderGenerator()}
          {renderResultsPreview()}
        </div>

        <div className="modal-actions">
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
