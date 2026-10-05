// The app's navigation: one list, used by the sidebar, the command palette
// (Ctrl+K) and the top bar's page title.
//
// These used to be three hand-kept lists that had drifted apart: the palette
// knew 16 of the 31 pages (no Story So Far, GM Screen, Player Display, Battle
// Map Studio…), and the top bar titled pages it didn't know by capitalising
// the id ("Gm-screen", "ApiSettings"). The DM's table tools were also spread
// over Adventure, Resources and Settings — Player Display and Battle Map
// Studio sat under Settings — so running a session meant hunting.
//
// Pure apart from the icon components, so the grouping can be tested.

import {
  Home, User, Gamepad2, Users, Skull, Backpack, StickyNote, MessageSquare, BookMarked,
  UsersRound, Map, BookOpen, Calendar, Target, ScrollText, Swords, Zap, LayoutDashboard,
  Monitor, Grid, Package, TreePine, FolderUp, Wrench, Sparkles, Wand2, UserCog, Settings,
  HelpCircle, Shield, Globe, Dices, Library,
} from 'lucide-react';

/**
 * Every page, keyed by view id. `title` is the top bar's heading where it
 * differs from the menu label; `keywords` help the command palette.
 * `dm` pages are DM-only; `player` pages are hidden from the DM.
 */
export const VIEWS = {
  superadmin:      { label: 'All Campaigns',       icon: Shield,          superadmin: true },
  dashboard:       { label: 'Dashboard',           icon: Home,            keywords: ['home', 'previously on'] },
  'my-sheet':      { label: 'My Sheet',            icon: User,            player: true, keywords: ['character', 'sheet'] },
  portal:          { label: 'Player Portal',       icon: Gamepad2,        player: true, action: 'portal', daggerheartOnly: true },

  sessions:        { label: 'Sessions',            icon: ScrollText,      title: 'Session Logs', keywords: ['games', 'play', 'live notes'] },
  encounters:      { label: 'Encounters',          icon: Swords,          dm: true, title: 'Encounter Builder', keywords: ['combat', 'battle', 'fight'] },
  initiative:      { label: 'Initiative',          icon: Zap,             dm: true, title: 'Initiative Tracker', keywords: ['turns', 'combat'] },
  'gm-screen':     { label: 'GM Screen',           icon: LayoutDashboard, dm: true, keywords: ['fear', 'countdowns', 'party'] },
  playerDisplay:   { label: 'Player Display',      icon: Monitor,         dm: true, keywords: ['tv', 'screen', 'handout'] },
  battleMapStudio: { label: 'Battle Map Studio',   icon: Grid,            dm: true, keywords: ['map', 'tokens', 'grid'] },
  'gm-cheatsheet': { label: 'Rules Cheatsheet',    icon: BookMarked,      dm: true, keywords: ['rules', 'reference'] },

  characters:      { label: 'Characters',          icon: Users,           keywords: ['players', 'pcs', 'party'] },
  graveyard:       { label: 'Graveyard',           icon: Skull,           keywords: ['dead', 'fallen'] },
  partyInventory:  { label: 'Party Stash',         icon: Backpack,        keywords: ['inventory', 'loot'] },
  notes:           { label: 'My Notes',            icon: StickyNote,      keywords: ['journal'] },
  messaging:       { label: 'Messages',            icon: MessageSquare,   keywords: ['chat', 'whisper'] },

  storybook:       { label: 'Story So Far',        icon: BookMarked,      title: 'The Chronicle', keywords: ['chronicle', 'chapters', 'recap'] },

  npcs:            { label: 'NPCs',                icon: UsersRound,      title: 'Non-Player Characters', keywords: ['non-player', 'people'] },
  locations:       { label: 'Locations',           icon: Map,             keywords: ['places', 'maps'] },
  lore:            { label: 'Lore',                icon: BookOpen,        title: 'Lore & World', keywords: ['worldbuilding', 'history'] },
  timeline:        { label: 'Timeline',            icon: Calendar,        title: 'World Timeline', keywords: ['events', 'history'] },
  quests:          { label: 'Quests',              icon: Target,          title: 'Quests & Objectives', keywords: ['objectives', 'missions'] },

  items:           { label: 'Item Catalog',        icon: Package,         keywords: ['weapons', 'armor', 'equipment'] },
  adversaries:     { label: 'Adversary Catalog',   icon: Skull,           keywords: ['monsters', 'enemies', 'statblock'] },
  environments:    { label: 'Environment Catalog', icon: TreePine,        keywords: ['terrain', 'scene'] },
  files:           { label: 'Maps & Files',        icon: FolderUp,        keywords: ['documents', 'uploads'] },
  tools:           { label: 'Tools',               icon: Wrench,          title: 'Utility Tools', keywords: ['generators', 'utility'] },
  'ai-cogm':       { label: 'AI Co-GM',            icon: Sparkles,        dm: true, keywords: ['ai', 'assistant', 'generate'] },
  campaignBuilder: { label: 'Campaign Builder',    icon: Wand2,           dm: true, keywords: ['setup', 'wizard'] },

  members:         { label: 'Members',             icon: UserCog,         dm: true, title: 'Campaign Members', keywords: ['invite', 'players', 'roles'] },
  apiSettings:     { label: 'API Settings',        icon: Settings,        keywords: ['keys', 'config'] },
  help:            { label: 'Features & Help',     icon: HelpCircle,      keywords: ['help', 'guide'] },
};

