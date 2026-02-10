import { useState } from 'react';
import { Plus, Search, Calendar, ScrollText } from 'lucide-react';
import TimelineEventCard from './TimelineEventCard';
import TimelineEventForm from './TimelineEventForm';
import SessionCard from '../Sessions/SessionCard';
import Modal from '../Modal';
import './TimelineView.css';

export default function TimelineView({ campaign, events = [], addEvent, updateEvent, deleteEvent, isDM, npcs = [], locations = [], lore = [], sessions = [], encounters = [], notes = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showSessions, setShowSessions] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  const handleAdd = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleSave = async (eventData) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, eventData);
    } else {
      await addEvent(eventData);
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = async (eventId) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(eventId);
    }
  };

  // Combine sessions and events into unified timeline
  const timelineItems = [];

  // Add events with type marker
  if (showEvents) {
    events.forEach(event => {
      // Visibility filter
      if (!isDM && event.hidden) return;

      timelineItems.push({
        ...event,
        itemType: 'event',
        displayDate: event.date || '',
        displayTitle: event.title
      });
    });
  }

  // Add sessions with type marker
  if (showSessions) {
    sessions.forEach(session => {
      // Visibility filter
      if (!isDM && session.hidden) return;

      timelineItems.push({
        ...session,
        itemType: 'session',
        displayDate: session.date || '',
        displayTitle: session.title
      });
    });
  }

  // Filter timeline items
  const filteredItems = timelineItems.filter(item => {
    const matchesSearch = item.displayTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by event type (only applies to events, not sessions)
    const matchesFilter = filterType === 'all' ||
      item.itemType === 'session' ||
      item.type === filterType;

    return matchesSearch && matchesFilter;
  });

  // Sort by date
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!a.displayDate) return 1;
    if (!b.displayDate) return -1;

    // Try to compare dates
    const dateA = new Date(a.displayDate);
    const dateB = new Date(b.displayDate);

    if (!isNaN(dateA) && !isNaN(dateB)) {
      return dateB - dateA; // Most recent first
    }

    // Fallback to string comparison
    return b.displayDate.localeCompare(a.displayDate);
  });

  // Count by type
  const counts = {
    all: events.length + sessions.length,
    sessions: sessions.length,
    event: events.filter(e => e.type === 'event').length,
    quest: events.filter(e => e.type === 'quest').length,
    milestone: events.filter(e => e.type === 'milestone').length,
    other: events.filter(e => e.type === 'other').length
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Universal Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[rgb(var(--color-primary))]">Timeline</h1>
            <p className="text-white/60 mt-1">
              {counts.all} items • {counts.sessions} sessions • {events.length} events
            </p>
          </div>
          {isDM && (
            <button
              className="px-4 py-2 bg-[rgb(var(--color-primary))] hover:brightness-110 text-white rounded-lg font-medium transition-all shadow-lg shadow-[rgb(var(--color-primary)/0.2)] flex items-center gap-2"
              onClick={handleAdd}
            >
              <Plus size={18} />
              Add Event
            </button>
          )}
        </div>
        <hr className="border-[rgb(var(--color-accent))] opacity-30" />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 border border-white/10 p-4 rounded-lg">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search events and sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${showSessions ? 'bg-[rgb(var(--color-primary)/0.2)] text-white' : 'text-white/60 hover:text-white'}`}
              onClick={() => setShowSessions(!showSessions)}
            >
              <ScrollText size={14} />
              Sessions
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${showEvents ? 'bg-[rgb(var(--color-primary)/0.2)] text-white' : 'text-white/60 hover:text-white'}`}
              onClick={() => setShowEvents(!showEvents)}
            >
              <Calendar size={14} />
              Events
            </button>
          </div>

          <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>

          <button
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${filterType === 'all' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          {['event', 'quest', 'milestone', 'other'].map(type => (
            <button
              key={type}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border capitalize ${filterType === type ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'}`}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Content */}
      {sortedItems.length === 0 ? (
        <div className="bg-white/5 border border-[rgb(var(--color-accent)/0.2)] rounded-lg p-16 flex flex-col items-center justify-center text-center">
          <Calendar size={48} className="text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-white/40 mb-2">No Items Found</h3>
          <p className="text-white/20 max-w-sm">No timeline events or sessions match your current filters.</p>
          {isDM && (searchTerm === '' && filterType === 'all') && (
            <button
              className="mt-6 px-4 py-2 border border-[rgb(var(--color-accent))] text-white rounded-lg hover:bg-white/5 transition-all"
              onClick={handleAdd}
            >
              Create First Event
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-px before:bg-white/10">
          {sortedItems.map((item, index) => (
            <div key={`${item.itemType}-${item.id}`} className="relative">
              {/* Timeline Node */}
              <div
                className={`absolute -left-8 top-6 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 bg-[var(--bg-secondary)]
                  ${item.itemType === 'session' ? 'border-emerald-500/50 text-emerald-400' : 'border-[rgb(var(--color-primary)/0.5)] text-[rgb(var(--color-primary))]'}`}
              >
                {item.itemType === 'session' ? <ScrollText size={14} /> : <Calendar size={14} />}
              </div>

              {/* Card */}
              <div className={`bg-white/5 border border-[rgb(var(--color-accent)/0.2)] rounded-lg overflow-hidden transition-all hover:border-[rgb(var(--color-accent)/0.4)]`}>
                {item.itemType === 'session' ? (
                  <SessionCard
                    session={item}
                    isDM={isDM}
                    campaign={campaign}
                    isEmbedded={true}
                  />
                ) : (
                  <TimelineEventCard
                    event={item}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => handleDelete(item.id)}
                    isDM={isDM}
                    campaign={campaign}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? 'Edit Event' : 'Add New Event'}
        size="medium"
      >
        <TimelineEventForm
          event={editingEvent}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
          }}
          campaign={campaign}
          entities={{ npcs, locations, lore, sessions, timelineEvents: events, encounters, notes }}
          isDM={isDM}
        />
      </Modal>
    </div>
  );
}
