import { useState } from 'react';
import { Plus, Search, StickyNote, Trash2, Edit3 } from 'lucide-react';
import NoteCard from './NoteCard';
import NoteForm from './NoteForm';
import Modal from '../Modal';
import './NotesView.css';

export default function NotesView({ campaign, addNote, updateNote, deleteNote, currentUserId, isDM, npcs = [], locations = [], lore = [], sessions = [], timelineEvents = [], encounters = [], notes: allNotesEntities = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const allNotes = allNotesEntities.length > 0 ? allNotesEntities : (campaign?.notes || []);

  // Filter notes - visibility logic
  const userNotes = isDM
    ? allNotes  // DM sees all notes
    : allNotes.filter(note => {
      // Player sees notes if:
      // 1. They created it
      // 2. It's not hidden (shared with players)
      // 3. DM has overridden visibility with visibleToPlayers
      if (note.createdBy === currentUserId) return true;
      if (!note.hidden) return true;
      if (note.visibleToPlayers) return true;
      return false;
    });

  const handleAdd = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleSave = async (noteData) => {
    if (editingNote) {
      await updateNote(editingNote.id, noteData);
    } else {
      await addNote(noteData);
    }
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleDelete = async (noteId) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  // Filter notes
  const filteredNotes = userNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterCategory === 'all' || note.category === filterCategory;

    return matchesSearch && matchesFilter;
  });

  // Count by category
  const counts = {
    all: userNotes.length,
    quest: userNotes.filter(n => n.category === 'quest').length,
    npc: userNotes.filter(n => n.category === 'npc').length,
    location: userNotes.filter(n => n.category === 'location').length,
    combat: userNotes.filter(n => n.category === 'combat').length,
    other: userNotes.filter(n => n.category === 'other').length
  };

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8 animate-in fade-in duration-700">
      {/* View Header */}
      <div className="flex items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <h2 className="font-serif text-3xl font-black text-white/90 tracking-tight italic lowercase">
            The Archive
          </h2>
          <p className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
            <StickyNote size={12} />
            {userNotes.length} Document{userNotes.length !== 1 ? 's' : ''} synchronized
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/20"
          onClick={handleAdd}
        >
          <Plus size={18} strokeWidth={3} />
          Scribe Note
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Modern Search */}
        <div className="w-full lg:max-w-md relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search the archives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/[0.06] transition-all text-white placeholder:text-white/20 shadow-inner"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-2xl overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'quest', label: 'Quests', count: counts.quest },
            { id: 'npc', label: 'NPCs', count: counts.npc },
            { id: 'location', label: 'Locations', count: counts.location },
            { id: 'combat', label: 'Combat', count: counts.combat },
            { id: 'other', label: 'Other', count: counts.other }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all
                ${filterCategory === tab.id
                  ? 'bg-white/10 text-white shadow-lg ring-1 ring-white/10'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                }
              `}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${filterCategory === tab.id ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/40'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 rounded-[32px] border-2 border-dashed border-white/5 bg-white/[0.01]">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 text-white/10">
            <StickyNote size={40} />
          </div>
          {searchTerm || filterCategory !== 'all' ? (
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs italic">No documents match your query</p>
          ) : (
            <>
              <h3 className="text-xl font-serif font-black text-white/80 mb-2 italic lowercase">Empty Archive</h3>
              <p className="text-sm text-white/30 font-medium mb-8">Maintain records of your journey, the people you meet, and the lands you discover.</p>
              <button
                className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
                onClick={handleAdd}
              >
                Begin Scribing
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => handleEdit(note)}
              onDelete={() => handleDelete(note.id)}
              currentUserId={currentUserId}
              isDM={isDM}
              campaign={campaign}
              entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes: allNotesEntities }}
            />
          ))}
        </div>
      )}

      {/* Redesigned Modal wrapper for Arcane OS */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        title={editingNote ? 'Modify Document' : 'New Scribing'}
        size="medium"
      >
        <NoteForm
          note={editingNote}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingNote(null);
          }}
          campaign={campaign}
          entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes: allNotesEntities }}
          currentUserId={currentUserId}
          isDM={isDM}
        />
      </Modal>
    </div>
  );
}
