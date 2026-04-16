import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audioData, mimeType } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save locally
    const filePath = path.join(process.cwd(), 'debug-audio.webm');
    fs.writeFileSync(filePath, buffer);
    
    console.log(`Saved audio to ${filePath}, size: ${buffer.length}`);

    return res.status(200).json({ success: true, size: buffer.length });

  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Failed' });
  }
}
