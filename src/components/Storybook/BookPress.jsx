import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { X, Printer, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAllJournals } from '../../hooks/useStorybook';
import {
  TRIM_SIZES, ILLUSTRATION_SIZES, normalizeBookSettings, buildBook, trimFor,
  illustrationWidthIn, printDpi, pageCss, chapterLabel, estimatePages, wordCount
} from '../../utils/bookLayout';
import { BOOK_FONT_CSS } from './bookFonts';
import './BookPress.css';

/* ─────────────────────────────────────────────────────────────────────────────
   BookPress — binds the published chapters into a print-ready book.

   The left panel is the press settings; the right is the book itself, laid
   out at its real trim size. Printing hides everything but the book and hands
   the browser @page rules for the trim, so "Save as PDF" produces an interior
   file a print-on-demand service (Lulu, Blurb, KDP) will accept.
   ──────────────────────────────────────────────────────────────────────────── */

const SAVE_DELAY_MS = 800;
const LOW_DPI = 200;

export default function BookPress({ campaign, campaignId, chapters, characters = [], npcs = [], updateCampaign, onClose }) {
  const [settings, setSettings] = useState(() => normalizeBookSettings(campaign?.bookSettings, campaign));
  const [imageWidths, setImageWidths] = useState({});

  const published = useMemo(
    () => [...(chapters || [])]
      .filter(c => c.status === 'published')
      .sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0)),
    [chapters]
  );
  const chapterIds = useMemo(() => published.map(c => c.id), [published]);
  const journalsByChapter = useAllJournals(campaignId, settings.includeJournals ? chapterIds : []);

  const book = useMemo(
    () => buildBook({ chapters: published, characters, npcs, journalsByChapter, settings }),
    [published, characters, npcs, journalsByChapter, settings]
  );

  // Settings save themselves, so the next visit opens the same book.
  // The save goes through a ref: updateCampaign is a fresh function on every
  // parent render, and the save itself re-renders the parent, so depending on
  // it would save forever.
  const saveRef = useRef(updateCampaign);
  saveRef.current = updateCampaign;
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const t = setTimeout(() => {
      Promise.resolve(saveRef.current?.({ bookSettings: settings })).catch(() => {});
    }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [settings]);

  // Esc closes, like every other overlay.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (patch) => setSettings(s => ({ ...s, ...patch }));
  const toggleChapter = (id) => setSettings(s => {
    const ex = new Set(s.excludedChapterIds);
    if (ex.has(id)) ex.delete(id); else ex.add(id);
    return { ...s, excludedChapterIds: [...ex] };
  });

  const trim = trimFor(settings.trim);
  const illusIn = illustrationWidthIn(settings);
  const pages = estimatePages(book, settings);
  const words = wordCount(book);

  const sceneUrls = book.chapters.flatMap(c => c.blocks.filter(b => b.kind === 'scene').map(b => b.value.imageUrl));
  const measured = sceneUrls.filter(u => imageWidths[u]);
  const lowDpi = measured.filter(u => printDpi(imageWidths[u], illusIn) < LOW_DPI).length;
  const minDpi = measured.length ? Math.min(...measured.map(u => printDpi(imageWidths[u], illusIn))) : null;
  const onImageLoad = (url) => (e) => {
    const w = e.currentTarget.naturalWidth;
    if (w) setImageWidths(prev => (prev[url] === w ? prev : { ...prev, [url]: w }));
  };

  // Print only once fonts and every illustration have arrived, or the PDF
  // gets fallback type and empty frames.
  const handlePrint = async () => {
    try {
      await document.fonts?.ready;
      const imgs = [...document.querySelectorAll('.bp-book img')].filter(img => !img.complete);
      await Promise.all(imgs.map(img => new Promise(done => {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      })));
    } catch { /* print anyway */ }
    window.print();
  };

  const style = {
    '--bp-page-w': `${trim.width}in`,
    '--bp-page-h': `${trim.height}in`,
    '--bp-m-top': `${trim.margins.top}in`,
    '--bp-m-bottom': `${trim.margins.bottom}in`,
    '--bp-m-inside': `${trim.margins.inside}in`,
    '--bp-m-outside': `${trim.margins.outside}in`,
    '--bp-font': `${trim.fontPt}pt`,
    '--bp-illus': `${illusIn}in`
  };

  return createPortal(
    <div className="bp-root" style={style}>
      <style>{BOOK_FONT_CSS + pageCss(settings)}</style>

      <aside className="bp-panel" aria-label="Book settings">
        <div className="bp-panel-head">
          <div>
            <span className="bp-eyebrow">The Press</span>
            <h2 className="bp-panel-title"><BookOpen size={18} /> Make a book</h2>
          </div>
          <button type="button" className="bp-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <section className="bp-group">
          <h3>Title page</h3>
          <label>Title<input value={settings.title} onChange={e => set({ title: e.target.value })} /></label>
          <label>Subtitle<input value={settings.subtitle} placeholder="Being a true account of…" onChange={e => set({ subtitle: e.target.value })} /></label>
          <label>Byline<input value={settings.byline} placeholder="As told at the table of…" onChange={e => set({ byline: e.target.value })} /></label>
          <label>Dedication<textarea rows={2} value={settings.dedication} placeholder="For everyone who rolled with Fear." onChange={e => set({ dedication: e.target.value })} /></label>
        </section>

        <section className="bp-group">
          <h3>Format</h3>
          <label>Trim size
            <select value={settings.trim} onChange={e => set({ trim: e.target.value })}>
              {TRIM_SIZES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label>Illustration size
            <select value={settings.illustrations} onChange={e => set({ illustrations: e.target.value })} disabled={!settings.includeIllustrations}>
              {ILLUSTRATION_SIZES.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select>
          </label>
          <Check label="Illustrations" checked={settings.includeIllustrations} onChange={v => set({ includeIllustrations: v })} />
          <Check label="Contents page" checked={settings.includeContents} onChange={v => set({ includeContents: v })} />
          <Check label="Dramatis Personae (cast)" checked={settings.includeCast} onChange={v => set({ includeCast: v })} />
          <Check label="Player journals after chapters" checked={settings.includeJournals} onChange={v => set({ includeJournals: v })} />
        </section>

        <section className="bp-group">
          <h3>Chapters <span className="bp-muted">({book.chapters.length} of {published.length})</span></h3>
          {published.length === 0 && <p className="bp-muted">Publish a chapter to bind it into the book.</p>}
          <div className="bp-chapter-list">
            {published.map((c, i) => (
              <Check
                key={c.id}
                label={`${i + 1}. ${c.title || 'Untitled'}`}
                checked={!settings.excludedChapterIds.includes(c.id)}
                onChange={() => toggleChapter(c.id)}
              />
            ))}
          </div>
          <p className="bp-muted">Only published chapters are bound. Order follows the Reorder dialog.</p>
        </section>

        <section className="bp-group">
          <h3>Preflight</h3>
          <ul className="bp-preflight">
            <li>{words.toLocaleString()} words · about <strong>{pages}</strong> pages at {trim.width} × {trim.height} in</li>
            {pages < 32
              ? <li className="bp-warn"><AlertTriangle size={14} /> Most printers want 24–32+ pages for a glued spine. Saddle-stitch (stapled) works for shorter books.</li>
              : <li className="bp-ok"><CheckCircle2 size={14} /> Long enough for a perfect-bound paperback or hardcover.</li>}
            {settings.includeIllustrations && sceneUrls.length > 0 && (
              minDpi === null
                ? <li className="bp-muted">Checking illustration resolution…</li>
                : lowDpi > 0
                  ? <li className="bp-warn"><AlertTriangle size={14} /> {lowDpi} illustration{lowDpi === 1 ? '' : 's'} will print below {LOW_DPI} DPI (lowest {minDpi}). Choose “Crisp” size for sharper art.</li>
                  : <li className="bp-ok"><CheckCircle2 size={14} /> Illustrations print at {minDpi}+ DPI.</li>
            )}
          </ul>
        </section>

        <section className="bp-group">
          <h3>Print to PDF</h3>
          <ol className="bp-steps">
            <li>Use <strong>Chrome or Edge on a computer</strong> (phones ignore the page size).</li>
            <li>Destination: <strong>Save as PDF</strong>.</li>
            <li>Margins <strong>Default</strong>, Scale <strong>100%</strong>.</li>
            <li>Tick <strong>Background graphics</strong>, untick <strong>Headers and footers</strong>.</li>
          </ol>
          <p className="bp-muted">The PDF is your book interior at exact trim size, fonts embedded. Upload it to Lulu, Blurb or KDP as the interior file.</p>
          <button type="button" className="bp-print-btn" onClick={handlePrint} disabled={book.chapters.length === 0}>
            <Printer size={16} /> Print / Save PDF
          </button>
        </section>
      </aside>

      <main className="bp-desk">
        <article className="bp-book">
          <FrontMatter settings={settings} book={book} />
          {book.chapters.map(ch => (
            <section key={ch.id} className="bp-sheet bp-chapter">
              <header className="bp-chapter-head">
                <span className="bp-chapter-num">{chapterLabel(ch.number)}</span>
                <h2 className="bp-chapter-title">{ch.title}</h2>
                <Fleuron />
              </header>
              <div className="bp-prose">
                {ch.blocks.map((b, i) => b.kind === 'p' ? (
                  <div key={i} className="bp-para"><ReactMarkdown>{b.value}</ReactMarkdown></div>
                ) : (
                  <figure key={b.value.id || i} className="bp-figure">
                    <img src={b.value.imageUrl} alt={b.value.caption || ''} onLoad={onImageLoad(b.value.imageUrl)} />
                    {b.value.caption && <figcaption>{b.value.caption}</figcaption>}
                  </figure>
                ))}
              </div>
              {ch.journal.length > 0 && (
                <aside className="bp-journal">
                  <div className="bp-journal-head">From the Journals</div>
                  {ch.journal.map(e => (
                    <div key={e.id} className="bp-journal-entry">
                      <div className="bp-journal-name">{e.name}</div>
                      <div className="bp-journal-text"><ReactMarkdown>{e.content}</ReactMarkdown></div>
                    </div>
                  ))}
                </aside>
              )}
            </section>
          ))}
          {book.chapters.length > 0 && (
            <section className="bp-sheet bp-finis">
              <Fleuron />
              <p>Here ends the chronicle — for now.</p>
            </section>
          )}
        </article>
      </main>
    </div>,
    document.body
  );
}

function FrontMatter({ settings, book }) {
  const printed = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const { heroes, others } = book.cast;
  return (
    <>
      <section className="bp-sheet bp-front bp-title-page">
        <div className="bp-title-block">
          <h1 className="bp-book-title">{settings.title}</h1>
          {settings.subtitle && <p className="bp-book-subtitle">{settings.subtitle}</p>}
          <Fleuron />
          {settings.byline && <p className="bp-book-byline">{settings.byline}</p>}
        </div>
      </section>

      <section className="bp-sheet bp-front bp-credits">
        <p><em>{settings.title}</em></p>
        <p>A chronicle of play, set down from the table’s sessions.</p>
        {book.players.length > 0 && (
          <div className="bp-credits-players">
            <p className="bp-smallcaps">The Company</p>
            {book.players.map(p => <p key={p.character}>{p.character} — played by {p.player}</p>)}
          </div>
        )}
        <p>Printed {printed}</p>
      </section>

      {settings.dedication?.trim() && (
        <section className="bp-sheet bp-front bp-dedication">
          <p>{settings.dedication}</p>
        </section>
      )}

      {settings.includeContents && book.chapters.length > 0 && (
        <section className="bp-sheet bp-front bp-contents">
          <h2 className="bp-section-title">Contents</h2>
          <ol>
            {book.chapters.map(c => (
              <li key={c.id}><span className="bp-contents-num">{c.number}</span>{c.title}</li>
            ))}
          </ol>
        </section>
      )}

      {(heroes.length > 0 || others.length > 0) && (
        <section className="bp-sheet bp-front bp-cast">
          <h2 className="bp-section-title">Dramatis Personae</h2>
          {heroes.length > 0 && <CastGroup title="The Company" people={heroes} />}
          {others.length > 0 && <CastGroup title="Those They Met" people={others} />}
        </section>
      )}
    </>
  );
}

// Drawn rather than typed: Garamond has no fleuron glyph, and the fallback
// font's ❦ looked like clip art.
function Fleuron() {
  return (
    <div className="bp-fleuron" aria-hidden="true">
      <svg viewBox="0 0 120 16" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M2 8h44M74 8h44" />
        <path d="M60 2l6 6-6 6-6-6z" fill="currentColor" />
        <circle cx="49" cy="8" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="71" cy="8" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

function CastGroup({ title, people }) {
  return (
    <div className="bp-cast-group">
      <h3 className="bp-smallcaps">{title}</h3>
      <div className="bp-cast-grid">
        {people.map(p => (
          <div key={p.id} className="bp-cast-card">
            {p.portraitUrl
              ? <img src={p.portraitUrl} alt="" className="bp-cast-portrait" />
              : <div className="bp-cast-portrait bp-cast-initial">{p.name[0]}</div>}
            <div>
              <div className="bp-cast-name">{p.name}{p.deceased ? ' †' : ''}</div>
              {p.line && <div className="bp-cast-line">{p.line}</div>}
              {p.player && <div className="bp-cast-line">played by {p.player}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="bp-check">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
