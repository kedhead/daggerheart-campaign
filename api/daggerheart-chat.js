
import fs from 'fs';
import path from 'path';

/**
 * Vercel Serverless Function - Daggerheart AI Chat
 * Uses the extracted PDF text as context for the AI
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
        const { message, history = [], apiKey, provider = 'anthropic' } = req.body;

        if (!message) {
            console.error('Missing message in request body');
            return res.status(400).json({ error: 'Missing required field: message' });
        }

        console.log('Received request:', { provider, messageLength: message.length, hasHistory: history.length > 0 });

        // Load rules data dynamically using fs
        let rulesContent = '';
        try {
            const rulesPath = path.join(process.cwd(), 'api', 'daggerheart-rules.json');
            console.log('Loading rules from:', rulesPath);
            if (fs.existsSync(rulesPath)) {
                const fileData = fs.readFileSync(rulesPath, 'utf8');
                const rulesJson = JSON.parse(fileData);
                rulesContent = rulesJson.content || '';
            } else {
                console.warn('Warning: daggerheart-rules.json not found at', rulesPath);
                // Fallback attempt for Vercel's runtime directory structure if process.cwd() is different
                const altPath = path.join(__dirname, 'daggerheart-rules.json');
                if (fs.existsSync(altPath)) {
                    console.log('Found rules at alt path:', altPath);
                    const fileData = fs.readFileSync(altPath, 'utf8');
                    const rulesJson = JSON.parse(fileData);
                    rulesContent = rulesJson.content || '';
                }
            }
        } catch (err) {
            console.error('Error loading rules file:', err);
        }

        if (!rulesContent) {
            console.error('Rules content is empty after loading attempt');
        }

        // Prepare system prompt with rules context
        // We truncate the context if it's too large, though Claude 200k+ context should handle it fine.
        const systemPrompt = `You are a helpful and knowledgeable AI Game Master assistant for the tabletop roleplaying game "Daggerheart". 
    
You have access to the full core rulebook content below. Use this information to answer the user's questions accurately.
If the answer cannot be found in the provided text, state that you don't know based on the current rules, but try to provide helpful general RPG advice if applicable, while making it clear it's not official Daggerheart rules.

Cite the section or page number if possible (though page numbers might be lost in extraction, section headers should be present).

Tone: Helpful, encouraging, and thematic. You are speaking to a player or GM of Daggerheart.

=== DAGGERHEART CORE RULEBOOK CONTENT ===
${rulesContent.substring(0, 150000)} 
=== END RULEBOOK CONTENT ===
(Note: Content may be truncated if too long, but contains the bulk of the rules)
`;

        let responseText = '';

        if (provider === 'anthropic' || provider === 'claude') {
            const key = apiKey || process.env.ANTHROPIC_API_KEY;
            if (!key) {
                return res.status(500).json({ error: 'Server configuration error: Missing Anthropic API Key' });
            }

            const messages = [
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];

            const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: messages
                })
            });

            if (!apiResponse.ok) {
                const error = await apiResponse.text();
                console.error('Anthropic API error:', error);
                throw new Error(`Anthropic API error: ${apiResponse.statusText} - ${error}`);
            }

            const data = await apiResponse.json();
            responseText = data.content[0]?.text || '';

        } else if (provider === 'openai') {
            const key = apiKey || process.env.OPENAI_API_KEY;
            if (!key) {
                return res.status(500).json({ error: 'Server configuration error: Missing OpenAI API Key' });
            }

            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];

            const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo-preview',
                    messages: messages,
                    max_tokens: 4096,
                    temperature: 0.7
                })
            });

            if (!apiResponse.ok) {
                const error = await apiResponse.text();
                console.error('OpenAI API error:', error);
                throw new Error(`OpenAI API error: ${apiResponse.statusText} - ${error}`);
            }

            const data = await apiResponse.json();
            responseText = data.choices[0]?.message?.content || '';
        } else if (provider === '1min') {
            const key = apiKey || process.env.min_api || process.env.MIN_API_KEY;

            if (!key) {
                return res.status(500).json({ error: 'Server configuration error: Missing 1min.ai API Key' });
            }

            const messages = [
                { role: 'system', content: systemPrompt },
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];

            // 1min.ai typically uses OpenAI-compatible structure
            const apiResponse = await fetch('https://api.1min.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o', // Using a high quality model available via 1min
                    messages: messages,
                    max_tokens: 4096,
                    temperature: 0.7
                })
            });

            if (!apiResponse.ok) {
                const error = await apiResponse.text();
                console.error('1min.ai API error:', error);
                throw new Error(`1min.ai API error: ${apiResponse.statusText} - ${error}`);
            }

            const data = await apiResponse.json();
            responseText = data.choices[0]?.message?.content || '';
        } else {
            return res.status(400).json({ error: 'Invalid provider' });
        }

        return res.status(200).json({ response: responseText });

    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
