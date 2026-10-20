/**
 * Static font files for the printed book.
 *
 * The app's Google Fonts link serves variable fonts, and Chromium embeds
 * those in a PDF as Type 3 fonts — which print services (Lulu among them)
 * flag or reject. These static instances embed as ordinary TrueType. They get
 * their own family names so they never fight the Google faces elsewhere.
 */
import garamond400 from '@fontsource/eb-garamond/files/eb-garamond-latin-400-normal.woff2';
import garamond400Ext from '@fontsource/eb-garamond/files/eb-garamond-latin-ext-400-normal.woff2';
import garamond400i from '@fontsource/eb-garamond/files/eb-garamond-latin-400-italic.woff2';
import garamond400iExt from '@fontsource/eb-garamond/files/eb-garamond-latin-ext-400-italic.woff2';
import garamond600 from '@fontsource/eb-garamond/files/eb-garamond-latin-600-normal.woff2';
import garamond600Ext from '@fontsource/eb-garamond/files/eb-garamond-latin-ext-600-normal.woff2';
import cinzel400 from '@fontsource/cinzel/files/cinzel-latin-400-normal.woff2';
import cinzel600 from '@fontsource/cinzel/files/cinzel-latin-600-normal.woff2';
import cinzel700 from '@fontsource/cinzel/files/cinzel-latin-700-normal.woff2';

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

const face = (family, url, weight, style = 'normal', range = LATIN) =>
  `@font-face { font-family: '${family}'; src: url('${url}') format('woff2'); font-weight: ${weight}; font-style: ${style}; font-display: block; unicode-range: ${range}; }`;

export const BOOK_FONT_CSS = [
  face('Book Garamond', garamond400, 400),
  face('Book Garamond', garamond400Ext, 400, 'normal', LATIN_EXT),
  face('Book Garamond', garamond400i, 400, 'italic'),
  face('Book Garamond', garamond400iExt, 400, 'italic', LATIN_EXT),
  face('Book Garamond', garamond600, 600),
  face('Book Garamond', garamond600Ext, 600, 'normal', LATIN_EXT),
  face('Book Cinzel', cinzel400, 400),
  face('Book Cinzel', cinzel600, 600),
  face('Book Cinzel', cinzel700, 700)
].join('\n');

/**
 * The same faces with each file inlined as a data: URL, for printing on the
 * server: its browser may only load data: fonts (api/_lib/bookRender.js), and
 * a preview deployment's own URLs can sit behind Vercel's login anyway.
 */
export async function inlineBookFontCss() {
  const urls = [...new Set([...BOOK_FONT_CSS.matchAll(/url\('([^']+)'\)/g)].map(m => m[1]))];
  const inlined = await Promise.all(urls.map(async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load a book font (${res.status}).`);
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return [url, dataUrl];
  }));
  return inlined.reduce((css, [url, dataUrl]) => css.split(`url('${url}')`).join(`url('${dataUrl}')`), BOOK_FONT_CSS);
}
