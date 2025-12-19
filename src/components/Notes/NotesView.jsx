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
    <div className="notes-view">
      <div className="view-header">
        <div>
          <h2>My Notes</h2>
          <p className="view-subtitle">
            {userNotes.length} note{userNotes.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          Add Note
        </button>
      </div>

      {/* Search and Filter */}
      <div className="notes-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search notes by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            All ({counts.all})
          </button>
          <button
            className={`filter-tab ${filterCategory === 'quest' ? 'active' : ''}`}
            onClick={() => setFilterCategory('quest')}
          >
            Quests ({counts.quest})
          </button>
          <button
            className={`filter-tab ${filterCategory === 'npc' ? 'active' : ''}`}
            onClick={() => setFilterCategory('npc')}
          >
            NPCs ({counts.npc})
          </button>
          <button
            className={`filter-tab ${filterCategory === 'location' ? 'active' : ''}`}
            onClick={() => setFilterCategory('location')}
          >
            Locations ({counts.location})
          </button>
          <button
            className={`filter-tab ${filterCategory === 'combat' ? 'active' : ''}`}
            onClick={() => setFilterCategory('combat')}
          >
            Combat ({counts.combat})
          </button>
          <button
            className={`filter-tab ${filterCategory === 'other' ? 'active' : ''}`}
            onClick={() => setFilterCategory('other')}
          >
            Other ({counts.other})
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterCategory !== 'all' ? (
            <p>No notes match your search</p>
          ) : (
            <>
              <StickyNote size={64} />
              <p>No notes yet</p>
              <p className="empty-subtitle">Keep track of quests, NPCs, locations, and more</p>
              <button className="btn btn-primary" onClick={handleAdd}>
                <Plus size={20} />
                Add Your First Note
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="notes-grid">
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        title={editingNote ? 'Edit Note' : 'Add Note'}
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
