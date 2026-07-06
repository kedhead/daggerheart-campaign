import { useState } from 'react';
import { Save, X, Link as LinkIcon, Plus, Minus, Sparkles, Loader2 } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import { useAPIKey } from '../../hooks/useAPIKey';
import { summarizeSessionNotes } from '../../services/sessionSummaryGenerator';
import './SessionForm.css';

export default function SessionForm({ session, onSave, onCancel, isDM, campaign, entities, campaignContext = '' }) {
  const { search, autoLink } = useEntityRegistry(campaign, entities);
  const { getEffectiveKey } = useAPIKey(campaign?.createdBy);
  const [formData, setFormData] = useState(session || {
    title: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    highlights: [],
    dmNotes: '',
    encounterLinks: '',
    status: 'completed',
    isPlanned: false
  });

  const [highlightInput, setHighlightInput] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState(null);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handlePolishWithAI = async () => {
    setIsPolishing(true);
    setPolishError(null);
    try {
      let provider = 'anthropic';
      let apiKey = '';
      for (const p of ['anthropic', 'openai']) {
        const { key } = getEffectiveKey(p);
        if (key) { provider = p; apiKey = key; break; }
      }
      const polished = await summarizeSessionNotes({
        rawNotes: formData.summary,
        campaignContext,
        gameSystem: campaign?.gameSystem || 'daggerheart',
        apiKey,
        provider
      });
      handleChange('summary', polished);
    } catch (err) {
      setPolishError(err.message || 'Polishing failed.');
    } finally {
      setIsPolishing(false);
    }
  };

  const addHighlight = () => {
    if (highlightInput.trim()) {
      setFormData({
        ...formData,
        highlights: [...formData.highlights, highlightInput.trim()]
      });
      setHighlightInput('');
    }
  };

  const removeHighlight = (index) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-white/60">Session Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., The Forest of Whispers"
            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-white/60">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
            required
          />
        </div>
      </div>

      {isDM && (
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-white/60">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
          >
            <option value="planned">Planned (Future Session)</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed (Session Log)</option>
          </select>
        </div>
      )}

      {isDM && (
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-semibold text-white/60">
            <LinkIcon size={14} />
            Encounter Links (DM Only)
          </label>
          <input
            type="text"
            value={formData.encounterLinks}
            onChange={(e) => handleChange('encounterLinks', e.target.value)}
            placeholder="https://freshcutgrass.app/encounter/..."
            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
          />
          <p className="text-xs text-white/40 mt-1">Paste FreshCutGrass encounter link(s), separate multiple with commas</p>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-semibold text-white/60">
            Summary {formData.status === 'planned' ? '' : '*'}
          </label>
          {formData.summary.trim().length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-2"
              onClick={handlePolishWithAI}
              disabled={isPolishing}
              title="Turn this rough summary into polished prose — grounded strictly in what's already written"
            >
              {isPolishing ? (
                <><Loader2 size={14} className="animate-spin" /> Polishing…</>
              ) : (
                <><Sparkles size={14} /> Polish with AI</>
              )}
            </button>
          )}
        </div>
        {polishError && <p className="text-xs text-red-400 m-0">{polishError}</p>}
        <WikiLinkInput
          value={formData.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder={formData.status === 'planned' ? 'What do you plan for this session? Type [[ to link entities' : 'What happened in this session? Type [[ to link entities'}
          rows={6}
          required={formData.status !== 'planned'}
          className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
        />
        <p className="text-xs text-white/40 mt-1">Type [[ to link to other entities</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-white/60">Highlights</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={highlightInput}
            onChange={(e) => setHighlightInput(e.target.value)}
            placeholder="Add a highlight moment..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
            className="flex-1 p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
          />
          <button
            type="button"
            className="btn btn-secondary px-4"
            onClick={addHighlight}
          >
            <Plus size={20} />
          </button>
        </div>

        {formData.highlights.length > 0 && (
          <div className="space-y-2 mt-3">
            {formData.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center justify-between gap-3 p-3 bg-white/5 border border-white/5 rounded-lg group hover:border-white/20 transition-colors">
                <span className="text-sm text-white/80">{highlight}</span>
                <button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  className="text-white/40 hover:text-red-400 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDM && (
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-amber-400/80">DM Notes (DM Only)</label>
          <div className="bg-amber-950/10 rounded-lg border border-amber-500/10 overflow-hidden">
            <WikiLinkInput
              value={formData.dmNotes}
              onChange={(e) => handleChange('dmNotes', e.target.value)}
              searchEntities={search}
              autoLink={autoLink}
              placeholder="Private notes for your eyes only... Type [[ to link entities"
              rows={4}
              className="w-full p-3 bg-transparent text-amber-100/90 focus:outline-none placeholder-amber-500/30"
            />
          </div>
          <p className="text-xs text-amber-500/40 mt-1">Type [[ to link to other entities</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={18} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={18} />
          Save Session
        </button>
      </div>
    </form>
  );
}
