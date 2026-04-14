import React, { useState } from 'react';
import { Zap } from 'lucide-react';

/**
 * Direct API Generator Component
 * Generates content using server-side API keys (or user's own if configured)
 */
export default function DirectAPIGenerator({
  type,
  onGenerateWithAPI,
  generating
}) {
  const [requirements, setRequirements] = useState({});

  const handleGenerate = () => {
    onGenerateWithAPI(requirements);
  };

  const renderTypeFields = () => {
    if (type === 'npc') {
      return (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Name (Optional)</label>
            <input
              type="text"
              value={requirements.name || ''}
              onChange={(e) => setRequirements({ ...requirements, name: e.target.value })}
              placeholder="Leave blank for AI to generate"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Occupation (Optional)</label>
            <input
              type="text"
              value={requirements.occupation || ''}
              onChange={(e) => setRequirements({ ...requirements, occupation: e.target.value })}
              placeholder="e.g., Blacksmith, Merchant, Spy"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Relationship</label>
            <select
              value={requirements.relationship || ''}
              onChange={(e) => setRequirements({ ...requirements, relationship: e.target.value })}
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            >
              <option value="">AI decides</option>
              <option value="ally">Ally</option>
              <option value="neutral">Neutral</option>
              <option value="enemy">Enemy / Villain</option>
            </select>
          </div>
        </>
      );
    }

    if (type === 'location') {
      return (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Name (Optional)</label>
            <input
              type="text"
              value={requirements.name || ''}
              onChange={(e) => setRequirements({ ...requirements, name: e.target.value })}
              placeholder="Leave blank for AI to generate"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Type</label>
            <select
              value={requirements.type || ''}
              onChange={(e) => setRequirements({ ...requirements, type: e.target.value })}
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            >
              <option value="">AI decides</option>
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
            <label className="text-sm font-medium text-white/80">Region (Optional)</label>
            <input
              type="text"
              value={requirements.region || ''}
              onChange={(e) => setRequirements({ ...requirements, region: e.target.value })}
              placeholder="e.g., The Northlands, Near the capital"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>
        </>
      );
    }

    if (type === 'lore') {
      return (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Category</label>
            <select
              value={requirements.loreType || ''}
              onChange={(e) => setRequirements({ ...requirements, loreType: e.target.value })}
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            >
              <option value="">AI decides</option>
              <option value="history">History</option>
              <option value="legend">Legend</option>
              <option value="faction">Faction</option>
              <option value="culture">Culture</option>
              <option value="religion">Religion</option>
              <option value="magic">Magic</option>
              <option value="geography">Geography</option>
            </select>
          </div>
        </>
      );
    }

    if (type === 'encounter') {
      return (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Difficulty</label>
            <select
              value={requirements.difficulty || ''}
              onChange={(e) => setRequirements({ ...requirements, difficulty: e.target.value })}
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            >
              <option value="">AI decides</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Environment (Optional)</label>
            <input
              type="text"
              value={requirements.environment || ''}
              onChange={(e) => setRequirements({ ...requirements, environment: e.target.value })}
              placeholder="e.g., Dense forest, Ancient ruins"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Party Size</label>
            <input
              type="number"
              min="1"
              max="8"
              value={requirements.partySize || ''}
              onChange={(e) => setRequirements({ ...requirements, partySize: e.target.value ? parseInt(e.target.value) : '' })}
              placeholder="e.g., 4"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>

          <div className="p-3 bg-[var(--bg-secondary)] border border-white/10 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-white select-none">
              <input
                type="checkbox"
                checked={!!requirements.generateNewAdversaries}
                onChange={(e) => setRequirements({ ...requirements, generateNewAdversaries: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-black/40 text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
              />
              <span>Also generate fresh adversaries for this encounter</span>
            </label>
            <p className="text-xs text-white/50 mt-2 ml-6">
              The AI will propose new adversary concepts. You'll be able to review and edit them, then they'll be fully statted up and added to your campaign's adversary list.
            </p>
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 p-4 bg-[rgb(var(--color-primary))/10] rounded-xl border border-[rgb(var(--color-primary))/20]">
        <Zap size={20} className="text-[rgb(var(--color-primary-light))] mt-0.5 shrink-0" />
        <p className="text-sm text-white/70 m-0">
          Generation uses your campaign's pitch, themes, tone, and existing content to keep everything consistent with your world.
        </p>
      </div>

      {/* Description — the key field */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80">
          Describe what you want <span className="text-white/40">(Optional but recommended)</span>
        </label>
        <textarea
          value={requirements.description || ''}
          onChange={(e) => setRequirements({ ...requirements, description: e.target.value })}
          placeholder={
            type === 'npc' ? 'e.g., A corrupt dwarven mine foreman secretly working for the shadow cult. Gruff exterior hiding genuine fear.'
            : type === 'location' ? 'e.g., An ancient underwater dungeon that was once a temple, now flooded and home to something ancient.'
            : type === 'lore' ? 'e.g., The origin of the shadow cult and why the first members turned away from the light.'
            : 'Describe what you want the AI to generate...'
          }
          rows={3}
          className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-[rgb(var(--color-primary))] resize-none"
        />
      </div>

      {renderTypeFields()}

      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate with AI'}
      </button>
    </div>
  );
}
