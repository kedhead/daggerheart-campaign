import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Swords, ExternalLink, Wand2, Play } from 'lucide-react';
import EncounterCard from './EncounterCard';
import EncounterForm from './EncounterForm';
import EncounterBuilder from './EncounterBuilder';
import LiveEncounterTracker from './LiveEncounterTracker';
import Modal from '../Modal';
import QuickGeneratorModal from '../CampaignBuilder/QuickGeneratorModal';
import { useActiveEncounter } from '../../hooks/useActiveEncounter';

const SORTS = {
  newest: (a, b) => ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) || (a.name || '').localeCompare(b.name || ''),
  oldest: (a, b) => ((a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)) || (a.name || '').localeCompare(b.name || ''),
  name: (a, b) => (a.name || '').localeCompare(b.name || ''),
};

export default function EncountersView({ campaign, encounters = [], addEncounter, updateEncounter, deleteEncounter, addAdversary, isDM, npcs = [], locations = [], lore = [], sessions = [], timelineEvents = [], notes = [], adversaries = [], environments = [], characters = [], targetEncounterId = null, onTargetEncounterHandled }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [quickGenOpen, setQuickGenOpen] = useState(false);
  const [useBuilder, setUseBuilder] = useState(true); // Use new BP builder by default
  const [showTracker, setShowTracker] = useState(false);

  // Active encounter hook
  const { activeEncounter, startEncounter } = useActiveEncounter(campaign?.id);

  // Auto-open a specific encounter when navigated here from a session's encounter link
  useEffect(() => {
    if (!targetEncounterId) return;
    const target = encounters.find(e => e.id === targetEncounterId);
    if (target && (isDM || !target.hidden)) {
      setEditingEncounter(target);
      setIsModalOpen(true);
    }
    onTargetEncounterHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetEncounterId, encounters, isDM]);

  // Check if this is a Daggerheart campaign (BP builder is Daggerheart-specific)
  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';

  // Handle running an encounter
  const handleRunEncounter = async (encounter) => {
    if (!isDM) return;

    const environment = encounter.environmentId
      ? environments.find(e => e.id === encounter.environmentId)
      : null;

    await startEncounter(encounter, adversaries, environment);
    setShowTracker(true);
  };

  const handleAdd = () => {
    setEditingEncounter(null);
    setIsModalOpen(true);
  };

  const handleEdit = (encounter) => {
    setEditingEncounter(encounter);
    setIsModalOpen(true);
  };

  const handleSave = async (encounterData) => {
    if (editingEncounter) {
      await updateEncounter(editingEncounter.id, encounterData);
    } else {
      await addEncounter(encounterData);
    }
    setIsModalOpen(false);
    setEditingEncounter(null);
  };

  const handleDelete = async (encounterId) => {
    if (confirm('Are you sure you want to delete this encounter template?')) {
      await deleteEncounter(encounterId);
    }
  };

  // Filter encounters
  const filteredEncounters = encounters.filter(encounter => {
    // Visibility filter
    if (!isDM && encounter.hidden) return false;

    const matchesSearch = encounter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encounter.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      encounter.enemies?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterDifficulty === 'all' || encounter.difficulty === filterDifficulty;

    return matchesSearch && matchesFilter;
  }).sort(SORTS[sortBy] || SORTS.newest);

  // Count by difficulty
  const counts = {
    all: encounters.length,
    easy: encounters.filter(e => e.difficulty === 'easy').length,
    medium: encounters.filter(e => e.difficulty === 'medium').length,
    hard: encounters.filter(e => e.difficulty === 'hard').length,
    deadly: encounters.filter(e => e.difficulty === 'deadly').length
  };

  const entitiesData = useMemo(() => ({
    npcs, locations, lore, sessions, timelineEvents, encounters, notes
  }), [npcs, locations, lore, sessions, timelineEvents, encounters, notes]);

  // Show tracker if there's an active encounter or user clicked "Run"
  if (showTracker || activeEncounter) {
    return (
      <LiveEncounterTracker
        campaignId={campaign?.id}
        isDM={isDM}
        adversaries={adversaries}
        onClose={() => setShowTracker(false)}
      />
    );
  }



  const DIFF_TONES = {
    easy: 'var(--success)',
    medium: '#f59e0b',
    hard: '#f97316',
    deadly: 'var(--danger)',
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 lr-fade-in" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Hero header */}
      <div
        className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between pb-6"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="space-y-2 w-full max-w-full">
          <span
            className="text-[11px] font-bold uppercase block"
            style={{ color: 'var(--fear)', letterSpacing: '0.28em' }}
          >
            GM Combat Prep
          </span>
          <h2
            className="text-3xl md:text-4xl flex items-center gap-3 flex-wrap"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            <Swords size={28} style={{ color: 'var(--fear)' }} className="shrink-0" />
            Combat Scenarios
          </h2>
          <div className="flex items-center gap-2 pt-1">
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{
                background: 'var(--surface-hi)',
                border: '1px solid var(--line-strong)',
              }}
            >
              <span
                className="text-[10px] font-bold uppercase"
                style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
              >
                {encounters.length} {encounters.length !== 1 ? 'Scenarios' : 'Scenario'} Prepared
              </span>
            </div>
          </div>
        </div>
        {isDM && (
          <div className="flex gap-2 flex-wrap">
            {activeEncounter && (
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
                style={{
                  background: 'var(--success)',
                  color: '#fff',
                  border: '1px solid transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
                onClick={() => setShowTracker(true)}
              >
                <Play size={16} />
                <span className="font-bold text-[11px] uppercase" style={{ letterSpacing: '0.18em' }}>Resume Tracker</span>
              </button>
            )}
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
              onClick={() => setQuickGenOpen(true)}
            >
              <Wand2 size={14} />
              <span className="font-bold text-[11px] uppercase" style={{ letterSpacing: '0.16em' }}>AI Generate</span>
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
              onClick={handleAdd}
            >
              <Plus size={16} />
              <span className="font-bold text-[11px] uppercase" style={{ letterSpacing: '0.18em' }}>New Scenario</span>
            </button>
          </div>
        )}
      </div>

      {/* FreshCutGrass Link */}
      <div
        className="rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
        }}
      >
        <div className="flex flex-col gap-2">
          <h3
            className="text-lg flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            <Swords size={20} style={{ color: 'var(--success)' }} />
            FreshCutGrass Integration
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Build detailed encounters with the full FreshCutGrass toolkit, then save templates here for quick reference.</p>
        </div>
        <a
          href="https://freshcutgrass.app/encounter-manager"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all"
          style={{
            background: 'var(--surface-hi)',
            color: 'var(--text)',
            border: '1px solid var(--line-strong)',
          }}
        >
          <ExternalLink size={14} />
          <span className="font-semibold text-xs">Open FreshCutGrass</span>
        </a>
      </div>

      {/* Search and Filter */}
      <div
        className="flex flex-col gap-4 sticky top-0 z-20 p-4 -mx-4 rounded-xl md:flex-row md:items-center md:justify-between shadow-lg"
        style={{
          background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
          backdropFilter: 'blur(14px)',
          border: '1px solid var(--line)',
        }}
      >
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search scenarios…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none transition-all"
            style={{
              background: 'var(--surface-hi)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 pb-2 md:pb-0">
          {[
            { id: 'all', label: 'All', tone: 'var(--primary)' },
            { id: 'easy', label: 'Easy', tone: DIFF_TONES.easy },
            { id: 'medium', label: 'Medium', tone: DIFF_TONES.medium },
            { id: 'hard', label: 'Hard', tone: DIFF_TONES.hard },
            { id: 'deadly', label: 'Deadly', tone: DIFF_TONES.deadly },
          ].map(({ id, label, tone }) => {
            const active = filterDifficulty === id;
            return (
              <button
                key={id}
                onClick={() => setFilterDifficulty(id)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active ? `color-mix(in srgb, ${tone} 18%, transparent)` : 'transparent',
                  color: active ? tone : 'var(--text-muted)',
                  border: `1px solid ${active ? `color-mix(in srgb, ${tone} 45%, transparent)` : 'var(--line)'}`,
                }}
              >
                {label} ({counts[id]})
              </button>
            );
          })}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none transition-all cursor-pointer"
            style={{
              background: 'var(--surface-hi)',
              border: '1px solid var(--line)',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {/* Encounters Grid */}
      {filteredEncounters.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
          style={{
            background: 'var(--surface)',
            border: '1px dashed var(--line-strong)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'var(--surface-hi)',
              color: 'var(--text-dim)',
              border: '1px solid var(--line-strong)',
            }}
          >
            <Swords size={32} />
          </div>
          <h3
            className="text-xl mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text-muted)',
            }}
          >
            No scenarios found
          </h3>
          <p className="max-w-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            {searchTerm || filterDifficulty !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first combat scenario to get started.'}
          </p>
          {isDM && (
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
              onClick={handleAdd}
            >
              <Plus size={14} />
              Create Scenario
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEncounters.map((encounter) => (
            <EncounterCard
              key={encounter.id}
              encounter={encounter}
              onEdit={() => handleEdit(encounter)}
              onDelete={() => handleDelete(encounter.id)}
              onRun={encounter.adversarySlots?.length > 0 ? () => handleRunEncounter(encounter) : null}
              isDM={isDM}
              campaign={campaign}
              adversaries={adversaries}
              environments={environments}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEncounter(null);
        }}
        title={editingEncounter ? 'Edit Scenario' : 'New Scenario'}
        size={useBuilder && isDaggerheart ? 'large' : 'medium'}
      >
        {/* Builder Mode Toggle for Daggerheart */}
        {isDaggerheart && (
          <div className="flex gap-2 p-1 bg-black/40 rounded-lg mb-6 w-fit">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!useBuilder ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
              onClick={() => setUseBuilder(false)}
            >
              Simple
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${useBuilder ? 'bg-[rgb(var(--color-primary))] text-white' : 'text-white/40 hover:text-white'}`}
              onClick={() => setUseBuilder(true)}
            >
              BP Builder
            </button>
          </div>
        )}

        {useBuilder && isDaggerheart ? (
          <EncounterBuilder
            encounter={editingEncounter}
            onSave={handleSave}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingEncounter(null);
            }}
            campaign={campaign}
            adversaries={adversaries}
            environments={environments}
            characters={characters}
            entities={entitiesData}
            isDM={isDM}
          />
        ) : (
          <EncounterForm
            encounter={editingEncounter}
            onSave={handleSave}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingEncounter(null);
            }}
            campaign={campaign}
            entities={entitiesData}
            isDM={isDM}
          />
        )}
      </Modal>

      {/* Quick Generator Modal */}
      <QuickGeneratorModal
        isOpen={quickGenOpen}
        onClose={() => setQuickGenOpen(false)}
        type="encounter"
        campaign={campaign}
        campaignFrame={campaign?.campaignFrame}
        existingContent={encounters}
        existingAdversaries={adversaries}
        addAdversary={addAdversary}
        onSave={async (encounterData) => {
          await addEncounter(encounterData);
          setQuickGenOpen(false);
        }}
      />
    </div>
  );
}
