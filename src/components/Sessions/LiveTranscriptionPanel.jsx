import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, FileText, Check, AlertCircle, Copy, Play } from 'lucide-react';

export default function LiveTranscriptionPanel({ onNotesGenerated }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Format seconds into MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    setError(null);
    setGeneratedNotes('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const supportedMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      let selectedMimeType = 'audio/webm';
      for (const mimeType of supportedMimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      console.log('Using MIME type:', selectedMimeType);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        // Wait a tiny bit for the final ondataavailable to fire
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        await processAudio(audioBlob, selectedMimeType);
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob, mimeType = 'audio/webm') => {
    try {
      const formData = new FormData();
      // Whisper usually expects .webm, .mp3, .mp4, .m4a
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
      formData.append('audio', blob, `audio.${ext}`);
      formData.append('mimeType', mimeType);

      // 2. Transcribe Audio
      const transcribeRes = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData // Note: Content-Type is set automatically by the browser for FormData
      });

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json();
        throw new Error(errData.error || 'Failed to transcribe audio');
      }

      const { text: transcript } = await transcribeRes.json();
      
      if (!transcript || transcript.trim() === '') {
        throw new Error('Transcription returned empty text. Please try speaking closer to the microphone.');
      }

      // 3. Generate Notes from Transcript
      const notesRes = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      });

      if (!notesRes.ok) {
        const errData = await notesRes.json();
        throw new Error(errData.error || 'Failed to generate notes');
      }

      const { notes } = await notesRes.json();
      setGeneratedNotes(notes);
      if (onNotesGenerated) {
        onNotesGenerated(notes);
      }
      setIsProcessing(false);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || 'An error occurred during processing.');
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-white/40'}`}>
            <Mic size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Live Transcription</h3>
            <p className="text-sm text-white/50">Record session chat and generate DM notes automatically</p>
          </div>
        </div>
        {isRecording && (
          <div className="text-2xl font-mono font-bold text-red-400">
            {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} />
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-center py-4 border-y border-white/5">
        {!isRecording && !isProcessing && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-all shadow-lg shadow-red-900/20"
          >
            <Mic size={20} />
            Start Recording
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full font-bold transition-all"
          >
            <Square size={20} className="fill-white" />
            Stop & Generate Notes
          </button>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 text-white/70">
            <Loader2 size={24} className="animate-spin text-[rgb(var(--color-primary))]" />
            <span className="font-medium">Transcribing & formatting notes... this may take a minute.</span>
          </div>
        )}
      </div>

      {generatedNotes && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-[rgb(var(--color-primary))]" />
              Generated Notes
            </h4>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-4 bg-black/30 border border-white/10 rounded-lg max-h-[400px] overflow-y-auto custom-scrollbar prose prose-invert max-w-none">
            {generatedNotes.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-white/90">{line.replace('## ', '')}</h3>;
              if (line.startsWith('# ')) return <h2 key={i} className="text-xl font-bold mt-5 mb-3 text-white">{line.replace('# ', '')}</h2>;
              if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-white/70">{line.replace('- ', '')}</li>;
              return <p key={i} className="text-white/80 min-h-[1rem]">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
