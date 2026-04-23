import { useMemo, useState } from 'react';
import { Send, Feather } from 'lucide-react';

export default function JournalEntryForm({ characters, currentUserId, onSubmit }) {
  const myCharacters = useMemo(() => {
    return (characters || []).filter(c => c.userId === currentUserId || c.ownerId === currentUserId);
  }, [characters, currentUserId]);

  const [characterId, setCharacterId] = useState(myCharacters[0]?.id || '');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selected = myCharacters.find(c => c.id === characterId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        characterId: selected?.id || null,
        characterName: selected?.name || ''
      });
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border p-5 space-y-3"
      style={{
        background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
        borderColor: 'var(--line)'
      }}
    >
      <div className="flex items-center gap-2">
        <Feather size={16} className="text-[color:var(--primary)]" />
        <h4 className="text-sm font-bold text-white/80 uppercase tracking-wider">
          Write in-character
        </h4>
      </div>
      {myCharacters.length > 1 && (
        <select
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-[color:var(--primary)]"
        >
          {myCharacters.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`What does ${selected?.name || 'your character'} think about what happened?`}
        rows={4}
        className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-[color:var(--primary)]"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">
          {selected ? `Writing as ${selected.name}` : 'Anonymous entry'}
        </span>
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'color-mix(in srgb, var(--primary) 25%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)'
          }}
        >
          <Send size={14} />
          {submitting ? 'Posting…' : 'Post entry'}
        </button>
      </div>
    </form>
  );
}
