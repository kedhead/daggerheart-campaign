import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import DirectAPIGenerator from './generators/DirectAPIGenerator';
import { useAIGeneration } from '../../hooks/useAIGeneration';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateNPCPortrait } from '../../services/portraitGenerator';
import { generateAdversaryStatblock } from '../../services/adversaryGenerator';
import { Wand2, AlertCircle, ImageIcon, Loader2, Swords, Plus, Trash2 } from 'lucide-react';

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
  existingAdversaries = [],
  addAdversary,
  onSave
}) {
  const [mode, setMode] = useState('api');
  const [editableResult, setEditableResult] = useState(null);
  const [generatePortrait, setGeneratePortrait] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [portraitError, setPortraitError] = useState(null);
  const [adversaryStubs, setAdversaryStubs] = useState([]);
  const [generatingAdversaries, setGeneratingAdversaries] = useState(false);
  const [adversaryProgress, setAdversaryProgress] = useState({ done: 0, total: 0 });
  const [adversaryError, setAdversaryError] = useState(null);

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
      setAdversaryStubs([]);
      setGeneratingAdversaries(false);
      setAdversaryProgress({ done: 0, total: 0 });
      setAdversaryError(null);
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

      // Surface AI-suggested new adversary stubs for the encounter type
      if (type === 'encounter' && Array.isArray(result.newAdversaries) && result.newAdversaries.length > 0) {
        setAdversaryStubs(
          result.newAdversaries.map((s, i) => ({
            id: `${Date.now()}-${i}`,
            concept: s.concept || '',
            tier: Number(s.tier) || 1,
            role: s.role || 'standard',
            quantity: Number(s.quantity) || 1
          }))
        );
      }
    }
  }, [result]);

  // Generate portrait for NPC — backend uses server key if no client key
  const handleGeneratePortrait = async (npcData = null) => {
    const npc = npcData || editableResult;
    if (!npc) return;

    const keyInfo = getEffectiveKey('openai');

    setGeneratingPortrait(true);
    setPortraitError(null);

    try {
      const gameSystem = campaign?.gameSystem || 'daggerheart';
      const campaignId = campaign?.id;
      const avatarUrl = await generateNPCPortrait(npc, keyInfo?.key || null, gameSystem, campaignId);

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
      encounter: 'Encounter',
      lore: 'Lore Entry'
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

    // Pass null for apiKey — the backend uses server env vars as fallback
    const effectiveKey = getEffectiveKey('anthropic')?.key || getEffectiveKey('openai')?.key || null;
    const provider = getEffectiveKey('anthropic')?.key ? 'anthropic' : 'openai';

    try {
      await generateWithAPI(type, context, effectiveKey, provider);
    } catch (err) {
      console.error('API generation failed:', err);
    }
  };

  const handleStubChange = (id, field, value) => {
    setAdversaryStubs(stubs =>
      stubs.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleAddStub = () => {
    setAdversaryStubs(stubs => [
      ...stubs,
      { id: `${Date.now()}-${stubs.length}`, concept: '', tier: 1, role: 'standard', quantity: 1 }
    ]);
  };

  const handleRemoveStub = (id) => {
    setAdversaryStubs(stubs => stubs.filter(s => s.id !== id));
  };

  const buildCampaignContext = () => {
    const parts = [];
    if (campaign?.name) parts.push(`Campaign: ${campaign.name}`);
    if (campaign?.pitch) parts.push(`Pitch: ${campaign.pitch}`);
    if (campaign?.tone) parts.push(`Tone: ${Array.isArray(campaign.tone) ? campaign.tone.join(', ') : campaign.tone}`);
    if (campaign?.themes) parts.push(`Themes: ${Array.isArray(campaign.themes) ? campaign.themes.join(', ') : campaign.themes}`);
    if (existingAdversaries.length > 0) {
      parts.push(`Existing adversaries (avoid duplicating names): ${existingAdversaries.map(a => a.name).filter(Boolean).join(', ')}`);
    }
    return parts.join('\n');
  };

  const handleGenerateAdversariesAndSave = async () => {
    if (!editableResult) return;

    const validStubs = adversaryStubs.filter(s => s.concept?.trim());
    if (validStubs.length === 0 || !addAdversary) {
      onSave(editableResult);
      onClose();
      return;
    }

    setGeneratingAdversaries(true);
    setAdversaryError(null);
    setAdversaryProgress({ done: 0, total: validStubs.length });

    const apiKey = getEffectiveKey('anthropic')?.key || getEffectiveKey('openai')?.key || null;
    const provider = getEffectiveKey('anthropic')?.key ? 'anthropic' : 'openai';
    const campaignContext = buildCampaignContext();

    try {
      const stubResults = await Promise.all(
        validStubs.map(async (stub) => {
          try {
            const statblock = await generateAdversaryStatblock({
              concept: stub.concept,
              tier: stub.tier,
              role: stub.role,
              apiKey,
              provider,
              campaignContext
            });
            const saved = await addAdversary(statblock);
            setAdversaryProgress(p => ({ ...p, done: p.done + 1 }));
            return { adversaryId: saved.id, quantity: Math.max(1, stub.quantity) };
          } catch (err) {
            console.error(`Failed to generate adversary "${stub.concept}":`, err);
            setAdversaryProgress(p => ({ ...p, done: p.done + 1 }));
            return null;
          }
        })
      );

      const slots = stubResults.filter(Boolean);
      const existingSlots = Array.isArray(editableResult.adversarySlots) ? editableResult.adversarySlots : [];
      const encounterToSave = {
        ...editableResult,
        adversarySlots: [...existingSlots, ...slots]
      };

      onSave(encounterToSave);
      onClose();
    } catch (err) {
      console.error('Adversary generation flow failed:', err);
      setAdversaryError(err.message || 'Failed to generate adversaries');
      setGeneratingAdversaries(false);
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

  const renderGenerator = () => (
    <DirectAPIGenerator
      type={type}
      onGenerateWithAPI={handleAPIGenerate}
      generating={generating}
    />
  );

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
                      disabled={generatingPortrait}
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
                    <button
                      className="btn btn-sm btn-secondary text-xs"
                      onClick={() => handleGeneratePortrait()}
                    >
                      <ImageIcon size={14} />
                      Generate Portrait
                    </button>
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

    if (type === 'lore') {
      return (
        <div className="mt-6 p-4 bg-[var(--bg-secondary)] border border-[rgb(var(--color-primary))] rounded-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Wand2 size={20} className="text-[rgb(var(--color-primary))]" />
            Generated Lore Entry
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Title *</label>
              <input
                type="text"
                value={editableResult.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Category</label>
              <select
                value={editableResult.category || 'history'}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
              >
                <option value="history">History</option>
                <option value="legend">Legend</option>
                <option value="faction">Faction</option>
                <option value="culture">Culture</option>
                <option value="religion">Religion</option>
                <option value="magic">Magic</option>
                <option value="geography">Geography</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Content</label>
              <textarea
                value={editableResult.content || ''}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))] min-h-[150px]"
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

            {/* Adversary stubs editor (when AI suggested fresh adversaries) */}
            {adversaryStubs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-bold text-white flex items-center gap-2">
                    <Swords size={18} className="text-[rgb(var(--color-primary))]" />
                    New Adversaries to Generate
                  </h4>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleAddStub}
                    disabled={generatingAdversaries}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                <p className="text-xs text-white/50">
                  Review and tweak before saving. Each will be statted up and added to your campaign's adversary list, then linked to this encounter.
                </p>
                {adversaryStubs.map((stub) => (
                  <div key={stub.id} className="p-3 bg-black/20 border border-white/10 rounded-lg space-y-2">
                    <div className="flex gap-2 items-start">
                      <textarea
                        value={stub.concept}
                        onChange={(e) => handleStubChange(stub.id, 'concept', e.target.value)}
                        placeholder="Concept (one sentence)"
                        rows={2}
                        disabled={generatingAdversaries}
                        className="flex-1 p-2 bg-black/30 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveStub(stub.id)}
                        disabled={generatingAdversaries}
                        className="btn btn-ghost btn-sm text-red-400"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Tier</label>
                        <select
                          value={stub.tier}
                          onChange={(e) => handleStubChange(stub.id, 'tier', Number(e.target.value))}
                          disabled={generatingAdversaries}
                          className="w-full p-1.5 bg-black/30 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[rgb(var(--color-primary))]"
                        >
                          <option value={1}>1 — Novice</option>
                          <option value={2}>2 — Seasoned</option>
                          <option value={3}>3 — Formidable</option>
                          <option value={4}>4 — Legendary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Role</label>
                        <select
                          value={stub.role}
                          onChange={(e) => handleStubChange(stub.id, 'role', e.target.value)}
                          disabled={generatingAdversaries}
                          className="w-full p-1.5 bg-black/30 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[rgb(var(--color-primary))]"
                        >
                          <option value="minion">Minion</option>
                          <option value="horde">Horde</option>
                          <option value="standard">Standard</option>
                          <option value="bruiser">Bruiser</option>
                          <option value="skulk">Skulk</option>
                          <option value="ranged">Ranged</option>
                          <option value="support">Support</option>
                          <option value="social">Social</option>
                          <option value="leader">Leader</option>
                          <option value="solo">Solo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-white/50 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={stub.quantity}
                          onChange={(e) => handleStubChange(stub.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          disabled={generatingAdversaries}
                          className="w-full p-1.5 bg-black/30 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-[rgb(var(--color-primary))]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {generatingAdversaries && (
                  <div className="flex items-center gap-2 text-sm text-white/70 p-2 bg-[rgb(var(--color-primary))/10] rounded">
                    <Loader2 size={16} className="animate-spin" />
                    Generating statblocks ({adversaryProgress.done}/{adversaryProgress.total})...
                  </div>
                )}
                {adversaryError && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={14} />
                    {adversaryError}
                  </div>
                )}
              </div>
            )}
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
                  className="w-4 h-4 rounded border-gray-600 bg-black/40 text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
                />
                <ImageIcon size={16} />
                <span>Generate AI Portrait</span>
              </label>
            </div>
          )}

          {renderGenerator()}
          {renderResultsPreview()}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
          <button className="btn btn-secondary" onClick={onClose} disabled={generatingAdversaries}>
            Cancel
          </button>
          {editableResult && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditableResult(null);
                  setAdversaryStubs([]);
                }}
                disabled={generatingAdversaries}
              >
                Clear & Regenerate
              </button>
              {type === 'encounter' && adversaryStubs.length > 0 && addAdversary ? (
                <button
                  className="btn btn-primary"
                  onClick={handleGenerateAdversariesAndSave}
                  disabled={generatingAdversaries}
                >
                  {generatingAdversaries ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating ({adversaryProgress.done}/{adversaryProgress.total})...
                    </>
                  ) : (
                    <>
                      <Swords size={16} />
                      Generate Adversaries & Save
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                >
                  Save {getTypeLabel()}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
