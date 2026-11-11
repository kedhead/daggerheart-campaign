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

// ── Boss phase transitions ───────────────────────────────────────────────────

// How long each part of a phase transition lasts on the monitor.
export const PHASE_STILL_SECONDS = 2.4;      // a portrait with no clip shakes this long before the name lands
export const PHASE_VIDEO_MAX_SECONDS = 12;   // a clip that never reports its end is cut here
export const PHASE_HOLD_SECONDS = 3.4;       // the new phase's name stays up this long

/** A phase's number as the phase editor shows it: the first phase is the boss as it starts, so these count from 2. */
export function phaseNumber(phases = [], phaseId) {
  const sorted = [...(phases || [])].filter(Boolean).sort((a, b) => (b.triggerPercent ?? 0) - (a.triggerPercent ?? 0));
  const i = sorted.findIndex(p => p.id === phaseId);
  return (i < 0 ? 0 : i) + 2;
}

/** How the boss should move in its phase transition clip. */
export function buildPhaseMotionPrompt(entity, phase) {
  const name = clip(entity?.name, 60) || 'The boss';
  const into = clip(phase?.name, 60);
  const what = clip(phase?.description, 260);
  return [
    `Boss phase transformation: ${name}${into ? ` becomes "${into}"` : ' powers up'}.`,
    what,
    'Dramatic full-body transformation with real movement: the figure roars and surges with new power, its form changing, energy, fire or shadow and debris erupting around it, while the camera pushes in.',
    'Keep the exact character design, art style and colours of the source image, no text.'
  ].filter(Boolean).join(' ').slice(0, 500);
}

/**
 * Everything the monitor needs for a phase transition. The clip is read from
 * the adversary's own copy of the phase, so one made after the fight started
 * still plays.
 */
