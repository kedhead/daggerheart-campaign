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
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a note-taker for a tabletop RPG session. You will receive a raw transcript of spoken words.

CRITICAL RULES:
1. You must ONLY use information that is EXPLICITLY stated in the transcript. 
2. DO NOT invent, fabricate, or hallucinate ANY names, events, locations, items, or dialogue that is not in the transcript.
3. If the transcript does not contain any RPG/game content, simply return the transcript as-is under a "## Raw Transcript" heading. Do NOT try to force it into RPG categories.
4. If the transcript is very short, just return what was said. Do not expand or elaborate.

If the transcript DOES contain actual RPG session content, organize it into these sections (only include sections that have real content from the transcript):
- Key Events & Story Progress
- DM Notes (NPCs met, locations visited, important descriptions)
- Player Actions & Decisions
- Loot & Items
- Notable Quotes (direct quotes from the transcript only)

Format the output as Markdown. Remember: accuracy over creativity. Only write what was actually said.`
        },
        {
          role: 'user',
          content: `Here is the raw transcript to organize into notes. Remember, ONLY use information from this transcript, do not make anything up:\n\n${transcript}`
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
