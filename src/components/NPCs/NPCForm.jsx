import { useState } from 'react';
import { Save, X, Wand2, Loader2, Sparkles, Pencil } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import { useAPIKey } from '../../hooks/useAPIKey';
import { generateNPCPortrait } from '../../services/portraitGenerator';
import { generateNPC } from '../../services/npcGenerator';
import { STARWARS_SPECIES_GROUPS } from '../../data/starwarsd6Species';
import './NPCsView.css';

export default function NPCForm({ npc, onSave, onCancel, campaign, entities, isDM, campaignContext = '', initialMode = 'manual' }) {
  const { search, autoLink } = useEntityRegistry(campaign, entities);
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);

  const [formData, setFormData] = useState(npc || {
    name: '',
    species: '',
    occupation: '',
    location: '',
    relationship: 'neutral',
    description: '',
    notes: '',
    firstMet: '',
    avatarUrl: '',
    hidden: false
  });

  const isStarWarsD6 = campaign?.gameSystem === 'starwarsd6';

  const [mode, setMode] = useState(initialMode); // 'manual' | 'ai'
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [portraitError, setPortraitError] = useState(null);
  const [aiConcept, setAiConcept] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Check if OpenAI key is available
  const openaiKeyInfo = getEffectiveKey('openai');
  const hasOpenAIKey = !!openaiKeyInfo?.key;

  const anthropicKeyInfo = getEffectiveKey('anthropic');
  const aiApiKey = anthropicKeyInfo?.key || openaiKeyInfo?.key || '';
  const aiProvider = anthropicKeyInfo?.key ? 'anthropic' : 'openai';

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleGenerateNPC = async () => {
    if (!aiConcept.trim()) { setAiError('Describe the NPC concept first.'); return; }
    setAiGenerating(true);
    setAiError('');
    try {
      const result = await generateNPC({
        concept: aiConcept,
        campaign,
        campaignFrame: entities?.campaignFrame || null,
        existingNPCs: entities?.npcs || [],
        existingLocations: entities?.locations || [],
        apiKey: aiApiKey,
        provider: aiProvider,
        campaignContext
      });
      setFormData(prev => ({ ...prev, ...result, avatarUrl: prev.avatarUrl }));
      setMode('manual');
    } catch (e) {
      setAiError(e.message || 'Generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGeneratePortrait = async () => {
    if (!formData.name) {
      setPortraitError('Please enter an NPC name first');
      return;
    }

    setGeneratingPortrait(true);
    setPortraitError(null);

    try {
      const gameSystem = campaign?.gameSystem || 'daggerheart';
      const campaignId = campaign?.id;
      const avatarUrl = await generateNPCPortrait(formData, openaiKeyInfo?.key || null, gameSystem, campaignId);

      setFormData({
        ...formData,
        avatarUrl
      });
    } catch (err) {
      console.error('Portrait generation failed:', err);
      setPortraitError(err.message || 'Failed to generate portrait');
    } finally {
      setGeneratingPortrait(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        alert('Avatar size must be less than 1MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setUploadingAvatar(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          avatarUrl: e.target.result
        });
        setUploadingAvatar(false);
      };
      reader.onerror = () => {
        alert('Failed to upload avatar');
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="npc-form" onSubmit={handleSubmit}>
      {/* Mode selector */}
      <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`filter-tab ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          <Pencil size={14} />
          Build Manually
        </button>
        <button
          type="button"
          className={`filter-tab ${mode === 'ai' ? 'active' : ''}`}
          onClick={() => setMode('ai')}
        >
          <Sparkles size={14} />
          AI Generate
        </button>
      </div>

      {mode === 'ai' && (
        <div className="ai-generate-panel" style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <p className="form-hint" style={{ margin: 0 }}>
            Describe the NPC you want and the AI will draft a name, occupation, location, relationship,
            description, notes, and a first-meeting hook — grounded in your campaign's NPCs, locations,
            items, and story so far. Review and edit before saving.
          </p>
          <textarea
            value={aiConcept}
            onChange={(e) => setAiConcept(e.target.value)}
            placeholder="e.g. A nervous dockworker who's seen something he shouldn't have."
            rows={3}
          />
          {aiError && <small className="form-error">{aiError}</small>}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateNPC}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <>
                <Loader2 size={16} className="spinner" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Generate NPC
              </>
            )}
          </button>
        </div>
      )}

      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-preview">
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="NPC portrait" />
          ) : (
            <div className="avatar-placeholder">
              <span>No Portrait</span>
            </div>
          )}
        </div>
        <div className="avatar-upload">
          <label className="btn btn-secondary">
            {uploadingAvatar ? 'Uploading...' : 'Upload Portrait'}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar || generatingPortrait}
              style={{ display: 'none' }}
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGeneratePortrait}
            disabled={generatingPortrait}
            title="Generate AI portrait"
          >
            {generatingPortrait ? (
              <>
                <Loader2 size={16} className="spinner" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Generate AI
              </>
            )}
          </button>
          {formData.avatarUrl && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleChange('avatarUrl', '')}
              disabled={generatingPortrait}
            >
              Remove
            </button>
          )}
          <small className="form-hint">
            Upload an image or generate with AI
          </small>
          {portraitError && (
            <small className="form-error">{portraitError}</small>
          )}
        </div>
      </div>

      <div className="input-group">
        <label>NPC Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Grimwald the Merchant"
          required
        />
      </div>

      {isStarWarsD6 && (
        <div className="input-group">
          <label>Species</label>
          <select
            value={formData.species || ''}
            onChange={(e) => handleChange('species', e.target.value)}
          >
            <option value="">— Select species —</option>
            {STARWARS_SPECIES_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.species.map((s) => (
                  <option key={`${group.label}-${s}`} value={s}>{s}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <small className="form-hint">
            Pick a common Star Wars species, or leave blank and describe it in the notes.
          </small>
        </div>
      )}

      <div className="input-group">
        <label>Occupation</label>
        <input
          type="text"
          value={formData.occupation}
          onChange={(e) => handleChange('occupation', e.target.value)}
          placeholder="e.g., Blacksmith, Tavern Owner, Guard Captain"
        />
      </div>

      <div className="input-group">
        <label>Location</label>
        <WikiLinkInput
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="e.g., Riverside Market, The Golden Lion Inn — Type [[ to link"
          rows={1}
        />
        <small className="form-hint">Type [[ to link to locations or other entities</small>
      </div>

      <div className="input-group">
        <label>Relationship *</label>
        <select
          value={formData.relationship}
          onChange={(e) => handleChange('relationship', e.target.value)}
          required
        >
          <option value="ally">Ally</option>
          <option value="neutral">Neutral</option>
          <option value="enemy">Enemy</option>
        </select>
      </div>

      <div className="input-group">
        <label>Description</label>
        <WikiLinkInput
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="Physical appearance, personality, mannerisms... Type [[ to link entities"
          rows={4}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>Notes</label>
        <WikiLinkInput
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="Important information, quest connections, secrets... Type [[ to link entities"
          rows={4}
        />
        <small className="form-hint">Type [[ to link to other entities</small>
      </div>

      <div className="input-group">
        <label>First Met</label>
        <WikiLinkInput
          value={formData.firstMet}
          onChange={(e) => handleChange('firstMet', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="e.g., Session 3, At the tavern in [[Riverdale]] — Type [[ to link"
          rows={1}
        />
        <small className="form-hint">Type [[ to link to sessions, locations, or other entities</small>
      </div>

      {isDM && (
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={formData.hidden}
              onChange={(e) => handleChange('hidden', e.target.checked)}
            />
            <span>Hidden from Players</span>
          </label>
          <small className="form-hint">Players won't see this NPC until you reveal it</small>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save NPC
        </button>
      </div>
    </form>
  );
}
