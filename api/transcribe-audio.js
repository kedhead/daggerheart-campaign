import OpenAI, { toFile } from 'openai';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
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
    const { audioData, mimeType = 'audio/webm' } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    console.log('Received audio transcription request, length:', audioData.length);

    // Convert base64 data URL or raw base64 to buffer
    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Choose extension based on mimeType
    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
    
    // OpenAI SDK utility to convert buffer to File-like object
    const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });
    
    console.log('Sending to OpenAI Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });

    console.log('Transcription successful');
    return res.status(200).json({ text: transcription.text });

  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ 
      error: 'Failed to transcribe audio', 
      message: error.message 
    });
  }
}
