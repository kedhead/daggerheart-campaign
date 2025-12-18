import { useState } from 'react';
import { Plus, Search, Swords, ExternalLink, Wand2 } from 'lucide-react';
import EncounterCard from './EncounterCard';
import EncounterForm from './EncounterForm';
import Modal from '../Modal';
import QuickGeneratorModal from '../CampaignBuilder/QuickGeneratorModal';
import './EncountersView.css';

export default function EncountersView({ campaign, encounters = [], addEncounter, updateEncounter, deleteEncounter, isDM }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [quickGenOpen, setQuickGenOpen] = useState(false);

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

  return (
    <div className="encounters-view">
      <div className="view-header">
        <div>
          <h2>Combat Encounters</h2>
          <p className="view-subtitle">{encounters.length} encounter{encounters.length !== 1 ? 's' : ''} prepared</p>
        </div>
        {isDM && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setQuickGenOpen(true)}>
              <Wand2 size={20} />
              Generate with AI
            </button>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={20} />
              Add Encounter
            </button>
          </div>
        )}
      </div>

      {/* FreshCutGrass Link */}
      <div className="encounter-tool-link card">
        <div>
          <h3>
            <Swords size={20} />
            FreshCutGrass Encounter Manager
          </h3>
          <p>Build detailed encounters with the full FreshCutGrass toolkit, then save templates here for quick reference.</p>
        </div>
        <a
          href="https://freshcutgrass.app/encounter-manager"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          <ExternalLink size={16} />
          Open FreshCutGrass
        </a>
      </div>

      {/* Search and Filter */}
      <div className="encounters-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search encounters by name, description, or enemies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterDifficulty === 'all' ? 'active' : ''}`}
            onClick={() => setFilterDifficulty('all')}
          >
            All ({counts.all})
          </button>
          <button
            className={`filter-tab difficulty-easy ${filterDifficulty === 'easy' ? 'active' : ''}`}
            onClick={() => setFilterDifficulty('easy')}
          >
            Easy ({counts.easy})
          </button>
          <button
            className={`filter-tab difficulty-medium ${filterDifficulty === 'medium' ? 'active' : ''}`}
            onClick={() => setFilterDifficulty('medium')}
          >
            Medium ({counts.medium})
          </button>
          <button
            className={`filter-tab difficulty-hard ${filterDifficulty === 'hard' ? 'active' : ''}`}
            onClick={() => setFilterDifficulty('hard')}
          >
            Hard ({counts.hard})
          </button>
          <button
            className={`filter-tab difficulty-deadly ${filterDifficulty === 'deadly' ? 'active' : ''}`}
            onClick={() => setFilterDifficulty('deadly')}
          >
            Deadly ({counts.deadly})
          </button>
        </div>
      </div>

      {/* Encounters Grid */}
      {filteredEncounters.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterDifficulty !== 'all' ? (
            <p>No encounters match your search</p>
          ) : (
            <>
              <Swords size={64} />
              <p>No encounters yet</p>
              {isDM && (
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Plus size={20} />
                  Add Your First Encounter
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="encounters-grid">
          {filteredEncounters.map((encounter) => (
            <EncounterCard
              key={encounter.id}
              encounter={encounter}
              onEdit={() => handleEdit(encounter)}
              onDelete={() => handleDelete(encounter.id)}
              isDM={isDM}
              campaign={campaign}
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
        title={editingEncounter ? 'Edit Encounter' : 'Add Encounter'}
        size="medium"
      >
        <EncounterForm
          encounter={editingEncounter}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingEncounter(null);
          }}
        />
      </Modal>

      {/* Quick Generator Modal */}
      <QuickGeneratorModal
        isOpen={quickGenOpen}
        onClose={() => setQuickGenOpen(false)}
        type="encounter"
        campaign={campaign}
        campaignFrame={campaign?.campaignFrame}
        existingContent={encounters}
        onSave={async (encounterData) => {
          await addEncounter(encounterData);
          setQuickGenOpen(false);
        }}
      />
    </div>
  );
}
