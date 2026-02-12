import { useState, useCallback, useMemo } from 'react';
import { Play, Search, Sun, Moon, MapPin, X } from 'lucide-react';
import { useBattleMapStore } from '../../../stores/battleMapStore';

// Base URL for raw GitHub content
const GITHUB_RAW = 'https://raw.githubusercontent.com/PeggsDev/animated-battle-maps/master';

// Curated map catalog from PeggsDev/animated-battle-maps
const MAP_CATALOG = [
    // Nature & Outdoor
    { name: 'Forest Gorge', variant: 'Day', category: 'Nature', file: 'ADMaps_FOREST GORGE [day] - NO GRID.WebM' },
    { name: 'Forest Gorge', variant: 'Night', category: 'Nature', file: 'ADMaps_FOREST GORGE [night] - NO GRID.WebM' },
    { name: 'Waterfall - Broken Bridge', variant: 'Day', category: 'Nature', file: 'ADMaps_WATERFALL WITH A BROKEN BRIDGE [day] - NO GRID.WebM' },
    { name: 'Waterfall - Broken Bridge', variant: 'Night', category: 'Nature', file: 'ADMaps_WATERFALL WITH A BROKEN BRIDGE [night] - NO GRID.WebM' },
    { name: 'Waterfall - Hanging Bridge', variant: 'Day', category: 'Nature', file: 'ADMaps_WATERFALL WITH A HANGING BRIDGE [day] - NO GRID.WebM' },
    { name: 'Waterfall - Hanging Bridge', variant: 'Night', category: 'Nature', file: 'ADMaps_WATERFALL WITH A HANGING BRIDGE [night] - NO GRID.WebM' },
    { name: 'Wilderness - Seaside', variant: 'Day', category: 'Nature', file: 'Wilderness - Seaside [day] [gridless].WebM' },

    // Mountains & Cliffs
    { name: 'High Mountain Cliffs - Path', variant: 'Day', category: 'Mountains', file: 'High Mountain Cliffs Pathday.WebM' },
    { name: 'High Mountain Cliffs - Path', variant: 'Night', category: 'Mountains', file: 'High Mountain Cliffs - Path [night] [gridless].WebM' },
    { name: 'High Mountain Cliffs - Cave', variant: 'Day', category: 'Mountains', file: 'High Mountain Cliffs - Cave [day] [gridless].WebM' },
    { name: 'High Mountain Cliffs - Cave', variant: 'Night', category: 'Mountains', file: 'High Mountain Cliffs - Cave [night] [gridless].WebM' },
    { name: 'High Mountain Cliffs - Cave (Open)', variant: 'Day', category: 'Mountains', file: 'High Mountain Cliffs - Cave [day] [gridless] [open].WebM' },
    { name: 'High Mountain Cliffs - Cave (Open)', variant: 'Night', category: 'Mountains', file: 'High Mountain Cliffs - Cave [night] [gridless] [open].WebM' },
    { name: 'Mountain Top Ruins', variant: 'Dawn', category: 'Mountains', file: 'MOUNTAIN TOP RUINS [at dawn] - NO GRID.WebM' },
    { name: 'Mountain Top Ruins', variant: 'Night', category: 'Mountains', file: 'MOUNTAIN TOP RUINS [at night] - NO GRID.WebM' },
    { name: 'Mountain Top Ruins (No Walls)', variant: 'Dawn', category: 'Mountains', file: 'MOUNTAIN TOP RUINS [at dawn without walls] - NO GRID.WebM' },
    { name: 'Mountain Top Ruins (No Walls)', variant: 'Night', category: 'Mountains', file: 'MOUNTAIN TOP RUINS [at night without walls] - NO GRID.WebM' },

    // City & Town
    { name: 'City Streets 1', variant: 'Day', category: 'City', file: 'City_Streets1_Day-HD_gridless.WebM' },
    { name: 'City Streets 1', variant: 'Night', category: 'City', file: 'City_Streets1_Night-UHD_gridless.WebM' },
    { name: 'City Streets 2', variant: 'Day', category: 'City', file: 'City_Streets2_Day-HD_gridless.WebM' },
    { name: 'City Streets 2', variant: 'Night', category: 'City', file: 'City_Streets2_Night-UHD_gridless.WebM' },
    { name: 'Traveling Circus', variant: 'Day', category: 'City', file: 'TRAVELING CIRCUS [day] - NO GRID.WebM' },
    { name: 'Traveling Circus', variant: 'Night', category: 'City', file: 'TRAVELING CIRCUS [night] - NO GRID.WebM' },

    // Taverns & Interiors
    { name: 'Small Tavern', variant: '', category: 'Interior', file: 'SMALL TAVERN - NO GRID.WebM' },
    { name: 'Small Tavern (Abandoned)', variant: '', category: 'Interior', file: 'SMALL TAVERN [abandoned] - NO GRID.WebM' },
    { name: 'Roaring Pony - Full', variant: '', category: 'Interior', file: 'The Roaring Pony [gridless].WebM' },
    { name: 'Roaring Pony - Main Hall', variant: '', category: 'Interior', file: 'The Roaring Pony - Main Hall [gridless].WebM' },
    { name: 'Roaring Pony - Rooms', variant: '', category: 'Interior', file: 'The Roaring Pony - Rooms [gridless].WebM' },
    { name: 'Roaring Pony - Cellars Kitchen', variant: '', category: 'Interior', file: 'The Roaring Pony - Cellars - Kitchen [gridless].WebM' },
    { name: 'Roaring Pony - Cellars Unfinished', variant: '', category: 'Interior', file: 'The Roaring Pony - Cellars - Unfinished [gridless].WebM' },
    { name: 'Drunken Goat Inn', variant: '', category: 'Interior', file: 'Drunken Goat Inn [gridless].WebM' },
    { name: 'Kitchen', variant: '', category: 'Interior', file: 'KITCHEN - NOGRID.WebM' },
    { name: "Demon Hunter's House", variant: '', category: 'Interior', file: "DEMON HUNTER'S HOUSE - NOGRID.WebM" },
    { name: 'Ransacked Halls', variant: '', category: 'Interior', file: 'RANSACKED HALLS - remastered.WebM' },

    // Caves & Underground
    { name: 'Tribal Cave', variant: 'Day', category: 'Cave', file: 'Tribal Cave [day] [gridless].WebM' },
    { name: 'Tribal Cave', variant: 'Night', category: 'Cave', file: 'Tribal Cave [night] [gridless].WebM' },
    { name: 'Tribal Cave (Unfurnished)', variant: 'Day', category: 'Cave', file: 'Tribal Cave - Unfurnished [day] [gridless].WebM' },
    { name: 'Underground Fighting Pit', variant: '', category: 'Cave', file: 'Underground Fighting Pit [gridless].WebM' },
    { name: 'Underground Fighting Pit (Water)', variant: '', category: 'Cave', file: 'Underground Fighting Pit - Water [gridless].WebM' },

    // Arenas & Combat
    { name: 'Fighting Arena', variant: 'Day', category: 'Arena', file: 'Fighting Arena [day] [gridless].WebM' },
    { name: 'Fighting Arena', variant: 'Night', category: 'Arena', file: 'Fighting Arena [night] [gridless].WebM' },
    { name: 'Fighting Arena (Fiery)', variant: 'Night', category: 'Arena', file: 'Fighting Arena Fiery [night] [gridless].WebM' },

    // Camps
    { name: 'Tribal Camp', variant: 'Day', category: 'Camp', file: 'Tribal Camp [day] [gridless].WebM' },
    { name: 'Tribal Camp', variant: 'Night', category: 'Camp', file: 'Tribal Camp [night] [gridless].WebM' },

    // Dark & Hellish
    { name: 'Fiery Abyss', variant: '', category: 'Dark', file: 'Fiery Abyss [gridless].WebM' },
    { name: 'Lava Land', variant: '', category: 'Dark', file: 'LAVA LAND - NO GRID.WebM' },
    { name: 'Destroyed House (Lava)', variant: '', category: 'Dark', file: 'DistroyedHouseLava.WebM' },
    { name: 'Hand of God', variant: '', category: 'Dark', file: 'HAND OF GOD - NO GRID.WebM' },
    { name: 'Hand of God (Space)', variant: '', category: 'Dark', file: 'HAND OF GOD [space] - NO GRID.WebM' },
    { name: 'Shadowland - Plain', variant: '', category: 'Dark', file: 'Shadowland - Plain [gridless].WebM' },
    { name: 'Shadowland - Riverside', variant: '', category: 'Dark', file: 'Shadowland - Riverside [gridless].WebM' },
    { name: 'Shadowland - Road', variant: '', category: 'Dark', file: 'Shadowland - Road [gridless].WebM' },
    { name: 'Dragons Lair - Outside', variant: '', category: 'Dark', file: 'Dragons Lair - Outside Area Alternate [gridless].WebM' },

    // Wizard's Tower
    { name: "Wizard's Tower - Exterior (Mountains)", variant: '', category: 'Tower', file: 'Wizards Tower - Exterior - Mountains [gridless].WebM' },
    { name: "Wizard's Tower - Exterior (Sea)", variant: '', category: 'Tower', file: 'Wizards Tower - Exterior - Sea [gridless].WebM' },
    { name: "Wizard's Tower - Basement Cellars", variant: '', category: 'Tower', file: 'Wizards Tower - Level 0 - Basement Cellars [gridless].WebM' },
    { name: "Wizard's Tower - Ground Floor", variant: '', category: 'Tower', file: 'Wizards Tower - Level 1 - Ground Floor [gridless].WebM' },
    { name: "Wizard's Tower - Maze", variant: '', category: 'Tower', file: 'Wizards Tower - Level 2 - Maze [gridless].WebM' },
    { name: "Wizard's Tower - Library", variant: '', category: 'Tower', file: 'Wizards Tower - Level 3 - Library [gridless].WebM' },
    { name: "Wizard's Tower - Antigravity Room", variant: '', category: 'Tower', file: 'Wizards Tower - Level 4 - Antigravity Room [gridless].WebM' },
    { name: "Wizard's Tower - Bedroom", variant: '', category: 'Tower', file: 'Wizards Tower - Level 5 - Bedroom [gridless].WebM' },
    { name: "Wizard's Tower - Roof", variant: '', category: 'Tower', file: 'Wizards Tower - Roof - Mountains [gridless].WebM' },
];

