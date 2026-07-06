import { Sparkles } from 'lucide-react';
import GMAssistantPanel from './GMAssistantPanel';

/**
 * Standalone page for the AI GM Assistant, reachable from the sidebar.
 * The same panel is also embeddable inside the Sessions view via its
 * "Plan with AI" toggle; here it's always open with a page header.
 */
export default function GMAssistantView({
  campaign,
  campaignFrame,
  characters,
  npcs,
  adversaries,
  locations,
  lore,
  sessions,
  encounters,
  isDM,
  currentUserId,
  addEncounter,
  addAdversary,
  addNPC,
  addLocation,
  addSession,
  addLore,
}) {
  const handlers = { addEncounter, addAdversary, addNPC, addLocation, addSession, addLore };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="py-4">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3 font-cinzel">
          <Sparkles className="text-[rgb(var(--color-primary))]" size={32} />
          GM Assistant
        </h2>
        <p className="text-white/60 text-lg">
          Plan a session with AI — describe what you want and it drafts encounters, NPCs, locations, and more for you to review and save.
        </p>
      </div>

      <GMAssistantPanel
        campaign={campaign}
        campaignFrame={campaignFrame}
        characters={characters}
        npcs={npcs}
        adversaries={adversaries}
        locations={locations}
        lore={lore}
        sessions={sessions}
        encounters={encounters}
        isDM={isDM}
        currentUserId={currentUserId}
        handlers={handlers}
        onSaved={() => { /* lists auto-refresh via Firestore subscriptions */ }}
      />
    </div>
  );
}
