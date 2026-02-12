import { useState, useEffect } from 'react';
import WizardStep from '../WizardStep';
import { COMMUNITIES } from '../../../../data/systems/daggerheart';
import { Plus, X, Users, BookOpen } from 'lucide-react';

export default function CommunitiesStep({ value, onChange }) {
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [showStandard, setShowStandard] = useState(false);

  // Initialize value as array
  useEffect(() => {
    if (!value || typeof value === 'string') {
      try {
        // Try to parse if it's a JSON string, otherwise start empty
        const parsed = typeof value === 'string' && value.trim().startsWith('[')
          ? JSON.parse(value)
          : [];
        onChange(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        onChange([]);
      }
    }
  }, []);

  const communities = Array.isArray(value) ? value : [];

  const addCommunity = (name, description) => {
    onChange([...communities, { name, description }]);
    setCustomName('');
    setCustomDesc('');
    setShowStandard(false);
  };

  const removeCommunity = (index) => {
    const newCommunities = [...communities];
    newCommunities.splice(index, 1);
    onChange(newCommunities);
  };

  return (
    <WizardStep
      title="Communities"
      description="Describe the different communities (factions, cultures, groups) in your campaign world."
    >
      <div className="space-y-6">
        {/* Added Communities List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider flex items-center justify-between">
            <span>Your Communities</span>
            <span className="text-white/40 text-xs normal-case font-normal">{communities.length} added</span>
          </h3>

          {communities.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5">
              <Users className="mx-auto text-white/20 mb-3" size={32} />
              <p className="text-white/60">No communities added yet.</p>
              <p className="text-sm text-white/40 mt-1">Add standard Daggerheart communities or create your own.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {communities.map((community, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 relative group hover:border-white/20 transition-colors">
                  <button
                    onClick={() => removeCommunity(idx)}
                    className="absolute top-3 right-3 text-white/20 hover:text-red-400 transition-colors"
                    title="Remove Community"
                  >
                    <X size={16} />
                  </button>
                  <h4 className="font-bold text-white mb-1">{community.name}</h4>
                  <p className="text-sm text-white/70">{community.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Add Standard Community */}
          <div className="space-y-3">
            <button
              onClick={() => setShowStandard(!showStandard)}
              className="w-full btn btn-secondary justify-center py-3"
            >
              <BookOpen size={18} />
              {showStandard ? 'Hide Standard Communities' : 'Browse Standard Communities'}
            </button>

            {showStandard && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-3 max-h-60 overflow-y-auto space-y-2">
                {Object.entries(COMMUNITIES).map(([name, desc]) => {
                  const isAdded = communities.some(c => c.name === name);
                  if (isAdded) return null;

                  return (
                    <button
                      key={name}
                      onClick={() => addCommunity(name, desc)}
                      className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{name}</span>
                        <Plus size={14} className="text-[rgb(var(--color-primary))] opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-xs text-white/50 line-clamp-1">{desc}</p>
                    </button>
                  );
                })}
                {Object.keys(COMMUNITIES).every(name => communities.some(c => c.name === name)) && (
                  <p className="text-center text-xs text-white/40 py-2">All standard communities added</p>
                )}
              </div>
            )}
          </div>

          {/* Add Custom Community */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-white">Add Custom Community</h4>
            <input
              type="text"
              placeholder="Community Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
            <textarea
              placeholder="Description"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              rows={2}
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
            <button
              onClick={() => addCommunity(customName, customDesc)}
              disabled={!customName.trim()}
              className="w-full btn btn-primary justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add Custom
            </button>
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
