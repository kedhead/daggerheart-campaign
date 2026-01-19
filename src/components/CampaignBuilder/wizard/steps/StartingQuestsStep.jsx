import { useState } from 'react';
import { Plus, X, Sparkles, ChevronDown, ChevronUp, Target, Eye, EyeOff, GripVertical } from 'lucide-react';
import WizardStep from '../WizardStep';
import { templateService } from '../../../../services/templateService';

export default function StartingQuestsStep({ value = [], onChange, campaign }) {
  const [expandedQuest, setExpandedQuest] = useState(null);

  const generateId = () => `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addQuest = () => {
    const newQuest = {
      id: generateId(),
      name: '',
      description: '',
      priority: 'medium',
      objectives: [],
      rewards: '',
      hidden: false
    };
    onChange([...value, newQuest]);
    setExpandedQuest(newQuest.id);
  };

  const removeQuest = (id) => {
    onChange(value.filter(q => q.id !== id));
    if (expandedQuest === id) {
      setExpandedQuest(null);
    }
  };

  const updateQuest = (id, field, fieldValue) => {
    onChange(value.map(q =>
      q.id === id ? { ...q, [field]: fieldValue } : q
    ));
  };

  const addObjective = (questId) => {
    const quest = value.find(q => q.id === questId);
    if (quest) {
      const newObjective = {
        id: generateId(),
        text: '',
        completed: false
      };
      updateQuest(questId, 'objectives', [...(quest.objectives || []), newObjective]);
    }
  };

  const updateObjective = (questId, objId, text) => {
    const quest = value.find(q => q.id === questId);
    if (quest) {
      updateQuest(questId, 'objectives', quest.objectives.map(obj =>
        obj.id === objId ? { ...obj, text } : obj
      ));
    }
  };

  const removeObjective = (questId, objId) => {
    const quest = value.find(q => q.id === questId);
    if (quest) {
      updateQuest(questId, 'objectives', quest.objectives.filter(obj => obj.id !== objId));
    }
  };

  const generateRandomQuest = () => {
    const generated = templateService.generateStartingQuest({ campaign });
    const newQuest = {
      ...generated,
      id: generateId()
    };
    onChange([...value, newQuest]);
    setExpandedQuest(newQuest.id);
  };

  const toggleExpanded = (id) => {
    setExpandedQuest(expandedQuest === id ? null : id);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--fear-color)';
      case 'medium': return 'var(--hope-color)';
      case 'low': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <WizardStep
      title="Starting Quests"
      description="Define 1-3 quests that the party will begin with. These will be created as active quests when you complete the campaign frame."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Quest List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {value.map((quest) => (
            <div
              key={quest.id}
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                border: expandedQuest === quest.id ? '2px solid var(--hope-color)' : '1px solid var(--border)'
              }}
            >
              {/* Quest Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  background: expandedQuest === quest.id ? 'var(--bg-tertiary)' : 'transparent'
                }}
                onClick={() => toggleExpanded(quest.id)}
              >
                <Target size={18} style={{ color: getPriorityColor(quest.priority), flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 500 }}>
                  {quest.name || 'New Quest'}
                </span>
                {quest.hidden && (
                  <EyeOff size={16} style={{ color: 'var(--text-secondary)' }} title="Hidden from players" />
                )}
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '4px',
                    background: getPriorityColor(quest.priority),
                    color: 'white'
                  }}
                >
                  {quest.priority}
                </span>
                {expandedQuest === quest.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {/* Quest Details (Expanded) */}
              {expandedQuest === quest.id && (
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Name */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Quest Name</label>
                    <input
                      type="text"
                      value={quest.name}
                      onChange={(e) => updateQuest(quest.id, 'name', e.target.value)}
                      placeholder="Enter quest name..."
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Description</label>
                    <textarea
                      value={quest.description}
                      onChange={(e) => updateQuest(quest.id, 'description', e.target.value)}
                      placeholder="Describe the quest..."
                      rows={3}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
                    />
                  </div>

                  {/* Priority & Hidden */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                      <label>Priority</label>
                      <select
                        value={quest.priority}
                        onChange={(e) => updateQuest(quest.id, 'priority', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'flex-end' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={quest.hidden}
                          onChange={(e) => updateQuest(quest.id, 'hidden', e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {quest.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                          Hidden from players
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Objectives */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Objectives</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(quest.objectives || []).map((obj) => (
                        <div key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="text"
                            value={obj.text}
                            onChange={(e) => updateObjective(quest.id, obj.id, e.target.value)}
                            placeholder="Objective..."
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                          <button
                            onClick={() => removeObjective(quest.id, obj.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="btn btn-secondary"
                        onClick={() => addObjective(quest.id)}
                        style={{ alignSelf: 'flex-start', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        <Plus size={16} />
                        Add Objective
                      </button>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Rewards (optional)</label>
                    <input
                      type="text"
                      value={quest.rewards || ''}
                      onChange={(e) => updateQuest(quest.id, 'rewards', e.target.value)}
                      placeholder="Gold, items, reputation, etc..."
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                  </div>

                  {/* Remove Quest */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeQuest(quest.id)}
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      <X size={16} />
                      Remove Quest
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {value.length === 0 && (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                border: '2px dashed var(--border)'
              }}
            >
              <Target size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                No starting quests yet. Add some to give your players goals from the beginning!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={addQuest}>
            <Plus size={20} />
            Add Quest
          </button>
          <button className="btn btn-secondary" onClick={generateRandomQuest}>
            <Sparkles size={20} />
            Generate Random
          </button>
        </div>

        <small className="form-hint">
          Starting quests give your party immediate goals when the campaign begins.
          Use the "Hidden" option for secret quests that only the GM can see.
        </small>
      </div>
    </WizardStep>
  );
}
