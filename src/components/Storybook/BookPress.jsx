import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { X, Printer, BookOpen, AlertTriangle, CheckCircle2, CloudCog, Download, Wand2 } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { useAllJournals } from '../../hooks/useStorybook';
import {
  TRIM_SIZES, ILLUSTRATION_SIZES, normalizeBookSettings, buildBook, trimFor,
  illustrationWidthIn, printDpi, pageCss, chapterLabel, estimatePages, wordCount, bindableChapters,
  coverDimensions, coverPageCss, COVER_THEMES
} from '../../utils/bookLayout';
import { CoverSheet, CoverSection, frontArtDpi } from './BookCover';
import SecondDraftSection from './SecondDraft';
import { writeEpilogue, writeBlurb } from '../../services/bookDraftGenerator';
import { BOOK_FONT_CSS, inlineBookFontCss } from './bookFonts';
import bookCss from './BookPress.css?raw';
import './BookPress.css';

/* ─────────────────────────────────────────────────────────────────────────────
   BookPress — binds the published chapters into a print-ready book.

   The left panel is the press settings; the right is the book itself, laid
   out at its real trim size. Printing hides everything but the book and hands
   the browser @page rules for the trim, so "Save as PDF" produces an interior
   file a print-on-demand service (Lulu, Blurb, KDP) will accept.
   ──────────────────────────────────────────────────────────────────────────── */

const SAVE_DELAY_MS = 800;

// iPadOS reports itself as a Mac, so a touch-capable "Mac" counts too.
const IS_IOS = typeof navigator !== 'undefined' && (
  /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);
const LOW_DPI = 200;

