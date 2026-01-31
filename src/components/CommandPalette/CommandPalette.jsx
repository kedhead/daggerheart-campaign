import { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  MapPin,
  BookOpen,
  Calendar,
  Swords,
  StickyNote,
  Target,
  Package,
  Clock,
  UserPlus,
  Plus,
  Dices,
  Settings,
  HelpCircle,
  Building,
  FileText,
  Wrench,
} from 'lucide-react';
import { useKeyboardShortcut, useEscapeKey } from '../../hooks/useKeyboardShortcut';
import { useCommandPalette } from '../../hooks/useCommandPalette';
import './CommandPalette.css';

const ICONS = {
  dashboard: LayoutDashboard,
  characters: Users,
  locations: MapPin,
  lore: BookOpen,
  sessions: Calendar,
  encounters: Swords,
  notes: StickyNote,
  quests: Target,
  items: Package,
  timeline: Clock,
  npcs: UserPlus,
  add: Plus,
  dice: Dices,
  settings: Settings,
  help: HelpCircle,
  members: Building,
  files: FileText,
  tools: Wrench,
};

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  npcs = [],
  characters = [],
  locations = [],
  quests = [],
  isDM,
}) {
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Build command list
  const commands = useMemo(() => {
    const navCommands = [
      { id: 'nav-dashboard', title: 'Go to Dashboard', icon: 'dashboard', category: 'Navigation', action: () => onNavigate('dashboard'), keywords: ['home'] },
      { id: 'nav-characters', title: 'Go to Characters', icon: 'characters', category: 'Navigation', action: () => onNavigate('characters'), keywords: ['players', 'pcs'] },
      { id: 'nav-npcs', title: 'Go to NPCs', icon: 'npcs', category: 'Navigation', action: () => onNavigate('npcs'), keywords: ['non-player'] },
      { id: 'nav-locations', title: 'Go to Locations', icon: 'locations', category: 'Navigation', action: () => onNavigate('locations'), keywords: ['places', 'maps'] },
      { id: 'nav-lore', title: 'Go to Lore', icon: 'lore', category: 'Navigation', action: () => onNavigate('lore'), keywords: ['worldbuilding', 'history'] },
      { id: 'nav-sessions', title: 'Go to Sessions', icon: 'sessions', category: 'Navigation', action: () => onNavigate('sessions'), keywords: ['games', 'play'] },
      { id: 'nav-encounters', title: 'Go to Encounters', icon: 'encounters', category: 'Navigation', action: () => onNavigate('encounters'), keywords: ['combat', 'battles'] },
      { id: 'nav-notes', title: 'Go to Notes', icon: 'notes', category: 'Navigation', action: () => onNavigate('notes'), keywords: ['journal'] },
      { id: 'nav-quests', title: 'Go to Quests', icon: 'quests', category: 'Navigation', action: () => onNavigate('quests'), keywords: ['objectives', 'missions'] },
      { id: 'nav-items', title: 'Go to Items', icon: 'items', category: 'Navigation', action: () => onNavigate('items'), keywords: ['inventory', 'equipment'] },
      { id: 'nav-timeline', title: 'Go to Timeline', icon: 'timeline', category: 'Navigation', action: () => onNavigate('timeline'), keywords: ['events', 'history'] },
      { id: 'nav-files', title: 'Go to Files', icon: 'files', category: 'Navigation', action: () => onNavigate('files'), keywords: ['documents', 'uploads'] },
      { id: 'nav-tools', title: 'Go to Tools', icon: 'tools', category: 'Navigation', action: () => onNavigate('tools') },
      { id: 'nav-help', title: 'Go to Help', icon: 'help', category: 'Navigation', action: () => onNavigate('help') },
      { id: 'nav-members', title: 'Go to Members', icon: 'members', category: 'Navigation', action: () => onNavigate('members'), keywords: ['party', 'players'] },
      { id: 'nav-settings', title: 'Go to API Settings', icon: 'settings', category: 'Navigation', action: () => onNavigate('apiSettings'), keywords: ['config'] },
    ];

    // Search commands for entities
    const searchCommands = [];

    npcs.forEach((npc) => {
      searchCommands.push({
        id: `npc-${npc.id}`,
        title: npc.name,
        subtitle: npc.occupation || 'NPC',
        icon: 'npcs',
        category: 'NPCs',
        action: () => onNavigate('npcs', { highlight: npc.id }),
        keywords: [npc.occupation, npc.location].filter(Boolean),
      });
    });

    characters.forEach((char) => {
      searchCommands.push({
        id: `char-${char.id}`,
        title: char.name,
        subtitle: `${char.class} • Level ${char.level}`,
        icon: 'characters',
        category: 'Characters',
        action: () => onNavigate('characters', { highlight: char.id }),
        keywords: [char.class, char.ancestry, char.playerName].filter(Boolean),
      });
    });

    locations.forEach((loc) => {
      searchCommands.push({
        id: `loc-${loc.id}`,
        title: loc.name,
        subtitle: loc.type || 'Location',
        icon: 'locations',
        category: 'Locations',
        action: () => onNavigate('locations', { highlight: loc.id }),
        keywords: [loc.type, loc.region].filter(Boolean),
      });
    });

    quests.forEach((quest) => {
      searchCommands.push({
        id: `quest-${quest.id}`,
        title: quest.name,
        subtitle: quest.status || 'Quest',
        icon: 'quests',
        category: 'Quests',
        action: () => onNavigate('quests', { highlight: quest.id }),
        keywords: [quest.status].filter(Boolean),
      });
    });

    return [...navCommands, ...searchCommands];
  }, [onNavigate, npcs, characters, locations, quests]);

  const {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    filteredCommands,
    groupedCommands,
    handleKeyDown,
    handleSelect,
    reset,
  } = useCommandPalette({
    commands,
    onSelect: (cmd) => {
      cmd.action();
      onClose();
    },
  });

  // Escape to close
  useEscapeKey(onClose, isOpen);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      reset();
    }
  }, [isOpen, reset]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector('.command-item.selected');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let itemIndex = -1;

  return createPortal(
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <Search size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search commands, NPCs, locations..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="shortcut-hint">esc</kbd>
        </div>

        <div className="command-palette-list" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-empty">No results found</div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="command-group">
                <div className="command-group-title">{category}</div>
                {items.map((command) => {
                  itemIndex++;
                  const Icon = ICONS[command.icon] || Search;
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <div
                      key={command.id}
                      className={`command-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(command)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                    >
                      <div className="command-item-icon">
                        <Icon size={18} />
                      </div>
                      <div className="command-item-content">
                        <span className="command-item-title">{command.title}</span>
                        {command.subtitle && (
                          <span className="command-item-subtitle">{command.subtitle}</span>
                        )}
                      </div>
                      {isSelected && <kbd className="command-item-hint">enter</kbd>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>enter</kbd> to select</span>
          <span><kbd>esc</kbd> to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
