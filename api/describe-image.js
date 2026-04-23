/**
 * Vercel Serverless Function - Vision describe helper
 *
 * Uses GPT-4o-mini vision to produce a concise physical description of a
 * character portrait. Used by the storybook orchestrator so we can redraw
 * existing characters in a different art style while preserving their
 * likeness (DALL-E 3 is text-only, so we describe-then-redraw).
 */

import OpenAI from 'openai';

export const config = {
  maxDuration: 30
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageUrl, apiKey: clientApiKey, subjectHint } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'Missing required field: imageUrl' });

    const effectiveKey = clientApiKey || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!effectiveKey) {
      return res.status(500).json({ error: 'No OpenAI API key available.' });
    }

    const openai = new OpenAI({ apiKey: effectiveKey });

    const instruction = [
      'Describe the physical appearance of the subject in this image in 1-2 tight sentences,',
      'written as a brief for an illustrator who will redraw them in a different art style.',
      'Cover: species or ancestry, hair, eyes, skin tone, outfit, signature gear, notable features.',
      'Avoid narrative flourish, mood words, or scene details. Just the look of the subject.'
    ].join(' ');

    const userText = subjectHint
      ? `Subject: ${subjectHint}. ${instruction}`
      : instruction;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 180,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ]
    });

    const description = completion.choices[0]?.message?.content?.trim() || '';
    return res.status(200).json({ description });
  } catch (err) {
    console.error('describe-image error:', err);
    return res.status(500).json({
      error: 'Failed to describe image',
      message: err.message
    });
  }
}
