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
  XCircle,
  Play
} from 'lucide-react';
import WikiText from '../WikiText/WikiText';
import InlineEdit from '../InlineEdit/InlineEdit';
import { useToast } from '../../contexts/ToastContext';

const STATUS_CONFIG = {
  active: { icon: Target, label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  completed: { icon: Trophy, label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  'on-hold': { icon: Clock, label: 'On Hold', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' }
};

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: 'text-red-400', bg: 'bg-red-400/10' },
  medium: { label: 'Medium Priority', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  low: { label: 'Low Priority', color: 'text-slate-400', bg: 'bg-slate-400/10' }
};

export default function QuestCard({
  quest,
  onEdit,
  onDelete,
  onUpdate,
  onToggleObjective,
  onUpdateStatus,
  isDM,
  entityData = {}
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { success, error } = useToast();

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
    <div className={`group relative bg-[var(--bg-secondary)] border border-white/5 rounded-xl transition-all duration-300 ${quest.hidden ? 'opacity-70 border-dashed hover:opacity-100' : 'hover:border-white/10'}`}>
      {/* Header */}
      <div
        className="p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors rounded-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`p-3 rounded-xl h-fit ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
          <StatusIcon size={24} />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <InlineEdit
                  value={quest.name}
                  onSave={async (newName) => {
                    if (onUpdate) {
                      try {
                        await onUpdate(quest.id, { ...quest, name: newName });
                        success('Quest name updated');
                      } catch (e) {
                        error('Failed to update quest name');
                        throw e;
                      }
                    }
                  }}
                  disabled={!isDM || !onUpdate}
                  as="h3"
                  className="text-lg font-bold text-white truncate"
                />

                {quest.hidden && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-white/40">
                    <EyeOff size={12} />
                    <span>Hidden</span>
                  </div>
                )}

                {priorityConfig && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                    {priorityConfig.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className={`font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {totalCount > 0 && (
                  <span className="text-white/40">
                    {completedCount}/{totalCount} objectives
                  </span>
                )}
              </div>
            </div>

            <button className="p-1 text-white/20 hover:text-white transition-colors">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${quest.status === 'completed' ? 'bg-blue-500' : quest.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-6">
          {/* Description */}
          {quest.description && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Description</h4>
              <div className="text-white/80 text-sm leading-relaxed">
                <WikiText
                  text={quest.description}
                  entities={entityData}
                  isDM={isDM}
                />
              </div>
            </div>
          )}

          {/* Objectives */}
          {objectives.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Objectives</h4>
              <ul className="space-y-2">
                {objectives.map(objective => (
                  <li
                    key={objective.id}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border transition-all
                      ${objective.completed
                        ? 'bg-emerald-500/5 border-emerald-500/10'
                        : 'bg-white/5 border-white/5 hover:border-white/10'}
                      ${isDM ? 'cursor-pointer hover:bg-white/10' : ''}
                    `}
                    onClick={() => isDM && handleObjectiveToggle(objective.id, objective.completed)}
                  >
                    <div className={objective.completed ? 'text-emerald-400' : 'text-white/20'}>
                      {objective.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                    <span className={`text-sm ${objective.completed ? 'text-white/40 line-through' : 'text-white/90'}`}>
                      {objective.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rewards */}
          {quest.rewards && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Rewards</h4>
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <WikiText
                  text={quest.rewards}
                  entities={entityData}
                  isDM={isDM}
                />
              </div>
            </div>
          )}

          {/* DM Actions */}
          {isDM && (
            <div className="pt-4 mt-2 border-t border-white/5 flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                {quest.status !== 'completed' && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-all"
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus('completed'); }}
                  >
                    <Trophy size={14} />
                    Complete
                  </button>
                )}
                {quest.status !== 'failed' && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-all"
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus('failed'); }}
                  >
                    <XCircle size={14} />
                    Fail
                  </button>
                )}
                {quest.status === 'active' && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/20 transition-all"
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus('on-hold'); }}
                  >
                    <Clock size={14} />
                    Hold
                  </button>
                )}
                {quest.status !== 'active' && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all"
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus('active'); }}
                  >
                    <Play size={14} />
                    Reactivate
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  title="Edit Quest"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  title="Delete Quest"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
