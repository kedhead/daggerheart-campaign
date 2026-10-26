// Where the campaign is now, for the content generators.
//
// The quick generators (NPC, location, lore, encounter) only ever saw the
// campaign frame: the pitch, Session Zero and the starting quests. Those
// describe how the campaign began, so every new NPC was placed in the opening
// arc ("first met in the depths of the Obsidian Prison") long after the party
// had left it. This picks out the latest played sessions, the newest story
// chapters and the quests still open, so the prompt can say what is happening
// now.

import { stripWikiLinks } from './campaignMemory';

const clip = (text, n) => {
  const t = stripWikiLinks(String(text || '')).replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
};

// The end of a chapter is where the party is now, so keep its tail.
const tail = (text, n) => {
  const t = stripWikiLinks(String(text || '')).replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : `…${t.slice(t.length - (n - 1))}`;
};

const sessionNumber = (s) => Number(s?.sessionNumber ?? s?.number) || 0;

/**
 * @returns {{ sessions: Array<{label: string, text: string}>, chapters: Array<{label: string, text: string}>, quests: Array<{name: string, text: string}> }}
 */
export function currentStorySnapshot({ sessions = [], chapters = [], quests = [] } = {}) {
  const played = (sessions || [])
    .filter(s => s && s.status !== 'planned' && (s.summary || s.notes || s.title))
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || sessionNumber(b) - sessionNumber(a))
    .slice(0, 3)
    .reverse()
    .map(s => ({
      label: [sessionNumber(s) ? `Session ${sessionNumber(s)}` : 'Session', s.title].filter(Boolean).join(': '),
      text: clip(s.summary || s.notes, 400)
    }));

  const written = (chapters || [])
    .filter(c => c && c.status === 'published' && c.prose)
    .sort((a, b) => (Number(b.chapterNumber) || 0) - (Number(a.chapterNumber) || 0))
    .slice(0, 2)
    .reverse()
    .map(c => ({ label: `Chapter ${c.chapterNumber || '?'}${c.title ? `: ${c.title}` : ''}`, text: tail(c.prose, 500) }));

  const open = (quests || [])
    .filter(q => q && q.status === 'active' && q.name)
    .slice(0, 5)
    .map(q => ({ name: q.name, text: clip(q.description, 160) }));

  return { sessions: played, chapters: written, quests: open };
}

export function hasCurrentStory(snapshot) {
  return !!snapshot && (snapshot.sessions.length + snapshot.chapters.length + snapshot.quests.length) > 0;
}
