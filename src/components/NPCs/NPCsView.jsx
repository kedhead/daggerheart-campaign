import { useState, useMemo } from 'react';
import ConfirmDeleteModal from '../ConfirmDeleteModal';
import { Plus, Search, Users, Heart, Skull, Minus, Briefcase, MapPin, Wand2 } from 'lucide-react';
import NPCCard from './NPCCard';
import NPCForm from './NPCForm';
import Modal from '../Modal';
import QuickGeneratorModal from '../CampaignBuilder/QuickGeneratorModal';
import { useToast } from '../../contexts/ToastContext';
import { buildCampaignContext } from '../../services/campaignContext';
import { visibleTo } from '../../utils/playerVisibility';
import SessionDateFilters, { SessionTagSelect } from '../Filters/SessionDateFilters';
import { sessionFilterOptions, filterBySessionAndDate, SORTS } from '../../utils/sessionLinks';

export default function NPCsView({
  npcs, addNPC, updateNPC, deleteNPC, isDM, campaign, campaignFrame,
  locations = [], lore = [], sessions = [], timelineEvents = [], encounters = [], notes = [], chapters,
  adversaries = [], characters = [], items = [], maps = [], battleMaps = [], storybookChapters = []
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNPC, setEditingNPC] = useState(null);
  // Deletes here are permanent, so they go through a confirm first — they
  // used to fire on a single tap.
  const [pendingDelete, setPendingDelete] = useState(null);

  const [quickGenOpen, setQuickGenOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [addedFilter, setAddedFilter] = useState('any');
  const [sortBy, setSortBy] = useState('newest');
  const [sessionTag, setSessionTag] = useState('');
  const sessionOptions = useMemo(() => sessionFilterOptions(sessions, { isDM }), [sessions, isDM]);
  // Tagging is a DM action, so the dialog offers every session, planned ones included.
  const tagOptions = useMemo(() => sessionFilterOptions(sessions, { isDM: true }), [sessions]);
  // While the list is filtered to one session, new NPCs default to it.
  const filteredSessionId = sessionFilter !== 'all' && sessionFilter !== 'none' ? sessionFilter : '';
  const { success, error } = useToast();

  const mergedMaps = useMemo(() => [
    ...maps.map(m => ({ ...m, tag: 'map' })),
    ...battleMaps.map(m => ({ ...m, tag: 'battle-map' }))
  ], [maps, battleMaps]);

  const campaignContext = useMemo(
    () => buildCampaignContext(campaign, {
      campaignFrame, npcs, locations, lore, sessions, encounters, adversaries, characters,
      items, maps: mergedMaps, storybookChapters
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign?.id, npcs.length, locations.length, lore.length, sessions.length,
     encounters.length, adversaries.length, characters.length, items.length,
     mergedMaps.length, storybookChapters.length]
  );

  const handleAdd = () => {
    setEditingNPC(null);
    setSessionTag(filteredSessionId);
    setIsModalOpen(true);
  };

  const handleEdit = (npc) => {
    setEditingNPC(npc);
    setSessionTag(npc.sessionId || '');
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    const npcData = { ...formData, sessionId: sessionTag || null };
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

  // Players never see hidden NPCs. This list checked no visibility flag at all,
  // so the DM's hidden NPCs were listed for everyone.
  const viewableNPCs = visibleTo(npcs, isDM);
  const matchingNPCs = viewableNPCs.filter(npc => {
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
  // Session and date-added filters — rules in utils/sessionLinks.js.
  const visibleNPCs = filterBySessionAndDate(matchingNPCs, {
    session: sessionFilter, added: addedFilter, sessions, kind: 'npc', isDM, now: Date.now(),
  }).sort(SORTS[sortBy] || SORTS.newest);

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-10 animate-in fade-in duration-200">
      {/* Vault Style Header */}
      <div className="flex items-center justify-between gap-8 pb-8 border-b border-white/5 relative">
        <div className="space-y-2 relative z-10">
          <h2 className="font-serif text-4xl font-black text-lr-text tracking-tight italic lowercase">
            The Registry
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              <Users size={10} className="text-lr-text-dim" />
              <span className="text-[11px] font-black text-lr-text-dim uppercase tracking-[0.2em]">{viewableNPCs.length} Contacts</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20"></div>
            <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest italic">Identity Manifest v2.4</p>
          </div>
        </div>

        {isDM && (
          <div className="flex items-center gap-3">
            <button
              className="group relative flex items-center gap-3 px-6 py-4 rounded-[2rem] bg-[rgb(var(--color-primary))/20] hover:bg-[rgb(var(--color-primary))/30] text-[rgb(var(--color-primary-light))] transition-all duration-300 border border-[rgb(var(--color-primary))/30] active:scale-95"
              onClick={() => setQuickGenOpen(true)}
            >
              <Wand2 size={18} />
              <span className="font-black text-xs uppercase tracking-[0.2em]">Generate with AI</span>
            </button>
            <button
              className="group relative flex items-center gap-3 px-8 py-4 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] active:scale-95 border border-indigo-400/20"
              onClick={handleAdd}
            >
              <Plus size={20} className="text-white group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-black text-xs uppercase tracking-[0.3em]">Add NPC</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Module */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:max-w-md relative group">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-indigo-400 transition-all duration-300" />
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
                px-6 py-2.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300
                ${relationshipFilter === tab.id
                  ? 'bg-white/10 text-white shadow-xl ring-1 ring-white/10'
                  : 'text-white/20 hover:text-lr-text-muted'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <SessionDateFilters
        sessionOptions={sessionOptions}
        session={sessionFilter}
        onSession={setSessionFilter}
        added={addedFilter}
        onAdded={setAddedFilter}
        sort={sortBy}
        onSort={setSortBy}
        shown={visibleNPCs.length}
        total={viewableNPCs.length}
        noun="NPCs"
      />

      {/* Vault Grid */}
      {visibleNPCs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-32 rounded-[4rem] border border-white/5 bg-white/[0.01] transition-all duration-200 hover:bg-white/[0.02]">
          <div className="w-24 h-24 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 text-white/[0.03]">
            <Heart size={48} />
          </div>
          <h3 className="text-2xl font-serif font-black text-lr-text-dim mb-2 italic lowercase">Registry Empty</h3>
          <p className="text-sm text-white/20 font-medium tracking-wide">No individuals matching those parameters were found in the manifest.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10 items-start">
          <ConfirmDeleteModal
            isOpen={!!pendingDelete}
            onClose={() => setPendingDelete(null)}
            onConfirm={() => deleteNPC(pendingDelete.id)}
            kind="NPC"
            name={pendingDelete?.name}
          />
          {visibleNPCs.map(npc => (
            <NPCCard
              key={npc.id}
              npc={npc}
              onEdit={() => handleEdit(npc)}
              onDelete={() => setPendingDelete(npc)}
              onUpdate={updateNPC}
              isDM={isDM}
              campaign={campaign}
              entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
              chapters={chapters}
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
        {isDM && <SessionTagSelect sessionOptions={tagOptions} value={sessionTag} onChange={setSessionTag} />}
        <NPCForm
          npc={editingNPC}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingNPC(null);
          }}
          isDM={isDM}
          campaign={campaign}
          entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes, campaignFrame }}
          campaignContext={campaignContext}
        />
      </Modal>

      <QuickGeneratorModal
        isOpen={quickGenOpen}
        onClose={() => setQuickGenOpen(false)}
        type="npc"
        campaign={campaign}
        campaignFrame={campaignFrame}
        existingContent={npcs}
        onSave={async (npcData) => {
          await addNPC(filteredSessionId ? { ...npcData, sessionId: filteredSessionId } : npcData);
          success('NPC added to campaign');
          setQuickGenOpen(false);
        }}
      />
    </div>
  );
}
