import { useState, useMemo } from 'react';
import { Target, Plus, Search, Filter } from 'lucide-react';
import QuestCard from './QuestCard';
import QuestForm from './QuestForm';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'on-hold', label: 'On Hold' }
];

export default function QuestsView({
  campaign,
  quests = [],
  addQuest,
  updateQuest,
  deleteQuest,
  toggleQuestObjective,
  isDM,
  npcs = [],
  locations = [],
  items = [],
  lore = [],
  encounters = [],
  sessions = [],
  timelineEvents = [],
  notes = []
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter quests based on visibility, search, and status
  const filteredQuests = useMemo(() => {
    return quests
      .filter(quest => {
        // Hide hidden quests from non-DMs
        if (!isDM && quest.hidden) return false;

        // Status filter
        if (statusFilter !== 'all' && quest.status !== statusFilter) return false;

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = quest.name?.toLowerCase().includes(query);
          const matchesDescription = quest.description?.toLowerCase().includes(query);
          return matchesName || matchesDescription;
        }

        return true;
      })
      .sort((a, b) => {
        // Active quests first, then by priority, then by creation date
        const statusOrder = { active: 0, 'on-hold': 1, completed: 2, failed: 3 };
        const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };

        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
  }, [quests, isDM, statusFilter, searchQuery]);

  // Count quests by status
  const statusCounts = useMemo(() => {
    const counts = { all: 0, active: 0, completed: 0, failed: 0, 'on-hold': 0 };
    quests.forEach(quest => {
      if (!isDM && quest.hidden) return;
      counts.all++;
      if (counts[quest.status] !== undefined) {
        counts[quest.status]++;
      }
    });
    return counts;
  }, [quests, isDM]);

  const handleAddQuest = async (questData) => {
    await addQuest(questData);
    setShowForm(false);
  };

  const handleEditQuest = async (questData) => {
    await updateQuest(editingQuest.id, questData);
    setEditingQuest(null);
  };

  const handleDeleteQuest = async (questId) => {
    if (confirm('Are you sure you want to delete this quest?')) {
      await deleteQuest(questId);
    }
  };

  // Entity data for wiki linking
  const entityData = { npcs, locations, items, lore, encounters, sessions, timelineEvents, notes };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Target className="text-[rgb(var(--color-primary))]" size={32} />
            Quest Log
          </h2>
          <p className="text-white/60 text-lg">
            {statusCounts.active} active {statusCounts.active === 1 ? 'quest' : 'quests'}
          </p>
        </div>
        {isDM && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} />
            New Quest
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sticky top-0 z-20 bg-[var(--bg-primary)]/80 backdrop-blur-xl p-4 -mx-4 rounded-xl border border-white/5 md:flex-row md:items-center md:justify-between shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search quests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`
                whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border
                ${statusFilter === filter.value
                  ? 'bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]/50'
                  : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10 hover:text-white'}
              `}
            >
              {filter.label}
              {statusCounts[filter.value] > 0 && (
                <span className={`ml-2 text-xs opacity-60 ${statusFilter === filter.value ? 'text-[rgb(var(--color-primary))]' : ''}`}>
                  {statusCounts[filter.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quest Form Modal */}
      {(showForm || editingQuest) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingQuest(null); }}>
          <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto" style={{ maxHeight: 'min(90vh, calc(100dvh - 2rem))' }} onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <QuestForm
                quest={editingQuest}
                onSave={editingQuest ? handleEditQuest : handleAddQuest}
                onCancel={() => { setShowForm(false); setEditingQuest(null); }}
                isDM={isDM}
                campaign={campaign}
                entityData={entityData}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quest List */}
      {filteredQuests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
            <Target size={32} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No quests found</h3>
          <p className="text-white/40 max-w-sm mb-6">
            {statusFilter !== 'all'
              ? `No ${statusFilter} quests match your criteria.`
              : 'The adventure log is empty.'}
          </p>
          {isDM && statusFilter === 'all' && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Create First Quest
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onEdit={() => setEditingQuest(quest)}
              onDelete={() => handleDeleteQuest(quest.id)}
              onToggleObjective={toggleQuestObjective}
              onUpdateStatus={(status) => updateQuest(quest.id, { status })}
              isDM={isDM}
              entityData={entityData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
