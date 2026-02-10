import { useState } from 'react';
import { Crown, User } from 'lucide-react';
import './RoleSelection.css';

export default function RoleSelection({ onSelectRole }) {
  const [selectedRole, setSelectedRole] = useState(null);

  const handleContinue = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-arcane-navy flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="text-center space-y-4">
          <h1 className="font-serif text-6xl font-black text-white italic lowercase tracking-tighter">
            Welcome to Lorelich
          </h1>
          <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em]">Digital Campaign Orchestrator</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            className={`
              group relative flex flex-col items-center text-center p-10 rounded-[3rem] border transition-all duration-700
              ${selectedRole === 'dm'
                ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)]'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
              }
            `}
            onClick={() => setSelectedRole('dm')}
          >
            <div className={`w-24 h-24 rounded-3xl mb-8 flex items-center justify-center transition-all duration-700 ${selectedRole === 'dm' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-white/20 group-hover:text-white/40'}`}>
              <Crown size={48} className="group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-serif text-2xl font-black text-white/90 italic lowercase mb-3">Dungeon Master</h3>
            <p className="text-xs font-medium text-white/30 leading-relaxed">
              Create and manage operational theaters, synchronize player nodes, and archive the campaign chronicle.
            </p>
            {selectedRole === 'dm' && (
              <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-[3rem] animate-pulse pointer-events-none" />
            )}
          </button>

          <button
            className={`
              group relative flex flex-col items-center text-center p-10 rounded-[3rem] border transition-all duration-700
              ${selectedRole === 'player'
                ? 'bg-sky-500/10 border-sky-500/30 shadow-[0_0_50px_rgba(14,165,233,0.2)]'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
              }
            `}
            onClick={() => setSelectedRole('player')}
          >
            <div className={`w-24 h-24 rounded-3xl mb-8 flex items-center justify-center transition-all duration-700 ${selectedRole === 'player' ? 'bg-sky-500 text-white shadow-lg' : 'bg-white/5 text-white/20 group-hover:text-white/40'}`}>
              <User size={48} className="group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-serif text-2xl font-black text-white/90 italic lowercase mb-3">Player Node</h3>
            <p className="text-xs font-medium text-white/30 leading-relaxed">
              Join active campaigns, configure character manifestations, and synchronize with the campaign collective.
            </p>
            {selectedRole === 'player' && (
              <div className="absolute inset-0 border-2 border-sky-500/50 rounded-[3rem] animate-pulse pointer-events-none" />
            )}
          </button>
        </div>

        <div className="flex flex-col items-center gap-8">
          <button
            className="group relative px-20 py-5 rounded-[2.5rem] bg-white text-black font-black text-xs uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale overflow-hidden"
            onClick={handleContinue}
            disabled={!selectedRole}
          >
            <div className="absolute inset-0 bg-indigo-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10">Continue</span>
          </button>

          <p className="text-[10px] text-white/20 font-medium italic max-w-xs text-center leading-relaxed">
            Note: Role classification is non-binding and can be overridden within specific campaign parameters.
          </p>
        </div>
      </div>
    </div>
  );
}
