// Planning for the table cinematics: boss intros and "Previously on…"
// recaps. Pure functions only — prompts, parsing, picking art and timing —
// so the smoke tests cover them without a browser or a network.

import { stripWikiLinks } from '../../utils/campaignMemory';

const clean = (text) => stripWikiLinks(String(text || '')).replace(/\s+/g, ' ').trim();
const clip = (text, n) => {
  const t = clean(text);
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
};

// ── The monitor channel ──────────────────────────────────────────────────────

// A cue older than this is not played: opening or refreshing the monitor
// later must not replay last week's boss intro.
export const CUE_FRESH_MS = 90 * 1000;

export function isFreshCue(cue, now = Date.now()) {
  if (!cue || cue.stopped || !cue.id || !cue.kind) return false;
  const sent = Number(cue.sentAt) || 0;
  return sent > 0 && now - sent < CUE_FRESH_MS && now - sent > -CUE_FRESH_MS;
}

// ── Boss intros ──────────────────────────────────────────────────────────────

/** The card colour for an intro: tier colours for adversaries, relationship colours for NPCs. */
export function introAccent(entity, kind) {
  if (kind === 'adversary') {
    return { 1: '#22c55e', 2: '#eab308', 3: '#f97316', 4: '#ef4444' }[Number(entity?.tier)] || '#ef4444';
  }
  return { ally: '#22c55e', enemy: '#ef4444', neutral: '#eab308' }[entity?.relationship] || '#a855f7';
}

/** The small label above the name: "Tier 3 Solo", "Ally", "Ribbet seraph ghost"… */
export function introTag(entity, kind) {
  if (kind === 'adversary') {
    const role = entity?.role || entity?.type || '';
    return [entity?.tier ? `Tier ${entity.tier}` : '', role ? role[0].toUpperCase() + role.slice(1) : ''].filter(Boolean).join(' ') || 'Adversary';
  }
  return clip(entity?.occupation || entity?.relationship || 'NPC', 40);
}

/** Everything a boss intro needs, from an NPC or adversary and its saved intro settings. */
export function introFromEntity(entity, kind) {
  const intro = entity?.intro || {};
  return {
    name: entity?.name || 'Unknown',
    subtitle: intro.subtitle || '',
    tag: introTag(entity, kind),
    imageUrl: kind === 'adversary' ? entity?.imageUrl || '' : entity?.avatarUrl || '',
    videoUrl: intro.videoUrl || '',
    accent: introAccent(entity, kind)
  };
}

/** The prompt for Borderlands-style intro taglines. */
export function buildIntroPrompt(entity, kind, { campaignName = '', storyNow = '' } = {}) {
  const facts = [
    `Name: ${entity?.name || 'Unknown'}`,
    kind === 'adversary'
      ? `An adversary${entity?.tier ? `, tier ${entity.tier}` : ''}${entity?.role ? `, role ${entity.role}` : ''}.`
      : `An NPC${entity?.occupation ? `: ${clip(entity.occupation, 80)}` : ''}${entity?.relationship ? ` (${entity.relationship} to the party)` : ''}.`,
    entity?.description ? `Description: ${clip(entity.description, 500)}` : '',
    entity?.personality ? `Personality: ${clip(entity.personality, 300)}` : '',
    entity?.motive || entity?.motives ? `Motive: ${clip(entity.motive || entity.motives, 200)}` : ''
  ].filter(Boolean).join('\n');
  return `You write the title cards for character intros in the style of the Borderlands video games: when a boss or notable character appears, the game freezes, their name slams onto the screen, and a short, punchy, irreverent subtitle appears under it ("Your New Best Friend", "Professional Bad Decision", "Three Times Great, Zero Times Serious").

Write 3 different subtitles for this character in a tabletop fantasy campaign${campaignName ? ` called "${campaignName}"` : ''}.
${facts}${storyNow ? `\nWhere the story is now: ${clip(storyNow, 400)}` : ''}

Rules:
- 2 to 6 words each. Title Case. No quotation marks, no full stop, no emoji.
- Witty and specific to this character: their personality, quirks, reputation or what they want. Not generic ("Big Bad Boss").
- No real-world brands or people. Keep it fun for the table, never mean-spirited about players.

Answer with JSON only: {"subtitles": ["...", "...", "..."]}`;
}

