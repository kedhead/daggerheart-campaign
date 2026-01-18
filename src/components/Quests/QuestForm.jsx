import { useState } from 'react';
import { Save, X, Plus, Trash2, GripVertical } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import './QuestForm.css';

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
  entityData = {}
}) {
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
    <form className="quest-form" onSubmit={handleSubmit}>
      <h3>{quest ? 'Edit Quest' : 'Create Quest'}</h3>

      {/* Name */}
      <div className="form-group">
        <label>Quest Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter quest name..."
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-text">{errors.name}</span>}
      </div>

      {/* Status & Priority Row */}
      <div className="form-row">
        <div className="form-group">
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value)}
          >
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label>Description</label>
        <WikiLinkInput
          value={formData.description}
          onChange={(value) => handleChange('description', value)}
          placeholder="Describe the quest... Use [[entity name]] to link to NPCs, locations, etc."
          rows={4}
          entities={entityData}
        />
      </div>

      {/* Objectives */}
      <div className="form-group">
        <label>Objectives</label>
        <div className="objectives-editor">
          {formData.objectives.map((objective, index) => (
            <div key={objective.id} className="objective-row">
              <button
                type="button"
                className="btn btn-ghost btn-icon drag-handle"
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
                placeholder="Objective..."
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-danger"
                onClick={() => handleRemoveObjective(objective.id)}
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="add-objective-row">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Add new objective..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddObjective();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
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
      <div className="form-group">
        <label>Rewards</label>
        <WikiLinkInput
          value={formData.rewards}
          onChange={(value) => handleChange('rewards', value)}
          placeholder="Describe the rewards... Use [[item name]] to link to items."
          rows={2}
          entities={entityData}
        />
      </div>

      {/* Hidden Toggle */}
      {isDM && (
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.hidden}
              onChange={(e) => handleChange('hidden', e.target.checked)}
            />
            <span>Hidden from players</span>
          </label>
          <small className="form-hint">Players won't see this quest until you reveal it</small>
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
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
