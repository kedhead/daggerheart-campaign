/**
 * Campaign Context Builder — the campaign "brain"
 *
 * Distills all live campaign data into a concise, token-efficient context
 * string that can be injected into any AI prompt. Every generator and the
 * chatbot imports this so they always work from the same up-to-date picture
 * of the campaign world.
 *
 * Design goals:
 *  - One line per entity — enough to be useful, not enough to blow the budget
 *  - Capped list sizes so a large campaign doesn't explode the context window
 *  - Pure function — call it anywhere, always returns fresh data
 */

/**
 * Build the full campaign context string.
 *
 * @param {object} campaign        - Core campaign document
 * @param {object} opts
 * @param {Array}  opts.characters - Player characters
 * @param {Array}  opts.npcs       - NPCs
 * @param {Array}  opts.adversaries- Adversaries
 * @param {Array}  opts.locations  - Locations
 * @param {Array}  opts.lore       - Lore entries
 * @param {Array}  opts.sessions   - Session notes
 * @param {Array}  opts.encounters - Encounters
 * @param {object} opts.campaignFrame - Campaign frame (pitch, themes, tone…)
 * @returns {string} Markdown-formatted context block
 */
export function buildCampaignContext(campaign, {
  characters  = [],
  npcs        = [],
  adversaries = [],
  locations   = [],
  lore        = [],
  sessions    = [],
  encounters  = [],
  campaignFrame = null
} = {}) {
  if (!campaign) return '';

  const lines = [];

  // ── Campaign identity ──────────────────────────────────────────────────────
  lines.push(`## Campaign: ${campaign.name || 'Unnamed Campaign'}`);
  if (campaign.gameSystem && campaign.gameSystem !== 'daggerheart') {
    lines.push(`**System:** ${campaign.gameSystem}`);
  }

  if (campaignFrame) {
    if (campaignFrame.pitch)      lines.push(`**Pitch:** ${campaignFrame.pitch}`);
    if (campaignFrame.themes)     lines.push(`**Themes:** ${campaignFrame.themes}`);
    if (campaignFrame.toneAndFeel) lines.push(`**Tone:** ${campaignFrame.toneAndFeel}`);
    if (campaignFrame.overview)   lines.push(`**Overview:** ${_truncate(campaignFrame.overview, 200)}`);
    if (campaignFrame.incitingIncident) {
      lines.push(`**Inciting Incident:** ${_truncate(campaignFrame.incitingIncident, 150)}`);
    }
  }

  // ── Player characters ──────────────────────────────────────────────────────
  const activeChars = characters.filter(c => c.name);
  if (activeChars.length > 0) {
    lines.push(`\n### Player Characters (${activeChars.length})`);
    activeChars.slice(0, 10).forEach(c => {
      const parts = [c.name];
      if (c.ancestry)        parts.push(c.ancestry);
      if (c.characterClass)  parts.push(c.characterClass);
      if (c.level)           parts.push(`Lvl ${c.level}`);
      if (c.subclass)        parts.push(c.subclass);
      lines.push(`- ${parts.join(', ')}`);
    });
  }

  // ── NPCs ───────────────────────────────────────────────────────────────────
  const visibleNPCs = npcs.filter(n => n.name);
  if (visibleNPCs.length > 0) {
    lines.push(`\n### NPCs (${visibleNPCs.length})`);
    visibleNPCs.slice(0, 25).forEach(n => {
      let line = `- **${n.name}**`;
      if (n.occupation)    line += `, ${n.occupation}`;
      if (n.relationship)  line += ` (${n.relationship})`;
      if (n.location)      line += ` — ${_stripWikiLinks(n.location)}`;
      if (n.description)   line += `: ${_truncate(n.description, 80)}`;
      lines.push(line);
    });
    if (visibleNPCs.length > 25) lines.push(`  *(…and ${visibleNPCs.length - 25} more)*`);
  }

  // ── Locations ──────────────────────────────────────────────────────────────
  const visibleLocations = locations.filter(l => l.name);
  if (visibleLocations.length > 0) {
    lines.push(`\n### Locations (${visibleLocations.length})`);
    visibleLocations.slice(0, 20).forEach(l => {
      let line = `- **${l.name}**`;
      if (l.type)        line += ` (${l.type})`;
      if (l.description) line += ` — ${_truncate(l.description, 100)}`;
      lines.push(line);
    });
    if (visibleLocations.length > 20) lines.push(`  *(…and ${visibleLocations.length - 20} more)*`);
  }

  // ── Adversaries ────────────────────────────────────────────────────────────
  const visibleAdversaries = adversaries.filter(a => a.name);
  if (visibleAdversaries.length > 0) {
    lines.push(`\n### Adversaries (${visibleAdversaries.length})`);
    visibleAdversaries.slice(0, 20).forEach(a => {
      let line = `- **${a.name}** — Tier ${a.tier} ${a.role}`;
      if (a.description) line += `: ${_truncate(a.description, 80)}`;
      if (a.hidden)      line += ' *(hidden from players)*';
      lines.push(line);
    });
    if (visibleAdversaries.length > 20) lines.push(`  *(…and ${visibleAdversaries.length - 20} more)*`);
  }

  // ── Lore ───────────────────────────────────────────────────────────────────
  const visibleLore = lore.filter(l => l.title || l.name);
  if (visibleLore.length > 0) {
    lines.push(`\n### Lore (${visibleLore.length})`);
    visibleLore.slice(0, 15).forEach(l => {
      let line = `- **${l.title || l.name}**`;
      if (l.type)    line += ` (${l.type})`;
      if (l.content) line += `: ${_truncate(l.content, 100)}`;
      lines.push(line);
    });
    if (visibleLore.length > 15) lines.push(`  *(…and ${visibleLore.length - 15} more)*`);
  }

  // ── Recent sessions ────────────────────────────────────────────────────────
  if (sessions.length > 0) {
    const sorted = [...sessions]
      .sort((a, b) => (b.sessionNumber || 0) - (a.sessionNumber || 0))
      .slice(0, 5);
    lines.push(`\n### Recent Sessions`);
    sorted.forEach(s => {
      const title = s.title || `Session ${s.sessionNumber || '?'}`;
      let line = `- **${title}**`;
      if (s.summary || s.notes) {
        line += `: ${_truncate(s.summary || s.notes, 150)}`;
      }
      lines.push(line);
    });
  }

  // ── Encounters ─────────────────────────────────────────────────────────────
  if (encounters.length > 0) {
    lines.push(`\n### Encounters (${encounters.length})`);
    encounters.slice(0, 10).forEach(e => {
      let line = `- **${e.name}**`;
      if (e.difficulty) line += ` (${e.difficulty})`;
      if (e.description) line += `: ${_truncate(e.description, 80)}`;
      lines.push(line);
    });
  }

  return lines.join('\n');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function _truncate(str, max) {
  if (!str || typeof str !== 'string') return '';
  const clean = str.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1) + '…';
}

/** Strip [[wiki link]] syntax from strings */
function _stripWikiLinks(str) {
  if (!str) return '';
  return str.replace(/\[\[([^\]]+)\]\]/g, '$1');
}
