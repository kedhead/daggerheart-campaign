import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Template Generator Component
 * Generates content using pre-built templates and random generators
 */
export default function TemplateGenerator({ type, requirements, onGenerate, generating }) {
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleGenerate = () => {
    const context = {
      ...requirements,
      ...selectedOptions
    };
    onGenerate(context);
  };

  const renderRequirements = () => {
    if (type === 'npc') {
      return (
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Relationship (Optional)</label>
            <select
              value={selectedOptions.relationship || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, relationship: e.target.value })}
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            >
              <option value="">Random</option>
              <option value="ally">Ally</option>
              <option value="neutral">Neutral</option>
              <option value="enemy">Enemy</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Occupation (Optional)</label>
            <input
              type="text"
              value={selectedOptions.occupation || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, occupation: e.target.value })}
              placeholder="Leave blank for random"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Location (Optional)</label>
            <input
              type="text"
              value={selectedOptions.location || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, location: e.target.value })}
              placeholder="Leave blank for random"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>
        </div>
      );
    }

    if (type === 'location') {
      return (
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Type (Optional)</label>
            <select
              value={selectedOptions.type || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, type: e.target.value })}
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            >
              <option value="">Random</option>
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
              value={selectedOptions.region || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, region: e.target.value })}
              placeholder="Leave blank for random"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>
        </div>
      );
    }

    if (type === 'encounter') {
      return (
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Difficulty (Optional)</label>
            <select
              value={selectedOptions.difficulty || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, difficulty: e.target.value })}
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            >
              <option value="">Random</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Party Level (Optional)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={selectedOptions.partyLevel || ''}
              onChange={(e) => setSelectedOptions({ ...selectedOptions, partyLevel: parseInt(e.target.value) })}
              placeholder="1"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-white/5">
        <Sparkles size={24} className="text-emerald-400 mt-1" />
        <div>
          <h4 className="text-base font-bold text-white mb-1">Random Template Generation</h4>
          <p className="text-sm text-white/60 m-0">Instantly generate content from curated lists. No AI required!</p>
        </div>
      </div>

      {renderRequirements()}

      <button
        className="btn btn-primary"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate'}
      </button>
    </div>
  );
}
