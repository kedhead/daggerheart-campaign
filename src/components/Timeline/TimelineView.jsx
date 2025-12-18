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
    <div className="timeline-view">
      <div className="view-header">
        <div>
          <h2>Campaign Timeline</h2>
          <p className="view-subtitle">{counts.all} total items - {counts.sessions} sessions, {events.length} events</p>
        </div>
        {isDM && (
          <button className="btn btn-primary" onClick={handleAdd}>
            <Plus size={20} />
            Add Event
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="timeline-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search timeline by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="timeline-toggles">
          <button
            className={`toggle-btn ${showSessions ? 'active' : ''}`}
            onClick={() => setShowSessions(!showSessions)}
          >
            <ScrollText size={16} />
            Sessions ({counts.sessions})
          </button>
          <button
            className={`toggle-btn ${showEvents ? 'active' : ''}`}
            onClick={() => setShowEvents(!showEvents)}
          >
            <Calendar size={16} />
            Events ({events.length})
          </button>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filterType === 'event' ? 'active' : ''}`}
            onClick={() => setFilterType('event')}
          >
            Event ({counts.event})
          </button>
          <button
            className={`filter-tab ${filterType === 'quest' ? 'active' : ''}`}
            onClick={() => setFilterType('quest')}
          >
            Quest ({counts.quest})
          </button>
          <button
            className={`filter-tab ${filterType === 'milestone' ? 'active' : ''}`}
            onClick={() => setFilterType('milestone')}
          >
            Milestone ({counts.milestone})
          </button>
          <button
            className={`filter-tab ${filterType === 'other' ? 'active' : ''}`}
            onClick={() => setFilterType('other')}
          >
            Other ({counts.other})
          </button>
        </div>
      </div>

      {/* Enhanced Timeline */}
      {sortedItems.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterType !== 'all' || !showSessions || !showEvents ? (
            <p>No items match your filters</p>
          ) : (
            <>
              <Calendar size={64} />
              <p>No timeline items yet</p>
              {isDM && (
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Plus size={20} />
                  Add Your First Event
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="timeline-enhanced">
          <div className="timeline-rail"></div>
          <div className="timeline-items">
            {sortedItems.map((item, index) => (
              <div key={`${item.itemType}-${item.id}`} className="timeline-item-wrapper">
                <div className={`timeline-node ${item.itemType}-node`}>
                  {item.itemType === 'session' ? (
                    <ScrollText size={16} />
                  ) : (
                    <Calendar size={16} />
                  )}
                </div>
                <div className="timeline-item-content">
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
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? 'Edit Event' : 'Add Event'}
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
        />
      </Modal>
    </div>
  );
}
