import { useState, useMemo } from 'react';
import { Plus, Search, Swords, ExternalLink, Wand2, Play } from 'lucide-react';
import EncounterCard from './EncounterCard';
import EncounterForm from './EncounterForm';
import EncounterBuilder from './EncounterBuilder';
import LiveEncounterTracker from './LiveEncounterTracker';
import Modal from '../Modal';
import QuickGeneratorModal from '../CampaignBuilder/QuickGeneratorModal';
import { useActiveEncounter } from '../../hooks/useActiveEncounter';

export default function EncountersView({ campaign, encounters = [], addEncounter, updateEncounter, deleteEncounter, addAdversary, isDM, npcs = [], locations = [], lore = [], sessions = [], timelineEvents = [], notes = [], adversaries = [], environments = [], characters = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [quickGenOpen, setQuickGenOpen] = useState(false);
  const [useBuilder, setUseBuilder] = useState(true); // Use new BP builder by default
  const [showTracker, setShowTracker] = useState(false);

  // Active encounter hook
  const { activeEncounter, startEncounter } = useActiveEncounter(campaign?.id);

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
  });

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
        onClose={() => setShowTracker(false)}
      />
    );
  }



  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="space-y-1 w-full max-w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3 flex-wrap">
            <Swords className="text-[rgb(var(--color-primary))] shrink-0" size={32} />
            Combat Scenarios
          </h2>
          <p className="text-white/60 text-lg">
            {encounters.length} {encounters.length !== 1 ? 'scenario' : 'scenarios'} prepared
          </p>
        </div>
        {isDM && (
          <div className="flex gap-2 flex-wrap">
            {activeEncounter && (
              <button className="btn btn-primary" onClick={() => setShowTracker(true)}>
                <Play size={20} />
                Resume Tracker
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setQuickGenOpen(true)}>
              <Wand2 size={20} />
              AI Generate
            </button>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={20} />
              New Scenario
            </button>
          </div>
        )}
      </div>

      {/* FreshCutGrass Link */}
      <div className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Swords className="text-emerald-400" size={24} />
            FreshCutGrass Integration
          </h3>
          <p className="text-white/60">Build detailed encounters with the full FreshCutGrass toolkit, then save templates here for quick reference.</p>
        </div>
        <a
          href="https://freshcutgrass.app/encounter-manager"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary whitespace-nowrap"
        >
          <ExternalLink size={16} />
          Open FreshCutGrass
        </a>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sticky top-0 z-20 bg-[var(--bg-primary)]/80 backdrop-blur-xl p-4 -mx-4 rounded-xl border border-white/5 md:flex-row md:items-center md:justify-between shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search scenarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-primary))]"
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 pb-2 md:pb-0">
          <button
            onClick={() => setFilterDifficulty('all')}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border
              ${filterDifficulty === 'all'
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10 hover:text-white'}
            `}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilterDifficulty('easy')}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border
              ${filterDifficulty === 'easy'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-emerald-500/5 text-emerald-500/60 border-transparent hover:bg-emerald-500/10 hover:text-emerald-400'}
            `}
          >
            Easy ({counts.easy})
          </button>
          <button
            onClick={() => setFilterDifficulty('medium')}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border
              ${filterDifficulty === 'medium'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                : 'bg-amber-500/5 text-amber-500/60 border-transparent hover:bg-amber-500/10 hover:text-amber-400'}
            `}
          >
            Medium ({counts.medium})
          </button>
          <button
            onClick={() => setFilterDifficulty('hard')}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border
              ${filterDifficulty === 'hard'
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                : 'bg-orange-500/5 text-orange-500/60 border-transparent hover:bg-orange-500/10 hover:text-orange-400'}
            `}
          >
            Hard ({counts.hard})
          </button>
          <button
            onClick={() => setFilterDifficulty('deadly')}
            className={`
              whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all border
              ${filterDifficulty === 'deadly'
                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                : 'bg-red-500/5 text-red-500/60 border-transparent hover:bg-red-500/10 hover:text-red-400'}
            `}
          >
            Deadly ({counts.deadly})
          </button>
        </div>
      </div>

      {/* Encounters Grid */}
      {filteredEncounters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
            <Swords size={32} />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No scenarios found</h3>
          <p className="text-white/40 max-w-sm mb-6">
            {searchTerm || filterDifficulty !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first combat scenario to get started.'}
          </p>
          {isDM && (
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={16} />
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
