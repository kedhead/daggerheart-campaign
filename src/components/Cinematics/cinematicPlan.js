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
// A breath after each narrated beat, and around a spoken line.
export const CARTOON_BEAT_TAIL = 0.35;
export const CARTOON_LINE_LEAD = 0.25;
export const CARTOON_LINE_PAD = 0.7;

/** The prompt that turns a recap script into a shot list. */
export function buildStoryboardPrompt({ campaignName = '', beats = [], sources, characters = [], npcs = [] }) {
  const quotes0 = (sources?.sessions || []).flatMap(s => s?.highlights || []);
  const told = [...beats.map(b => clean(b.line ?? b)), ...(sources?.sessions || []).map(s => clean(s?.summary || s?.notes)), ...quotes0.map(clean)].join(' ');
  const inStory = (e) => nameForms(e?.name).some(f => nameRe(f).test(told));
  const sheet = (e, what) => `${clean(e.name)}${what ? ` (${what})` : ''}`;
  const party = (characters || []).filter(c => c?.name).slice(0, 8)
    .map(c => sheet(c, [clean(c.ancestry), clean(c.characterClass || c.class), clip(c.appearanceDescription, 90)].filter(Boolean).join(', ')));
  // Only people the script or the session actually mentions: a list of everyone in the world invites the model to add them.
  const others = (npcs || []).filter(n => n?.name && inStory(n)).slice(0, 12)
    .map(n => sheet(n, [clean(n.ancestry), clean(n.occupation), clip(n.description, 70)].filter(Boolean).join(', ')));
  const quotes = (sources?.sessions || []).flatMap(s => s?.highlights || []).slice(0, 8).map(h => `"${clip(h, 160)}"`);
  const story = (sources?.sessions || []).map(s => clip(s?.summary || s?.notes, 1800)).filter(Boolean).join('\n\n');

  return `You are storyboarding an animated "Previously on…" recap${campaignName ? ` for the tabletop RPG campaign "${campaignName}"` : ''}. A narrator reads the script below, one beat at a time, while short animated shots play. Turn it into a shot list.

THE SCRIPT (one beat per line):
${beats.map((b, i) => `${i + 1}. ${clean(b.line ?? b)}`).join('\n')}

${party.length ? `The party (the players' own characters): ${party.join('; ')}.\n` : ''}${others.length ? `Other people in this story: ${others.join('; ')}.\n` : ''}${story ? `\nWHAT HAPPENED (for detail only):\n${story}\n` : ''}${quotes.length ? `\nThings actually said at the table: ${quotes.join(' ')}\n` : ''}
Rules for "shots":
- One shot for a short beat, two for a beat of more than about 12 words. At most ${CARTOON_MAX_SHOTS} shots in all.
- "description": what we SEE, in one sentence of up to 28 words: who, doing what, where. Name the characters. Show the action the beat describes, mid-motion. No text, captions or speech bubbles in the picture.
- "camera": the framing and move in a few words, varied from shot to shot: "wide establishing shot, slow push in", "close-up on her face", "low angle, tracking alongside", "over-the-shoulder".
- Make it flow like one cartoon: when a shot continues in the same place as the one before, say so ("the same dock, moments later…"), and keep each character's look and the time of day consistent.
- "featuring": the names of the characters in the shot, spelled exactly as above.
- Use only what the script and the events above say happened.
- Never add a character. Only people the beat itself is about may be in its shots, and only people listed above may be named. If a beat names nobody, show the place or the thing it describes, with no people, or the party as a group.
- These are original characters. Describe them only as they are described above: never borrow the look of a famous character who happens to share a name.

Rules for "lines" (characters who speak, between the narrator's beats):
- Up to ${CARTOON_MAX_LINES} short lines, each under 14 words, each spoken by one named character right after the beat it belongs to.
- Prefer something actually said at the table. Otherwise write a short in-character reaction to what just happened in that beat: a reaction, never a new fact.
- If nothing fits, give an empty list.

Answer with JSON only:
{"shots": [{"beat": 1, "description": "...", "camera": "...", "featuring": ["..."]}], "lines": [{"afterBeat": 3, "speaker": "...", "line": "..."}]}`;
}

/**
 * The shot list from the model's answer, in playing order: each beat's action
 * shots, then any line spoken after it. Every beat gets at least one shot
 * (its own narration line stands in when the model skipped it).
 * `stamp` keeps the ids apart from an earlier storyboard's. With `known`
 * (the campaign's own names), anyone else the model put in a shot is dropped
 * from its cast, and a line spoken by a stranger is dropped altogether.
 */
export function parseStoryboard(text, beats = [], stamp = '', known = []) {
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
    .map(s => ({ beat: beatAt(s?.beat), description: clip(s?.description, 320), camera: clip(s?.camera, 90), featuring: names(s?.featuring) }))
    .filter(s => s.beat >= 0 && s.description);
  const lines = (Array.isArray(data.lines) ? data.lines : [])
    .map(l => ({ beat: beatAt(l?.afterBeat), speaker: clean(l?.speaker), line: clip(l?.line, 140) }))
    .filter(l => l.beat >= 0 && l.speaker && l.line && isKnown(l.speaker))
    .slice(0, CARTOON_MAX_LINES);

  const out = [];
  let room = CARTOON_MAX_SHOTS;
  beats.forEach((b, i) => {
    // Leave one shot for every beat still to come.
    const most = Math.max(1, Math.min(2, room - (beats.length - i - 1)));
    const own = action.filter(s => s.beat === i).slice(0, most);
    const list = own.length ? own : [{ beat: i, description: clip(b.line ?? b, 320), camera: '', featuring: [] }];
    list.forEach(s => out.push({ id: `${stamp}a${out.length}`, kind: 'action', ...s }));
    room -= list.length;
    lines.filter(l => l.beat === i).forEach(l => out.push({
      id: `${stamp}l${out.length}`, kind: 'line', beat: i, speaker: l.speaker, line: l.line, featuring: [l.speaker],
      description: `Close-up of ${l.speaker}, mid-sentence, mouth open, speaking with feeling to someone just off screen.`, camera: 'close-up'
    }));
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

/** What to draw for a shot. */
export function cartoonShotPrompt(shot) {
  const what = clip(shot?.description, 400);
  return `A single frame from an animated film: ${shot?.camera ? `${clip(shot.camera, 90)}. ` : ''}${what} Widescreen 16:9 composition, cinematic lighting, the moment caught mid-motion. No text, captions or speech bubbles.`;
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
    voice: beats + (voice.introUrl ? 0 : 1) + question + shots.filter(s => s.kind === 'line' && !s.audioUrl).length,
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
  return { shots, voices, captions, cliff, endStart, total: endStart + RECAP_END_SECONDS, titleEnd: RECAP_TITLE_SECONDS };
}

// ── Who is in a shot ───────────────────────────────────────────────────────
//
// A character's name means nothing to an image model, or worse, means someone
// famous: "Pippin" came back as the hobbit from The Lord of the Rings, not the
// campaign's rogue. So before a shot is drawn, every campaign character named
// in it is swapped for a plain label ("the rogue") and described from their
// sheet, tied to their reference portrait, and the model is told that those
// people and nobody else are in the picture.

const NAME_TITLES = ['the', 'lord', 'lady', 'sir', 'captain', 'master'];
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The ways a name is written in a line: in full, and by first name when that is distinctive. */
function nameForms(name) {
  const full = clean(name);
  if (full.length < 3) return [];
  const first = full.split(' ')[0];
  return first !== full && first.length >= 4 && !NAME_TITLES.includes(first.toLowerCase()) ? [full, first] : [full];
}
const nameRe = (form) => new RegExp(`(?<![A-Za-z])${escapeRe(form)}(?![A-Za-z])`, 'gi');

/**
 * The campaign's people named in `text`, at most four, each with a label that
 * carries no outside meaning, how they look, and whether there is a portrait
 * to send as a reference (`ref` is its place among the reference images).
 * `ancestryLook(ancestry)` gives a visual phrase for a game ancestry.
 */
export function shotCast(text, { characters = [], npcs = [], adversaries = [] } = {}, { ancestryLook = () => '' } = {}) {
  const line = clean(text);
  const found = [
    ...(characters || []).map(e => ({ e, type: 'character' })),
    ...(npcs || []).map(e => ({ e, type: 'npc' })),
    ...(adversaries || []).map(e => ({ e, type: 'adversary' }))
  ].filter(({ e }) => e?.id && nameForms(e.name).some(f => nameRe(f).test(line))).slice(0, 4);

  const counts = {};
  let refs = 0;
  return found.map(({ e, type }) => {
    const job = clean(type === 'character' ? e.characterClass || e.class : type === 'npc' ? e.occupation : '');
    const base = (job || (type === 'adversary' ? clean(e.name) : type === 'character' ? 'adventurer' : 'local')).toLowerCase();
    counts[base] = (counts[base] || 0) + 1;
    const label = counts[base] === 1 ? `the ${base}` : `the ${['', '', 'second', 'third', 'fourth'][counts[base]]} ${base}`;
    const species = ancestryLook(e.ancestry) || clean(e.ancestry);
    const detail = clip(type === 'character' ? e.appearanceDescription : e.description, 200).replace(/[.\s]+$/, '');
    const look = [species, type === 'character' ? clean(e.subclass) : type === 'adversary' ? clean(e.role) : '', detail].filter(Boolean).join(', ');
    const portrait = type === 'adversary' ? e.imageUrl : e.avatarUrl;
    return { id: e.id, type, name: clean(e.name), forms: nameForms(e.name), label, look, ref: portrait ? ++refs : 0 };
  });
}

/** `text` with each cast member's name swapped for their label. */
export function withoutNames(text, cast = []) {
  let out = String(text || '');
  // Names become numbered marks first and labels last, so a label is never
  // itself mistaken for a name ("the skeleton knight" for "Skeleton").
  const mark = (i) => `\u0001${i}\u0001`;
  // A "the" before the name goes with it: the label brings its own.
  const swap = (form, i) => { out = out.replace(new RegExp(`(?:(?<![A-Za-z])the\\s+)?${nameRe(form).source}`, 'gi'), mark(i)); };
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
export function groundShotPrompt(prompt, cast = [], { scenery = false } = {}) {
  const base = withoutNames(prompt, cast).trim();
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
