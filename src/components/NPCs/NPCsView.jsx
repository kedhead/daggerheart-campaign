import { useState } from 'react';
import { Plus, Search, Users, Heart, Skull, Minus, Wand2 } from 'lucide-react';
import NPCCard from './NPCCard';
import NPCForm from './NPCForm';
import Modal from '../Modal';
import QuickGeneratorModal from '../CampaignBuilder/QuickGeneratorModal';
import './NPCsView.css';

export default function NPCsView({ campaign, npcs = [], addNPC, updateNPC, deleteNPC, isDM }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNPC, setEditingNPC] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRelationship, setFilterRelationship] = useState('all');
  const [quickGenOpen, setQuickGenOpen] = useState(false);

  const handleAdd = () => {
    setEditingNPC(null);
    setIsModalOpen(true);
  };

  const handleEdit = (npc) => {
    setEditingNPC(npc);
    setIsModalOpen(true);
  };

  const handleSave = async (npcData) => {
    if (editingNPC) {
      await updateNPC(editingNPC.id, npcData);
    } else {
      await addNPC(npcData);
    }
    setIsModalOpen(false);
    setEditingNPC(null);
  };

  const handleDelete = async (npcId) => {
    if (confirm('Are you sure you want to delete this NPC?')) {
      await deleteNPC(npcId);
    }
  };

  // Filter NPCs
  const filteredNPCs = npcs.filter(npc => {
    const matchesSearch = npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         npc.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         npc.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterRelationship === 'all' || npc.relationship === filterRelationship;

    return matchesSearch && matchesFilter;
  });

  // Count by relationship
  const counts = {
    all: npcs.length,
    ally: npcs.filter(n => n.relationship === 'ally').length,
    neutral: npcs.filter(n => n.relationship === 'neutral').length,
    enemy: npcs.filter(n => n.relationship === 'enemy').length
  };

  return (
    <div className="npcs-view">
      <div className="view-header">
        <div>
          <h2>NPC Directory</h2>
          <p className="view-subtitle">{npcs.length} NPC{npcs.length !== 1 ? 's' : ''} in your campaign</p>
        </div>
        {isDM && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setQuickGenOpen(true)}>
              <Wand2 size={20} />
              Generate with AI
            </button>
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={20} />
              Add NPC
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="npcs-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search NPCs by name, occupation, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterRelationship === 'all' ? 'active' : ''}`}
            onClick={() => setFilterRelationship('all')}
          >
            <Users size={16} />
            All ({counts.all})
          </button>
          <button
            className={`filter-tab ${filterRelationship === 'ally' ? 'active' : ''}`}
            onClick={() => setFilterRelationship('ally')}
          >
            <Heart size={16} />
            Allies ({counts.ally})
          </button>
          <button
            className={`filter-tab ${filterRelationship === 'neutral' ? 'active' : ''}`}
            onClick={() => setFilterRelationship('neutral')}
          >
            <Minus size={16} />
            Neutral ({counts.neutral})
          </button>
          <button
            className={`filter-tab ${filterRelationship === 'enemy' ? 'active' : ''}`}
            onClick={() => setFilterRelationship('enemy')}
          >
            <Skull size={16} />
            Enemies ({counts.enemy})
          </button>
        </div>
      </div>

      {/* NPCs Grid */}
      {filteredNPCs.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterRelationship !== 'all' ? (
            <p>No NPCs match your search</p>
          ) : (
            <>
              <Users size={64} />
              <p>No NPCs yet</p>
              {isDM && (
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Plus size={20} />
                  Add Your First NPC
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="npcs-grid">
          {filteredNPCs.map((npc) => (
            <NPCCard
              key={npc.id}
              npc={npc}
              onEdit={() => handleEdit(npc)}
              onDelete={() => handleDelete(npc.id)}
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
          setEditingNPC(null);
        }}
        title={editingNPC ? 'Edit NPC' : 'Add NPC'}
        size="medium"
      >
        <NPCForm
          npc={editingNPC}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingNPC(null);
          }}
          campaign={campaign}
        />
      </Modal>

      {/* Quick Generator Modal */}
      <QuickGeneratorModal
        isOpen={quickGenOpen}
        onClose={() => setQuickGenOpen(false)}
        type="npc"
        campaign={campaign}
        campaignFrame={campaign?.campaignFrame}
        existingContent={npcs}
        onSave={async (npcData) => {
          await addNPC(npcData);
          setQuickGenOpen(false);
        }}
      />
    </div>
  );
}
