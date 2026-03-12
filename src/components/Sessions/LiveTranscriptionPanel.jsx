import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, FileText, Check, AlertCircle, Copy, Volume2, Settings } from 'lucide-react';

export default function LiveTranscriptionPanel({ onNotesGenerated }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Mic test state
  const [isTesting, setIsTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [testPlaybackUrl, setTestPlaybackUrl] = useState(null);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const testStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const testRecorderRef = useRef(null);
  const testChunksRef = useRef([]);

  // Format seconds into MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Load available audio devices
  useEffect(() => {
    async function loadDevices() {
      try {
        // Need to request permission first to get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Could not enumerate devices:', err);
      }
    }
    loadDevices();
  }, []);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicTest();
      if (testPlaybackUrl) URL.revokeObjectURL(testPlaybackUrl);
    };
  }, []);

  const getAudioConstraints = () => {
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    };
    if (selectedDeviceId) {
      constraints.audio.deviceId = { exact: selectedDeviceId };
    }
    return constraints;
  };

  // ─── Mic Test ───────────────────────────────────────────────
  const startMicTest = async () => {
    setError(null);
    setTestPlaybackUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints());
      testStreamRef.current = stream;

      // Set up analyser for level meter
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = { analyser, audioCtx };

      // Start a short test recording so they can play it back
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      const testRecorder = new MediaRecorder(stream, { mimeType });
      testChunksRef.current = [];
      testRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) testChunksRef.current.push(e.data);
      };
      testRecorderRef.current = testRecorder;
      testRecorder.start(500);

      setIsTesting(true);

      // Animate level meter
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      console.error('Mic test error:', err);
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.audioCtx.close();
      analyserRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(t => t.stop());
      testStreamRef.current = null;
    }
    // Create playback from test recording
    if (testRecorderRef.current && testRecorderRef.current.state !== 'inactive') {
      testRecorderRef.current.onstop = () => {
        if (testChunksRef.current.length > 0) {
          const blob = new Blob(testChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setTestPlaybackUrl(url);
        }
      };
      testRecorderRef.current.stop();
    }
    setIsTesting(false);
    setAudioLevel(0);
  };

  // ─── Recording ──────────────────────────────────────────────
  const startRecording = async () => {
    setError(null);
    setGeneratedNotes('');
    setTestPlaybackUrl(null);
    
    // Stop any running mic test
    if (isTesting) stopMicTest();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints());

      // Set up live level meter during recording too
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = { analyser, audioCtx };

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

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
          console.log(`Chunk received: ${event.data.size} bytes (total chunks: ${audioChunksRef.current.length})`);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop level meter
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (analyserRef.current) {
          analyserRef.current.audioCtx.close();
          analyserRef.current = null;
        }
        setAudioLevel(0);

        setIsProcessing(true);
        
        // Wait a tiny bit for the final ondataavailable to fire
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        console.log(`Final blob: ${audioBlob.size} bytes from ${audioChunksRef.current.length} chunks`);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        if (audioBlob.size < 1000) {
          setError('Recording was too short or empty. Please speak louder and record for at least a few seconds.');
          setIsProcessing(false);
          return;
        }

        await processAudio(audioBlob, selectedMimeType);
      };

      mediaRecorder.start(1000);
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
      const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
      formData.append('audio', blob, `audio.${ext}`);
      formData.append('mimeType', mimeType);

      const transcribeRes = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData
      });

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json();
        throw new Error(errData.error || 'Failed to transcribe audio');
      }

      const { text: transcript } = await transcribeRes.json();
      
      if (!transcript || transcript.trim() === '') {
        throw new Error('Transcription returned empty text. Please try speaking closer to the microphone.');
      }

      console.log('Whisper transcript:', transcript);

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

  // ─── Audio level bar color ──────────────────────────────────
  const getLevelColor = () => {
    if (audioLevel < 15) return 'bg-red-500';
    if (audioLevel < 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLevelLabel = () => {
    if (audioLevel < 5) return 'No signal';
    if (audioLevel < 15) return 'Very quiet';
    if (audioLevel < 40) return 'Good';
    return 'Strong';
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : isTesting ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
            <Mic size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Live Transcription</h3>
            <p className="text-sm text-white/50">Record session chat and generate DM notes automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="text-2xl font-mono font-bold text-red-400">
              {formatTime(recordingTime)}
            </div>
          )}
          <button
            onClick={() => setShowDeviceSettings(!showDeviceSettings)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            title="Audio settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Device selector */}
      {showDeviceSettings && (
        <div className="p-3 bg-black/20 border border-white/5 rounded-lg space-y-2">
          <label className="text-sm font-medium text-white/70">Microphone</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Audio level meter — shown during test or recording */}
      {(isTesting || isRecording) && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 flex items-center gap-1">
              <Volume2 size={12} /> Mic Level
            </span>
            <span className={`font-medium ${audioLevel < 15 ? 'text-red-400' : audioLevel < 40 ? 'text-yellow-400' : 'text-green-400'}`}>
              {getLevelLabel()}
            </span>
          </div>
          <div className="h-3 bg-black/30 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-100 ${getLevelColor()}`}
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} />
          <p>{error}</p>
        </div>
      )}

      {/* Test playback */}
      {testPlaybackUrl && (
        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg space-y-2">
          <p className="text-sm text-green-400 font-medium">🎧 Play back your test recording:</p>
          <audio controls src={testPlaybackUrl} className="w-full h-8" />
          <p className="text-xs text-white/40">If you can hear yourself clearly, the mic is working. Click "Start Recording" to begin.</p>
        </div>
      )}

      <div className="flex justify-center gap-3 py-4 border-y border-white/5">
        {/* Mic test button */}
        {!isRecording && !isProcessing && !isTesting && (
          <button
            onClick={startMicTest}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 rounded-full font-bold transition-all text-sm"
          >
            <Volume2 size={18} />
            Test Mic
          </button>
        )}

        {isTesting && (
          <button
            onClick={stopMicTest}
            className="flex items-center gap-2 px-5 py-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-full font-bold transition-all text-sm"
          >
            <Check size={18} />
            Stop Test
          </button>
        )}

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
