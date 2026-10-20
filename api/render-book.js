/**
 * Vercel Serverless Function — print the Book Press to a print-ready PDF.
 *
 * Phones can't make the book PDF themselves: Safari on iOS ignores @page sizes
 * and page-margin boxes, so its PDF comes out on Letter/A4 with no folios.
 * The browser sends the book it laid out, headless Chromium prints it exactly
 * as desktop Chrome would, and the PDF goes to the campaign's storage — the
 * response can't carry it, as Vercel caps responses at 4.5 MB and an
 * illustrated book is far bigger.
 */

import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium } from 'playwright-core';
import { requireUser, bearerToken, ALLOWED_HEADERS } from './_lib/auth.js';
import {
  readBookRequest, buildBookDocument, isAllowedAssetUrl, countPdfPages, bookStoragePath, uploadToStorage
} from './_lib/bookRender.js';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: { sizeLimit: '4mb' },
  },
};

// Leave time inside the 60 s limit for the PDF itself and the upload.
const LOAD_TIMEOUT_MS = 25000;

async function launchServerChromium() {
  return playwrightChromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

// Tests swap in a local browser and a fake upload, as auth.js does for tokens.
let launchBrowser = launchServerChromium;
let upload = uploadToStorage;
export function setBookRenderDepsForTests({ launch, uploader } = {}) {
  launchBrowser = launch || launchServerChromium;
  upload = uploader || uploadToStorage;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireUser(req, res);
  if (!user) return;

  const book = readBookRequest(req.body);
  if (book.error) return res.status(400).json({ error: book.error });

  const bucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;
  if (!bucket) return res.status(500).json({ error: 'Storage bucket is not configured on the server.' });

  let browser;
  try {
    browser = await launchBrowser();
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.route('**/*', (route) => (
      isAllowedAssetUrl(route.request().url()) ? route.continue() : route.abort('blockedbyclient')
    ));

    await page.setContent(buildBookDocument(book), { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    // Images that didn't arrive — refused by the filter, an expired link, a
    // deleted file — would print as empty frames, so the reply says how many.
    // (Playwright's own evaluate still runs with the page's scripts off.)
    const missing = await page.evaluate(() => [...document.images].filter(img => !img.naturalWidth).length);

    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    await browser.close();
    browser = null;

    const path = bookStoragePath(book.campaignId, book.title);
    const url = await upload({ bucket, path, bytes: pdf, idToken: bearerToken(req) });

    return res.status(200).json({
      url,
      pages: countPdfPages(pdf),
      bytes: pdf.length,
      missing
    });
  } catch (err) {
    console.error('[render-book]', err);
    const timedOut = /timeout/i.test(err?.message || '');
    const forbidden = err?.status === 403;
    return res.status(timedOut ? 504 : forbidden ? 403 : 500).json({
      error: timedOut
        ? 'The book took too long to print. Leave some chapters out and print it in parts.'
        : forbidden
          ? 'You don’t have permission to save files to this campaign.'
          : `Could not print the book: ${err?.message || 'unknown error'}`
    });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
