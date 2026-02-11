import { useState } from 'react';
import { Save, X, Plus, Trash2, GripVertical } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' }
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'No Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' }
];

export default function QuestForm({
  quest = null,
  onSave,
  onCancel,
  isDM,
  campaign,
  entityData = {}
}) {
  // Create entity registry for wiki linking
  const { search: searchEntities } = useEntityRegistry(campaign, entityData, isDM);
  const [formData, setFormData] = useState({
    name: quest?.name || '',
    description: quest?.description || '',
    status: quest?.status || 'active',
    priority: quest?.priority || '',
    objectives: quest?.objectives || [],
    rewards: quest?.rewards || '',
    hidden: quest?.hidden || false
  });

  const [newObjective, setNewObjective] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;

    const objective = {
      id: `obj-${Date.now()}`,
      text: newObjective.trim(),
      completed: false
    };

    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, objective]
    }));
    setNewObjective('');
  };

  const handleRemoveObjective = (objectiveId) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter(obj => obj.id !== objectiveId)
    }));
  };

  const handleObjectiveChange = (objectiveId, newText) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map(obj =>
        obj.id === objectiveId ? { ...obj, text: newText } : obj
      )
    }));
  };

  const handleMoveObjective = (index, direction) => {
    const newObjectives = [...formData.objectives];
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= newObjectives.length) return;

    [newObjectives[index], newObjectives[newIndex]] = [newObjectives[newIndex], newObjectives[index]];
    setFormData(prev => ({ ...prev, objectives: newObjectives }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Quest name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      rewards: formData.rewards.trim()
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-xl font-bold text-white">{quest ? 'Edit Quest' : 'Create New Quest'}</h3>
        <button type="button" onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Quest Name <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter quest name..."
          className={`w-full bg-black/20 border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] transition-all ${errors.name ? 'border-red-500/50' : 'border-white/10'}`}
        />
        {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
      </div>

      {/* Status & Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/80 block">Status</label>
          <div className="relative">
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full appearance-none bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] transition-all"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-white/80 block">Priority</label>
          <div className="relative">
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full appearance-none bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] transition-all"
            >
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Description</label>
        <WikiLinkInput
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          searchEntities={searchEntities}
          placeholder="Describe the quest... Use [[entity name]] to link to NPCs, locations, etc."
          rows={4}
        />
        <p className="text-xs text-white/40">Type [[ to link to other entities</p>
      </div>

      {/* Objectives */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80 block">Objectives</label>
        <div className="space-y-2 bg-black/20 border border-white/5 rounded-lg p-4">
          {formData.objectives.length === 0 && (
            <p className="text-sm text-white/40 italic text-center py-2">No objectives added yet</p>
          )}

          {formData.objectives.map((objective, index) => (
            <div key={objective.id} className="flex items-center gap-2">
              <button
                type="button"
                className={`p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                disabled={index === 0}
                onClick={() => handleMoveObjective(index, -1)}
                title="Move up"
              >
                <GripVertical size={14} />
              </button>
              <input
                type="text"
                value={objective.text}
                onChange={(e) => handleObjectiveChange(objective.id, e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
                placeholder="Objective..."
              />
              <button
                type="button"
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                onClick={() => handleRemoveObjective(objective.id)}
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-2 mt-2 border-t border-white/5">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Add new objective..."
              className="flex-1 bg-transparent border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))] placeholder:text-white/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddObjective();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary text-xs py-1.5 h-full"
              onClick={handleAddObjective}
              disabled={!newObjective.trim()}
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Rewards</label>
        <WikiLinkInput
          value={formData.rewards}
          onChange={(e) => handleChange('rewards', e.target.value)}
          searchEntities={searchEntities}
          placeholder="Describe the rewards... Use [[item name]] to link to items."
          rows={2}
        />
      </div>

      {/* Hidden Toggle */}
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
            <span className="block text-xs text-white/50">Only you can see this quest until revealed</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          {quest ? 'Update Quest' : 'Create Quest'}
        </button>
      </div>
    </form>
  );
}
