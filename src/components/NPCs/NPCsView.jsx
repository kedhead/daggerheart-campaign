import { useState } from 'react';
import { Plus, Search, Users, Heart, Skull, Minus, Briefcase, MapPin } from 'lucide-react';
import NPCCard from './NPCCard';
import NPCForm from './NPCForm';
import Modal from '../Modal';
import { useToast } from '../../contexts/ToastContext';

export default function NPCsView({ npcs, addNPC, updateNPC, deleteNPC, isDM, campaign, locations = [], lore = [], sessions = [], timelineEvents = [], encounters = [], notes = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNPC, setEditingNPC] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const { success, error } = useToast();

  const handleAdd = () => {
    setEditingNPC(null);
    setIsModalOpen(true);
  };

  const handleEdit = (npc) => {
    setEditingNPC(npc);
    setIsModalOpen(true);
  };

  const handleSave = async (npcData) => {
    try {
      if (editingNPC) {
        await updateNPC(editingNPC.id, npcData);
        success('Identity Recalibrated');
      } else {
        await addNPC(npcData);
        success('New Contact Registered');
      }
      setIsModalOpen(false);
      setEditingNPC(null);
    } catch (e) {
      error('Registry Error');
    }
  };

  const visibleNPCs = npcs.filter(npc => {
    if (relationshipFilter !== 'all' && npc.relationship !== relationshipFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        npc.name.toLowerCase().includes(search) ||
        (npc.occupation || '').toLowerCase().includes(search) ||
        (npc.location || '').toLowerCase().includes(search) ||
        (npc.description || '').toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-10 animate-in fade-in duration-1000">
      {/* Vault Style Header */}
      <div className="flex items-center justify-between gap-8 pb-8 border-b border-white/5 relative">
        <div className="space-y-2 relative z-10">
          <h2 className="font-serif text-4xl font-black text-white/95 tracking-tight italic lowercase">
            The Registry
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <Users size={10} className="text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{npcs.length} Contacts</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Identity Manifest v2.4</p>
          </div>
        </div>

        {isDM && (
          <button
            className="group relative flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-500 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] active:scale-95 border border-indigo-400/20"
            onClick={handleAdd}
          >
            <Plus size={20} className="text-white group-hover:rotate-90 transition-transform duration-500" />
            <span className="font-black text-xs uppercase tracking-[0.3em]">Assemble NPC</span>
          </button>
        )}
      </div>

      {/* Control Module */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:max-w-md relative group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-indigo-400 transition-all duration-500" />
          <input
            type="text"
            placeholder="Search manifest by name or occupation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:bg-black/40 transition-all text-white placeholder:text-white/10 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-[2.5rem] shadow-inner">
          {[
            { id: 'all', label: 'All Souls' },
            { id: 'ally', label: 'Allies' },
            { id: 'enemy', label: 'Threats' },
            { id: 'neutral', label: 'Neutral' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRelationshipFilter(tab.id)}
              className={`
                px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300
                ${relationshipFilter === tab.id
                  ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/10'
                  : 'text-white/20 hover:text-white/60'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vault Grid */}
      {visibleNPCs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-32 rounded-[4rem] border border-white/5 bg-white/[0.01] transition-all duration-700 hover:bg-white/[0.02]">
          <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 text-white/[0.03]">
            <Heart size={48} />
          </div>
          <h3 className="text-2xl font-serif font-black text-white/30 mb-2 italic lowercase">Registry Empty</h3>
          <p className="text-sm text-white/20 font-medium tracking-wide">No individuals matching those parameters were found in the manifest.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10">
          {visibleNPCs.map(npc => (
            <NPCCard
              key={npc.id}
              npc={npc}
              onEdit={() => handleEdit(npc)}
              onDelete={() => deleteNPC(npc.id)}
              onUpdate={updateNPC}
              isDM={isDM}
              campaign={campaign}
              entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
            />
          ))}
        </div>
      )}

      {/* Redesigned Modal wrapper for Arcane OS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNPC(null);
        }}
        title={editingNPC ? 'Modify Profile' : 'New Identity Entry'}
        size="large"
      >
        <NPCForm
          npc={editingNPC}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingNPC(null);
          }}
          isDM={isDM}
          campaign={campaign}
          entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
        />
      </Modal>
    </div>
  );
}
