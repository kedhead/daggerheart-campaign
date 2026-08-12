// Draw a character onto the official Daggerheart character sheet and hand back
// a PDF blob.
//
// The official sheet has no form fields — it's vector artwork — so every value
// is drawn at an absolute coordinate from daggerheartSheetLayout.js. The
// template ships as a static asset and is fetched on demand; pdf-lib is
// dynamically imported so neither reaches the initial bundle.
//
// The one-page sheet can't hold a full character, so anything that overflows
// (domain cards, extra experiences, backstory, companion) is written onto
// appended continuation pages rather than silently dropped.

import { buildSheetFields } from './daggerheartSheetFields';
import {
  PAGE,
  TEXT_FIELDS,
  MULTILINE_BOXES,
  RULED_LINES,
  INVENTORY_WEAPONS,
  SLOT_TRACKS,
} from './daggerheartSheetLayout';

const TEMPLATE_URL = '/assets/daggerheart-sheet-template.pdf';
const MANIFEST_URL = '/assets/daggerheart-sheet-template.json';

const INK = { r: 0.09, g: 0.09, b: 0.11 };
const DEBUG_INK = { r: 1, g: 0, b: 0.6 };

// Module-level cache: exporting twice in a session shouldn't refetch ~1MB.
let templateCache = null;

class TemplateError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TemplateError';
    this.code = 'TEMPLATE_MISSING';
  }
}

/**
 * pdf-lib's standard fonts are WinAnsi-encoded and drawText THROWS on any
 * codepoint they can't encode. Player-entered names and the SRD's own text
 * both carry curly quotes, em dashes and ellipses, so this is mandatory rather
 * than cosmetic — CLASSES.Rogue alone contains "Rogue's Dodge" with U+2019.
 */
export function sanitizeWinAnsi(value) {
  if (value == null) return '';
  return String(value)
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—―]/g, '-')
    .replace(/…/g, '...')
    .replace(/[•·]/g, '-')
    .replace(/ /g, ' ')
    .replace(/[←-⇿∀-⋿]/g, '')
    // Anything still outside Latin-1 would throw; drop it rather than fail.
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '');
}

