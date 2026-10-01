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
import { navItemsFor } from '../../config/navigation';
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
  isDaggerheart = true,
}) {
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Build command list
  const commands = useMemo(() => {
    // Every page this viewer can open, from the same list as the sidebar —
    // this used to be its own hand-kept list that knew about half of them.
    const navCommands = navItemsFor({ isDM, isDaggerheart })
      .filter(item => item.action === 'view')
      .map(item => ({
        id: `nav-${item.id}`,
        title: `Go to ${item.label}`,
        Icon: item.icon,
        category: 'Navigation',
        action: () => onNavigate(item.id),
        keywords: [item.group, ...item.keywords],
      }));

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
  }, [onNavigate, npcs, characters, locations, quests, isDM, isDaggerheart]);

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
                  const Icon = command.Icon || ICONS[command.icon] || Search;
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
