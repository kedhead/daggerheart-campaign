import { useState } from 'react';
import { AlertTriangle, Wand2 } from 'lucide-react';
import { PAPER_TYPES, COVER_THEMES, MIN_SPINE_TEXT_PAGES, printDpi } from '../../utils/bookLayout';

/* ─────────────────────────────────────────────────────────────────────────────
   The wraparound cover: back, spine and front on one sheet with bleed all
   round, at real size in inches. On screen it is shown scaled down with trim
   and spine guides; printed, it is the cover file a printer asks for.
   ──────────────────────────────────────────────────────────────────────────── */

const SCREEN_PX_PER_IN = 96;
const PREVIEW_MAX_PX = 860;

export function CoverSheet({ settings, dims, theme, imageUrl, onArtLoad }) {
  const blurb = (settings.cover.blurb || '').split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const zoom = Math.min(1, PREVIEW_MAX_PX / (dims.width * SCREEN_PX_PER_IN));
  const style = {
    width: `${dims.width}in`,
    height: `${dims.height}in`,
    '--cv-bleed': `${dims.bleed}in`,
    '--cv-trim-w': `${dims.trimWidth}in`,
    '--cv-spine': `${dims.spine}in`,
    '--cv-bg': theme.bg,
    '--cv-ink': theme.ink,
    '--cv-soft': theme.soft,
    '--cv-zoom': zoom
  };
  return (
    <div className="bp-cover-wrap">
      <div className="bp-cover" style={style}>
        <div className="bp-cover-back">
          <div className="bp-cover-blurb">
            {blurb.length ? blurb.map((p, i) => <p key={i}>{p}</p>) : <p className="bp-cover-placeholder">Your back-cover blurb goes here.</p>}
          </div>
          <div className="bp-cover-back-foot">
            <div className="bp-cover-rule" aria-hidden="true" />
            <span>{settings.byline || settings.title}</span>
          </div>
        </div>

        <div className="bp-cover-spine">
          {dims.spineText && (
            <div className="bp-cover-spine-text">
              <span className="bp-cover-spine-title">{settings.title}</span>
            </div>
          )}
        </div>

        <div className="bp-cover-front">
          {imageUrl && <img src={imageUrl} alt="" className="bp-cover-art" onLoad={onArtLoad} />}
          <div className="bp-cover-shade" aria-hidden="true" />
          <div className="bp-cover-front-title">
            <h1>{settings.title}</h1>
            {settings.subtitle && <p>{settings.subtitle}</p>}
          </div>
          {settings.byline && <div className="bp-cover-front-byline">{settings.byline}</div>}
        </div>

        {/* Screen-only guides: where the printer trims, and the spine folds. */}
        <div className="bp-cover-guide bp-cover-guide-trim" aria-hidden="true" />
        <div className="bp-cover-guide bp-cover-guide-spine-l" aria-hidden="true" />
        <div className="bp-cover-guide bp-cover-guide-spine-r" aria-hidden="true" />
      </div>
    </div>
  );
}

export function CoverSection({ settings, setCover, dims, pageSource, artChoices, imageUrl, artDpi, onWriteBlurb, blurbJob }) {
  const [showArt, setShowArt] = useState(false);
  return (
    <section className="bp-group">
      <h3>Cover</h3>
      <p className="bp-muted">
        One wraparound sheet (back, spine, front) with {dims.bleed} in of bleed, sized to your page count. Printers ask for it
        as a separate file from the interior.
      </p>

      <label>Theme
        <select value={settings.cover.theme} onChange={e => setCover({ theme: e.target.value })}>
          {COVER_THEMES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </label>
      <label>Paper
        <select value={settings.cover.paper} onChange={e => setCover({ paper: e.target.value })}>
          {PAPER_TYPES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </label>
      <label>Page count
        <input
          type="number"
          min="2"
          inputMode="numeric"
          value={settings.cover.pageCount ?? ''}
          placeholder={String(dims.pages)}
          onChange={e => setCover({ pageCount: e.target.value ? Math.max(2, parseInt(e.target.value, 10) || 2) : null })}
        />
      </label>
      <p className="bp-muted">
        Spine {dims.spine} in for {dims.pages} pages ({pageSource}). Sheet {dims.width} × {dims.height} in.
        {!dims.spineText && ` Spine title appears from ${MIN_SPINE_TEXT_PAGES} pages, as printers require.`}
      </p>

      <div>
        <button type="button" className="bp-sd-link" onClick={() => setShowArt(v => !v)}>
          {showArt ? 'Hide cover art choices' : 'Choose the front cover art'}
        </button>
        {showArt && (
          <div className="bp-art-grid">
            {artChoices.map(a => (
              <button
                key={a.url}
                type="button"
                className={`bp-art-choice ${a.url === imageUrl ? 'on' : ''}`}
                onClick={() => setCover({ imageUrl: a.url })}
                title={a.label}
              >
                <img src={a.url} alt={a.label} />
              </button>
            ))}
            {artChoices.length === 0 && <p className="bp-muted">No illustrations or portraits yet.</p>}
          </div>
        )}
      </div>
      {artDpi > 0 && artDpi < 200 && (
        <p className="bp-warn bp-note">
          <AlertTriangle size={14} />
          <span>The front art prints at about {artDpi} DPI. It will look soft up close. 300 is ideal; an upscaled image prints sharper.</span>
        </p>
      )}

      <label>Back-cover blurb
        <textarea rows={5} value={settings.cover.blurb} placeholder="A hook, the company, the stakes, a question…" onChange={e => setCover({ blurb: e.target.value })} />
      </label>
      <button type="button" className="bp-print-btn bp-print-btn-alt" onClick={onWriteBlurb} disabled={blurbJob?.state === 'working'}>
        <Wand2 size={16} />
        {blurbJob?.state === 'working' ? 'Writing the blurb…' : settings.cover.blurb ? 'Rewrite the blurb' : 'Write the blurb'}
      </button>
      {blurbJob?.state === 'error' && <p className="bp-warn bp-note"><AlertTriangle size={14} /><span>{blurbJob.message}</span></p>}
    </section>
  );
}

/** Effective DPI of the front art across the front panel plus its bleed. */
export function frontArtDpi(pixelWidth, dims) {
  return printDpi(pixelWidth, dims.trimWidth + dims.bleed);
}