const CATEGORIES = [
    { id: 'all', label: 'All Maps', icon: '🗺️' },
    { id: 'Nature', label: 'Nature', icon: '🌿' },
    { id: 'Mountains', label: 'Mountains', icon: '⛰️' },
    { id: 'City', label: 'City', icon: '🏘️' },
    { id: 'Interior', label: 'Interior', icon: '🏠' },
    { id: 'Cave', label: 'Caves', icon: '🕳️' },
    { id: 'Arena', label: 'Arenas', icon: '⚔️' },
    { id: 'Camp', label: 'Camps', icon: '⛺' },
    { id: 'Dark', label: 'Dark & Hellish', icon: '🔥' },
    { id: 'Tower', label: "Wizard's Tower", icon: '🗼' },
];

export default function AnimatedMapLibrary({ onClose }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loadingMap, setLoadingMap] = useState(null);

    const { setMapImage } = useBattleMapStore();

    const filteredMaps = useMemo(() => {
        return MAP_CATALOG.filter(map => {
            const matchesCategory = selectedCategory === 'all' || map.category === selectedCategory;
            const matchesSearch = !search ||
                map.name.toLowerCase().includes(search.toLowerCase()) ||
                map.variant.toLowerCase().includes(search.toLowerCase()) ||
                map.category.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [search, selectedCategory]);

    const loadMap = useCallback((map) => {
        setLoadingMap(map.file);
        const url = `${GITHUB_RAW}/${encodeURIComponent(map.file)}`;

        setMapImage({
            url,
            width: 1920,
            height: 1080,
            name: `${map.name}${map.variant ? ` (${map.variant})` : ''}`,
            isVideo: true,
            isExternal: true
        });

        setLoadingMap(null);
        if (onClose) onClose();
    }, [setMapImage, onClose]);

    const getVariantIcon = (variant) => {
        if (!variant) return null;
        const v = variant.toLowerCase();
        if (v.includes('night') || v.includes('dark')) return <Moon size={12} className="variant-moon" />;
        if (v.includes('day') || v.includes('dawn')) return <Sun size={12} className="variant-sun" />;
        return null;
    };

    return (
        <div className="animated-map-library">
            <div className="library-header">
                <h3>🎬 Animated Maps</h3>
                <span className="map-count">{filteredMaps.length} maps</span>
                {onClose && (
                    <button className="lib-close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                )}
            </div>

            <p className="lib-credit">
                Maps by <a href="https://github.com/PeggsDev/animated-battle-maps" target="_blank" rel="noreferrer">PeggsDev</a> & community
            </p>

            {/* Search */}
            <div className="lib-search">
                <Search size={14} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search maps..."
                />
            </div>

            {/* Category filters */}
            <div className="lib-categories">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        <span className="cat-icon">{cat.icon}</span>
                        <span className="cat-label">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Map grid */}
            <div className="lib-maps">
                {filteredMaps.map((map, i) => (
                    <button
                        key={i}
                        className={`map-card ${loadingMap === map.file ? 'loading' : ''}`}
                        onClick={() => loadMap(map)}
                        title={`${map.name}${map.variant ? ` — ${map.variant}` : ''}`}
                    >
                        <div className="map-card-icon">
                            <MapPin size={16} />
                        </div>
                        <div className="map-card-info">
                            <span className="map-card-name">{map.name}</span>
                            {map.variant && (
                                <span className="map-card-variant">
                                    {getVariantIcon(map.variant)} {map.variant}
                                </span>
                            )}
                        </div>
                        <Play size={14} className="map-card-play" />
                    </button>
                ))}
                {filteredMaps.length === 0 && (
                    <p className="no-results">No maps match your search</p>
                )}
            </div>

            <style>{`
        .animated-map-library {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .library-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .library-header h3 {
          margin: 0;
          font-size: 1rem;
          color: var(--text-primary);
          flex: 1;
        }

        .map-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 0.15rem 0.5rem;
          border-radius: 10px;
        }

        .lib-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          border-radius: 4px;
        }

        .lib-close-btn:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .lib-credit {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin: 0 0 0.75rem;
          opacity: 0.7;
        }

        .lib-credit a {
          color: var(--hope-color);
          text-decoration: none;
        }

        .lib-credit a:hover {
          text-decoration: underline;
        }

        .lib-search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.4rem 0.6rem;
          margin-bottom: 0.75rem;
        }

        .lib-search svg {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .lib-search input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.8rem;
          outline: none;
        }

        .lib-search input::placeholder {
          color: var(--text-muted);
          opacity: 0.5;
        }

        .lib-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }

        .cat-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border: 1px solid transparent;
          border-radius: 12px;
          color: var(--text-muted);
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cat-btn:hover {
          color: var(--text-primary);
          border-color: var(--border);
        }

        .cat-btn.active {
          border-color: var(--hope-color);
          color: var(--hope-color);
          background: rgba(234, 179, 8, 0.1);
        }

        .cat-icon {
          font-size: 0.8rem;
        }

        .lib-maps {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .map-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.6rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .map-card:hover {
          border-color: var(--hope-color);
          background: rgba(234, 179, 8, 0.05);
        }

        .map-card:hover .map-card-play {
          opacity: 1;
          color: var(--hope-color);
        }

        .map-card.loading {
          opacity: 0.6;
          pointer-events: none;
        }

        .map-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: rgba(139, 92, 246, 0.15);
          border-radius: 6px;
          color: var(--fear-color);
          flex-shrink: 0;
        }

        .map-card-info {
          flex: 1;
          min-width: 0;
        }

        .map-card-name {
          display: block;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .map-card-variant {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }

        .variant-sun { color: #fbbf24; }
        .variant-moon { color: #818cf8; }

        .map-card-play {
          opacity: 0.3;
          color: var(--text-muted);
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .no-results {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
          padding: 2rem 0;
        }
      `}</style>
        </div>
    );
}
