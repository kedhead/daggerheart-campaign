import { useState } from 'react';
import {
  Target,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  EyeOff,
  AlertTriangle,
  Clock,
  Trophy,
  XCircle
} from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import './QuestCard.css';

const STATUS_CONFIG = {
  active: { icon: Target, label: 'Active', color: '#22c55e' },
  completed: { icon: Trophy, label: 'Completed', color: '#3b82f6' },
  failed: { icon: XCircle, label: 'Failed', color: '#ef4444' },
  'on-hold': { icon: Clock, label: 'On Hold', color: '#f59e0b' }
};

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: '#ef4444' },
  medium: { label: 'Medium Priority', color: '#f59e0b' },
  low: { label: 'Low Priority', color: '#6b7280' }
};

export default function QuestCard({
  quest,
  onEdit,
  onDelete,
  onToggleObjective,
  onUpdateStatus,
  isDM,
  entityData = {}
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[quest.status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;
  const priorityConfig = quest.priority ? PRIORITY_CONFIG[quest.priority] : null;

  // Calculate progress
  const objectives = quest.objectives || [];
  const completedCount = objectives.filter(obj => obj.completed).length;
  const totalCount = objectives.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleObjectiveToggle = (objectiveId, currentCompleted) => {
    onToggleObjective(quest.id, objectiveId, !currentCompleted);
  };

  return (
    <div className={`quest-card card ${quest.status} ${quest.hidden ? 'hidden-quest' : ''}`}>
      {/* Header */}
      <div className="quest-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="quest-icon" style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}>
          <StatusIcon size={24} />
        </div>

        <div className="quest-info">
          <div className="quest-title-row">
            <h3>
              {quest.name}
              {quest.hidden && <EyeOff size={14} className="hidden-icon" />}
            </h3>
            {priorityConfig && (
              <span className="priority-badge" style={{ backgroundColor: `${priorityConfig.color}20`, color: priorityConfig.color }}>
                {priorityConfig.label}
              </span>
            )}
          </div>

          <div className="quest-meta">
            <span className="status-badge" style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}>
              {statusConfig.label}
            </span>
            {totalCount > 0 && (
              <span className="objectives-count">
                {completedCount}/{totalCount} objectives
              </span>
            )}
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: statusConfig.color
                }}
              />
            </div>
          )}
        </div>

        <button className="btn btn-ghost expand-btn">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="quest-details">
          {/* Description */}
          {quest.description && (
            <div className="quest-section">
              <h4>Description</h4>
              <WikiText
                text={quest.description}
                entities={entityData}
                isDM={isDM}
              />
            </div>
          )}

          {/* Objectives */}
          {objectives.length > 0 && (
            <div className="quest-section">
              <h4>Objectives</h4>
              <ul className="objectives-list">
                {objectives.map(objective => (
                  <li
                    key={objective.id}
                    className={`objective-item ${objective.completed ? 'completed' : ''}`}
                    onClick={() => isDM && handleObjectiveToggle(objective.id, objective.completed)}
                  >
                    {objective.completed ? (
                      <CheckCircle2 size={18} className="objective-icon checked" />
                    ) : (
                      <Circle size={18} className="objective-icon" />
                    )}
                    <span className="objective-text">{objective.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rewards */}
          {quest.rewards && (
            <div className="quest-section">
              <h4>Rewards</h4>
              <WikiText
                text={quest.rewards}
                entities={entityData}
                isDM={isDM}
              />
            </div>
          )}

          {/* DM Actions */}
          {isDM && (
            <div className="quest-actions">
              {/* Quick Status Change */}
              <div className="status-actions">
                {quest.status !== 'completed' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => onUpdateStatus('completed')}
                  >
                    <Trophy size={14} />
                    Complete
                  </button>
                )}
                {quest.status !== 'failed' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onUpdateStatus('failed')}
                  >
                    <XCircle size={14} />
                    Fail
                  </button>
                )}
                {quest.status !== 'on-hold' && quest.status !== 'completed' && quest.status !== 'failed' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onUpdateStatus('on-hold')}
                  >
                    <Clock size={14} />
                    Hold
                  </button>
                )}
                {(quest.status === 'on-hold' || quest.status === 'completed' || quest.status === 'failed') && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onUpdateStatus('active')}
                  >
                    <Target size={14} />
                    Reactivate
                  </button>
                )}
              </div>

              <div className="edit-actions">
                <button className="btn btn-secondary btn-sm" onClick={onEdit}>
                  <Edit2 size={14} />
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={onDelete}>
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
