import { useAuth } from '../../contexts/AuthContext';
import { Search, Bell, User, ChevronRight } from 'lucide-react';
import PresenceIndicator from '../PresenceIndicator/PresenceIndicator';

export default function TopBar({ currentView, presenceList }) {
    const { currentUser } = useAuth();

    const getBreadcrumbs = () => {
        const views = {
            dashboard: 'Dashboard',
            characters: 'Characters',
            lore: 'Lore & World',
            npcs: 'Non-Player Characters',
            locations: 'Locations',
            timeline: 'World Timeline',
            quests: 'Quests & Objectives',
            sessions: 'Session Logs',
            encounters: 'Encounter Builder',
            initiative: 'Initiative Tracker',
            partyInventory: 'Party Stash',
            items: 'Item Catalog',
            adversaries: 'Adversary Catalog',
            environments: 'Environment Catalog',
            files: 'Maps & Files',
            tools: 'Utility Tools',
            help: 'Features & Help',
            members: 'Campaign Members',
            playerDisplay: 'Player Display',
            battleMapStudio: 'Battle Map Studio',
            campaignBuilder: 'Campaign Builder'
        };
        return views[currentView] || currentView.charAt(0).toUpperCase() + currentView.slice(1);
    };

    return (
        <header className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6 bg-[#0d1126]/70 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40 transition-all duration-300">
            <div className="flex items-center gap-4 min-w-0">
                <nav className="flex items-center text-sm font-medium min-w-0">
                    <span className="hidden sm:inline text-white/40 hover:text-white/80 transition-colors cursor-default shrink-0">Lorelich</span>
                    <ChevronRight size={14} className="hidden sm:inline mx-2 text-white/20 shrink-0" />
                    <span className="text-white font-semibold tracking-wide truncate">{getBreadcrumbs()}</span>
                </nav>
            </div>

            <div className="hidden md:flex flex-1 max-w-2xl px-12">
                <div className="relative group w-full">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search campaign, lore, or press '/' for commands..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 focus:bg-white/[0.07] transition-all text-white placeholder:text-white/20 shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-bold text-white/30 group-focus-within:hidden">
                        CMD K
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-6 shrink-0">
                <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-white/10">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-bold text-white/90 tracking-tight">
                            {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-0.5 ring-1 ring-white/5">
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-black text-white/80 uppercase rounded-lg">
                                {currentUser?.email?.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
                <button className="relative p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all duration-200">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0d1126]"></span>
                </button>
            </div>
        </header>
    );
}
