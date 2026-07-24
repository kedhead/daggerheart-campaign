import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  Image,
  Users
} from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

/**
 * Actions for the current token selection. Appears only while something is
 * selected — these used to exist in the store with nothing calling them.
 */
export default function SelectionToolbar() {
  const {
    tokens,
    selectedTokenIds,
    duplicateSelectedTokens,
    deleteSelectedTokens,
    bringSelectedToFront,
    sendSelectedToBack,
    toggleSelectedLocked,
    setSelectedTokensLayer
  } = useBattleMapStore();

  if (selectedTokenIds.length === 0) return null;

  const selected = tokens.filter(t => selectedTokenIds.includes(t.id));
  const allLocked = selected.length > 0 && selected.every(t => t.locked);
  const onBackground = selected.length > 0 && selected.every(t => t.layer === 'background');

  const actions = [
    { icon: Copy, label: 'Duplicate (Ctrl+D)', onClick: duplicateSelectedTokens },
    { icon: BringToFront, label: 'Bring to front', onClick: bringSelectedToFront },
    { icon: SendToBack, label: 'Send to back', onClick: sendSelectedToBack },
    {
      icon: onBackground ? Users : Image,
      label: onBackground ? 'Move to token layer' : 'Move to scenery layer',
      onClick: () => setSelectedTokensLayer(onBackground ? 'tokens' : 'background')
    },
    {
      icon: allLocked ? Unlock : Lock,
      label: allLocked ? 'Unlock' : 'Lock in place',
      onClick: toggleSelectedLocked
    }
  ];

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-full shadow-2xl">
      <span className="px-2 text-xs text-zinc-500 tabular-nums whitespace-nowrap">
        {selectedTokenIds.length} selected
      </span>
      <div className="w-px h-6 bg-zinc-700" />
      {actions.map(({ icon: Icon, label, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          title={label}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Icon size={16} />
        </button>
      ))}
      <div className="w-px h-6 bg-zinc-700" />
      <button
        onClick={deleteSelectedTokens}
        title="Delete (Del)"
        className="p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
