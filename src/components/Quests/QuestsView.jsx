import { useState, useMemo } from 'react';
import { Target, Plus, Search, Filter } from 'lucide-react';
import QuestCard from './QuestCard';
import QuestForm from './QuestForm';
import './QuestsView.css';

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
    <div className="quests-view">
      <div className="view-header">
        <div className="header-title">
          <Target size={24} />
          <h2>Quests</h2>
          <span className="count-badge">{statusCounts.active} active</span>
        </div>
        {isDM && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            New Quest
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="quests-controls">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search quests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-filters">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.value}
              className={`filter-btn ${statusFilter === filter.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
              {statusCounts[filter.value] > 0 && (
                <span className="filter-count">{statusCounts[filter.value]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quest Form Modal */}
      {(showForm || editingQuest) && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingQuest(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <QuestForm
              quest={editingQuest}
              onSave={editingQuest ? handleEditQuest : handleAddQuest}
              onCancel={() => { setShowForm(false); setEditingQuest(null); }}
              isDM={isDM}
              entityData={entityData}
            />
          </div>
        </div>
      )}

      {/* Quest List */}
      {filteredQuests.length === 0 ? (
        <div className="empty-state">
          <Target size={48} strokeWidth={1.5} />
          <h3>No quests yet</h3>
          <p>
            {statusFilter !== 'all'
              ? `No ${statusFilter} quests found.`
              : isDM
                ? 'Create your first quest to start tracking your party\'s adventures.'
                : 'No quests have been assigned yet.'}
          </p>
          {isDM && statusFilter === 'all' && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Create Quest
            </button>
          )}
        </div>
      ) : (
        <div className="quests-list">
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
