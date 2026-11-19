// Planning for the table cinematics: boss intros and "Previously on…"
// recaps. Pure functions only — prompts, parsing, picking art and timing —
// so the smoke tests cover them without a browser or a network.

import { stripWikiLinks } from '../../utils/campaignMemory';
import { mentionedEntityIds, sessionNotesText } from '../../utils/storybookCast';

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
  return `A single dramatic cinematic illustration of this moment from the story: ${what} Wide shot, strong composition and lighting, with anyone it mentions clearly acting it out. No text, captions or speech bubbles.`;
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
    ? { start: at, questionAt: at + RECAP_CLIFF_SILENCE, duration: Math.max(RECAP_CLIFF_SECONDS, RECAP_CLIFF_SILENCE + RECAP_QUESTION_VOICE_DELAY + questionSeconds + 1.4) }
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

// The voice lines wait for the hit before them to ring out: "Previously on…"
// after the opening boom, the cliffhanger question after its slam.
export const RECAP_INTRO_VOICE_AT = 1.3;
export const RECAP_QUESTION_VOICE_DELAY = 0.7;

/**
 * How loud each trailer sound effect plays (0 to 1). The effects are long,
 * loud trailer hits, so any that lands while a voice is speaking (`voiced`)
 * plays far quieter; the ones in the clear keep their punch.
 */
