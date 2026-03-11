import OpenAI, { toFile } from 'openai';
import busboy from 'busboy';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false, // Must disable body parser to use Busboy
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

  return new Promise((resolve, reject) => {
    let audioBuffer = null;
    let fileName = 'audio.webm';
    let mimeType = 'audio/webm';

    const bb = busboy({ headers: req.headers });

    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType: _mimeType } = info;
      const chunks = [];
      file.on('data', (data) => {
        chunks.push(data);
      }).on('end', () => {
        audioBuffer = Buffer.concat(chunks);
        fileName = filename;
        if (_mimeType) mimeType = _mimeType;
      });
    });

    bb.on('field', (name, val) => {
      if (name === 'mimeType') {
        mimeType = val;
      }
    });

    bb.on('finish', async () => {
      try {
        if (!audioBuffer) {
           res.status(400).json({ error: 'No audio file found in request' });
           return resolve();
        }

        if (audioBuffer.length < 100) {
           res.status(400).json({ error: `Audio buffer too small (${audioBuffer.length} bytes), recording failed.` });
           return resolve();
        }
        
        console.log(`Received audio upload: ${fileName}, size: ${audioBuffer.length}, type: ${mimeType}`);

        // Choose extension based on mimeType
        const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
        
        // OpenAI SDK utility to convert buffer to File-like object
        const file = await toFile(audioBuffer, `audio.${ext}`, { type: mimeType });
        
        console.log('Sending to OpenAI Whisper API...');
        const transcription = await openai.audio.transcriptions.create({
          file: file,
          model: 'whisper-1',
        });

        console.log('Transcription successful:', transcription.text);
        res.status(200).json({ text: transcription.text });
        return resolve();
      } catch (error) {
        console.error('Transcription error:', error);
        res.status(500).json({ 
          error: 'Failed to transcribe audio', 
          message: error.message 
        });
        return resolve();
      }
    });

    bb.on('error', (err) => {
       console.error('Busboy error:', err);
       res.status(500).json({ error: 'Error parsing form data' });
       return resolve();
    });

    req.pipe(bb);
  });
}