/** Greedy word wrap, breaking over-long single words. */
export function wrapText(text, font, size, maxWidth) {
  const clean = sanitizeWinAnsi(text).replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const lines = [];
  let line = '';
  for (const word of clean.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      line = word;
    } else {
      // A single word wider than the box — hard-break it.
      let chunk = '';
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrink then ellipsize so a value always stays inside its printed rule. */
function fitText(text, font, size, maxWidth) {
  const clean = sanitizeWinAnsi(text);
  if (!clean || !maxWidth) return { text: clean, size };
  let s = size;
  const floor = size * 0.6;
  while (s > floor && font.widthOfTextAtSize(clean, s) > maxWidth) s -= 0.5;
  if (font.widthOfTextAtSize(clean, s) <= maxWidth) return { text: clean, size: s };
  let truncated = clean;
  while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}...`, s) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return { text: `${truncated}...`, size: s };
}

function makeDrawer(page, font, boldFont, rgb, debug) {
  const ink = rgb(INK.r, INK.g, INK.b);
  const debugInk = rgb(DEBUG_INK.r, DEBUG_INK.g, DEBUG_INK.b);

  function drawField(spec, value, { bold = false } = {}) {
    if (!spec) return;
    if (debug) {
      page.drawRectangle({
        x: spec.x - 1,
        y: spec.y - 2,
        width: spec.maxWidth || 20,
        height: (spec.size || 9) + 3,
        borderColor: debugInk,
        borderWidth: 0.4,
      });
    }
    const raw = value == null ? '' : String(value);
    if (!raw.trim()) return;
    const f = bold ? boldFont : font;
    const { text, size } = fitText(raw, f, spec.size || 9, spec.maxWidth);
    if (!text) return;
    let x = spec.x;
    if (spec.align === 'center') x -= f.widthOfTextAtSize(text, size) / 2;
    else if (spec.align === 'right') x -= f.widthOfTextAtSize(text, size);
    page.drawText(text, { x, y: spec.y, size, font: f, color: ink });
  }

  function drawBoxText(spec, value, { bold = false } = {}) {
    if (!spec) return;
    if (debug) {
      page.drawRectangle({
        x: spec.x - 1,
        y: spec.y - (spec.lineHeight || 9) * (spec.maxLines || 3),
        width: spec.width,
        height: (spec.lineHeight || 9) * (spec.maxLines || 3) + 4,
        borderColor: debugInk,
        borderWidth: 0.4,
      });
    }
    const raw = value == null ? '' : String(value);
    if (!raw.trim()) return;
    const f = bold ? boldFont : font;
    const size = spec.size || 8;
    let lines = wrapText(raw, f, size, spec.width);
    const max = spec.maxLines || lines.length;
    if (lines.length > max) {
      lines = lines.slice(0, max);
      const last = lines[max - 1];
      lines[max - 1] = fitText(`${last}...`, f, size, spec.width).text;
    }
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: spec.x,
        y: spec.y - i * (spec.lineHeight || size * 1.2),
        size,
        font: f,
        color: ink,
      });
    });
    return lines.length;
  }

  /** A mark on a printed slot: a filled shape inset inside the artwork. */
  function drawMark(shape, x, y, dims) {
    if (shape === 'box') {
      const w = (dims.w || 10) * 0.62;
      const h = (dims.h || 8) * 0.62;
      page.drawRectangle({ x: x - w / 2, y: y - h / 2, width: w, height: h, color: ink });
    } else if (shape === 'diamond') {
      const r = (dims.r || 6) * 0.72;
      page.drawLine({ start: { x: x - r, y }, end: { x, y: y + r }, thickness: r * 0.9, color: ink });
      page.drawLine({ start: { x, y: y + r }, end: { x: x + r, y }, thickness: r * 0.9, color: ink });
      page.drawLine({ start: { x: x + r, y }, end: { x, y: y - r }, thickness: r * 0.9, color: ink });
      page.drawLine({ start: { x, y: y - r }, end: { x: x - r, y }, thickness: r * 0.9, color: ink });
    } else {
      page.drawCircle({ x, y, size: (dims.r || 4) * 0.62, color: ink });
    }
  }

  /** A scar: the slot is crossed out rather than filled. */
  function drawCross(x, y, r) {
    const t = Math.max(0.8, r * 0.22);
    page.drawLine({ start: { x: x - r, y: y - r }, end: { x: x + r, y: y + r }, thickness: t, color: ink });
    page.drawLine({ start: { x: x - r, y: y + r }, end: { x: x + r, y: y - r }, thickness: t, color: ink });
  }

  function drawTick(x, y) {
    page.drawLine({ start: { x: x - 2.2, y }, end: { x: x - 0.4, y: y - 2.2 }, thickness: 1.1, color: ink });
    page.drawLine({ start: { x: x - 0.4, y: y - 2.2 }, end: { x: x + 2.6, y: y + 2.4 }, thickness: 1.1, color: ink });
  }

  function debugDot(x, y) {
    if (debug) page.drawCircle({ x, y, size: 0.8, color: debugInk });
  }

  return { drawField, drawBoxText, drawMark, drawCross, drawTick, debugDot };
}

/** Fill a linear slot track (HP, Stress, Hope, Proficiency, gold coins/bags). */
function fillTrack(d, track, isMarked, isScarred) {
  for (let i = 0; i < track.count; i += 1) {
    const x = track.x + i * track.pitch;
    d.debugDot(x, track.y);
    if (isScarred && isScarred(i)) d.drawCross(x, track.y, (track.r || 5) * 0.85);
    else if (isMarked(i)) d.drawMark(track.shape, x, track.y, track);
  }
}

async function loadTemplate(templateUrl, manifestUrl, injectedBytes, injectedManifest) {
  if (injectedBytes) {
    return { bytes: injectedBytes, manifest: injectedManifest || null };
  }
  if (templateCache) return templateCache;
  let res;
  let manifest = null;
  try {
    res = await fetch(templateUrl);
  } catch (err) {
    throw new TemplateError(`Could not load the character sheet template: ${err.message}`);
  }
  if (!res.ok) {
    throw new TemplateError(
      `Character sheet template not found (${res.status}). It may not have been deployed.`
    );
  }
  const bytes = await res.arrayBuffer();
  try {
    const mres = await fetch(manifestUrl);
    if (mres.ok) manifest = await mres.json();
  } catch {
    // A missing manifest only costs us class-specific page selection.
    manifest = null;
  }
  templateCache = { bytes, manifest };
  return templateCache;
}

/**
 * Render a character onto the official sheet.
 *
 * @param {object} character
 * @param {object} [opts]
 * @param {Array}  [opts.items]           campaign item catalog, for equipped gear
 * @param {boolean}[opts.includeAppendix] append continuation pages (default true)
 * @param {boolean}[opts.includeDmNotes]  include GM notes (pass only for a DM)
 * @param {ArrayBuffer}[opts.templateBytes] inject the template (node/tests)
 * @param {boolean}[opts.debug]           stroke every field box for calibration
 * @returns {Promise<Blob>}
 */
export async function exportCharacterSheetPdf(character, opts = {}) {
  const {
    items = [],
    includeAppendix = true,
    includeDmNotes = false,
    templateBytes = null,
    templateManifest = null,
    templateUrl = TEMPLATE_URL,
    manifestUrl = MANIFEST_URL,
    debug = false,
  } = opts;

  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const { bytes, manifest } = await loadTemplate(templateUrl, manifestUrl, templateBytes, templateManifest);

  const template = await PDFDocument.load(bytes);
  const pdf = await PDFDocument.create();

  const pages = manifest?.pages || {};
  const charClass = character?.class || '';
  const pageIndex =
    pages[charClass] != null ? pages[charClass] : pages.__generic != null ? pages.__generic : template.getPageCount() - 1;
  // Class pages preprint the class name, Hope Feature and Class Feature text.
  const preprinted = manifest?.preprinted?.[String(pageIndex)] || [];

  const [sheet] = await pdf.copyPages(template, [pageIndex]);
  pdf.addPage(sheet);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const model = buildSheetFields(character, { items, includeDmNotes });
  const d = makeDrawer(sheet, font, boldFont, rgb, debug);

  // ── Identity ──
  d.drawField(TEXT_FIELDS.name, model.name, { bold: true });
  d.drawField(TEXT_FIELDS.pronouns, model.pronouns);
  d.drawField(TEXT_FIELDS.heritage, model.heritage);
  // A class page's banner already names the class, so its header slot is just
  // "SUBCLASS"; the generic page needs both.
  d.drawField(
    TEXT_FIELDS.classSubclass,
    preprinted.includes('className') ? model.subclassOnly : model.classSubclass
  );
  d.drawField(TEXT_FIELDS.level, model.level, { bold: true });

  // ── Defenses ──
  d.drawField(TEXT_FIELDS.evasion, model.evasion, { bold: true });
  d.drawField(TEXT_FIELDS.armorScore, model.armorScore, { bold: true });
  d.drawField(TEXT_FIELDS.majorThreshold, model.majorThreshold, { bold: true });
  d.drawField(TEXT_FIELDS.severeThreshold, model.severeThreshold, { bold: true });

  // ── Traits ──
  model.traits.forEach(t => {
    const key = `trait${t.label}`;
    d.drawField(TEXT_FIELDS[key], t.value, { bold: true });
    if (t.marked) {
      const marks = SLOT_TRACKS.traitMarks;
      const x = marks.xs[t.key];
      if (x != null) d.drawMark('circle', x, marks.y, marks);
    }
  });

  // ── Vital tracks ──
  fillTrack(d, SLOT_TRACKS.hp, i => !!model.hp.marked[i]);
  fillTrack(d, SLOT_TRACKS.stress, i => !!model.stress.marked[i]);
  fillTrack(
    d,
    SLOT_TRACKS.hope,
    i => !!model.hope[i]?.filled,
    i => !!model.hope[i]?.scarred
  );
  fillTrack(d, SLOT_TRACKS.proficiency, i => i < model.proficiency);

  const armorTrack = SLOT_TRACKS.armor;
  for (let i = 0; i < armorTrack.count; i += 1) {
    const x = armorTrack.xs[i % armorTrack.xs.length];
    const y = armorTrack.ys[Math.floor(i / armorTrack.xs.length)];
    d.debugDot(x, y);
    if (model.armorSlots.marked[i]) d.drawMark('circle', x, y, armorTrack);
  }

  // ── Gold ──
  fillTrack(d, SLOT_TRACKS.gold.handfuls, i => i < model.gold.handfulsShown);
  fillTrack(d, SLOT_TRACKS.gold.bags, i => i < model.gold.bagsShown);
  if (model.gold.chestsShown > 0) {
    const chest = SLOT_TRACKS.gold.chest;
    d.drawMark('box', chest.x, chest.y, chest);
  }

  // ── Weapons ──
  if (model.primaryWeapon) {
    d.drawField(TEXT_FIELDS.primaryWeaponName, model.primaryWeapon.name);
    d.drawField(TEXT_FIELDS.primaryWeaponTraitRange, model.primaryWeapon.traitRange);
    d.drawField(TEXT_FIELDS.primaryWeaponDamage, model.primaryWeapon.damage);
    d.drawBoxText(MULTILINE_BOXES.primaryWeaponFeature, model.primaryWeapon.feature);
  }
  if (model.secondaryWeapon) {
    d.drawField(TEXT_FIELDS.secondaryWeaponName, model.secondaryWeapon.name);
    d.drawField(TEXT_FIELDS.secondaryWeaponTraitRange, model.secondaryWeapon.traitRange);
    d.drawField(TEXT_FIELDS.secondaryWeaponDamage, model.secondaryWeapon.damage);
    d.drawBoxText(MULTILINE_BOXES.secondaryWeaponFeature, model.secondaryWeapon.feature);
  }
  model.inventoryWeapons.forEach((w, i) => {
    const spec = INVENTORY_WEAPONS[i];
    if (!spec || !w) return;
    d.drawField(spec.name, w.name);
    d.drawField(spec.traitRange, w.traitRange);
    d.drawField(spec.damage, w.damage);
    d.drawBoxText(spec.feature, w.feature);
  });

  // ── Armor ──
  d.drawField(TEXT_FIELDS.armorName, model.activeArmor.name);
  d.drawField(TEXT_FIELDS.armorBaseThresholds, model.activeArmor.baseThresholds);
  d.drawField(TEXT_FIELDS.armorBaseScore, model.activeArmor.baseScore);
  d.drawBoxText(MULTILINE_BOXES.armorFeature, model.activeArmor.feature);

  // ── Experiences ──
  const exp = RULED_LINES.experiences;
  model.experiences.forEach((e, i) => {
    if (i >= exp.ys.length) return;
    d.drawField({ x: exp.x, y: exp.ys[i], size: exp.size, maxWidth: exp.maxWidth }, e.name);
    d.drawField({ x: exp.modX, y: exp.ys[i], size: exp.modSize, align: exp.modAlign }, e.mod, { bold: true });
  });

  // ── Inventory ──
  const inv = RULED_LINES.inventory;
  model.inventoryLines.forEach((line, i) => {
    if (i >= inv.ys.length) return;
    d.drawField({ x: inv.x, y: inv.ys[i], size: inv.size, maxWidth: inv.maxWidth }, line);
  });

  // ── Class / Hope features (generic page only) ──
  if (!preprinted.includes('hopeFeature') && model.hopeFeature) {
    d.drawBoxText(
      MULTILINE_BOXES.hopeFeature,
      `${model.hopeFeature.name}: ${model.hopeFeature.description}`
    );
  }
  if (!preprinted.includes('classFeature') && model.classFeatures.length) {
    const text = model.classFeatures.map(f => `${f.name}: ${f.description}`).join('\n\n');
    d.drawBoxText(MULTILINE_BOXES.classFeature, text);
  }

  if (includeAppendix) {
    await drawAppendix(pdf, model, { font, boldFont, rgb });
  }

  const out = await pdf.save();
  return new Blob([out], { type: 'application/pdf' });
}

// ── Continuation pages ───────────────────────────────────────────────────────

/** Everything the official one-pager has no room for, as {title, body} blocks. */
export function buildAppendixSections(model) {
  const s = [];
  const o = model.overflow;

  const cardBlock = (c) => {
    const head = [c.domain, c.level ? `Level ${c.level}` : null, c.recallCost != null ? `Recall ${c.recallCost}` : null]
      .filter(Boolean)
      .join(' · ');
    return [`${c.name}${head ? ` (${head})` : ''}`, c.text || c.description || ''].filter(Boolean).join('\n');
  };

  if (o.loadoutCards.length) {
    s.push({ title: 'Domain Cards — Loadout', body: o.loadoutCards.map(cardBlock).join('\n\n') });
  }
  if (o.vaultCards.length) {
    s.push({ title: 'Domain Cards — Vault', body: o.vaultCards.map(cardBlock).join('\n\n') });
  }
  if (o.domainNotes) s.push({ title: 'Domain Notes', body: o.domainNotes });

  if (o.subclass) {
    const tiers = ['foundation', 'specialization', 'mastery'];
    const shown = tiers.slice(0, Math.max(1, tiers.indexOf(o.subclassLevel) + 1));
    const body = shown
      .map(t => {
        const tier = o.subclass[t];
        if (!tier) return null;
        return `${t.toUpperCase()} — ${tier.name || ''}\n${tier.description || ''}`.trim();
      })
      .filter(Boolean)
      .join('\n\n');
    if (body) s.push({ title: `Subclass — ${o.subclass.name}`, body });
  }

  const heritageBits = [];
  [o.ancestry, o.community].forEach(h => {
    if (!h) return;
    const features = (h.features || []).map(f => `${f.name}: ${f.description}`).join('\n');
    const text = [h.description, features].filter(Boolean).join('\n');
    if (text) heritageBits.push(`${h.name}\n${text}`);
  });
  if (heritageBits.length) s.push({ title: 'Heritage Features', body: heritageBits.join('\n\n') });

  if (o.experiences.length) {
    s.push({
      title: 'Experiences (continued)',
      body: o.experiences.map(e => `${e.mod}  ${e.name}`).join('\n'),
    });
  }
  if (o.inventoryLines.length) {
    s.push({ title: 'Inventory (continued)', body: o.inventoryLines.join('\n') });
  }
  if (o.weapons.length) {
    s.push({
      title: 'Weapons (continued)',
      body: o.weapons
        .map(w => [w.name, w.traitRange, w.damage, w.feature].filter(Boolean).join(' · '))
        .join('\n'),
    });
  }
  if (o.goldRemainder) {
    s.push({
      title: 'Gold',
      body: `${o.goldRemainder.total} total — ${o.goldRemainder.chests} chest(s), ${o.goldRemainder.bags} bag(s), ${o.goldRemainder.handfuls} handful(s). Exceeds the printed track.`,
    });
  }

  if (o.companion) {
    const c = o.companion;
    const stats = [
      c.type ? `Type: ${c.type}` : null,
      c.evasion != null ? `Evasion: ${c.evasion}` : null,
      c.damageDie ? `Damage: ${c.damageDie}` : null,
      c.range ? `Range: ${c.range}` : null,
      c.attackDescription ? `Attack: ${c.attackDescription}` : null,
      (c.experiences || []).length ? `Experiences: ${c.experiences.join(', ')}` : null,
      (c.upgrades || []).length ? `Upgrades: ${c.upgrades.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    s.push({ title: `Companion — ${c.name || 'Unnamed'}`, body: stats });
  }
  if (o.knownBeastforms.length) {
    s.push({
      title: 'Known Beastforms',
      body: o.knownBeastforms.map(b => (typeof b === 'string' ? b : b.name)).filter(Boolean).join('\n'),
    });
  }

  const extras = [];
  if (model.massiveThreshold) extras.push(`Massive damage threshold: ${model.massiveThreshold}`);
  if (model.scars) extras.push(`Scars: ${model.scars}`);
  if (o.playerName) extras.push(`Player: ${o.playerName}`);
  if (extras.length) s.push({ title: 'Additional Stats', body: extras.join('\n') });

  if (o.appearance) s.push({ title: 'Appearance', body: o.appearance });
  if (o.backstory) s.push({ title: 'Backstory', body: o.backstory });
  if (o.playerNotes) s.push({ title: 'Player Notes', body: o.playerNotes });
  if (o.dmNotes) s.push({ title: 'GM Notes', body: o.dmNotes });

  return s;
}

async function drawAppendix(pdf, model, { font, boldFont, rgb }) {
  const sections = buildAppendixSections(model);
  if (!sections.length) return;

  const MARGIN = 54;
  const BODY = 9.5;
  const LINE = 12;
  const ink = rgb(INK.r, INK.g, INK.b);
  const faint = rgb(0.45, 0.45, 0.48);
  const width = PAGE.width - MARGIN * 2;

  let page = null;
  let y = 0;

  const newPage = () => {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - MARGIN;
    const header = sanitizeWinAnsi(
      `${model.name || 'Character'}${model.classSubclass ? ` — ${model.classSubclass}` : ''}${model.level ? ` — Level ${model.level}` : ''}`
    );
    page.drawText(header, { x: MARGIN, y, size: 10, font: boldFont, color: faint });
    y -= 8;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE.width - MARGIN, y },
      thickness: 0.6,
      color: faint,
    });
    y -= 22;
  };

  const ensure = (needed) => {
    if (!page || y - needed < MARGIN) newPage();
  };

  newPage();

  sections.forEach(section => {
    ensure(LINE * 3);
    page.drawText(sanitizeWinAnsi(section.title), { x: MARGIN, y, size: 12.5, font: boldFont, color: ink });
    y -= LINE * 1.4;

    // Blank lines are paragraph breaks; keep them.
    String(section.body)
      .split(/\n/)
      .forEach(para => {
        if (!para.trim()) {
          y -= LINE * 0.5;
          return;
        }
        wrapText(para, font, BODY, width).forEach(line => {
          ensure(LINE);
          page.drawText(line, { x: MARGIN, y, size: BODY, font, color: ink });
          y -= LINE;
        });
      });
    y -= LINE * 0.8;
  });
}

export default exportCharacterSheetPdf;
