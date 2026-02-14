import { useState } from 'react';
import { Save, X } from 'lucide-react';
import WikiLinkInput from '../WikiText/WikiLinkInput';
import { useEntityRegistry } from '../../hooks/useEntityRegistry';

export default function TimelineEventForm({ event, onSave, onCancel, campaign, entities, isDM }) {
  const { search, autoLink } = useEntityRegistry(campaign, entities);
  const [formData, setFormData] = useState(event || {
    title: '',
    date: '',
    location: '',
    type: 'event',
    description: '',
    participants: '',
    outcome: '',
    hidden: false
  });

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Event Title <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., The Battle of Stonewood"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">In-Game Date</label>
        <input
          type="text"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          placeholder="e.g., Day 15 of Summer, Year 1024"
        />
        <p className="text-xs text-white/40">
          Use any format that makes sense for your campaign
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Location</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="e.g., Stonewood Forest, The Royal Palace"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Event Type <span className="text-red-400">*</span></label>
        <div className="relative">
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            required
            className="appearance-none"
          >
            <option value="event">Event - Standard campaign event</option>
            <option value="quest">Quest - Major objective or mission</option>
            <option value="milestone">Milestone - Significant achievement</option>
            <option value="other">Other - Background info or flavor</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Description</label>
        <WikiLinkInput
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="What happened? Type [[ to link entities"
          rows={4}
        />
        <p className="text-xs text-white/40">Type [[ to link to other entities</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Participants</label>
        <input
          type="text"
          value={formData.participants}
          onChange={(e) => handleChange('participants', e.target.value)}
          placeholder="e.g., The party, King Aldric, Guards"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-white/80 block">Outcome</label>
        <WikiLinkInput
          value={formData.outcome}
          onChange={(e) => handleChange('outcome', e.target.value)}
          searchEntities={search}
          autoLink={autoLink}
          placeholder="Consequences? Type [[ to link entities"
          rows={3}
        />
      </div>

      {isDM && (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10 cursor-pointer" onClick={() => handleChange('hidden', !formData.hidden)}>
          <input
            type="checkbox"
            checked={formData.hidden}
            onChange={(e) => handleChange('hidden', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))]"
          />
          <div>
            <span className="block text-sm font-medium text-white">Hidden from Players</span>
            <span className="block text-xs text-white/50">Only you can see this until revealed</span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          <X size={16} />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          Save Event
        </button>
      </div>
    </form>
  );
}