/** The subtitles from the model's answer, cleaned. Tolerates prose around the JSON. */
export function parseIntroSubtitles(text) {
  const raw = String(text || '');
  let list = [];
  const json = raw.match(/\{[\s\S]*\}/);
  if (json) {
    try { list = JSON.parse(json[0]).subtitles || []; } catch { list = []; }
  }
  if (!list.length) list = raw.split('\n').map(l => l.replace(/^[\s\-*\d.)]+/, ''));
  return list
    .map(s => String(s || '').replace(/["“”]/g, '').replace(/[.!]+$/, '').trim())
    .filter(s => s && s.split(/\s+/).length <= 8)
    .slice(0, 3);
}

// ── "Previously on…" recaps ──────────────────────────────────────────────────

const sessionTime = (s) => String(s?.date || '');
const sessionNo = (s) => Number(s?.sessionNumber ?? s?.number) || 0;

/**
 * Sessions that were played, oldest first. The same test the chapter writer
 * uses: marked completed, or with a summary or quotes written up. Sessions
 * are often logged as planned and never switched over once played, so the
 * status alone would hide most of them. A session with a chapter was played
 * whatever its status says.
 */
export function playedSessions(sessions = [], chapters = []) {
  const withChapter = new Set((chapters || []).map(c => c?.sessionId).filter(Boolean));
  return (sessions || [])
    .filter(s => s && (s.status === 'completed' || String(s.summary || '').trim() || s.highlights?.length || withChapter.has(s.id)))
    .sort((a, b) => (sessionNo(a) - sessionNo(b)) || sessionTime(a).localeCompare(sessionTime(b)));
}

/** The session's own number if it has one, else its place among played sessions. */
export function sessionNumberOf(session, played) {
  return sessionNo(session) || (played.findIndex(s => s.id === session?.id) + 1);
}

/**
 * What a recap of `session` draws on: that session, the one before it for a
 * little run-up, and the chapters written from them.
 */
export function recapSources({ session, sessions = [], chapters = [] }) {
  const played = playedSessions(sessions, chapters);
  const at = played.findIndex(s => s.id === session?.id);
  const picked = at > 0 ? [played[at - 1], played[at]] : session ? [session] : [];
  const sourceChapters = picked
    .map(s => (chapters || []).find(c => c?.sessionId === s.id && c.status === 'published') || (chapters || []).find(c => c?.sessionId === s.id))
    .filter(Boolean);
  return { sessions: picked, chapters: sourceChapters, sessionNumber: session ? sessionNumberOf(session, played) : played.length };
}

/** The prompt for a recap script. */
export function buildRecapPrompt({ campaignName = '', sources, characters = [] }) {
  const party = (characters || []).filter(c => c?.name).slice(0, 8).map(c => c.name).join(', ');
  const material = [];
  sources.sessions.forEach((s, i) => {
    const last = i === sources.sessions.length - 1;
    material.push(`${last ? 'LAST SESSION' : 'THE SESSION BEFORE'}${s.title ? ` — ${clean(s.title)}` : ''}:\n${clip(s.summary || s.notes, last ? 2500 : 900)}`);
    if (s.highlights?.length) material.push(`Memorable lines: ${s.highlights.slice(0, 4).map(h => `"${clip(h, 140)}"`).join(' ')}`);
  });
  sources.chapters.forEach(c => material.push(`STORY CHAPTER "${clean(c.title)}" (ending):\n${clean(c.prose).slice(-1500)}`));

  return `Write the "Previously on…" recap that opens tonight's tabletop RPG session${campaignName ? ` of "${campaignName}"` : ''}, like the cold open of a TV drama. It plays on a big screen over the campaign's art, read by a narrator.
${party ? `The party: ${party}.\n` : ''}
${material.join('\n\n')}

Rules:
- 6 to 8 beats, in story order, mostly from the LAST SESSION. Use the session before only for set-up.
- Write it for the classic movie-theatre trailer narrator: present tense, epic and dramatic, with humour where the table had fun. Open like a trailer, with "In a world where…" or a three-part set-up ("One party. One prison. No way out."). Vary the rhythm: mostly one sentence of 8 to 18 words, with a couple of very short punches ("Then the floor gave way.").
- Use only what happened in the material above. Do not invent events, deaths or revelations.
- The last beat sets up the cliffhanger: where things stand right now.
- For each beat give "focus": the name of the one character, NPC, creature or place it is most about (or "" if none).
- Then write "question": the cliffhanger as one short dramatic question about what happens next (under 10 words), e.g. "Will the elders trust a ghost?"

Answer with JSON only: {"beats": [{"line": "...", "focus": "..."}], "question": "..."}`;
}

/** The recap beats from the model's answer. */
export function parseRecapScript(text) {
  const raw = String(text || '');
  const json = raw.match(/\{[\s\S]*\}/);
  if (!json) return [];
  let beats = [];
  try { beats = JSON.parse(json[0]).beats || []; } catch { return []; }
  return beats
    .map(b => ({ line: clean(typeof b === 'string' ? b : b?.line), focus: clean(b?.focus) }))
    .filter(b => b.line)
    .slice(0, 8);
}

/** The cliffhanger question from the model's answer, or ''. */
export function parseRecapQuestion(text) {
  const json = String(text || '').match(/\{[\s\S]*\}/);
  if (!json) return '';
  try {
    const q = clean(JSON.parse(json[0]).question);
    return q ? (/[?!.…]$/.test(q) ? q : `${q}?`) : '';
  } catch {
    return '';
  }
}

/**
 * The comic layout for each beat. Short, punchy lines get a full-bleed
 * punch; longer ones a two- or three-panel spread so there is more to look
 * at while the narrator talks. The first and last beats are always
 * full-bleed: the opening shot and the cliffhanger.
 */
export function montageLayout(index, count, line) {
  if (index === 0 || index === count - 1) return 'full';
  const words = clean(line).split(' ').filter(Boolean).length;
  if (words <= 7) return 'full';
  return index % 2 === 1 ? 'split2' : 'split3';
}

/**
 * The pictures each beat's panels show: its own art first, then others from
 * the pool, rotating so neighbouring beats don't repeat each other's extras.
 */
export function panelImages(slides, pool = []) {
  const primaries = new Set(slides.map(s => s.imageUrl).filter(Boolean));
  const extras = [...new Set(pool.filter(u => u && !primaries.has(u)))];
  const fallback = [...primaries];
  let next = 0;
  return slides.map((s, i) => {
    const want = { full: 1, split2: 2, split3: 3 }[montageLayout(i, slides.length, s.line)];
    const out = s.imageUrl ? [s.imageUrl] : [];
    const source = extras.length ? extras : fallback.filter(u => u !== s.imageUrl);
    for (let k = 0; out.length < want && source.length && k < source.length; k++) {
      const u = source[(next + k) % source.length];
      if (!out.includes(u)) out.push(u);
    }
    next += Math.max(0, out.length - 1);
    return out;
  });
}

/**
 * The art each beat shows. A beat about a named NPC, character or adversary
 * gets their portrait; otherwise the chapter's scene art, in order, so the
 * reel walks through the story's own illustrations. Never empty-handed while
 * any art exists.
 */
export function pickRecapArt(beats, { chapters = [], npcs = [], characters = [], adversaries = [], locations = [] } = {}) {
  const scenes = [];
  (chapters || []).forEach(c => {
    (c?.scenes || []).forEach((s, i) => {
      if (!s?.imageUrl) return;
      const key = s.id || `s${i}`;
      scenes.push({ imageUrl: s.imageUrl, videoUrl: c.sceneVideos?.[key]?.url || '' });
    });
  });
  const portraits = [
    ...(npcs || []).map(n => ({ name: n?.name, imageUrl: n?.avatarUrl })),
    ...(characters || []).map(c => ({ name: c?.name, imageUrl: c?.avatarUrl || c?.portraitUrl || c?.imageUrl })),
    ...(adversaries || []).map(a => ({ name: a?.name, imageUrl: a?.imageUrl })),
    ...(locations || []).map(l => ({ name: l?.name, imageUrl: l?.imageUrl || l?.avatarUrl }))
  ].filter(p => p.name && p.imageUrl);
  const byName = (focus) => {
    const f = String(focus || '').toLowerCase();
    if (!f) return null;
    return portraits.find(p => p.name.toLowerCase() === f)
      || portraits.find(p => f.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(f))
      || null;
  };
  let next = 0;
  const all = scenes.length ? scenes : portraits.map(p => ({ imageUrl: p.imageUrl, videoUrl: '' }));
  return beats.map((b, i) => {
    const portrait = byName(b.focus);
    // Open and close on the story's own scene art when there is some.
    if (portrait && i !== 0 && i !== beats.length - 1) return { imageUrl: portrait.imageUrl, videoUrl: '' };
    if (!all.length) return { imageUrl: '', videoUrl: '' };
    const art = all[next % all.length];
    next += 1;
    return { ...art };
  });
}

export const RECAP_TITLE_SECONDS = 3.2;
export const RECAP_END_SECONDS = 3.6;
// The cliffhanger: the music cuts, a beat of black silence, then the question.
export const RECAP_CLIFF_SILENCE = 0.9;
export const RECAP_CLIFF_SECONDS = 3.6;

/**
 * When each slide starts and how long it lasts. With narration the spoken
 * time is shared out by line length (people read long lines for longer);
 * without, each line gets a reading pace.
 */
export function recapTimings(slides, narrationSeconds = 0, { question = '', questionSeconds = 0 } = {}) {
  const lengths = slides.map(s => Math.max(12, clean(s.line).length));
  const totalChars = lengths.reduce((a, b) => a + b, 0) || 1;
  const spoken = narrationSeconds > 0 ? narrationSeconds : lengths.reduce((a, n) => a + Math.max(3.5, n / 15), 0);
  let at = RECAP_TITLE_SECONDS;
  const out = slides.map((s, i) => {
    const duration = narrationSeconds > 0 ? (spoken * lengths[i]) / totalChars : Math.max(3.5, lengths[i] / 15);
    const t = { start: at, duration };
    at += duration;
    return t;
  });
  const cliff = question
    ? { start: at, questionAt: at + RECAP_CLIFF_SILENCE, duration: Math.max(RECAP_CLIFF_SECONDS, RECAP_CLIFF_SILENCE + questionSeconds + 1.4) }
    : null;
  const endStart = cliff ? cliff.start + cliff.duration : at;
  return { slides: out, cliff, endStart, total: endStart + RECAP_END_SECONDS, narrationStart: RECAP_TITLE_SECONDS };
}

/**
 * The full narration script: the beats read one after another. With
 * `trailer`, each beat ends on an ellipsis, which the voice reads as the
 * long, heavy pause of a movie-trailer narrator.
 */
export function narrationScript(slides, { trailer = false } = {}) {
  const lines = slides.map(s => clean(s.line)).filter(Boolean);
  if (!trailer) return lines.join(' ');
  return lines.map(l => l.replace(/[.!]+$/, '') + (/[?]$/.test(l) ? '' : '…')).join(' ');
}
