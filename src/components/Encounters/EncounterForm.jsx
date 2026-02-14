import { useState } from 'react';
import { Save, X } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';

export default function EncounterForm({ encounter, onSave, onCancel, campaign, entities, isDM }) {
  // Create entity registry for wiki linking
  const { search: searchEntities, autoLink } = useEntityRegistry(campaign, entities, isDM);
  const [formData, setFormData] = useState({
    name: encounter?.name || '',
    difficulty: encounter?.difficulty || 'medium',
    partyLevel: encounter?.partyLevel || '',
    description: encounter?.description || '',
    enemies: encounter?.enemies || '',
    environment: encounter?.environment || '',
    tactics: encounter?.tactics || '',
    rewards: encounter?.rewards || '',
    freshcutgrassLink: encounter?.freshcutgrassLink || '',
    hidden: encounter?.hidden || false
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Scenario Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter scenario name..."
          className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/80 block">Difficulty</label>
          <div className="relative">
            <select
              value={formData.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              className="w-full appearance-none bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-white/80 block">Rec. Level</label>
          <input
            type="number"
            value={formData.partyLevel}
            onChange={(e) => handleChange('partyLevel', e.target.value)}
            placeholder="e.g. 3"
            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Description</label>
        <WikiLinkInput
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          searchEntities={searchEntities}
          autoLink={autoLink}
          placeholder="Describe the scenario... Use [[entity name]] to link."
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Opponents</label>
        <WikiLinkInput
          value={formData.enemies}
          onChange={(e) => handleChange('enemies', e.target.value)}
          searchEntities={searchEntities}
          autoLink={autoLink}
          placeholder="List enemies and their stats..."
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Environment</label>
        <WikiLinkInput
          value={formData.environment}
          onChange={(e) => handleChange('environment', e.target.value)}
          searchEntities={searchEntities}
          autoLink={autoLink}
          placeholder="Describe the environment/terrain..."
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Tactics</label>
        <WikiLinkInput
          value={formData.tactics}
          onChange={(e) => handleChange('tactics', e.target.value)}
          searchEntities={searchEntities}
          autoLink={autoLink}
          placeholder="Enemy strategies..."
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Rewards</label>
        <WikiLinkInput
          value={formData.rewards}
          onChange={(e) => handleChange('rewards', e.target.value)}
          searchEntities={searchEntities}
          autoLink={autoLink}
          placeholder="Loot and XP..."
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">FreshCutGrass Link (Optional)</label>
        <input
          type="url"
          value={formData.freshcutgrassLink}
          onChange={(e) => handleChange('freshcutgrassLink', e.target.value)}
          placeholder="https://freshcutgrass.app/encounter/..."
          className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
        />
      </div>

      {isDM && (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleChange('hidden', !formData.hidden)}>
          <input
            type="checkbox"
            checked={formData.hidden}
            onChange={(e) => handleChange('hidden', e.target.checked)}
            className="rounded border-white/20 bg-black/40 text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
          />
          <div>
            <span className="block text-sm font-medium text-white">Hidden from Players</span>
            <span className="block text-xs text-white/50">Only you can see this until revealed</span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          {encounter ? 'Update Scenario' : 'Create Scenario'}
        </button>
      </div>
    </form>
  );
}
