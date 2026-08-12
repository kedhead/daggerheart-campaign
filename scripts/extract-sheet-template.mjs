#!/usr/bin/env node
/**
 * Build the character sheet PDF template shipped to the browser.
 *
 * The official Darrington Press "Character Sheets and Guides" pack is 22 pages:
 * a front sheet plus a character guide for each of the nine classes, some
 * class-specific reference pages, and one blank class-agnostic sheet. We only
 * need the ten fronts — every one of them uses an identical field layout, so a
 * single coordinate map fills any of them.
 *
 * The source pack is NOT committed (see .gitignore). Pass it in:
 *
 *   node scripts/extract-sheet-template.mjs path/to/CharacterSheetsandGuides.pdf
 *   node scripts/extract-sheet-template.mjs <src> --generic-only
 *
 * Writes public/assets/daggerheart-sheet-template.pdf plus a manifest JSON that
 * records which output page belongs to which class, and which fields are
 * already preprinted on it (so the renderer doesn't draw over them).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(PROJECT_ROOT, 'public', 'assets');
const OUT_PDF = path.join(OUT_DIR, 'daggerheart-sheet-template.pdf');
const OUT_MANIFEST = path.join(OUT_DIR, 'daggerheart-sheet-template.json');

// 1-indexed pages in the source pack. Verified against the May 21 2025 release:
// every entry is a 612x792 front sheet, and page 22 is the blank generic one.
const FRONTS = [
  { class: 'Bard', sourcePage: 1 },
  { class: 'Druid', sourcePage: 3 },
  { class: 'Guardian', sourcePage: 7 },
  { class: 'Ranger', sourcePage: 9 },
  { class: 'Rogue', sourcePage: 12 },
  { class: 'Seraph', sourcePage: 14 },
  { class: 'Sorcerer', sourcePage: 16 },
  { class: 'Warrior', sourcePage: 18 },
  { class: 'Wizard', sourcePage: 20 },
  { class: '__generic', sourcePage: 22 },
];

const PAGE_SIZE = [612, 792];
const SIZE_TOLERANCE = 1; // points

async function main() {
  const srcPath = process.argv[2] || process.env.DAGGERHEART_SHEETS_PDF;
  const genericOnly = process.argv.includes('--generic-only');

  if (!srcPath) {
    console.error('Usage: node scripts/extract-sheet-template.mjs <CharacterSheetsandGuides.pdf> [--generic-only]');
    console.error('       (or set DAGGERHEART_SHEETS_PDF)');
    process.exit(1);
  }
  if (!fs.existsSync(srcPath)) {
    console.error(`Source PDF not found: ${srcPath}`);
    process.exit(1);
  }

  const bytes = fs.readFileSync(srcPath);
  const sourceSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const src = await PDFDocument.load(bytes);

  const wanted = genericOnly ? FRONTS.filter(f => f.class === '__generic') : FRONTS;

  // Fail loudly if the source has been republished with different pagination —
  // silently emitting a wrong-but-valid template would misplace every field.
  for (const { class: cls, sourcePage } of wanted) {
    if (sourcePage > src.getPageCount()) {
      throw new Error(`Source has ${src.getPageCount()} pages; expected page ${sourcePage} for ${cls}.`);
    }
    const { width, height } = src.getPage(sourcePage - 1).getSize();
    if (Math.abs(width - PAGE_SIZE[0]) > SIZE_TOLERANCE || Math.abs(height - PAGE_SIZE[1]) > SIZE_TOLERANCE) {
      throw new Error(
        `Source page ${sourcePage} (expected ${cls} front) is ${Math.round(width)}x${Math.round(height)}, ` +
        `not ${PAGE_SIZE.join('x')}. The source pack layout has changed — re-check FRONTS.`
      );
    }
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, wanted.map(f => f.sourcePage - 1));
  copied.forEach(p => out.addPage(p));

  const pages = {};
  const preprinted = {};
  wanted.forEach((f, i) => {
    pages[f.class] = i;
    // The class fronts carry the class name, Hope Feature and Class Feature text
    // in the artwork. The generic sheet leaves those areas blank.
    preprinted[i] = f.class === '__generic' ? [] : ['className', 'hopeFeature', 'classFeature'];
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outBytes = await out.save({ useObjectStreams: true });
  fs.writeFileSync(OUT_PDF, outBytes);

  const manifest = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/extract-sheet-template.mjs',
    sourceLabel: path.basename(srcPath),
    sourceSha256,
    pageSize: PAGE_SIZE,
    pages,
    preprinted,
  };
  fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`Wrote ${path.relative(PROJECT_ROOT, OUT_PDF)} — ${wanted.length} page(s), ${(outBytes.length / 1024).toFixed(0)} KB`);
  console.log(`Wrote ${path.relative(PROJECT_ROOT, OUT_MANIFEST)}`);
  console.log(`Source sha256: ${sourceSha256.slice(0, 16)}…`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
