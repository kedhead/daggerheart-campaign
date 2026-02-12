import { useState } from 'react';
import { Save, X, TreePine, Play, Info } from 'lucide-react';
import BPCalculator, { calculateUsedBP, calculateBPBudget } from './BPCalculator';
import AdversaryPicker from './AdversaryPicker';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';
import './EncounterBuilder.css';

export default function EncounterBuilder({
  encounter,
  onSave,
  onCancel,
  campaign,
  adversaries = [],
  environments = [],
  characters = [],
  entities,
  isDM
}) {
  const { search } = useEntityRegistry(campaign, entities);
  const characterCount = characters.length;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    environmentId: '',
    adversarySlots: [],
    partySize: characterCount || 4,
    tactics: '',
    rewards: '',
    hidden: false,
    ...(encounter || {}),
    // Ensure array safety even if encounter has bad data
    adversarySlots: Array.isArray(encounter?.adversarySlots) ? encounter.adversarySlots : []
  });

  // Calculate BP values
  const usedBP = calculateUsedBP(formData.adversarySlots, adversaries);
  const budget = calculateBPBudget(formData.partySize);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      calculatedBP: budget,
      usedBP: usedBP
    });
  };

  // Get selected environment details
  const selectedEnvironment = environments.find(e => e.id === formData.environmentId);

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-white/60">Encounter Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Goblin Ambush, Dragon's Lair"
            required
            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-white/60">Description</label>
          <div className="relative">
            <WikiLinkInput
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              searchEntities={search}
              placeholder="Brief setup description... Type [[ to link entities"
              rows={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* BP Calculator */}
      <div className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-4 md:p-6">
        <BPCalculator
          partySize={formData.partySize}
          setPartySize={(size) => handleChange('partySize', size)}
          usedBP={usedBP}
          characterCount={characterCount}
        />
      </div>

      {/* Environment Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <TreePine className="text-emerald-400" size={20} />
          <h4 className="text-lg font-bold text-white">Environment</h4>
        </div>

        {environments.length === 0 ? (
          <div className="p-6 bg-[var(--bg-secondary)] border border-white/5 rounded-xl text-center border-dashed">
            <p className="text-white/60">No environments in catalog</p>
            <p className="text-xs text-white/40 mt-1">Import or create environments first to use them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-white/60">Select Environment</label>
              <select
                value={formData.environmentId}
                onChange={(e) => handleChange('environmentId', e.target.value)}
                className="w-full p-3 bg-black/20 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors appearance-none"
              >
                <option value="">-- No Environment --</option>
                {[1, 2, 3, 4].map(tier => {
                  const tierEnvs = environments.filter(e => e.tier === tier);
                  if (tierEnvs.length === 0) return null;
                  return (
                    <optgroup key={tier} label={`Tier ${tier}`} className="bg-gray-800">
                      {tierEnvs.map(env => (
                        <option key={env.id} value={env.id}>
                          {env.name} ({env.type}, DC {env.difficulty})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {selectedEnvironment && (
              <div className="p-4 bg-[var(--bg-secondary)] border border-white/5 rounded-lg space-y-2 animate-in fade-in duration-300">
                <div className="flex items-baseline justify-between border-b border-white/5 pb-2">
                  <span className="font-bold text-white">{selectedEnvironment.name}</span>
                  <span className="text-xs text-emerald-400 font-mono">
                    T{selectedEnvironment.tier} • {selectedEnvironment.type} • DC {selectedEnvironment.difficulty}
                  </span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{selectedEnvironment.description}</p>
                {selectedEnvironment.features?.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 text-xs text-white/50">
                    <Info size={12} />
                    <span>{selectedEnvironment.features.length} feature{selectedEnvironment.features.length !== 1 ? 's' : ''} available</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adversary Picker */}
      <div className="space-y-4">
        <AdversaryPicker
          adversarySlots={formData.adversarySlots}
          setAdversarySlots={(slots) => handleChange('adversarySlots', slots)}
          adversaries={adversaries}
        />
      </div>

      {/* Additional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-white/60">Tactics</label>
          <div className="relative">
            <WikiLinkInput
              value={formData.tactics}
              onChange={(e) => handleChange('tactics', e.target.value)}
              searchEntities={search}
              placeholder="How enemies behave in combat..."
              rows={3}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-white/60">Rewards</label>
          <div className="relative">
            <WikiLinkInput
              value={formData.rewards}
              onChange={(e) => handleChange('rewards', e.target.value)}
              searchEntities={search}
              placeholder="Loot, experience, story rewards..."
              rows={3}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Visibility */}
      {isDM && (
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/5">
          <input
            id="hidden-check"
            type="checkbox"
            checked={formData.hidden}
            onChange={(e) => handleChange('hidden', e.target.checked)}
            className="w-5 h-5 rounded border-white/10 bg-black/20 text-[rgb(var(--color-primary))] focus:ring-offset-0 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="hidden-check" className="cursor-pointer text-white/80 select-none">
            Hidden from Players
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
        >
          <X size={18} />
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
        >
          <Save size={18} />
          Save Encounter
        </button>
      </div>
    </form>
  );
}
