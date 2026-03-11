import OpenAI from 'openai';

export const config = {
  maxDuration: 60
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { transcript } = req.body;
    
    if (!transcript) {
        return res.status(400).json({ error: 'No transcript provided' });
    }

    console.log('Generating notes for transcript length:', transcript.length);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert D&D/tabletop RPG note-taker. 
Your job is to read a raw, unformatted transcript of a live game session and organize it into clear, easy-to-read session notes.
Whisper generated this transcript, so there is no speaker ID. You must identify who is speaking based on context (e.g. the DM describing the world, players rolling dice or making actions/jokes).

Organize the notes into logical sections:
- Key Events & Story Progress
- DM Notes (NPCs met, locations visited, important descriptions)
- Player Actions & Decisions
- Loot & Items
- Raw Quotes (A few funny or important direct quotes from the transcript)

Format the output strictly as Markdown.`
        },
        {
          role: 'user',
          content: transcript
        }
      ]
    });

    console.log('Note generation successful');
    return res.status(200).json({ notes: completion.choices[0].message.content });

  } catch (err) {
    console.error('Error generating notes:', err);
    return res.status(500).json({ 
      error: 'Failed to generate notes',
      message: err.message 
    });
  }
}
