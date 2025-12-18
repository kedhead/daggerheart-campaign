import { useState } from 'react';
import { Plus, Search, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import TimelineEventCard from './TimelineEventCard';
import TimelineEventForm from './TimelineEventForm';
import Modal from '../Modal';
import './TimelineView.css';

export default function TimelineView({ campaign, events = [], addEvent, updateEvent, deleteEvent, isDM }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

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

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === 'all' || event.type === filterType;

    return matchesSearch && matchesFilter;
  });

  // Sort by date (in-game date string for now)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  // Count by type
  const counts = {
    all: events.length,
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
          <p className="view-subtitle">{events.length} event{events.length !== 1 ? 's' : ''} in your campaign</p>
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
            placeholder="Search events by title, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <Calendar size={16} />
            All ({counts.all})
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

      {/* Timeline */}
      {sortedEvents.length === 0 ? (
        <div className="empty-state card">
          {searchTerm || filterType !== 'all' ? (
            <p>No events match your search</p>
          ) : (
            <>
              <Calendar size={64} />
              <p>No events yet</p>
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
        <div className="timeline-list">
          {sortedEvents.map((event) => (
            <TimelineEventCard
              key={event.id}
              event={event}
              onEdit={() => handleEdit(event)}
              onDelete={() => handleDelete(event.id)}
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
        />
      </Modal>
    </div>
  );
}
