import { useState } from 'react';
import { Users, BookOpen, ScrollText, ExternalLink, Edit3 } from 'lucide-react';
import DiceRoller from '../DiceRoller';
import DMSoundboard from '../Soundboard/DMSoundboard';
import Modal from '../Modal';
import RelationshipGraph from '../RelationshipGraph/RelationshipGraph';
import { getGameSystem } from '../../data/systems/index.js';
import './DashboardView.css';

const ICON_MAP = {
  sword: '⚔️',
  sparkles: '✨',
  'user-circle': '👤',
  home: '🏠',
  'book-open': '📖'
};

export default function DashboardView({ campaign, updateCampaign, characters, lore, sessions, isDM, npcs, locations, timelineEvents, encounters, notes, currentUserId }) {
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState(campaign);

  // Get external tools from game system
  const gameSystem = getGameSystem(campaign?.gameSystem);
  const externalTools = gameSystem?.externalTools || [];

  const handleSaveCampaign = (e) => {
    e.preventDefault();
    updateCampaign(campaignForm);
    setIsEditingCampaign(false);
  };

  const recentSessions = [...sessions]
    .sort((a, b) => b.number - a.number)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-10 animate-in fade-in duration-1000">
      {/* Campaign Terminal Header */}
      <div className="relative rounded-[3rem] border border-white/5 bg-white/[0.01] backdrop-blur-md overflow-hidden p-10 flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:bg-white/[0.03] hover:border-white/10 group">
        <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] block animate-pulse">Campaign uplink established</span>
          <h1 className="font-serif text-5xl font-black text-white/95 leading-none italic lowercase tracking-tighter">
            {campaign.name}
          </h1>
          <p className="text-sm font-medium text-white/30 leading-relaxed">
            {campaign.description || 'No system-level description provided for this operational theater.'}
          </p>
        </div>

        {isDM && (
          <button
            className="p-4 rounded-2xl bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group/edit"
            onClick={() => setIsEditingCampaign(true)}
          >
            <Edit3 size={24} className="group-hover/edit:-translate-y-1 transition-transform" />
          </button>
        )}

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all duration-1000" />
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Synchronized Souls', value: characters.length, icon: Users, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
          { label: 'Archived Lore', value: lore.length, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
          { label: 'Recorded Sessions', value: sessions.length, icon: ScrollText, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' }
        ].map((stat, i) => (
          <div key={i} className="group relative flex items-center gap-6 p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl transition-all duration-500 hover:bg-white/[0.05] hover:border-white/10 hover:-translate-y-1 overflow-hidden">
            <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color} transition-transform group-hover:scale-110 duration-500 shadow-lg`}>
              <stat.icon size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-4xl font-serif font-black text-white/90 italic leading-none">{stat.value}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{stat.label}</p>
            </div>
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000 ${stat.color}`}>
              <stat.icon size={120} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Quick Actions & Sessions */}
        <div className="lg:col-span-8 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] font-sans">External Relays</h2>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {externalTools.map((tool, index) => (
                <a
                  key={index}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-5 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/20 transition-all duration-500 overflow-hidden"
                >
                  <div className="text-2xl bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                    {ICON_MAP[tool.icon] || '🔗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white/80 group-hover:text-white transition-colors">{tool.name}</h4>
                    <p className="text-[10px] font-medium text-white/30 truncate">{tool.description}</p>
                  </div>
                  <ExternalLink size={14} className="text-white/10 group-hover:text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/[0.03] to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </a>
              ))}
            </div>
          </section>

          {recentSessions.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] font-sans">Recent Transmissions</h2>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>
              <div className="space-y-4">
                {recentSessions.map(session => (
                  <div key={session.id} className="group flex items-center gap-6 p-6 rounded-3xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-500">
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col items-center justify-center">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">SEC</span>
                      <span className="text-xl font-serif font-black text-white">#{session.number}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-serif font-black text-white/90 italic lowercase leading-none">{session.title}</h4>
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <p className="text-xs text-white/40 line-clamp-1 italic leading-relaxed">{session.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Relationship Graph - Full Width Integration */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] font-sans">Network Topology</h2>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            <div className="rounded-[3rem] border border-white/5 bg-white/[0.01] overflow-hidden p-2">
              <RelationshipGraph
                campaign={campaign}
                entities={{ npcs, locations, lore, sessions, timelineEvents, encounters, notes }}
                isDM={isDM}
                currentUserId={currentUserId}
              />
            </div>
          </section>
        </div>

        {/* Right Column: Interaction Hub */}
        <div className="lg:col-span-4 space-y-10">
          <div className="sticky top-6 flex flex-col gap-10">
            <section className="bg-black/20 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-sm overflow-hidden relative group">
              <DiceRoller
                isDM={isDM}
                campaignId={campaign.id}
                characters={characters}
                currentUserId={currentUserId}
              />
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <ScrollText size={120} className="text-white" />
              </div>
            </section>

            {isDM && (
              <section className="bg-black/20 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-sm overflow-hidden relative group">
                <DMSoundboard campaignId={campaign.id} />
                <div className="absolute top-0 left-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <Edit3 size={120} className="text-white" />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Edit Campaign Modal */}
      <Modal
        isOpen={isEditingCampaign}
        onClose={() => setIsEditingCampaign(false)}
        title="Override Campaign Parameters"
        size="medium"
      >
        <form onSubmit={handleSaveCampaign} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Designated Alias</label>
            <input
              type="text"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              required
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all font-serif italic"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Mission Intel</label>
            <textarea
              value={campaignForm.description}
              onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
              rows="4"
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all resize-none font-sans"
            />
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={campaignForm.isPublic || false}
                onChange={(e) => setCampaignForm({ ...campaignForm, isPublic: e.target.checked })}
                className="w-5 h-5 rounded-lg bg-black/40 border-white/10 text-indigo-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">Broadcast to Public Channels</span>
            </label>
            <p className="text-[10px] text-white/20 font-medium ml-8 italic">
              Enabling this flag allows unsolicited join requests from external nodes.
            </p>
          </div>
          <div className="flex gap-3 pt-6 border-t border-white/5">
            <button type="button" className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 font-black text-xs uppercase tracking-widest transition-all" onClick={() => setIsEditingCampaign(false)}>
              Abort
            </button>
            <button type="submit" className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
              Force Sync
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
