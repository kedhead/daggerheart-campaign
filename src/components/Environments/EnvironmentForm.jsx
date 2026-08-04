import { useState } from 'react';
import { Save, X, Plus, Trash2, Wand2, Loader2, Pencil, BookOpen, Swords } from 'lucide-react';
import {
  ENVIRONMENT_TYPES,
  ENVIRONMENT_FEATURE_TYPES,
  DAGGERHEART_ENVIRONMENTS,
} from '../../data/daggerheartEnvironments';
import { generateEnvironment } from '../../services/environmentGenerator';
import { useAPIKey } from '../../hooks/useAPIKey';

const FEATURE_TYPES = ENVIRONMENT_FEATURE_TYPES;

const emptyEnvironment = {
  name: '',
  tier: 1,
  type: 'exploration',
  difficulty: 11,
  description: '',
  impulses: [],
  features: [],
  potentialAdversaries: [],
  hidden: false,
  isOfficial: false
};

const fromEnvironment = (env) => ({
  ...emptyEnvironment,
  ...env,
  impulses: env?.impulses ? [...env.impulses] : [],
  features: env?.features ? env.features.map(f => ({ ...f })) : [],
  potentialAdversaries: env?.potentialAdversaries ? [...env.potentialAdversaries] : [],
});

export default function EnvironmentForm({
  environment,
  onSave,
  onCancel,
  isDM,
  userId,
  campaignEnvironments = [],
  campaignAdversaries = [],
  campaignContext = '',
  onBuildEncounter = null,
  buildingEncounter = false,
}) {
  const [formData, setFormData] = useState(() =>
    environment ? fromEnvironment(environment) : { ...emptyEnvironment }
  );

  // 'manual' | 'ai' | 'template' — mirrors AdversaryForm. Editing always opens
  // in manual; there is nothing to generate when you came to change one field.
  const [mode, setMode] = useState('manual');
  const [aiConcept, setAiConcept] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateSource, setTemplateSource] = useState('srd'); // 'srd' | 'campaign'

  // A client-side key is optional. /api/generate falls back to the server's
  // ANTHROPIC_API_KEY / OPENAI_API_KEY when none is sent, so gating the panel
  // on a personal key refused requests the server would have answered. Same
  // resolution LocationsView and FilesView already use.
  const { getEffectiveKey } = useAPIKey(userId);
  const anthropicInfo = getEffectiveKey('anthropic');
  const openaiInfo = getEffectiveKey('openai');
  const aiKey = anthropicInfo?.key || openaiInfo?.key || null;
  const aiProvider = openaiInfo?.key && !anthropicInfo?.key ? 'openai' : 'anthropic';

  // The one genuine block: a shared key exists but this user has spent their
  // allowance. Falling through to the server's env key there would quietly
  // bypass the limit the shared-key system exists to enforce.
  const sharedLimitReason = !aiKey
    ? (anthropicInfo?.usageCheck && !anthropicInfo.usageCheck.allowed && anthropicInfo.usageCheck.reason)
      || (openaiInfo?.usageCheck && !openaiInfo.usageCheck.allowed && openaiInfo.usageCheck.reason)
      || null
    : null;

  const handleGenerate = async (templateEnvironment = null) => {
    if (!aiConcept.trim()) { setAiError('Describe the environment concept first.'); return; }
    setAiGenerating(true);
    setAiError('');
    try {
      const result = await generateEnvironment({
        concept: aiConcept,
        tier: formData.tier,
        type: formData.type,
        apiKey: aiKey,
        provider: aiProvider,
        templateEnvironment,
        campaignContext,
        campaignAdversaries,
      });
      // Land in the form for review rather than saving — the same contract the
      // adversary builder has. Nothing is written until you press Save.
      setFormData(prev => ({ ...fromEnvironment(result), hidden: prev.hidden }));
      setMode('manual');
    } catch (e) {
      setAiError(e.message || 'Generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyTemplate = (source) => {
    setFormData(prev => ({
      ...fromEnvironment(source),
      // A template is a starting point, not an import: it must not inherit the
      // official flag or claim the SRD's name unchanged.
      name: `${source.name} (Variant)`,
      isOfficial: false,
      hidden: prev.hidden,
    }));
    setMode('manual');
    setTemplateSearch('');
  };

  const templateList = templateSource === 'srd' ? DAGGERHEART_ENVIRONMENTS : campaignEnvironments;
  const filteredTemplates = templateList.filter(e =>
    !templateSearch || e.name?.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Impulses helpers
  const addImpulse = () => {
    setFormData(prev => ({ ...prev, impulses: [...prev.impulses, ''] }));
  };
  const updateImpulse = (idx, value) => {
    setFormData(prev => {
      const impulses = [...prev.impulses];
      impulses[idx] = value;
      return { ...prev, impulses };
    });
  };
  const removeImpulse = (idx) => {
    setFormData(prev => ({ ...prev, impulses: prev.impulses.filter((_, i) => i !== idx) }));
  };

  // Features helpers
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { name: '', type: 'passive', description: '', cost: '' }]
    }));
  };
  const updateFeature = (idx, field, value) => {
    setFormData(prev => {
      const features = [...prev.features];
      features[idx] = { ...features[idx], [field]: value };
      return { ...prev, features };
    });
  };
  const removeFeature = (idx) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  // Potential adversaries helpers
  const addAdversary = () => {
    setFormData(prev => ({ ...prev, potentialAdversaries: [...prev.potentialAdversaries, ''] }));
  };
  const updateAdversary = (idx, value) => {
    setFormData(prev => {
      const arr = [...prev.potentialAdversaries];
      arr[idx] = value;
      return { ...prev, potentialAdversaries: arr };
    });
  };
  const removeAdversary = (idx) => {
    setFormData(prev => ({
      ...prev,
      potentialAdversaries: prev.potentialAdversaries.filter((_, i) => i !== idx)
    }));
  };

  // Shared by Save and by Save & Build Encounter, so the two paths cannot
  // drift into storing differently shaped environments.
  const handleClean = () => ({
    ...formData,
    impulses: formData.impulses.map(s => s.trim()).filter(Boolean),
    potentialAdversaries: formData.potentialAdversaries.map(s => s.trim()).filter(Boolean),
    features: formData.features
      .filter(f => f.name?.trim() || f.description?.trim())
      .map(f => {
        const out = {
          name: (f.name || '').trim(),
          type: FEATURE_TYPES.includes(f.type) ? f.type : 'passive',
          description: (f.description || '').trim()
        };
        if (f.cost && f.cost.trim()) out.cost = f.cost.trim();
        return out;
      })
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(handleClean());
  };

  const modeTab = (id, label, icon) => (
    <button
      key={id}
      type="button"
      onClick={() => setMode(id)}
      className={`environment-mode-tab${mode === id ? ' active' : ''}`}
      aria-pressed={mode === id}
    >
      {icon}
      {label}
    </button>
  );

  if (mode === 'ai') {
    return (
      <div className="environment-form">
        <div className="environment-mode-tabs">
          {modeTab('manual', 'Manual', <Pencil size={16} />)}
          {modeTab('ai', 'AI Build', <Wand2 size={16} />)}
          {modeTab('template', 'Template', <BookOpen size={16} />)}
        </div>

        {sharedLimitReason ? (
          <p className="form-hint">{sharedLimitReason}</p>
        ) : (
          <>
            <div className="form-row">
              <div className="input-group">
                <label>Tier</label>
                <select value={formData.tier} onChange={(e) => handleChange('tier', parseInt(e.target.value))}>
                  {[1, 2, 3, 4].map(t => <option key={t} value={t}>Tier {t}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Type</label>
                <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)}>
                  {ENVIRONMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Concept *</label>
              <textarea
                value={aiConcept}
                onChange={(e) => setAiConcept(e.target.value)}
                placeholder="e.g., a flooded library where the water remembers what was read to it"
                rows={3}
              />
              <small className="form-hint">
                Tier and type shape the difficulty and the kind of features you get.
                Generated content lands in the form for review — nothing is saved until you press Save.
              </small>
            </div>

            {aiError && <p className="form-error">{aiError}</p>}

            <div className="environment-form-actions">
              <button type="button" className="btn-secondary" onClick={onCancel}>
                <X size={16} /> Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleGenerate(null)}
                disabled={aiGenerating}
              >
                {aiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                {aiGenerating ? 'Generating…' : 'Generate Environment'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (mode === 'template') {
    return (
      <div className="environment-form">
        <div className="environment-mode-tabs">
          {modeTab('manual', 'Manual', <Pencil size={16} />)}
          {modeTab('ai', 'AI Build', <Wand2 size={16} />)}
          {modeTab('template', 'Template', <BookOpen size={16} />)}
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Source</label>
            <select value={templateSource} onChange={(e) => setTemplateSource(e.target.value)}>
              <option value="srd">Official SRD ({DAGGERHEART_ENVIRONMENTS.length})</option>
              <option value="campaign">This campaign ({campaignEnvironments.length})</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: 2 }}>
            <label>Search</label>
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Filter by name…"
            />
          </div>
        </div>

        <div className="environment-template-list">
          {filteredTemplates.length === 0 && (
            <p className="form-hint">No environments match.</p>
          )}
          {filteredTemplates.slice(0, 60).map((env) => (
            <div key={env.id || env.name} className="environment-template-row">
              <div className="environment-template-meta">
                <strong>{env.name}</strong>
                <small>Tier {env.tier} · {env.type} · {(env.features || []).length} features</small>
              </div>
              <div className="environment-template-buttons">
                <button type="button" className="btn-secondary" onClick={() => applyTemplate(env)}>
                  Use as-is
                </button>
                {!sharedLimitReason && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      if (!aiConcept.trim()) {
                        setAiError('Describe what to change it into first, in the AI Build tab.');
                        setMode('ai');
                        return;
                      }
                      handleGenerate(env);
                    }}
                    disabled={aiGenerating}
                    title="Reskin this environment to your concept"
                  >
                    {aiGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    Adapt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {aiError && <p className="form-error">{aiError}</p>}

        <div className="environment-form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            <X size={16} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="environment-form" onSubmit={handleSubmit}>
      {!environment && (
        <div className="environment-mode-tabs">
          {modeTab('manual', 'Manual', <Pencil size={16} />)}
          {modeTab('ai', 'AI Build', <Wand2 size={16} />)}
          {modeTab('template', 'Template', <BookOpen size={16} />)}
        </div>
      )}

      <div className="input-group">
        <label>Environment Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., The Whispering Vault"
          required
        />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Tier *</label>
          <select value={formData.tier} onChange={(e) => handleChange('tier', parseInt(e.target.value))}>
            <option value={1}>Tier 1</option>
            <option value={2}>Tier 2</option>
            <option value={3}>Tier 3</option>
            <option value={4}>Tier 4</option>
          </select>
        </div>

        <div className="input-group">
          <label>Type *</label>
          <select value={formData.type} onChange={(e) => handleChange('type', e.target.value)}>
            {ENVIRONMENT_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Difficulty</label>
          <input
            type="number"
            min="0"
            value={formData.difficulty}
            onChange={(e) => handleChange('difficulty', parseInt(e.target.value) || 0)}
            placeholder="e.g., 13"
          />
          <small className="form-hint">0 to hide DC badge</small>
        </div>
      </div>

      <div className="input-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief overview of the environment..."
          rows={3}
        />
      </div>

      {/* Impulses */}
      <div className="input-group">
        <div className="custom-features-header">
          <label>Impulses</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addImpulse}>
            <Plus size={14} /> Add Impulse
          </button>
        </div>
        <small className="form-hint">GM guidance for running the environment (e.g., "Draw in the curious")</small>
        {formData.impulses.length > 0 && (
          <div className="custom-features-list">
            {formData.impulses.map((impulse, i) => (
              <div key={i} className="custom-feature-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <input
                  type="text"
                  value={impulse}
                  onChange={(e) => updateImpulse(i, e.target.value)}
                  placeholder="e.g., Echo historical events"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm danger"
                  onClick={() => removeImpulse(i)}
                  title="Remove impulse"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="input-group">
        <div className="custom-features-header">
          <label>Features</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addFeature}>
            <Plus size={14} /> Add Feature
          </button>
        </div>
        <small className="form-hint">Mechanical effects, hazards, actions, or encounters</small>
        {formData.features.length > 0 && (
          <div className="custom-features-list">
            {formData.features.map((feature, i) => (
              <div key={i} className="environment-feature-editor">
                <div className="environment-feature-row">
                  <input
                    type="text"
                    value={feature.name}
                    onChange={(e) => updateFeature(i, 'name', e.target.value)}
                    placeholder="Feature name"
                  />
                  <select
                    value={feature.type}
                    onChange={(e) => updateFeature(i, 'type', e.target.value)}
                  >
                    {FEATURE_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={feature.cost || ''}
                    onChange={(e) => updateFeature(i, 'cost', e.target.value)}
                    placeholder="Cost (optional, e.g., 1 Fear)"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm danger"
                    onClick={() => removeFeature(i)}
                    title="Remove feature"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  value={feature.description}
                  onChange={(e) => updateFeature(i, 'description', e.target.value)}
                  placeholder="What the feature does..."
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Potential Adversaries */}
      <div className="input-group">
        <div className="custom-features-header">
          <label>Potential Adversaries</label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addAdversary}>
            <Plus size={14} /> Add Adversary
          </button>
        </div>
        <small className="form-hint">Suggested enemies for this environment</small>
        {formData.potentialAdversaries.length > 0 && (
          <div className="custom-features-list">
            {formData.potentialAdversaries.map((adv, i) => (
              <div key={i} className="custom-feature-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <input
                  type="text"
                  value={adv}
                  onChange={(e) => updateAdversary(i, e.target.value)}
                  placeholder="e.g., Bear, Dire Wolf"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm danger"
                  onClick={() => removeAdversary(i)}
                  title="Remove adversary"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
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
          <small className="form-hint">Players won't see this environment until you reveal it</small>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        {/* Saves first, then hands the stored environment to the encounter
            builder — an encounter needs a real environmentId, which only
            exists after the save. */}
        {onBuildEncounter && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onBuildEncounter(handleClean())}
            disabled={!formData.name.trim() || buildingEncounter}
            title="Save this environment, then build an encounter in it"
          >
            {buildingEncounter ? <Loader2 size={16} className="animate-spin" /> : <Swords size={16} />}
            {buildingEncounter ? 'Building…' : 'Save & Build Encounter'}
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          {environment?.id ? 'Update Environment' : 'Create Environment'}
        </button>
      </div>
    </form>
  );
}