export default function BookPress({ campaign, campaignId, chapters, characters = [], npcs = [], locations = [], lore = [], sessions = [], updateCampaign, updateChapter, apiKey, onClose }) {
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
    () => buildBook({ chapters: published, characters, npcs, locations, lore, journalsByChapter, settings }),
    [published, characters, npcs, locations, lore, journalsByChapter, settings]
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
  // gets fallback type and empty frames. The waiting happens here, ahead of
  // the tap: Safari on iPhone only honours window.print() called straight from
  // the tap, so awaiting anything inside the click handler made it do nothing.
  const bookRef = useRef(null);
  const [pendingAssets, setPendingAssets] = useState(1);
  useEffect(() => {
    const root = bookRef.current;
    if (!root) return;
    let cancelled = false;
    const recount = () => {
      if (cancelled) return;
      const loadingImgs = [...root.querySelectorAll('img')].filter(img => !img.complete).length;
      const fontsLoading = document.fonts && document.fonts.status !== 'loaded' ? 1 : 0;
      setPendingAssets(loadingImgs + fontsLoading);
    };
    const imgs = [...root.querySelectorAll('img')];
    imgs.forEach(img => {
      img.addEventListener('load', recount);
      img.addEventListener('error', recount);
    });
    document.fonts?.ready.then(recount);
    document.fonts?.addEventListener?.('loadingdone', recount);
    recount();
    return () => {
      cancelled = true;
      imgs.forEach(img => {
        img.removeEventListener('load', recount);
        img.removeEventListener('error', recount);
      });
      document.fonts?.removeEventListener?.('loadingdone', recount);
    };
  }, [book]);
  const printReady = pendingAssets === 0;

  const handlePrint = () => window.print();

  const [epilogueJob, setEpilogueJob] = useState(null); // { state: 'working'|'error', message }
  const handleWriteEpilogue = async () => {
    setEpilogueJob({ state: 'working' });
    try {
      const epilogue = await writeEpilogue({
        bound: bindableChapters(published, settings),
        characters,
        threads: settings.threads || '',
        guidance: settings.epilogueGuidance || '',
        gameSystem: campaign?.gameSystem || 'daggerheart',
        apiKey
      });
      set({ epilogue });
      setEpilogueJob(null);
    } catch (err) {
      setEpilogueJob({ state: 'error', message: err.message });
    }
  };

  // Print on the server: the same Chromium print as desktop Chrome, for phones
  // (whose browsers ignore the page size) or anyone who'd rather not fiddle
  // with print settings. The finished PDF lands in campaign storage. The
  // interior and the cover are separate files, as printers ask for them.
  const [serverJobs, setServerJobs] = useState({}); // target -> { state: 'working'|'done'|'error', ... }
  const serverJob = serverJobs.book;
  const coverJob = serverJobs.cover;
  const setJob = (target, job) => setServerJobs(prev => ({ ...prev, [target]: job }));
  const handleServerPdf = async (target = 'book') => {
    const started = Date.now();
    setJob(target, { state: 'working', started });
    try {
      const vars = Object.entries(style).map(([k, v]) => `${k}:${v}`).join(';');
      const html = target === 'cover'
        ? `<div class="bp-root bp-print-cover" style="${vars}">${coverRef.current.outerHTML}</div>`
        : `<div class="bp-root" style="${vars}">${bookRef.current.outerHTML}</div>`;
      const css = (await inlineBookFontCss()) + (target === 'cover' ? coverPageCss(dims) : pageCss(settings)) + bookCss;
      const res = await apiFetch('/api/render-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, html, css, title: target === 'cover' ? `${settings.title} cover` : settings.title })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Printing failed (${res.status}).`);
      setJob(target, { state: 'done', ...data, seconds: Math.round((Date.now() - started) / 1000) });
    } catch (err) {
      setJob(target, { state: 'error', message: err.message });
    }
  };

  // ── Cover ──────────────────────────────────────────────────────────────────
  const coverRef = useRef(null);
  const setCover = (patch) => setSettings(s => ({ ...s, cover: { ...s.cover, ...patch } }));
  const artChoices = useMemo(() => {
    const seen = new Set();
    const out = [];
    const add = (url, label) => { if (url && !seen.has(url)) { seen.add(url); out.push({ url, label }); } };
    published.forEach(c => (c.scenes || []).forEach(sc => add(sc.imageUrl, sc.caption || c.title)));
    [...characters, ...npcs].forEach(e => add(e.avatarUrl, e.name));
    return out;
  }, [published, characters, npcs]);
  const coverImage = settings.cover.imageUrl || artChoices[0]?.url || '';
  // The spine follows the real page count once the server has printed the
  // interior; until then, the estimate — and the author can always type it.
  const coverPages = settings.cover.pageCount ?? (serverJob?.state === 'done' ? serverJob.pages : pages);
  const pageSource = settings.cover.pageCount != null
    ? 'as entered'
    : serverJob?.state === 'done' ? 'from your print-ready PDF' : 'estimated, so print the interior first for the exact count';
  const dims = coverDimensions({ trim: settings.trim, pages: coverPages, paper: settings.cover.paper });
  const coverTheme = COVER_THEMES.find(t => t.key === settings.cover.theme) || COVER_THEMES[0];
  const [artWidth, setArtWidth] = useState(0);
  const [blurbJob, setBlurbJob] = useState(null);
  const handleWriteBlurb = async () => {
    setBlurbJob({ state: 'working' });
    try {
      const blurb = await writeBlurb({
        bound: bindableChapters(published, settings), characters, title: settings.title,
        gameSystem: campaign?.gameSystem || 'daggerheart', apiKey
      });
      setCover({ blurb });
      setBlurbJob(null);
    } catch (err) {
      setBlurbJob({ state: 'error', message: err.message });
    }
  };

  // Printing the cover swaps the page rules and what's visible, then prints —
  // synchronously, for the same iPhone reason as the book — and swaps back
  // once the print dialog is done with.
  const [printTarget, setPrintTarget] = useState('book');
  useEffect(() => {
    const reset = () => setPrintTarget('book');
    window.addEventListener('afterprint', reset);
    return () => window.removeEventListener('afterprint', reset);
  }, []);
  const handlePrintCover = () => {
    flushSync(() => setPrintTarget('cover'));
    window.print();
  };

  // A ticking counter, so a minute-long print doesn't look frozen.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (serverJob?.state !== 'working' && coverJob?.state !== 'working') return;
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [serverJob?.state, coverJob?.state]);

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
    <div className={`bp-root ${printTarget === 'cover' ? 'bp-print-cover' : ''}`} style={style}>
      <style>{BOOK_FONT_CSS + (printTarget === 'cover' ? coverPageCss(dims) : pageCss(settings))}</style>

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

        {updateChapter && (
          <SecondDraftSection
            bound={bindableChapters(published, settings)}
            characters={characters}
            npcs={npcs}
            sessions={sessions}
            settings={settings}
            set={set}
            updateChapter={updateChapter}
            apiKey={apiKey}
            gameSystem={campaign?.gameSystem || 'daggerheart'}
          />
        )}

        <section className="bp-group">
          <h3>Back matter</h3>
          <Check label="Epilogue — where are they now" checked={settings.includeEpilogue} onChange={v => set({ includeEpilogue: v })} />
          {settings.includeEpilogue && (
            <>
              <label>Wishes for the epilogue
                <textarea
                  rows={2}
                  value={settings.epilogueGuidance || ''}
                  placeholder="Optional, e.g. Ten years later. Yargal runs an inn; Orwyn finally learns to haggle."
                  onChange={e => set({ epilogueGuidance: e.target.value })}
                />
              </label>
              {settings.epilogue?.prose && (
                <>
                  <label>Epilogue title
                    <input value={settings.epilogue.title || ''} onChange={e => set({ epilogue: { ...settings.epilogue, title: e.target.value } })} />
                  </label>
                  <label>Epilogue text (edit freely)
                    <textarea rows={8} value={settings.epilogue.prose} onChange={e => set({ epilogue: { ...settings.epilogue, prose: e.target.value } })} />
                  </label>
                </>
              )}
              <button
                type="button"
                className="bp-print-btn bp-print-btn-alt"
                onClick={handleWriteEpilogue}
                disabled={epilogueJob?.state === 'working' || book.chapters.length === 0}
              >
                <Wand2 size={16} />
                {epilogueJob?.state === 'working' ? 'Writing the epilogue…' : settings.epilogue?.prose ? 'Rewrite the epilogue' : 'Write the epilogue'}
              </button>
              {epilogueJob?.state === 'error' && <p className="bp-warn bp-note"><AlertTriangle size={14} /><span>{epilogueJob.message}</span></p>}
            </>
          )}
          <Check label="Glossary of places and lore" checked={settings.includeGlossary} onChange={v => set({ includeGlossary: v })} />
          {settings.includeGlossary && (
            <p className="bp-muted">
              {book.glossary.length
                ? `${book.glossary.length} entr${book.glossary.length === 1 ? 'y' : 'ies'} from your Locations and Lore that the book mentions.`
                : 'No Locations or Lore entries are mentioned in the book yet.'}
            </p>
          )}
        </section>

        <CoverSection
          settings={settings}
          setCover={setCover}
          dims={dims}
          pageSource={pageSource}
          artChoices={artChoices}
          imageUrl={coverImage}
          artDpi={artWidth ? frontArtDpi(artWidth, dims) : 0}
          onWriteBlurb={handleWriteBlurb}
          blurbJob={blurbJob}
        />

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
          {IS_IOS && (
            <p className="bp-warn bp-note">
              <AlertTriangle size={14} />
              <span>
                On iPhone and iPad, Safari prints on Letter/A4 paper without page numbers, so this makes a readable PDF
                but not the print-ready one. For the file you send to the printer, open this page in Chrome or Edge
                on a computer.
              </span>
            </p>
          )}
          <ol className="bp-steps">
            <li>Use <strong>Chrome or Edge on a computer</strong> (phones ignore the page size).</li>
            <li>Destination: <strong>Save as PDF</strong>.</li>
            <li>Margins <strong>Default</strong>, Scale <strong>100%</strong>.</li>
            <li>Tick <strong>Background graphics</strong>, untick <strong>Headers and footers</strong>.</li>
          </ol>
          <p className="bp-muted">The PDF is your book interior at exact trim size, fonts embedded. Upload it to Lulu, Blurb or KDP as the interior file.</p>
          <button type="button" className="bp-print-btn" onClick={handlePrint} disabled={book.chapters.length === 0 || !printReady}>
            <Printer size={16} /> {printReady ? 'Print / Save PDF' : `Preparing pages… (${pendingAssets})`}
          </button>
          {IS_IOS && (
            <p className="bp-muted">On iPhone: tap Print, then in the print preview tap the Share button and choose Save to Files.</p>
          )}
        </section>

        <section className="bp-group">
          <h3>Print-ready PDF from the server</h3>
          <p className="bp-muted">
            Works from any device, phones included: the server prints the book exactly as desktop Chrome would and saves
            the PDF to this campaign. Big books can take up to a minute.
          </p>
          <button
            type="button"
            className="bp-print-btn bp-print-btn-alt"
            onClick={() => handleServerPdf('book')}
            disabled={book.chapters.length === 0 || !printReady || serverJob?.state === 'working'}
          >
            <CloudCog size={16} />
            {serverJob?.state === 'working'
              ? `Binding your book… ${Math.round((Date.now() - serverJob.started) / 1000)}s`
              : 'Make print-ready PDF'}
          </button>
          {serverJob?.state === 'done' && (
            <a className="bp-download" href={serverJob.url} target="_blank" rel="noopener noreferrer">
              <Download size={15} />
              <span>Download PDF · {serverJob.pages} pages · {(serverJob.bytes / 1048576).toFixed(1)} MB</span>
            </a>
          )}
          {serverJob?.state === 'done' && serverJob.missing > 0 && (
            <p className="bp-warn bp-note">
              <AlertTriangle size={14} />
              <span>{serverJob.missing} image{serverJob.missing === 1 ? '' : 's'} couldn’t be loaded and printed as empty frames. Try again; if it keeps happening, regenerate or re-upload those pictures.</span>
            </p>
          )}
          {serverJob?.state === 'error' && (
            <p className="bp-warn bp-note"><AlertTriangle size={14} /><span>{serverJob.message}</span></p>
          )}
        </section>

        <section className="bp-group">
          <h3>Print the cover</h3>
          <p className="bp-muted">
            A separate {dims.width} × {dims.height} in PDF. Leave the bottom right of the back cover clear: printers put the barcode there.
          </p>
          <button type="button" className="bp-print-btn" onClick={handlePrintCover}>
            <Printer size={16} /> Print / Save cover PDF
          </button>
          <button
            type="button"
            className="bp-print-btn bp-print-btn-alt"
            onClick={() => handleServerPdf('cover')}
            disabled={coverJob?.state === 'working'}
          >
            <CloudCog size={16} />
            {coverJob?.state === 'working'
              ? `Printing the cover… ${Math.round((Date.now() - coverJob.started) / 1000)}s`
              : 'Make print-ready cover PDF'}
          </button>
          {coverJob?.state === 'done' && (
            <a className="bp-download" href={coverJob.url} target="_blank" rel="noopener noreferrer">
              <Download size={15} />
              <span>Download cover PDF · {(coverJob.bytes / 1048576).toFixed(1)} MB</span>
            </a>
          )}
          {coverJob?.state === 'error' && (
            <p className="bp-warn bp-note"><AlertTriangle size={14} /><span>{coverJob.message}</span></p>
          )}
        </section>
      </aside>

      <main className="bp-desk">
        <div ref={coverRef}>
          <CoverSheet
            settings={settings}
            dims={dims}
            theme={coverTheme}
            imageUrl={coverImage}
            onArtLoad={(e) => setArtWidth(e.currentTarget.naturalWidth || 0)}
          />
        </div>
        <article className="bp-book" ref={bookRef}>
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
          {book.epilogue && (
            <section className="bp-sheet bp-chapter bp-epilogue">
              <header className="bp-chapter-head">
                <span className="bp-chapter-num">Epilogue</span>
                <h2 className="bp-chapter-title">{book.epilogue.title}</h2>
                <Fleuron />
              </header>
              <div className="bp-prose">
                {book.epilogue.paragraphs.map((p, i) => (
                  <div key={i} className="bp-para"><ReactMarkdown>{p}</ReactMarkdown></div>
                ))}
              </div>
            </section>
          )}
          {book.glossary.length > 0 && (
            <section className="bp-sheet bp-glossary">
              <h2 className="bp-section-title">Glossary</h2>
              <dl>
                {book.glossary.map(g => (
                  <div key={g.term} className="bp-gloss-entry">
                    <dt><span className="bp-gloss-term">{g.term}</span> <span className="bp-gloss-kind">{g.kind}</span></dt>
                    {g.definition && <dd>{g.definition}</dd>}
                  </div>
                ))}
              </dl>
            </section>
          )}
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
            {book.epilogue && <li><span className="bp-contents-num" />Epilogue: {book.epilogue.title}</li>}
            {book.glossary.length > 0 && <li><span className="bp-contents-num" />Glossary</li>}
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
