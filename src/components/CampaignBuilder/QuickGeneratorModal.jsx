import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import GenerationModeSelector from './GenerationModeSelector';
import TemplateGenerator from './generators/TemplateGenerator';
import PromptGenerator from './generators/PromptGenerator';
import DirectAPIGenerator from './generators/DirectAPIGenerator';
import { useAIGeneration } from '../../hooks/useAIGeneration';
import { useAPIKey } from '../../hooks/useAPIKey';
import { Wand2, AlertCircle } from 'lucide-react';
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

  const { keys, hasKey } = useAPIKey(campaign?.createdBy);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      clearGeneration();
      setEditableResult(null);
      setMode('template');
    }
  }, [isOpen]);

  // Update editable result when generation completes
  useEffect(() => {
    if (result) {
      setEditableResult(result);
    }
  }, [result]);

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