export function phaseShiftFromBoss({ adversary, phase, bossName = '' }) {
  const phases = adversary?.phases?.length ? adversary.phases : [phase];
  const live = (adversary?.phases || []).find(p => p.id === phase?.id) || phase || {};
  return {
    name: clip(live.name || phase?.name, 60) || 'Next Phase',
    bossName: clip(bossName || adversary?.name, 60),
    tag: `Phase ${phaseNumber(phases, phase?.id)}`,
    line: clip(live.description || phase?.description, 140),
    imageUrl: adversary?.imageUrl || '',
    videoUrl: live.videoUrl || phase?.videoUrl || '',
    accent: introAccent(adversary, 'adversary')
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
 * The picture each beat shows: the one chosen for it in the studio, and
 * nothing else. (The reel used to fill extra comic panels beside it with
 * other campaign art, which put pictures on screen nobody had picked.)
 */
export function panelImages(slides) {
  return slides.map(s => (s.imageUrl ? [s.imageUrl] : []));
}

/**
 * The chapters whose art a session's recap uses: that session's own, never an
 * older one's. (The script reads the session before it too, for context, but
 * its pictures belong to last week's recap.)
 */
export function recapArtChapters(session, chapters = []) {
  if (!session?.id) return [];
  const own = (chapters || []).filter(c => c?.sessionId === session.id);
  const published = own.filter(c => c.status === 'published');
  return published.length ? published : own;
}

/** The art a recap may show, this session's first; older chapters only when asked for. */
export function recapGallery({ session, chapters = [], npcs = [], characters = [], adversaries = [] }) {
  const seen = new Set();
  const groups = { session: [], portraits: [], older: [] };
  const add = (group, url, label) => { if (url && !seen.has(url)) { seen.add(url); groups[group].push({ url, label }); } };
  const own = new Set(recapArtChapters(session, chapters).map(c => c.id));
  (chapters || []).filter(c => own.has(c.id)).forEach(c => (c.scenes || []).forEach(sc => add('session', sc.imageUrl, c.title)));
  [...(npcs || []), ...(characters || [])].forEach(e => add('portraits', e?.avatarUrl, e?.name));
  (adversaries || []).forEach(a => add('portraits', a?.imageUrl, a?.name));
  (chapters || []).filter(c => !own.has(c.id)).forEach(c => (c.scenes || []).forEach(sc => add('older', sc.imageUrl, c.title)));
  return groups;
}

/** Who a recap line is about, for a new shot's reference portraits: ids of the characters, NPCs and adversaries it names. */
export function featuredInLine(line, { characters = [], npcs = [], adversaries = [] } = {}) {
  const text = ` ${clean(line).toLowerCase()} `;
  const named = (name) => {
    const full = String(name || '').toLowerCase().trim();
    if (full.length < 3) return false;
    if (text.includes(full)) return true;
    // "Pippin" for "Pippin Underbough"; skip short or common first words.
    const first = full.split(/\s+/)[0];
    return first.length >= 4 && !['the', 'lord', 'lady', 'sir', 'captain', 'master'].includes(first)
      && new RegExp(`[^a-z]${first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z]`).test(text);
  };
  return [...(characters || []), ...(npcs || []), ...(adversaries || [])]
    .filter(e => e?.id && named(e.name))
    .map(e => e.id)
    .slice(0, 4);
}

/** The prompt for a fresh recap shot. */
export function recapShotPrompt(description) {
  const what = clip(description, 400);
  return `A single dramatic cinematic illustration of this moment from the story: ${what} Wide shot, strong composition and lighting, the characters clearly acting it out. No text, captions or speech bubbles.`;
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

/**
 * Whether a picture is close enough to the screen's shape to fill it. Art
 * shaped unlike the screen (square or tall art on a wide monitor) would lose
 * heads and feet stretched over it, so the reel frames that as a comic panel.
 * Both arguments are width / height.
 */
export function recapArtFills(ratio, screen = 16 / 9) {
  return ratio >= screen * 0.8 && ratio <= screen * 1.3;
}

export const RECAP_TITLE_SECONDS = 3.2;
export const RECAP_END_SECONDS = 3.6;
// The cliffhanger: the music cuts, a beat of black silence, then the question.
export const RECAP_CLIFF_SILENCE = 0.9;
export const RECAP_CLIFF_SECONDS = 3.6;

// The cast roll: how long each "Starring…" card holds.
export const RECAP_CAST_SECONDS = 1.6;
export const RECAP_CAST_MAX = 6;

/** Everyone who can have a "Starring…" card: player characters with a portrait. */
export function recapCast(characters = []) {
  return (characters || [])
    .filter(c => c?.name && c.avatarUrl)
    .map(c => ({ id: c.id, name: clean(c.name), playerName: clean(c.playerName), imageUrl: c.avatarUrl }));
}

/** Tonight's cards: the cast without the players who are away (by character id), up to the most the roll shows. */
export function recapStarring(cast = [], away = []) {
  const out = new Set(away || []);
  return (cast || []).filter(c => !out.has(c.id)).slice(0, RECAP_CAST_MAX);
}

/**
 * Whether a line is short enough to stand alone as a trailer text card
 * ("One prison." / "Then the floor gave way.") in place of a subtitle.
 */
export function recapCardLine(line) {
  const words = clean(line).split(' ').filter(Boolean).length;
  return words > 0 && words <= 5;
}

/**
 * The quick-cut montage that ends a film recap: every shot again, each cut
 * shorter than the last. Needs at least three pictures; a short reel goes
 * round twice. Returns [{ shot, start, duration }], start from the montage's own zero.
 */
export function montageCuts(shots) {
  if (!(shots >= 3)) return [];
  const count = Math.min(10, shots >= 6 ? shots : shots * 2);
  let at = 0;
  return Array.from({ length: count }, (_, k) => {
    const duration = 0.44 - 0.26 * (k / (count - 1));
    const cut = { shot: k % shots, start: at, duration };
    at += duration;
    return cut;
  });
}

/**
 * When each slide starts and how long it lasts. With narration the spoken
 * time is shared out by line length (people read long lines for longer);
 * without, each line gets a reading pace. `cast` is how many "Starring…"
 * cards play between the title and the first beat, `montage` how many
 * pictures the closing quick-cut montage has to work with (0 for none).
 */
export function recapTimings(slides, narrationSeconds = 0, { question = '', questionSeconds = 0, cast = 0, montage = 0 } = {}) {
  const lengths = slides.map(s => Math.max(12, clean(s.line).length));
  const totalChars = lengths.reduce((a, b) => a + b, 0) || 1;
  const spoken = narrationSeconds > 0 ? narrationSeconds : lengths.reduce((a, n) => a + Math.max(3.5, n / 15), 0);
  const titleEnd = RECAP_TITLE_SECONDS;
  const castCount = Math.min(RECAP_CAST_MAX, Math.max(0, cast));
  const narrationStart = titleEnd + castCount * RECAP_CAST_SECONDS;
  let at = narrationStart;
  const out = slides.map((s, i) => {
    const duration = narrationSeconds > 0 ? (spoken * lengths[i]) / totalChars : Math.max(3.5, lengths[i] / 15);
    const t = { start: at, duration };
    at += duration;
    return t;
  });
  const cuts = montageCuts(montage);
  const quick = cuts.length ? { start: at, duration: cuts[cuts.length - 1].start + cuts[cuts.length - 1].duration, cuts } : null;
  if (quick) at += quick.duration;
  const cliff = question
    ? { start: at, questionAt: at + RECAP_CLIFF_SILENCE, duration: Math.max(RECAP_CLIFF_SECONDS, RECAP_CLIFF_SILENCE + questionSeconds + 1.4) }
    : null;
  const endStart = cliff ? cliff.start + cliff.duration : at;
  return {
    slides: out,
    cast: castCount ? { start: titleEnd, each: RECAP_CAST_SECONDS, count: castCount } : null,
    montage: quick,
    cliff,
    endStart,
    total: endStart + RECAP_END_SECONDS,
    titleEnd,
    narrationStart
  };
}

/**
 * How loud the music plays, as a share of the level the DM set. Tracks are
 * mastered far louder than speech, so under any voice (the narrator, or the
 * "Previously on…" line over the title) it drops right back.
 */
export function recapMusicFactor({ speaking = false, montage = false } = {}) {
  if (montage) return 0.85;
  return speaking ? 0.12 : 0.55;
}

/** The whole timeline of a recap as it is sent to the monitor: film recaps end on the montage, and a cast list adds its cards. */
export function recapPlan(recap) {
  const slides = recap?.slides || [];
  return recapTimings(slides, recap?.narration?.duration || 0, {
    question: recap?.question || '',
    questionSeconds: recap?.narration?.questionDuration || 0,
    cast: recap?.cast?.length || 0,
    montage: recap?.style === 'film' ? slides.filter(sl => sl.imageUrl).length : 0
  });
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
