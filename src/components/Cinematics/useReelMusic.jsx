import { useEffect, useRef, useState } from 'react';
import { audioContext, loadMusicBuffer } from './cinematicSfx';

/**
 * A reel's music, at a level the device cannot ignore.
 *
 * An audio element's volume is only a request: iPhones, iPads and some TV
 * browsers ignore it and play at full blast, so the narrator was drowned
 * whatever the slider said. The track is decoded and played through a Web
 * Audio gain instead, which every device obeys. If the track cannot be
 * decoded, an audio element is used after all (through a gain where the
 * device ignores the element's own volume).
 *
 * @param {string} musicUrl
 * @param {number} level - how loud the music should be right now, 0 to 1
 * @param {{current: (blocked: boolean) => void}} blockedRef - told when the browser wants a click before sound
 * @returns {JSX.Element|null} the fallback audio element to render, when it is needed
 */
export default function useReelMusic(musicUrl, level, blockedRef) {
  const musicRef = useRef(null);
  const musicGain = useRef(null); // the music's volume control
  const levelRef = useRef(0); // what that volume should be right now
  levelRef.current = level;
  // How the music is played: as decoded sound through a gain ('buffer'), or,
  // if that cannot be done, by an audio element ('element').
  const [mode, setMode] = useState('loading');

  useEffect(() => {
    if (!musicUrl) return undefined;
    const ctx = audioContext();
    if (!ctx) { setMode('element'); return undefined; }
    // On iPhone, let this sound play with the silent switch on, as the narrator does.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* not supported */ }
    let live = true;
    let source = null;
    const began = performance.now();
    const gain = ctx.createGain();
    gain.gain.value = levelRef.current;
    gain.connect(ctx.destination);
    loadMusicBuffer(ctx, musicUrl).then(buffer => {
      if (!live) return;
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      gain.gain.value = levelRef.current;
      musicGain.current = gain;
      // Join the track where it would be had it started with the reel.
      source.start(0, ((performance.now() - began) / 1000) % buffer.duration);
      ctx.resume?.().catch(() => {});
      if (ctx.state === 'suspended') blockedRef.current?.(true);
      setMode('buffer');
    }).catch(() => { if (live) setMode('element'); });
    return () => {
      live = false;
      try { source?.stop(); } catch { /* never started */ }
      gain.disconnect();
      musicGain.current = null;
    };
  }, [musicUrl, blockedRef]);

  // The fallback, when the track could not be decoded.
  useEffect(() => {
    const music = musicRef.current;
    if (mode !== 'element' || !music) return;
    music.volume = 0.5;
    const volumeLocked = music.volume !== 0.5;
    const ctx = audioContext();
    if (volumeLocked && ctx && !musicGain.current) {
      try {
        const gain = ctx.createGain();
        gain.gain.value = levelRef.current;
        ctx.createMediaElementSource(music).connect(gain).connect(ctx.destination);
        musicGain.current = gain;
        ctx.resume?.().catch(() => {});
      } catch { /* stays on element volume */ }
    }
    music.volume = levelRef.current;
    music.play().catch(() => blockedRef.current?.(true));
  }, [mode, blockedRef]);

  useEffect(() => {
    const gain = musicGain.current;
    if (gain) gain.gain.setTargetAtTime(level, gain.context.currentTime, 0.12);
    else if (musicRef.current) musicRef.current.volume = level;
  }, [level, mode]);

  return musicUrl && mode === 'element'
    ? <audio ref={musicRef} src={musicUrl} preload="auto" loop crossOrigin="anonymous" />
    : null;
}