// Group order and membership. A view appears in exactly one group.
const GROUPS = [
  { id: 'superadmin', label: 'SuperAdmin',   icon: Shield,     views: ['superadmin'] },
  { id: 'campaign',   label: 'Campaign',     icon: Home,       views: ['dashboard', 'my-sheet', 'portal'] },
  { id: 'table',      label: 'At the Table', icon: Dices,      views: ['sessions', 'encounters', 'initiative', 'gm-screen', 'playerDisplay', 'battleMapStudio', 'gm-cheatsheet'] },
  { id: 'players',    label: 'Players',      icon: Users,      views: ['characters', 'graveyard', 'partyInventory', 'notes', 'messaging'] },
  { id: 'story',      label: 'The Chronicle', icon: BookMarked, featured: true, views: ['storybook'] },
  { id: 'world',      label: 'World',        icon: Globe,      views: ['npcs', 'locations', 'lore', 'timeline', 'quests'] },
  { id: 'library',    label: 'Library',      icon: Library,    views: ['items', 'adversaries', 'environments', 'files', 'tools', 'ai-cogm', 'campaignBuilder'] },
  { id: 'settings',   label: 'Settings',     icon: Settings,   views: ['members', 'apiSettings', 'help'] },
];

export const NAV_GROUP_IDS = GROUPS.map(g => g.id);

function visible(view, { isDM, isDaggerheart, isSuperAdmin, canEnterPortal }) {
  if (view.superadmin && !isSuperAdmin) return false;
  if (view.dm && !isDM) return false;
  if (view.player && isDM) return false;
  if (view.daggerheartOnly && !isDaggerheart) return false;
  if (view.action === 'portal' && !canEnterPortal) return false;
  return true;
}

/**
 * The sidebar's groups for this viewer: `[{ id, label, icon, featured?, items: [{ id, label, icon, action? }] }]`.
 * Empty groups are dropped.
 */
export function navGroupsFor({ isDM = false, isDaggerheart = false, isSuperAdmin = false, canEnterPortal = false } = {}) {
  const who = { isDM, isDaggerheart, isSuperAdmin, canEnterPortal };
  return GROUPS
    .map(g => ({
      id: g.id,
      label: g.label,
      icon: g.icon,
      featured: !!g.featured,
      items: g.views
        .filter(id => VIEWS[id] && visible(VIEWS[id], who))
        .map(id => ({ id, label: VIEWS[id].label, icon: VIEWS[id].icon, action: VIEWS[id].action || 'view', keywords: VIEWS[id].keywords || [] })),
    }))
    .filter(g => g.items.length > 0);
}

/** Every navigable page for this viewer, flat — what the command palette lists. */
export function navItemsFor(who) {
  return navGroupsFor(who).flatMap(g => g.items.map(item => ({ ...item, group: g.label })));
}

/** The top bar's heading for a view. */
export function viewTitle(viewId) {
  const view = VIEWS[viewId];
  if (view) return view.title || view.label;
  return String(viewId || '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
