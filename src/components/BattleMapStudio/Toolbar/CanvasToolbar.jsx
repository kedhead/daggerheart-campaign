import { MousePointer, Hand, Crosshair, Eraser, Trash2 } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

const tools = [
  { id: 'select', icon: MousePointer, label: 'Select (V)' },
  { id: 'pan', icon: Hand, label: 'Pan (Space)' },
  { id: 'place', icon: Crosshair, label: 'Place Token' },
  { id: 'fog-erase', icon: Eraser, label: 'Reveal Fog' }
];

export default function CanvasToolbar() {
  const { selectedTool, setSelectedTool, selectedTokenIds, deleteSelectedTokens } = useBattleMapStore();

  const handleKeyDown = (e) => {
    switch (e.key.toLowerCase()) {
      case 'v':
        setSelectedTool('select');
        break;
      case ' ':
        e.preventDefault();
        setSelectedTool('pan');
        break;
      case 'delete':
      case 'backspace':
        if (selectedTokenIds.length > 0) {
          deleteSelectedTokens();
        }
        break;
    }
  };

  // Set up keyboard shortcuts
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }

  return (
    <div className="canvas-toolbar">
      {tools.map(tool => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            className={`toolbar-btn ${selectedTool === tool.id ? 'active' : ''}`}
            onClick={() => setSelectedTool(tool.id)}
            title={tool.label}
          >
            <Icon size={18} />
          </button>
        );
      })}
      {selectedTokenIds.length > 0 && (
        <button
          className="toolbar-btn"
          onClick={deleteSelectedTokens}
          title="Delete Selected (Delete)"
          style={{ color: 'var(--danger)' }}
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}
