/**
 * Vercel Serverless Function — Demiplane URL Character Import
 * Launches a headless Chromium browser to render the Demiplane share link,
 * extracts character data from the rendered page, and parses it with Claude.
 */

import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium } from 'playwright-core';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: { sizeLimit: '1mb' },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url || !url.includes('demiplane.com')) {
    return res.status(400).json({ error: 'A valid Demiplane character sheet URL is required.' });
  }

  const anthropicKey = process.env.ANTHROPIC_MODEL;
  if (!anthropicKey) {
    return res.status(500).json({ error: 'ANTHROPIC_MODEL is not configured on the server.' });
  }

  let browser;
  try {
    // Launch headless Chromium — @sparticuz/chromium downloads the binary to /tmp on first cold start
    browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900 },
      locale: 'en-US',
    });

    const page = await context.newPage();

    // Navigate and wait for the character sheet to fully render
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

    // Give React/JS extra time to populate character data
    await page.waitForTimeout(3000);

    // Extract all meaningful text from the rendered page
    const pageText = await page.evaluate(() => {
      // Remove script/style/nav noise
      const noise = document.querySelectorAll('script, style, nav, footer, [aria-hidden="true"]');
      noise.forEach(el => el.remove());
      return document.body.innerText;
    });

    // Also grab a screenshot for Claude Vision as a fallback/supplement
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotBase64 = screenshotBuffer.toString('base64');

    await browser.close();
    browser = null;

    if (!pageText || pageText.trim().length < 100) {
      return res.status(422).json({
        error: 'Could not read the character sheet. Make sure the link is a public Demiplane share link.'
      });
    }

    // Send both the extracted text AND screenshot to Claude for highest accuracy
    const prompt = `You are reading a Daggerheart TTRPG character sheet from Demiplane.
You have both the page text and a screenshot to work from.
Extract all character data and return ONLY a valid JSON object matching this schema.
Use empty strings, 0, or empty arrays for any field not found — do NOT guess.

Valid classes: Bard, Druid, Guardian, Ranger, Rogue, Seraph, Sorcerer, Warrior, Wizard
Valid domains: Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor
Trait values are integers from -2 to +3.

{
  "name": "",
  "playerName": "",
  "class": "",
  "subclass": "",
  "level": 1,
  "ancestry": "",
  "community": "",
  "traits": { "agility": 0, "strength": 0, "finesse": 0, "instinct": 0, "presence": 0, "knowledge": 0 },
  "evasion": 10,
  "armor": 0,
  "primaryDomain": "",
  "secondaryDomain": "",
  "domainCards": [],
  "primaryWeapon": "",
  "secondaryWeapon": "",
  "equippedArmor": "",
  "gold": 0,
  "inventory": "",
  "experiences": [],
  "backstory": "",
  "playerNotes": ""
}

PAGE TEXT:
${pageText.substring(0, 8000)}

Return ONLY the JSON object. No markdown, no explanation.`;

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/png', data: screenshotBase64 },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      const err = await apiResponse.json().catch(() => ({}));
      return res.status(502).json({ error: `Claude API error: ${err.error?.message || apiResponse.statusText}` });
    }

    const aiData = await apiResponse.json();
    const rawJson = aiData.content?.[0]?.text?.trim();

    if (!rawJson) {
      return res.status(502).json({ error: 'Claude returned an empty response.' });
    }

    const cleaned = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const character = JSON.parse(cleaned);

    return res.status(200).json({ character });

  } catch (err) {
    if (browser) await browser.close().catch(() => {});

    console.error('import-from-url error:', err);

    if (err.message?.includes('TimeoutError') || err.message?.includes('timeout')) {
      return res.status(504).json({
        error: 'The page took too long to load. Make sure the link is correct and publicly shared.'
      });
    }
    if (err instanceof SyntaxError) {
      return res.status(422).json({ error: 'Failed to parse Claude response. Try again.' });
    }
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