export function recapCueVolume(moment, voiced = false) {
  const levels = {
    open: [0.6, 0.6], // the boom on the title card, before "Previously on…"
    firstBeat: [0.6, 0.22], // the slam as the first beat lands
    cut: [0.5, 0.14], // the whoosh on every later cut
    cast: [0.35, 0.35],
    montageStart: [0.7, 0.7],
    montageCut: [0.3, 0.3],
    question: [0.8, 0.8], // the slam the question lands on; its voice follows
    riser: [0.6, 0.28], // rises under the end of the spoken question
    end: [1, 1]
  }[moment];
  return levels ? levels[voiced ? 1 : 0] : 0;
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

// ── The animated cartoon recap ─────────────────────────────────────────────
//
// A third way to play a recap, kept beside the film and comic looks: the
// script is storyboarded into short shots (one or two per beat), each drawn
// and animated for the recap, the narrator is recorded one beat at a time so
// every cut lands on his words, and a character or two speaks a line in
// their own voice. It lives in recap.cartoon and never touches the slides.

export const CARTOON_MAX_SHOTS = 16;
export const CARTOON_MAX_LINES = 2;
// How much the characters talk: the most spoken lines a storyboard may write.
// "lots" leaves room for short exchanges between characters.
export const CARTOON_TALK = { little: CARTOON_MAX_LINES, some: 4, lots: 8 };

/**
 * A spoken line as a shot: a close-up of whoever says it, played right after
 * the beat it belongs to. Lines after the same beat play in order, so two or
 * three of them are a conversation, cutting from face to face.
 */
export function lineShot({ id, beat, speaker, line, ...rest }) {
  const who = clean(speaker);
  return {
    ...rest, id, kind: 'line', beat, speaker: who, line: clip(line, 140), featuring: [who],
    description: `Close-up of ${who}, mid-sentence, mouth open, speaking with feeling to someone just off screen.`, camera: 'close-up'
  };
}

/**
 * `shots` with a new spoken line added after `beat`: at the end of that
 * beat's shots, so it follows any lines already there.
 */
export function addLineShot(shots = [], { id, beat, speaker, line }) {
  const made = lineShot({ id, beat, speaker, line });
  let at = -1;
  shots.forEach((s, i) => { if (s.beat <= beat) at = i; });
  return [...shots.slice(0, at + 1), made, ...shots.slice(at + 1)];
}

/** `shots` with the spoken line `id` moved one place earlier (-1) or later (+1) among its own beat's lines. */
export function moveLineShot(shots = [], id, step) {
  const from = shots.findIndex(s => s.id === id);
  const to = from + step;
  const a = shots[from];
  const b = shots[to];
  if (!a || !b || a.kind !== 'line' || b.kind !== 'line' || a.beat !== b.beat) return shots;
  const out = [...shots];
  out[from] = b;
  out[to] = a;
  return out;
}
// A breath after each narrated beat, and around a spoken line.
export const CARTOON_BEAT_TAIL = 0.35;
export const CARTOON_LINE_LEAD = 0.25;
export const CARTOON_LINE_PAD = 0.7;

/**
 * Who was in the session a recap is about: the cast the storyboard may draw
 * from. The story chapter's own cast, anyone the session's notes name, and
 * anyone the recap script itself names (the DM has read those lines, so a
 * fallen character named there is there on purpose). A fallen character is
 * never added on the strength of the notes alone. If that leaves no living
 * party member, the whole living party stands in.
 */
export function recapSessionCast({ session, chapter, lines = [], characters = [], npcs = [], adversaries = [] } = {}) {
  const everyone = [...(characters || []), ...(npcs || []), ...(adversaries || [])].filter(e => e?.id);
  const ids = new Set(Object.keys(chapter?.castStates || {}));
  mentionedEntityIds({ characters, npcs, adversaries }, sessionNotesText(session)).forEach(id => ids.add(id));
  const script = lines.map(l => clean(l?.line ?? l)).join(' ');
  everyone.forEach(e => { if (nameForms(e.name).some(f => nameRe(f).test(script))) ids.add(e.id); });
  const living = (characters || []).filter(c => c?.id && !c.deceased);
  if (!living.some(c => ids.has(c.id))) living.forEach(c => ids.add(c.id));
  const keep = (list) => (list || []).filter(e => e?.id && ids.has(e.id));
  return { characters: keep(characters), npcs: keep(npcs), adversaries: keep(adversaries) };
}

/**
 * The prompt that turns a recap script into a shot list. `characters`, `npcs`
 * and `adversaries` are the session's cast (recapSessionCast), not the whole
 * campaign: a writer shown everyone uses everyone.
 */
export function buildStoryboardPrompt({ campaignName = '', beats = [], sources, characters = [], npcs = [], adversaries = [], maxLines = CARTOON_MAX_LINES, mode = 'recap' }) {
  // 'scene': a stand-alone cinematic the DM described (sources.scene), not a recap of a session.
  const scene = mode === 'scene';
  const sheet = (e, what) => `${clean(e.name)}${what ? ` (${what})` : ''}`;
  const fallen = (e) => (e.deceased ? 'FALLEN: dead' : '');
  const party = (characters || []).filter(c => c?.name).slice(0, 8)
    .map(c => sheet(c, [fallen(c), clean(c.ancestry), clean(c.characterClass || c.class), clip(c.appearanceDescription, 90)].filter(Boolean).join(', ')));
  const others = [
    ...(npcs || []).filter(n => n?.name).slice(0, 12).map(n => sheet(n, [fallen(n), clean(n.ancestry), clean(n.occupation), clip(n.description, 70)].filter(Boolean).join(', '))),
    ...(adversaries || []).filter(x => x?.name).slice(0, 8).map(x => sheet(x, [clean(x.role), clip(x.description, 70)].filter(Boolean).join(', ')))
  ];
  const sessions = scene ? [] : sources?.sessions || [];
  const last = sessions[sessions.length - 1];
  const before = sessions.length > 1 ? sessions[sessions.length - 2] : null;
  const quotes = (last?.highlights || []).slice(0, 8).map(h => `"${clip(h, 160)}"`);
  const happened = scene ? clip(sources?.scene, 3200) : clip(sessionNotesText(last) || last?.notes, 3200);
  const when = scene ? 'as the scene describes it' : 'as it happened last session';

  const opening = scene
    ? `You are storyboarding a short animated cinematic${campaignName ? ` for the tabletop RPG campaign "${campaignName}"` : ''}: a scene the DM plays on the big screen at a dramatic moment of the game. A narrator reads the script below, one beat at a time, while short animated shots play and the characters speak. Turn it into a shot list. Your job is to illustrate the script faithfully, not to add to the story.`
    : `You are storyboarding an animated "Previously on…" recap${campaignName ? ` for the tabletop RPG campaign "${campaignName}"` : ''}. A narrator reads the script below, one beat at a time, while short animated shots play. Turn it into a shot list. Your job is to illustrate the script faithfully, not to add to the story.`;
  return `${opening}

THE SCRIPT (one beat per line):
${beats.map((b, i) => `${i + 1}. ${clean(b.line ?? b)}`).join('\n')}

${scene ? 'WHO IS IN THIS SCENE' : 'WHO WAS THERE LAST SESSION'}
${party.length ? `The party (the players' own characters): ${party.join('; ')}.\n` : ''}${others.length ? `Others: ${others.join('; ')}.\n` : ''}Nobody else exists for this storyboard.
${happened ? `\n${scene ? 'THE SCENE THE DM ASKED FOR (use it for the detail of each beat)' : 'WHAT HAPPENED LAST SESSION (the recap is about this; use it for the detail of each beat)'}:\n${happened}\n` : ''}${before ? `\nEARLIER, for background only (never show these events):\n${clip(before.summary || before.notes, 500)}\n` : ''}${quotes.length ? `\nThings actually said at the table: ${quotes.join(' ')}\n` : ''}
Rules for "shots":
- One shot for a short beat, two for a beat of more than about 12 words. At most ${CARTOON_MAX_SHOTS} shots in all.
- Each shot illustrates its own beat and nothing else: the event that beat's words describe, ${when}. Never show an event from another beat${scene ? '' : ', from earlier sessions'}, or one that ${scene ? 'the script does not describe' : 'did not happen'}. Never invent a fight, a death, a meeting or a place.
- "from": the exact words of the beat that this shot illustrates.
- "description": what we SEE, in one sentence of up to 28 words: who, doing what, where. Name the characters. Show the action the beat describes, mid-motion. No text, captions or speech bubbles in the picture.
- "setting": where the shot takes place, in a few words ("a misty pine forest at dusk", "the throne room of the vampire king"). Take it from ${scene ? 'the scene' : 'what happened last session'}: never move the story somewhere it did not go. Use exactly the same words for every shot in the same place, and change them only when the story moves.
- "camera": the framing and move in a few words, varied from shot to shot: "wide establishing shot, slow push in", "close-up on her face", "low angle, tracking alongside", "over-the-shoulder".
- Who may be in a shot: a party member from the list above, and anyone else only if that beat's own line names them. Never add a character. If a beat names nobody and is about a place or a thing, show that place or thing with no people.
- Someone marked FALLEN is dead. They appear only in a beat whose own line names them.
- Make it flow like one cartoon: when a shot continues in the same place as the one before, say so ("the same dock, moments later…"), and keep each character's look and the time of day consistent.
- "featuring": the names of the characters in the shot, spelled exactly as above.
- These are original characters. Describe them only as they are described above: never borrow the look of a famous character who happens to share a name.

${howTheyTalk([...(characters || []), ...(npcs || [])])}
Rules for "lines" (characters who speak, between the narrator's beats):
- Up to ${maxLines} short lines, each under 14 words, each spoken by one living character from the lists above, right after the beat it belongs to.${maxLines > CARTOON_MAX_LINES ? `
- Lines after the same beat play one after another, in the order you give them. Use that for a short exchange of two or three lines between characters who were both there: one speaks, the other answers. Spread the rest across the beats; never more than three lines after one beat.` : ''}
- ${scene ? 'Write each line in that character\'s own voice: a reaction to what just happened in that beat, or an answer to the line before. Never a new fact the script does not hold.' : 'Prefer something actually said at the table. Otherwise write a short in-character reaction to what just happened in that beat: a reaction, never a new fact.'}
- If nothing fits, give an empty list.

Answer with JSON only:
{"shots": [{"beat": 1, "from": "...", "setting": "...", "description": "...", "camera": "...", "featuring": ["..."]}], "lines": [{"afterBeat": 3, "speaker": "...", "line": "..."}]}`;
}

/**
 * The shot list from the model's answer, in playing order: each beat's action
 * shots, then any line spoken after it. Every beat gets at least one shot
 * (its own narration line stands in when the model skipped it).
 * `stamp` keeps the ids apart from an earlier storyboard's. With `known`
 * (the campaign's own names), anyone else the model put in a shot is dropped
 * from its cast, and a line spoken by a stranger is dropped altogether.
 *
 * `guard` ({ rosters, cast }) holds the model to the session: a shot that
 * names someone from the campaign who should not be in it (anyone outside
 * the session's cast, or a fallen character or non-party member its own beat
 * does not name) is replaced by the beat's own words, and a line from someone
 * who was not there, or is dead, is dropped. `maxLines` is the most spoken
 * lines kept (never more than three after one beat).
 */
export function parseStoryboard(text, beats = [], stamp = '', known = [], guard = null, maxLines = CARTOON_MAX_LINES) {
  let data = {};
  try { data = JSON.parse(String(text || '').match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch { data = {}; }
  const beatAt = (n) => {
    const i = Math.round(Number(n)) - 1;
    return i >= 0 && i < beats.length ? i : -1;
  };
  const forms = known.flatMap(nameForms).map(f => f.toLowerCase());
  const isKnown = (name) => !forms.length || forms.includes(clean(name).toLowerCase()) || nameForms(name).some(f => forms.includes(f.toLowerCase()));
  const names = (list) => (Array.isArray(list) ? list.map(clean).filter(n => n && isKnown(n)).slice(0, 4) : []);
  const action = (Array.isArray(data.shots) ? data.shots : [])
    .map(s => ({ beat: beatAt(s?.beat), description: clip(s?.description, 320), camera: clip(s?.camera, 90), featuring: names(s?.featuring), ...(clean(s?.setting) ? { setting: clip(s.setting, 120) } : {}) }))
    .filter(s => s.beat >= 0 && s.description);
  const lines = (Array.isArray(data.lines) ? data.lines : [])
    .map(l => ({ beat: beatAt(l?.afterBeat), speaker: clean(l?.speaker), line: clip(l?.line, 140) }))
    .filter(l => l.beat >= 0 && l.speaker && l.line && isKnown(l.speaker));

  // Who the session allows in a beat's shots.
  const flat = (r) => [...(r?.characters || []).map(e => ({ e, pc: true })), ...(r?.npcs || []).map(e => ({ e })), ...(r?.adversaries || []).map(e => ({ e }))].filter(x => x.e?.id);
  const everyone = guard ? flat(guard.rosters) : [];
  const castIds = new Set(guard ? flat(guard.cast).map(x => x.e.id) : []);
  const namedIn = (e, where) => nameForms(e.name).some(f => nameRe(f).test(where));
  const beatLine = (i) => clean(beats[i]?.line ?? beats[i]);
  const mayAppear = ({ e, pc }, i) => castIds.has(e.id) && ((pc && !e.deceased) || namedIn(e, beatLine(i)));
  const intruders = (where, i) => everyone.filter(x => namedIn(x.e, where) && !mayAppear(x, i));
  const speaker = (name) => everyone.find(x => namedIn(x.e, ` ${name} `));

  const out = [];
  let room = CARTOON_MAX_SHOTS;
  let talk = Math.max(0, maxLines);
  beats.forEach((b, i) => {
    // Leave one shot for every beat still to come.
    const most = Math.max(1, Math.min(2, room - (beats.length - i - 1)));
    const own = action.filter(s => s.beat === i).slice(0, most)
      // Someone who should not be here: show what the narrator says, not what the model made up.
      .map(s => (guard && intruders(`${s.description} ${s.camera}`, i).length ? { beat: i, description: clip(b.line ?? b, 320), camera: s.camera && !intruders(s.camera, i).length ? s.camera : '', featuring: [], ...(s.setting && !intruders(s.setting, i).length ? { setting: s.setting } : {}) } : s));
    const list = own.length ? own : [{ beat: i, description: clip(b.line ?? b, 320), camera: '', featuring: [] }];
    list.forEach(s => out.push({ id: `${stamp}a${out.length}`, kind: 'action', ...s }));
    room -= list.length;
    lines.filter(l => l.beat === i).filter(l => {
      if (!guard) return true;
      const who = speaker(l.speaker);
      // A speaker has to have been there, and alive.
      return !!who && castIds.has(who.e.id) && !who.e.deceased;
    }).slice(0, Math.min(3, talk)).forEach(l => {
      out.push(lineShot({ id: `${stamp}l${out.length}`, beat: i, speaker: l.speaker, line: l.line }));
      talk -= 1;
    });
  });
  return out;
}

/**
 * The text that says who is in a shot: what it shows and how it is framed.
 * Not its "featuring" list: the storyboard tends to list the whole party on
 * a shot of an empty ruin, and drawing from that put them in the picture.
 */
export function cartoonShotText(shot) {
  return `${clean(shot?.description)} ${clean(shot?.camera)}`.trim();
}

// ── Where the story is ──
//
// Shots drawn one by one have no memory of each other: the party is in a
// forest in one and a castle hall in the next. So each beat has a setting, a
// few words for where it takes place, that goes into every one of its shots.
// A setting carries on to the beats after it until another is given: type
// "a misty pine forest" on beat 1 and "the king's castle" on beat 4.

/** Where a beat takes place: its own setting, or the nearest one given before it. */
export function beatSetting(cartoon, beat) {
  const settings = cartoon?.settings || {};
  for (let i = beat; i >= 0; i--) {
    const here = clean(settings[i]);
    if (here) return here;
  }
  return '';
}

/**
 * A setting as the image model is told it. When it names one of the
 * campaign's locations, that location's own description goes with it.
 */
export function settingText(setting, locations = []) {
  const where = clean(setting);
  if (!where) return '';
  const place = (locations || []).find(l => l?.name && clean(l.name).toLowerCase() === where.toLowerCase());
  const detail = place ? clip(place.description || place.notes, 220).replace(/[.\s]+$/, '') : '';
  return detail ? `${where} (${detail})` : where;
}

/** The per-beat settings a storyboard gave its shots, keeping only the beats where the place changes. */
export function settingsFromShots(shots = []) {
  const out = {};
  let last = '';
  shots.forEach(s => {
    const where = clean(s?.setting);
    if (!where || s.kind === 'line' || out[s.beat] !== undefined) return;
    if (where.toLowerCase() !== last.toLowerCase()) { out[s.beat] = where; last = where; }
  });
  return out;
}

/** Whether a drawn shot was drawn for somewhere other than where its beat now is. */
export function shotOutOfPlace(shot, setting) {
  const where = clean(setting);
  return !!shot?.imageUrl && !!where && clean(shot.drawnIn).toLowerCase() !== where.toLowerCase();
}

/** What to draw for a shot. `setting` is where its beat takes place, as settingText() words it. */
export function cartoonShotPrompt(shot, setting = '') {
  const what = clip(shot?.description, 400);
  const where = clean(setting);
  // Said first and said firmly: the description often mentions no place at all, and the model then picks its own.
  const place = where
    ? `Setting: ${clip(where, 320)}. The whole picture is in this place and nowhere else${shot?.kind === 'line' ? ', seen behind the speaker' : ''}. `
    : '';
  return `A single frame from an animated film. ${place}${shot?.camera ? `${clip(shot.camera, 90)}. ` : ''}${what} Widescreen 16:9 composition, cinematic lighting, the moment caught mid-motion. No text, captions or speech bubbles.`;
}

/** How a shot's still should move. */
export function cartoonMotionPrompt(shot) {
  if (shot?.kind === 'line') {
    return `${clean(shot.speaker)} talks to someone just off screen: lips moving as they speak, head and eyes alive with expression, a small gesture. Hold the close-up. Keep the exact art style, no text.`;
  }
  return `${shot?.camera ? `${clip(shot.camera, 90)}. ` : ''}${clip(shot?.description, 300)} Fluid cartoon animation: the characters move and act it out, the camera moves as described. Keep the exact art style, no text.`.slice(0, 480);
}

/** A voice for a speaker, the same one every time for the same name. */
export function voiceForSpeaker(name, voiceKeys = []) {
  if (!voiceKeys.length) return '';
  let hash = 0;
  for (const ch of clean(name).toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return voiceKeys[hash % voiceKeys.length];
}

// A voice from the DM's own ElevenLabs account is kept as "el:<voice id>".
export const ACCOUNT_VOICE_PREFIX = 'el:';

/**
 * The voice a speaker gets when the DM has not picked one for the line:
 * the voice saved on their character, NPC or adversary (an ElevenLabs voice
 * of the DM's own, or a built-in one), else a voice in the DM's ElevenLabs
 * account named after them, else one of the built-in character voices (the
 * same one every time). `accountVoices` is [{ id, name }].
 */
export function speakerVoiceKey(speaker, { characters = [], npcs = [], adversaries = [], accountVoices = [], presetKeys = [] } = {}) {
  const who = clean(speaker);
  const said = ` ${who} `;
  // Characters, NPCs and adversaries alike keep the voice saved on them (recapVoice).
  const person = [...(characters || []), ...(npcs || []), ...(adversaries || [])].find(e => e?.name && nameForms(e.name).some(f => nameRe(f).test(said)));
  const have = (id) => accountVoices.some(v => v.id === id);
  // The voice saved on the character; trusted as it is when the account's voices could not be listed.
  if (person?.recapVoice?.id && (have(person.recapVoice.id) || !accountVoices.length)) return `${ACCOUNT_VOICE_PREFIX}${person.recapVoice.id}`;
  // A built-in voice the DM chose for them.
  if (person?.recapVoice?.preset && presetKeys.includes(person.recapVoice.preset)) return person.recapVoice.preset;
  // "Pippin" finds a voice called "Pippin", "Pippin Puddle-Jumper" or "pippin (frog)"; and a voice called "Pippin" finds "Pippin Puddle-Jumper".
  const names = [...new Set([...(person ? nameForms(person.name) : []), ...nameForms(who)])];
  const match = accountVoices.find(v => names.some(n => nameRe(n).test(` ${clean(v.name)} `)))
    || accountVoices.find(v => nameForms(v.name).some(f => names.some(n => nameRe(f).test(` ${n} `))));
  if (match) return `${ACCOUNT_VOICE_PREFIX}${match.id}`;
  return voiceForSpeaker(who, presetKeys);
}

/**
 * The voice a line is spoken in: the DM's pick for that line (`voicePicked`),
 * else the speaker's own. Older storyboards stored the built-in default on
 * every line; that is not a pick, so such a line still gets the speaker's own
 * voice.
 */
export function lineVoiceKey(shot, voices = {}) {
  if (shot?.voicePicked && shot.voiceKey) return shot.voiceKey;
  const builtIn = voiceForSpeaker(shot?.speaker, voices.presetKeys || []);
  return shot?.voiceKey && shot.voiceKey !== builtIn ? shot.voiceKey : speakerVoiceKey(shot?.speaker, voices);
}

/** Whether a line's recording is still in the voice it should be. */
export function lineIsVoiced(shot, voices = {}) {
  if (!shot?.audioUrl) return false;
  const recordedIn = shot.voicedWith || shot.voiceKey || voiceForSpeaker(shot.speaker, voices.presetKeys || []);
  return recordedIn === lineVoiceKey(shot, voices);
}

/** Whether a beat's recorded narration still matches its words. */
const beatVoice = (recap, i, voice = recap?.cartoon?.voice) => {
  const take = voice?.beats?.[i];
  return take?.url && clean(take.line) === clean(recap?.slides?.[i]?.line) ? take : null;
};

/**
 * The narrator's takes that can still be used: none of them once the studio's
 * narrator (`recap.voiceKey`, when given) is no longer the one who read them.
 */
export function cartoonNarration(recap) {
  const voice = recap?.cartoon?.voice || {};
  return recap?.voiceKey && voice.voiceKey && voice.voiceKey !== recap.voiceKey ? {} : voice;
}

/** What "Shoot it" still has to make: narration takes, spoken lines, drawings and clips. */
export function cartoonNeeds(recap) {
  const shots = recap?.cartoon?.shots || [];
  const voice = cartoonNarration(recap);
  const beats = (recap?.slides || []).filter((s, i) => !beatVoice(recap, i, voice)).length;
  const question = recap?.question && clean(voice.question) !== clean(recap.question) ? 1 : 0;
  return {
    // `introText: ''` means the reel opens without a spoken line (a stand-alone cinematic).
    voice: beats + (voice.introUrl || recap?.introText === '' ? 0 : 1) + question + shots.filter(s => s.kind === 'line' && !s.audioUrl).length,
    draw: shots.filter(s => !s.imageUrl).length,
    animate: shots.filter(s => !s.videoUrl).length
  };
}

/**
 * The cartoon's timeline. Each beat lasts exactly as long as its own
 * narration take (so the picture changes when the narrator moves on), shared
 * between that beat's shots; a spoken line then plays over its own shot.
 * Returns { shots: [...shot, start, duration], voices: [{url, start}],
 * captions: [{beat, line, start, duration}], cliff, endStart, total, titleEnd }.
 */
export function cartoonPlan(recap) {
  const slides = recap?.slides || [];
  const all = recap?.cartoon?.shots || [];
  const voice = recap?.cartoon?.voice || {};
  const shots = [];
  const voices = [];
  const captions = [];
  let at = RECAP_TITLE_SECONDS;

  slides.forEach((slide, i) => {
    const take = beatVoice(recap, i);
    const seconds = (take ? take.duration : Math.max(3.5, clean(slide.line).length / 15)) + CARTOON_BEAT_TAIL;
    const own = all.filter(s => s.beat === i && s.kind !== 'line');
    // A beat with no shot of its own shows the picture chosen for it in the studio.
    const list = own.length ? own : [{ id: `slide-${i}`, kind: 'action', beat: i, imageUrl: slide.imageUrl || '', videoUrl: slide.videoUrl || '' }];
    if (take) voices.push({ url: take.url, start: at });
    captions.push({ beat: i, line: clean(slide.line), start: at, duration: seconds });
    list.forEach((s, k) => shots.push({ ...s, start: at + (k * seconds) / list.length, duration: seconds / list.length }));
    at += seconds;

    all.filter(s => s.beat === i && s.kind === 'line').forEach(s => {
      const said = s.audioUrl ? s.duration || 2 : Math.max(2, clean(s.line).split(' ').length / 2.6);
      const duration = CARTOON_LINE_LEAD + said + CARTOON_LINE_PAD;
      if (s.audioUrl) voices.push({ url: s.audioUrl, start: at + CARTOON_LINE_LEAD });
      shots.push({ ...s, start: at, duration });
      at += duration;
    });
  });

  const question = clean(recap?.question);
  const questionSeconds = question && clean(voice.question) === question ? voice.questionDuration || 0 : 0;
  const cliff = question
    ? { start: at, questionAt: at + RECAP_CLIFF_SILENCE, duration: Math.max(RECAP_CLIFF_SECONDS, RECAP_CLIFF_SILENCE + RECAP_QUESTION_VOICE_DELAY + questionSeconds + 1.4) }
    : null;
  if (cliff && questionSeconds && voice.questionUrl) voices.push({ url: voice.questionUrl, start: cliff.questionAt + RECAP_QUESTION_VOICE_DELAY });
  const endStart = cliff ? cliff.start + cliff.duration : at;
  // With no end card (`noEnd`), the reel just fades out.
  return { shots, voices, captions, cliff, endStart, total: endStart + (recap?.noEnd ? CINEMATIC_FADE_SECONDS : RECAP_END_SECONDS), titleEnd: RECAP_TITLE_SECONDS };
}

// ── Who is in a shot ───────────────────────────────────────────────────────
//
// A character's name means nothing to an image model, or worse, means someone
// famous: "Pippin" came back as the hobbit from The Lord of the Rings, not the
// campaign's rogue. So before a shot is drawn, every campaign character named
// in it is swapped for a plain label ("the rogue") and described from their
// sheet, tied to their reference portrait, and the model is told that those
// people and nobody else are in the picture.

const NAME_TITLES = ['the', 'lord', 'lady', 'sir', 'captain', 'master', 'king', 'queen', 'prince', 'princess', 'duke', 'duchess', 'baron', 'baroness', 'count', 'countess', 'emperor', 'empress', 'elder', 'high', 'dame', 'father', 'mother', 'brother', 'sister', 'saint', 'archmage', 'general', 'commander'];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The ways a name is written in a line: in full, and by first name when that is distinctive. */
function nameForms(name) {
  const full = clean(name);
  if (full.length < 3) return [];
  // "King Finius, the Elder Vampire King" is "Finius" in a line: drop the epithet after a comma, then the titles before the name.
  const words = full.split(',')[0].trim().split(' ');
  while (words.length > 1 && NAME_TITLES.includes(words[0].toLowerCase())) words.shift();
  const first = words[0];
  return first !== full && first.length >= 4 && !NAME_TITLES.includes(first.toLowerCase()) ? [full, first] : [full];
}
const nameRe = (form) => new RegExp(`(?<![A-Za-z])${escapeRe(form)}(?![A-Za-z])`, 'gi');

// In what is drawn, a name counts only where it is written as a name, with a
// capital: an NPC called "Grim" or "Hope" was put into any shot whose
// narration said "a grim silence" or "hope fades", and drawn from their portrait.
const startsUpper = (s) => /^\p{Lu}/u.test(String(s || ''));
const namedAsName = (form, text) => [...String(text || '').matchAll(nameRe(form))].some(m => startsUpper(m[0]));
const dropNamed = (form, text) => String(text || '').replace(nameRe(form), m => (startsUpper(m) ? ' ' : m));

/**
 * The campaign's people named in `text`, at most four, each with a label that
 * carries no outside meaning, how they look, and whether there is a portrait
 * to send as a reference (`ref` is its place among the reference images).
 * `ancestryLook(ancestry)` gives a visual phrase for a game ancestry.
 *
 * A first name counts only when one person answers to it: with "Bubbles" and
 * "Bubbles the Undead Seraph" both in the campaign, the word "Bubbles" means
 * the one whose whole name it is, and the other has to be named in full.
 *
 * `ids`, when given, is the DM's own choice of who is in the shot and
 * replaces what the text says (an empty list means nobody).
 */
export function shotCast(text, { characters = [], npcs = [], adversaries = [] } = {}, { ancestryLook = () => '', ids = null } = {}) {
  const line = clean(text);
  const everyone = [
    ...(characters || []).map(e => ({ e, type: 'character' })),
    ...(npcs || []).map(e => ({ e, type: 'npc' })),
    ...(adversaries || []).map(e => ({ e, type: 'adversary' }))
  ].filter(({ e }) => e?.id && e.name);
  // How many people each name or first name could mean.
  const claims = new Map();
  everyone.forEach(({ e }) => new Set(nameForms(e.name).map(f => f.toLowerCase())).forEach(f => claims.set(f, (claims.get(f) || 0) + 1)));
  // Whole names first, longest first, each struck from the line once found:
  // "Bubbles the Undead Seraph rises" names that one, and not plain "Bubbles" as well.
  const hit = new Set();
  let rest = line;
  [...everyone].sort((x, y) => clean(y.e.name).length - clean(x.e.name).length).forEach(({ e }) => {
    const [full] = nameForms(e.name);
    if (full && namedAsName(full, rest)) { hit.add(e.id); rest = dropNamed(full, rest); }
  });
  everyone.forEach(({ e }) => {
    const first = nameForms(e.name)[1];
    if (first && claims.get(first.toLowerCase()) === 1 && namedAsName(first, rest)) hit.add(e.id);
  });
  const found = (Array.isArray(ids)
    ? ids.map(id => everyone.find(x => x.e.id === id)).filter(Boolean)
    : everyone.filter(({ e }) => hit.has(e.id))
  ).slice(0, 4);

  const counts = {};
  let refs = 0;
  return found.map(({ e, type }) => {
    const job = clean(type === 'character' ? e.characterClass || e.class : type === 'npc' ? e.occupation : '');
    const base = (job || (type === 'adversary' ? clean(e.name) : type === 'character' ? 'adventurer' : 'local')).toLowerCase();
    counts[base] = (counts[base] || 0) + 1;
    const label = counts[base] === 1 ? `the ${base}` : `the ${['', '', 'second', 'third', 'fourth'][counts[base]]} ${base}`;
    const portrait = type === 'adversary' ? e.imageUrl : e.avatarUrl;
    // With a portrait, the portrait is how they look. The stock phrase for
    // their ancestry ("a mechanical automaton of gears and brass" for a Clank)
    // overruled it, and a Clank came back as a gold robot whatever the portrait
    // showed. It is only used for someone with no portrait to go by.
    const species = portrait ? '' : ancestryLook(e.ancestry) || clean(e.ancestry);
    const detail = clip(type === 'character' ? e.appearanceDescription : e.description, 200).replace(/[.\s]+$/, '');
    const look = [species, type === 'character' ? clean(e.subclass) : type === 'adversary' ? clean(e.role) : '', detail].filter(Boolean).join(', ');
    return { id: e.id, type, name: clean(e.name), forms: nameForms(e.name), label, look, ref: portrait ? ++refs : 0 };
  });
}

/**
 * The campaign's people a shot's text names who are not in its cast: the ones
 * the DM took out of the shot.
 */
export function shotAbsent(text, rosters = {}, cast = []) {
  const inShot = new Set(cast.map(c => c.id));
  return shotCast(text, rosters).filter(c => !inShot.has(c.id));
}

/**
 * `text` with each cast member's name swapped for their label. `absent` are
 * people the text names who are not in the shot (the DM took them out): a
 * bare name left in a prompt gets drawn anyway, so theirs becomes "someone unseen".
 */
export function withoutNames(text, cast = [], absent = []) {
  let out = String(text || '');
  // The people in the shot go first, so a name they share with someone absent stays theirs.
  if (absent.length) {
    const everyone = [...cast, ...absent.map(a => ({ forms: a.forms, label: 'someone unseen' }))];
    return withoutNames(out, everyone);
  }
  // Names become numbered marks first and labels last, so a label is never
  // itself mistaken for a name ("the skeleton knight" for "Skeleton").
  const mark = (i) => `\u0001${i}\u0001`;
  // A "the" before the name goes with it: the label brings its own.
  // Only where the name is written as one: "a grim silence" keeps its word.
  const swap = (form, i) => { out = out.replace(new RegExp(`(?:(?<![A-Za-z])the\\s+)?${nameRe(form).source}`, 'gi'), m => (startsUpper(m.replace(/^the\s+/i, '')) ? mark(i) : m)); };
  // Full names before first names, so "Pippin Underbough" is not left as "the rogue Underbough".
  cast.forEach((c, i) => swap(c.forms[0], i));
  cast.forEach((c, i) => c.forms.slice(1).forEach(f => swap(f, i)));
  cast.forEach((c, i) => { out = out.split(mark(i)).join(c.label); });
  // A sentence still starts with a capital.
  return out.replace(/(^|[.!?]\s+)the /g, '$1The ');
}

// Words that plainly put living beings in a shot, named or not. Kept narrow on
// purpose: "the tombs of forgotten kings" and "carved faces" are scenery.
const BEING_WORDS = /\b(?:he|she|they|someone|somebody|people|person|persons|man|men|woman|women|child|children|figures?|silhouettes?|crowds?|party|heroes|adventurers?|villagers?|townsfolk|guards?|soldiers?|knights?|warriors?|army|armies|troops?|bandits?|thieves|cultists?|sailors?|crew|prisoners?|creatures?|monsters?|beasts?|dragons?|demons?|goblins?|wolves|wolf|horses?|riders?)\b/i;

/**
 * Whether a shot is scenery: a place, drawn with nobody in it. A shot that
 * names someone from the campaign never is. Otherwise the DM's own choice
 * (`choice`: true or false) decides; without one, a shot is scenery unless
 * its text plainly mentions people or creatures.
 */
export function shotIsScenery(text, cast = [], choice = undefined) {
  if (cast.length) return false;
  if (choice === true || choice === false) return choice;
  return !BEING_WORDS.test(clean(text));
}

/**
 * A picture prompt the image model cannot misread: names swapped for labels,
 * then who each label is, and that nobody else is in the shot. With
 * `scenery`, the shot is a place and the prompt says it is empty.
 */
export function groundShotPrompt(prompt, cast = [], { scenery = false, absent = [] } = {}) {
  const base = withoutNames(prompt, cast, absent).trim();
  if (scenery && !cast.length) {
    return `${base} This is a shot of the place itself, deserted: architecture, landscape, light and weather only. No people, no characters, no creatures, no figures of any size anywhere in the frame.`;
  }
  if (!cast.length) {
    // A shot of a place stays a shot of a place: an image model fills an empty scene with adventurers unless told not to.
    return `${base} Nobody from the story is in this shot. Show only what the description says: if it mentions no person or creature, the scene is empty of people and creatures.`;
  }
  const who = cast.map(c => {
    const seen = c.ref ? `drawn exactly as in reference image ${c.ref}` : '';
    return c.look ? `${c.label} is ${c.look}${seen ? ` (${seen})` : ''}` : seen ? `${c.label} is ${seen}` : `${c.label} is one person, drawn the same way throughout`;
  }).join('; ');
  const count = cast.length === 1 ? 'Exactly one character appears' : `Exactly these ${cast.length} characters appear`;
  return `${base} Who is in the shot: ${who}. ${count}, and nobody else. They are original characters from this story: do not draw any famous or existing character.`;
}

// ── Stand-alone cinematics ─────────────────────────────────────────────────
//
// The same animated-cartoon reel as the recap, made from a moment the DM
// describes instead of a session: the AI writes the narrator's beats, the
// storyboard turns them into shots and spoken lines, and it is shot and played
// the same way. Saved in the campaign (see services/cinematicStore.js), ready to play.

export const CINEMATIC_FADE_SECONDS = 1.4;
export const CINEMATIC_LENGTHS = { short: 4, medium: 6, long: 8 };

/** The prompt that writes a cinematic's narration from the DM's description. */
export function buildCinematicPrompt({ campaignName = '', prompt = '', characters = [], npcs = [], adversaries = [], setting = '', beats = CINEMATIC_LENGTHS.medium }) {
  const sheet = (e, what) => `${clean(e.name)}${what ? ` (${what})` : ''}`;
  const cast = [
    ...(characters || []).filter(c => c?.name).map(c => sheet(c, [c.deceased ? 'FALLEN: dead' : '', 'player character', clean(c.ancestry), clean(c.characterClass || c.class), clip(c.appearanceDescription, 90)].filter(Boolean).join(', '))),
    ...(npcs || []).filter(n => n?.name).map(n => sheet(n, [clean(n.ancestry), clean(n.occupation), clip(n.description, 90)].filter(Boolean).join(', '))),
    ...(adversaries || []).filter(x => x?.name).map(x => sheet(x, [clean(x.role), clip(x.description, 90)].filter(Boolean).join(', ')))
  ];
  return `Write the narration for a short animated cinematic${campaignName ? ` in the tabletop RPG campaign "${campaignName}"` : ''}. The DM plays it on the big screen at a dramatic moment of the game, so it should land like the best scene of a fantasy film.

THE MOMENT THE DM WANTS:
${clip(prompt, 2500)}
${setting ? `\nWHERE IT HAPPENS: ${clip(setting, 200)}\n` : ''}${cast.length ? `\nWHO IS IN IT: ${cast.join('; ')}.\nNobody else is in this scene.\n` : ''}${howTheyTalk([...(characters || []), ...(npcs || [])])}
Rules:
- Exactly ${beats} beats, in order: set the scene, build, then the moment itself, and end on an image that hangs in the air.
- Each beat is one line the narrator reads: present tense, vivid and cinematic, 8 to 20 words, with a couple of very short punches for rhythm.
- Show what the DM described. Keep to it: do not add characters, deaths or twists it does not ask for.
- Name the characters in the lines where they act, spelled exactly as above.
- Leave the talking to the characters: the narrator describes, never quotes them.
- "title": a short, dramatic title for the scene (2 to 5 words).
- "setting": where it happens, in a few words, if the DM did not say.

Answer with JSON only: {"title": "...", "setting": "...", "beats": [{"line": "..."}]}`;
}

/** The title, setting and beats from the model's answer. */
export function parseCinematicScript(text) {
  let data = {};
  try { data = JSON.parse(String(text || '').match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch { data = {}; }
  const beats = (Array.isArray(data.beats) ? data.beats : [])
    .map(b => ({ line: clip(typeof b === 'string' ? b : b?.line, 220) }))
    .filter(b => b.line)
    .slice(0, CINEMATIC_LENGTHS.long + 2);
  return { title: clip(data.title, 60), setting: clip(data.setting, 120), beats };
}

/**
 * Who a cinematic is about, from the DM's description: the campaign's people
 * it names (the fallen too, since the DM named them on purpose).
 */
export function cinematicCastIds(prompt, { characters = [], npcs = [], adversaries = [] } = {}) {
  return shotCast(prompt, { characters, npcs, adversaries }).map(c => c.id).concat(
    // shotCast stops at four; a scene can hold more.
    [...(characters || []), ...(npcs || []), ...(adversaries || [])]
      .filter(e => e?.id && e.name && nameForms(e.name).some(f => namedAsName(f, ` ${clean(prompt)} `)))
      .map(e => e.id)
  ).filter((id, i, all) => all.indexOf(id) === i);
}

/** The reel data a cinematic plays with (CartoonReel). */
export function cinematicReel(cinematic, { campaignName = '', musicUrl = '' } = {}) {
  return {
    style: 'cartoon',
    kicker: campaignName || 'A cinematic',
    title: cinematic?.title || 'Untitled',
    slides: cinematic?.slides || [],
    question: '',
    introText: '',
    noEnd: true,
    cartoon: cinematic?.cartoon || null,
    // A cinematic written as a screenplay plays from it (screenplayPlan) instead of the narration beats.
    screenplay: cinematic?.format === 'screenplay' ? cinematic.screenplay || { lines: [] } : null,
    musicUrl,
    musicLevel: cinematic?.musicLevel ?? 0.6,
    sfxLevel: cinematic?.sfxLevel ?? 1
  };
}

// ── Cinematics as screenplays ──────────────────────────────────────────────
//
// A cinematic driven by narration beats felt like a recap with lines bolted
// on. As a screenplay, the scene is one ordered list of lines, each one shot:
//   action:   what we see ("Bubbles bursts through the stained glass.")
//   line:     a character speaks, to someone or to no one
//   narrator: an optional voice over the picture
// A character speaking to someone is filmed over the listener's shoulder, so
// an exchange cuts between the two faces like a film conversation, and the
// next line's voice starts a moment before its picture (a J-cut).

export const SCREENPLAY_LENGTHS = { short: 8, medium: 12, long: 18 };
export const SCREENPLAY_NARRATION = { none: 'No narrator', some: 'A little narration', lots: 'Narrated' };
export const SCREENPLAY_TIMING = { lead: 0.15, pad: 0.45, jcut: 0.3, action: 3.2, narratorTail: 0.35 };
export const SCREENPLAY_KINDS = ['line', 'action', 'narrator'];
export const SCREENPLAY_TRANSITIONS = { cut: 'Cut', dissolve: 'Dissolve', fade: 'Fade from black' };

/**
 * How a shot comes in, when the DM has not said: the first fades in from
 * black, a shot that carries on from the one before cuts straight in (the
 * movement continues), an answer in a conversation cuts to the other face,
 * and anything else dissolves.
 */
export function screenplayTransition(line, prev) {
  if (SCREENPLAY_TRANSITIONS[line?.transition]) return line.transition;
  if (!prev) return 'fade';
  if (line?.continues) return 'cut';
  if (line?.kind === 'line' && prev.kind === 'line') return 'cut';
  return 'dissolve';
}

/** Whether a shot that carries on from the one before was made from an older clip of that shot. */
export function continuityStale(lines = [], i) {
  const l = lines[i];
  return !!(l?.continues && i > 0 && l.imageUrl && l.fromClip !== lines[i - 1]?.videoUrl);
}

// Words that mean "the party" when a line names nobody: "four figures", "they", "the heroes".
const GROUP_WORDS = /\b(the party|the heroes|the companions|the adventurers|the group|the four|the three|the five|the two|figures|silhouettes|prisoners|captives|they|them|their|everyone|all of them|both of them|together)\b/i;

/** Whether a line talks about a group of people without naming them. */
export function mentionsGroup(text) {
  return GROUP_WORDS.test(String(text || ''));
}

/**
 * Who a screenplay line's picture shows, and how that was decided:
 * 'chosen' by the DM (line.cast, which may be empty for nobody), 'auto' for a
 * character line (speaker and listener), 'named' for the cast an action or
 * narrator line names, 'guessed' (the party) when it names nobody but speaks of
 * a group, or 'none'.
 */
export function screenplayShotCast(line, { idOf = () => null, namedIds = [], partyIds = [] } = {}) {
  if (Array.isArray(line?.cast)) return { ids: line.cast.filter(Boolean), how: 'chosen' };
  if (line?.kind === 'line') return { ids: [idOf(line.speaker), line.to ? idOf(line.to) : null].filter(Boolean), how: 'auto' };
  if (namedIds.length) return { ids: namedIds, how: 'named' };
  if (mentionsGroup(line?.text)) return { ids: partyIds.slice(0, 4), how: partyIds.length ? 'guessed' : 'none' };
  return { ids: [], how: 'none' };
}

/** A shot's picture or motion prompt with the DM's own note for it. */
export function withShotNote(prompt, note) {
  const said = clip(note, 240);
  return said ? `${prompt} Direction for this shot, which overrides anything above: ${said.replace(/[.\s]+$/, '')}.` : prompt;
}

/**
 * How the people in a scene talk, from their sheets: "Story Voice &
 * Personality" (storyVoice) and "Sample Lines" (voiceLines). Every AI writer
 * that gives a character something to say gets this, so their lines sound
 * like them. '' when nobody has either filled in.
 */
export function howTheyTalk(people = []) {
  const rows = (people || []).filter(e => e?.name && (clean(e.storyVoice) || clean(e.voiceLines))).slice(0, 12).map(e => {
    const lines = String(e.voiceLines || '').split(/\n+/).map(clean).filter(Boolean).slice(0, 4).map(l => (/^["“]/.test(l) ? l : `"${l}"`));
    return `- ${clean(e.name)}: ${[clip(e.storyVoice, 240), lines.length ? `Says things like: ${clip(lines.join(' '), 260)}` : ''].filter(Boolean).join(' ')}`;
  });
  return rows.length ? `\nHOW THEY TALK (write every line in its speaker's own voice, echoing the rhythm of their sample lines, not their exact words):\n${rows.join('\n')}\n` : '';
}

/** The prompt that writes a cinematic as a screenplay. */
export function buildScreenplayPrompt({ campaignName = '', prompt = '', characters = [], npcs = [], adversaries = [], setting = '', length = 'medium', narrator = 'some' }) {
  const sheet = (e, what) => `${clean(e.name)}${what ? ` (${what})` : ''}`;
  const cast = [
    ...(characters || []).filter(c => c?.name).map(c => sheet(c, [c.deceased ? 'FALLEN: dead' : '', 'player character', clean(c.ancestry), clean(c.characterClass || c.class), clip(c.appearanceDescription, 90)].filter(Boolean).join(', '))),
    ...(npcs || []).filter(n => n?.name).map(n => sheet(n, [clean(n.ancestry), clean(n.occupation), clip(n.description, 90)].filter(Boolean).join(', '))),
    ...(adversaries || []).filter(x => x?.name).map(x => sheet(x, [clean(x.role), clip(x.description, 90)].filter(Boolean).join(', ')))
  ];
  const count = SCREENPLAY_LENGTHS[length] || SCREENPLAY_LENGTHS.medium;
  const narration = {
    none: 'Do not use the narrator at all: the scene is told by what we see and what the characters say.',
    some: 'Use the narrator at most twice, briefly: to open the scene and/or to close it.',
    lots: 'The narrator may carry the story between moments, in up to a quarter of the lines.'
  }[narrator] || '';
  return `Write the screenplay for a short animated cinematic${campaignName ? ` in the tabletop RPG campaign "${campaignName}"` : ''}. The DM plays it on the big screen at a dramatic moment of the game, so it should play like the best scene of a fantasy film: characters talking to each other, reacting, and something happening.

THE MOMENT THE DM WANTS:
${clip(prompt, 2500)}
${setting ? `\nWHERE IT HAPPENS: ${clip(setting, 200)}\n` : ''}${cast.length ? `\nWHO IS IN IT: ${cast.join('; ')}.\nNobody else is in this scene.\n` : ''}${howTheyTalk([...(characters || []), ...(npcs || [])])}
Write about ${count} lines, in order. Each line is one shot of the film, and is one of:
- {"type": "action", "text": "...", "camera": "...", "continues": false}: what we SEE in one moment, 8 to 25 words, present tense, naming who acts. "camera" is the framing in a few words ("wide shot", "low angle on the king", "close on his hand"), varied from shot to shot. "continues": true only when this shot carries straight on from the shot before it, in the same place from the same angle, the movement unbroken.
- {"type": "line", "speaker": "...", "to": "...", "text": "..."}: one character speaks, under 18 words, in their own voice (see HOW THEY TALK where given). "to" is who they are talking to, or "" if no one.
- {"type": "narrator", "text": "..."}: a voice over the picture, 8 to 20 words.

Rules:
- Make the characters talk to each other: real exchanges of two to four lines in which each answers the one before, with action lines between them to show what happens.
- A character line is only the words they say out loud, never what they do; what anyone does is an action line.
- Every action and narrator line names each character it shows, by name ("Pippin and Xajax hang in chains"), never "the party", "they", "the heroes" or "figures" alone; a line that shows only a place names nobody.
- Open on an action that sets the scene, build, play the moment the DM described, and end on an image that hangs in the air.
- Keep to what the DM described. Do not add characters, deaths or twists it does not ask for.
- Only the people listed speak or appear, named exactly as above.
- ${narration}
- A line may carry "where" (a few words for the place) when the scene moves somewhere new; the first line always carries it.
- "title": a short, dramatic title (2 to 5 words). "setting": where it begins.

Answer with JSON only: {"title": "...", "setting": "...", "lines": [ ... ]}`;
}

/**
 * The screenplay from the model's answer. `castNames` are the people allowed
 * to speak: a line from anyone else is dropped, and "to" must be someone else
 * from the cast. `stamp` keeps line ids apart from an earlier draft's.
 */
export function parseScreenplay(text, { castNames = [], stamp = '' } = {}) {
  let data = {};
  try { data = JSON.parse(String(text || '').match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch { data = {}; }
  const allowed = castNames.map(n => clean(n));
  // "Pippin" finds "Pippin Puddle-Jumper"; the cast's own spelling is kept.
  const who = (name) => {
    const said = clean(name);
    if (!said) return '';
    if (!allowed.length) return said;
    return allowed.find(n => n.toLowerCase() === said.toLowerCase())
      || allowed.find(n => nameForms(n).some(f => f.toLowerCase() === said.toLowerCase()))
      || allowed.find(n => nameForms(said).some(f => nameForms(n).some(g => g.toLowerCase() === f.toLowerCase())))
      || '';
  };
  const lines = [];
  (Array.isArray(data.lines) ? data.lines : []).forEach(l => {
    const kind = { action: 'action', line: 'line', dialogue: 'line', narrator: 'narrator' }[clean(l?.type).toLowerCase()];
    const body = clip(l?.text, kind === 'line' ? 160 : 240);
    if (!kind || !body) return;
    const out = { id: `${stamp}p${lines.length}`, kind, text: body };
    // A "line" that only describes what happens is an action.
    if (kind === 'line' && lineReadsAsAction({ kind, text: body, speaker: who(l.speaker) || clean(l.speaker), to: who(l.to) || clean(l.to) })) {
      out.kind = 'action';
    } else if (kind === 'line') {
      const speaker = who(l.speaker);
      if (!speaker) return;
      const to = who(l.to);
      Object.assign(out, { speaker, to: to && to !== speaker ? to : '' });
    }
    if (out.kind === 'action' && clean(l?.camera)) out.camera = clip(l.camera, 90);
    if (out.kind === 'action' && l?.continues === true && lines.length) out.continues = true;
    if (clean(l?.where)) out.where = clip(l.where, 120);
    lines.push(out);
  });
  const capped = lines.slice(0, 24);
  const setting = clip(data.setting, 120);
  if (capped.length && !capped[0].where && setting) capped[0] = { ...capped[0], where: setting };
  return { title: clip(data.title, 60), setting, lines: capped };
}

/** Where a line takes place: its own "where", or the nearest one before it. */
export function lineWhere(lines = [], i) {
  for (let k = i; k >= 0; k--) {
    const here = clean(lines[k]?.where);
    if (here) return here;
  }
  return '';
}

/** A screenplay line as the shot that is drawn and animated for it. */
// Words someone uses when talking: "I", "you", "we"...
const SPOKEN_WORDS = /\b(i|i'm|i've|i'll|i'd|me|my|mine|myself|we|we're|we'll|us|our|ours|you|you're|you'll|your|yours|yourself)\b/i;

/**
 * A character line that is really stage directions ("Finius tears open his
 * wrist, flooding Emmanita's mouth with blood"): no "I" or "you", no question,
 * and it talks about the speaker or listener by name or as he, she or they.
 * It is filmed as what it describes, and the editor offers to make it an action.
 */
export function lineReadsAsAction(line) {
  if (line?.kind !== 'line') return false;
  const text = clean(line.text);
  if (!text || /["\u201c\u201d?]/.test(text) || SPOKEN_WORDS.test(text)) return false;
  const forms = [line.speaker, line.to].filter(Boolean).flatMap(n => nameForms(n));
  return forms.some(f => nameRe(f).test(text)) || /^(he|she|they|his|her|their)\b/i.test(text);
}

export function screenplayShot(line) {
  if (lineReadsAsAction(line)) return { kind: 'action', description: clean(line.text), camera: '' };
  if (line?.kind === 'line') {
    const speaker = clean(line.speaker);
    const listener = clean(line.to);
    return listener
      ? { kind: 'line', speaker, listener, camera: 'over-the-shoulder',
        description: `Over-the-shoulder shot from behind ${listener}, who is in the near foreground with their back to us, looking at ${speaker}, who faces the camera and speaks to them with feeling, mid-sentence.` }
      : { kind: 'line', speaker, camera: 'close-up', description: `Close-up of ${speaker}, mid-sentence, speaking with feeling.` };
  }
  return { kind: 'action', description: clean(line?.text), camera: clean(line?.camera) };
}

/** How a screenplay shot's still should move. */
export function screenplayMotionPrompt(shot) {
  if (shot?.kind === 'line' && shot.listener) {
    return `${shot.speaker} talks to ${shot.listener}: lips moving as they speak, face alive with expression, a small gesture. ${shot.listener}, seen from behind in the near foreground, listens and barely moves. Hold the framing. Keep the exact art style, no text.`;
  }
  return cartoonMotionPrompt(shot);
}

/**
 * The screenplay's timeline, in the shape cartoonPlan() gives (so CartoonReel
 * plays it): a character's line lasts as long as its recording, a narrator's
 * line as long as his, an action line a few seconds. When one character line
 * follows another, its voice starts a moment before its picture.
 */
export function screenplayPlan(recap) {
  const lines = recap?.screenplay?.lines || [];
  const T = SCREENPLAY_TIMING;
  // The DM can hold a spoken shot on screen a little longer after the words.
  const hold = (l) => Math.max(0, Math.min(6, Number(l.hold) || 0));
  const shots = [];
  const voices = [];
  const captions = [];
  let at = RECAP_TITLE_SECONDS;
  lines.forEach((l, i) => {
    const text = clean(l.text);
    let duration;
    if (l.kind === 'line') {
      const said = l.audioUrl ? l.duration || 2 : Math.max(1.6, text.split(' ').length / 2.6);
      duration = T.lead + said + T.pad + hold(l);
      const jcut = i > 0 && lines[i - 1]?.kind === 'line' ? T.jcut : 0;
      if (l.audioUrl) voices.push({ url: l.audioUrl, start: at + T.lead - jcut });
    } else if (l.kind === 'narrator') {
      const said = l.audioUrl ? l.duration || 3 : Math.max(2.5, text.length / 15);
      duration = said + T.narratorTail + hold(l);
      if (l.audioUrl) voices.push({ url: l.audioUrl, start: at });
      captions.push({ beat: i, line: text, start: at, duration });
    } else {
      duration = Math.max(1.5, Math.min(8, Number(l.seconds) || T.action));
    }
    const shot = screenplayShot(l);
    shots.push({
      id: l.id, kind: shot.kind, beat: i, speaker: shot.speaker || '', line: l.kind === 'line' ? text : '',
      imageUrl: l.imageUrl || '', videoUrl: l.videoUrl || '', start: at, duration,
      transition: screenplayTransition(l, lines[i - 1]),
      // The next shot starts on this clip's last frame, so this clip must reach it before the cut.
      endsOnClip: !!lines[i + 1]?.continues
    });
    at += duration;
  });
  const endStart = at;
  return { shots, voices, captions, cliff: null, endStart, total: endStart + (recap?.noEnd ? CINEMATIC_FADE_SECONDS : RECAP_END_SECONDS), titleEnd: RECAP_TITLE_SECONDS };
}

/**
 * What "Shoot it" still has to make for a screenplay. `voiced(line)` says
 * whether a line's recording is still good (its words, speaker and voice).
 */
export function screenplayNeeds(screenplay, voiced = (l) => !!l.audioUrl) {
  const lines = screenplay?.lines || [];
  return {
    voice: lines.filter(l => (l.kind === 'line' || l.kind === 'narrator') && !voiced(l)).length,
    draw: lines.filter(l => !l.imageUrl).length,
    animate: lines.filter(l => !l.videoUrl).length
  };
}
