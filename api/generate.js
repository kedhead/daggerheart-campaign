/**
 * Vercel Serverless Function - AI Generation Proxy
 * Proxies requests to Anthropic/OpenAI APIs to avoid CORS issues
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, apiKey, provider, model } = req.body;

    if (!prompt || !provider) {
      return res.status(400).json({ error: 'Missing required fields: prompt, provider' });
    }

    // Use client-provided key, or fall back to server-side environment variables
    const effectiveKey = apiKey ||
      (provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY) ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (!effectiveKey) {
      return res.status(400).json({ error: 'No API key available. Provide one or configure server environment variables.' });
    }

    let response;

    if (provider === 'anthropic') {
      // Call Anthropic API
      const apiModel = model || 'claude-haiku-4-5-20251001';

      const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': effectiveKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: apiModel,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        console.error('Anthropic API error:', error);
        return res.status(apiResponse.status).json({
          error: `Anthropic API error: ${apiResponse.statusText}`,
          details: error
        });
      }

      const data = await apiResponse.json();
      response = data.content[0]?.text || '';

    } else if (provider === 'openai') {
      // Call OpenAI API
      const apiModel = model || 'gpt-4o';

      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveKey}`
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4096,
          temperature: 0.7
        })
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        console.error('OpenAI API error:', error);
        return res.status(apiResponse.status).json({
          error: `OpenAI API error: ${apiResponse.statusText}`,
          details: error
        });
      }

      const data = await apiResponse.json();
      response = data.choices[0]?.message?.content || '';

    } else {
      return res.status(400).json({ error: 'Invalid provider. Must be "anthropic" or "openai"' });
    }

    // Return the generated text
    return res.status(200).json({ response });

  } catch (error) {
    console.error('Generate API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
