import { useState } from 'react';
import { Users, BookOpen, ScrollText, ExternalLink, Edit3, Swords, Crown, Calendar, UsersRound, MapPin } from 'lucide-react';
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

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-4">
      <h2
        className="text-[11px] font-bold uppercase"
        style={{
          color: 'var(--text-muted)',
          letterSpacing: '0.28em',
          fontFamily: 'var(--font-body)',
        }}
      >
        {children}
      </h2>
      <div className="h-px flex-1" style={{ background: 'var(--line)' }} />
    </div>
  );
}

function GmStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={16} style={{ color: 'var(--text-muted)' }} strokeWidth={1.8} />
      <div className="flex flex-col leading-tight">
        <span
          className="text-[9px] font-bold uppercase"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.18em' }}
        >
          {label}
        </span>
        <span
          className="text-base"
          style={{
            color: 'var(--text)',
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export default function DashboardView({
  campaign,
  updateCampaign,
  characters = [],
  lore = [],
  sessions = [],
  isDM,
  npcs = [],
  locations = [],
  timelineEvents = [],
  encounters = [],
  notes = [],
  currentUserId
}) {
  // Defensive check for array props to prevent "is not iterable" errors
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeCharacters = Array.isArray(characters) ? characters : [];
  const safeLore = Array.isArray(lore) ? lore : [];

  if (!Array.isArray(sessions)) console.error('DashboardView: sessions is not an array:', sessions);
  if (!Array.isArray(encounters)) console.error('DashboardView: encounters is not an array:', encounters);

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

  const recentSessions = [...safeSessions]
    .sort((a, b) => b.number - a.number)
    .slice(0, 3);

  const safeEncounters = Array.isArray(encounters) ? encounters : [];
  const safeNpcs = Array.isArray(npcs) ? npcs : [];
  const safeLocations = Array.isArray(locations) ? locations : [];
  const lastSession = recentSessions[0];

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-10 lr-fade-in" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Campaign Hero */}
      <div
        className="relative rounded-[2rem] overflow-hidden p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 transition-all group"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
          <span
            className="text-[11px] font-bold uppercase"
            style={{ color: 'var(--primary)', letterSpacing: '0.3em' }}
          >
            Campaign Overview
          </span>
          <h1
            className="text-4xl md:text-5xl leading-[1.05]"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            {campaign.name}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {campaign.description || 'No description has been written for this campaign yet.'}
          </p>
        </div>

        {isDM && (
          <button
            className="p-3 rounded-xl transition-all"
            style={{
              background: 'var(--surface-hi)',
              border: '1px solid var(--line-strong)',
              color: 'var(--text-muted)',
            }}
            onClick={() => setIsEditingCampaign(true)}
            title="Edit campaign"
          >
            <Edit3 size={20} />
          </button>
        )}

        <div
          className="absolute top-0 right-0 w-64 h-64 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"
          style={{ background: 'var(--primary-soft)' }}
        />
      </div>

      {/* Stats Cluster — 4-up per Lorelich */}
      <div className="grid grid-cols-2 lr-stats-grid lg:grid-cols-4 gap-4 md:gap-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Adventurers', value: safeCharacters.length, icon: Users, tone: 'var(--primary)' },
          { label: 'Lore Entries', value: safeLore.length, icon: BookOpen, tone: 'var(--accent)' },
          { label: 'Sessions', value: safeSessions.length, icon: ScrollText, tone: 'var(--success)' },
          { label: 'Encounters', value: safeEncounters.length, icon: Swords, tone: 'var(--fear)' },
        ].map((stat, i) => (
          <div
            key={i}
            className="group relative flex items-center gap-4 p-5 md:p-6 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `color-mix(in srgb, ${stat.tone} 16%, transparent)`,
                border: `1px solid color-mix(in srgb, ${stat.tone} 35%, transparent)`,
                color: stat.tone,
              }}
            >
              <stat.icon size={22} />
            </div>
            <div className="space-y-1 min-w-0">
              <h3
                className="text-3xl leading-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {stat.value}
              </h3>
              <p
                className="text-[10px] font-bold uppercase"
                style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}
              >
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* GM-at-a-glance — only when GM view is active */}
      {isDM && (
        <div
          className="rounded-2xl p-6 flex flex-wrap items-center gap-6"
          style={{
            background: 'color-mix(in srgb, var(--fear) 10%, var(--surface))',
            border: '1px solid color-mix(in srgb, var(--fear) 28%, var(--line-strong))',
          }}
        >
          <div className="flex items-center gap-3 shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'color-mix(in srgb, var(--fear) 18%, transparent)',
                border: '1px solid var(--fear)',
                color: 'var(--fear)',
              }}
            >
              <Crown size={18} />
            </div>
            <div>
              <span
                className="text-[10px] font-bold uppercase block"
                style={{ color: 'var(--fear)', letterSpacing: '0.24em' }}
              >
                GM at a glance
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Private overview for the Game Master
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6 flex-1">
            <GmStat icon={Calendar} label="Last session" value={lastSession ? `#${lastSession.number}` : '—'} />
            <GmStat icon={UsersRound} label="NPCs" value={safeNpcs.length} />
            <GmStat icon={MapPin} label="Locations" value={safeLocations.length} />
            <GmStat icon={Swords} label="Encounters" value={safeEncounters.length} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Quick Actions & Sessions */}
        <div className="lg:col-span-8 space-y-10">
          <section className="space-y-4">
            <SectionHeading>Quick Links</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {externalTools.map((tool, index) => (
                <a
                  key={index}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-4 p-4 rounded-xl transition-all"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
                >
                  <div
                    className="text-xl w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: 'var(--surface-hi)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    {ICON_MAP[tool.icon] || '🔗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{tool.name}</h4>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{tool.description}</p>
                  </div>
                  <ExternalLink size={14} style={{ color: 'var(--text-dim)' }} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              ))}
            </div>
          </section>

          {recentSessions.length > 0 && (
            <section className="space-y-4">
              <SectionHeading>Recent Sessions</SectionHeading>
              <div className="space-y-3">
                {recentSessions.map(session => (
                  <div
                    key={session.id}
                    className="group flex items-center gap-4 p-4 rounded-xl transition-all"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div
                      className="w-12 h-12 shrink-0 rounded-lg flex flex-col items-center justify-center"
                      style={{
                        background: 'var(--primary-soft)',
                        border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                      }}
                    >
                      <span
                        className="text-[8px] font-bold uppercase"
                        style={{ color: 'var(--primary)', letterSpacing: '0.14em' }}
                      >
                        SES
                      </span>
                      <span
                        className="text-base"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        #{session.number}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4
                          className="text-base leading-tight truncate"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            color: 'var(--text)',
                          }}
                        >
                          {session.title}
                        </h4>
                        <span
                          className="text-[10px] font-semibold uppercase shrink-0"
                          style={{ color: 'var(--text-dim)', letterSpacing: '0.12em' }}
                        >
                          {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>{session.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Relationship Graph */}
          <section className="space-y-4">
            <SectionHeading>Relationship Map</SectionHeading>
            <div
              className="rounded-2xl overflow-hidden p-2"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
            >
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
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-6 flex flex-col gap-6">
            <section
              className="rounded-2xl p-6 overflow-hidden relative"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
            >
              <DiceRoller
                isDM={isDM}
                campaignId={campaign.id}
                characters={characters}
                currentUserId={currentUserId}
              />
            </section>

            {isDM && (
              <section
                className="rounded-2xl p-6 overflow-hidden relative"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                }}
              >
                <DMSoundboard campaignId={campaign.id} />
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Edit Campaign Modal */}
      <Modal
        isOpen={isEditingCampaign}
        onClose={() => setIsEditingCampaign(false)}
        title="Edit Campaign"
        size="medium"
      >
        <form onSubmit={handleSaveCampaign} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Campaign Name</label>
            <input
              type="text"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              required
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all font-serif italic"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Description</label>
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
              <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">Make Campaign Public</span>
            </label>
            <p className="text-[10px] text-white/20 font-medium ml-8 italic">
              Anyone can discover and request to join this campaign.
            </p>
          </div>
          <div className="flex gap-3 pt-6 border-t border-white/5">
            <button type="button" className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 font-black text-xs uppercase tracking-widest transition-all" onClick={() => setIsEditingCampaign(false)}>
              Cancel
            </button>
            <button type="submit" className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
