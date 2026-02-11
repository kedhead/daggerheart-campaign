import React, { useState } from 'react';
import { Zap, Key, Settings } from 'lucide-react';

/**
 * Direct API Generator Component
 * Generates content using user's API key for seamless in-app generation
 */
export default function DirectAPIGenerator({
  type,
  apiKey,
  provider,
  onGenerateWithAPI,
  onOpenAPISettings,
  generating
}) {
  const [requirements, setRequirements] = useState({});

  const handleGenerate = () => {
    onGenerateWithAPI(requirements);
  };

  const renderRequirements = () => {
    if (type === 'npc') {
      return (
        <div className="flex flex-col gap-4">
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
              placeholder="e.g., Blacksmith, Merchant"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Relationship (Optional)</label>
            <select
              value={requirements.relationship || ''}
              onChange={(e) => setRequirements({ ...requirements, relationship: e.target.value })}
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            >
              <option value="">AI decides</option>
              <option value="ally">Ally</option>
              <option value="neutral">Neutral</option>
              <option value="enemy">Enemy</option>
            </select>
          </div>
        </div>
      );
    }

    if (type === 'location') {
      return (
        <div className="flex flex-col gap-4">
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
            <label className="text-sm font-medium text-white/80">Type (Optional)</label>
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
              placeholder="e.g., The Northlands"
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
            <label className="text-sm font-medium text-white/80">Enemy Types (Optional)</label>
            <input
              type="text"
              value={requirements.enemyTypes || ''}
              onChange={(e) => setRequirements({ ...requirements, enemyTypes: e.target.value })}
              placeholder="e.g., Bandits, Undead"
              className="w-full p-2 bg-black/20 border border-white/10 rounded-md text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-6 text-center border-2 border-dashed border-white/10 rounded-xl bg-[var(--bg-secondary)]">
        <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
          <Key size={24} className="text-amber-400 mt-1" />
          <div>
            <h4 className="text-base font-bold text-white mb-1">API Key Required</h4>
            <p className="text-sm text-white/60 m-0">You need to configure your API key to use direct generation.</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onOpenAPISettings}>
          <Settings size={20} />
          Configure API Key
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl border border-white/5">
        <Zap size={24} className="text-purple-400 mt-1" />
        <div>
          <h4 className="text-base font-bold text-white mb-1">Direct AI Generation</h4>
          <p className="text-sm text-white/60 m-0">Generate content instantly using your {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key.</p>
        </div>
      </div>

      {renderRequirements()}

      <div className="flex flex-col gap-3">
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate with AI'}
        </button>

        <button
          className="text-sm text-white/40 hover:text-white flex items-center justify-center gap-2 py-2"
          onClick={onOpenAPISettings}
        >
          <Settings size={14} />
          Change API Settings
        </button>
      </div>
    </div>
  );
}
