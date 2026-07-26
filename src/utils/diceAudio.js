// Web Audio API sound synthesis for dice rolling
// No external audio files needed (except optional roll sound override)


let audioCtx = null;
let rollBuffer = null;
let rawAudioData = null; // Pre-fetched ArrayBuffer (before AudioContext exists)

// Pre-fetch the mp3 immediately on module load (no user interaction needed)
fetch('/sounds/gooddiceroll.mp3')
    .then(r => r.arrayBuffer())
    .then(buf => { rawAudioData = buf; })
    .catch(() => { });

async function decodeRollSound() {
    if (rollBuffer || !rawAudioData || !audioCtx) return;
    try {
        // decodeAudioData detaches the buffer, so copy it first
        const copy = rawAudioData.slice(0);
        rollBuffer = await audioCtx.decodeAudioData(copy);
    } catch (err) {
        console.warn('Audio decode failed', err);
    }
}

function getAudioContext() {
    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }
    return audioCtx;
}

/**
 * Initialize audio context on user interaction to unlock autoplay
 */
export function initAudio() {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => { });
        }
        // Decode pre-fetched mp3 now that we have an AudioContext
        decodeRollSound();
    } catch (e) {
        // Ignore
    }
}

/**
 * Play a single click/tick sound
 */
function playTick(ctx, time, volume = 0.3) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 1200, time);
    osc.frequency.exponentialRampToValueAtTime(200 + Math.random() * 400, time + 0.03);

    // Use a small nonzero start value — exponentialRamp cannot ramp from 0
    gain.gain.setValueAtTime(Math.max(volume, 0.001), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
}

// Simultaneous rolls each ask for the tumble sound. Playing four copies at
// once is just noise, so collapse a burst into one.
const ROLL_SOUND_THROTTLE_MS = 200;
let lastRollSoundAt = 0;

/**
 * Play dice tumbling/rolling sound (~600ms of rapid clicks)
 */
export function playRollSound() {
    const now = Date.now();
    if (now - lastRollSoundAt < ROLL_SOUND_THROTTLE_MS) return;
    lastRollSoundAt = now;

    try {
        const ctx = getAudioContext();

        // If buffer loaded, play it
        if (rollBuffer) {
            const source = ctx.createBufferSource();
            source.buffer = rollBuffer;
            const gain = ctx.createGain();
            gain.gain.value = 0.5; // Adjust volume as needed
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start(0);
            return;
        }

        // Try to decode for next time
        decodeRollSound();

        // Fallback to synthesis if file not loaded yet
        const now = ctx.currentTime;
        const tickCount = 12 + Math.floor(Math.random() * 6);

        for (let i = 0; i < tickCount; i++) {
            const progress = i / tickCount;
            const interval = 0.02 + progress * 0.04;
            const time = now + i * interval;
            const volume = 0.15 + (1 - progress) * 0.2;
            playTick(ctx, time, volume);
        }
    } catch (e) {
        console.warn('Dice roll sound failed:', e);
    }
}

/**
 * Play triumphant ascending chime for CRIT!
 */
export function playCritSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);

            // Start at a small nonzero value, ramp up, then decay
            gain.gain.setValueAtTime(0.001, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.3, now + i * 0.12 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.6);
        });

        // Shimmer/sparkle
        const noise = ctx.createOscillator();
        const noiseGain = ctx.createGain();
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(2000, now + 0.3);
        noise.frequency.exponentialRampToValueAtTime(4000, now + 0.8);
        noiseGain.gain.setValueAtTime(0.001, now + 0.3);
        noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.4);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now + 0.3);
        noise.stop(now + 1.1);
    } catch (e) {
        console.warn('Crit sound failed:', e);
    }
}

/**
 * Play resonant harmonic chord for DOUBLES!
 */
export function playDoublesSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const frequencies = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = i === 0 ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Start at small nonzero, ramp up, sustain, then decay
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
            gain.gain.setValueAtTime(0.2, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 1.3);
        });

        // Low impact thud
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(80, now);
        sub.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        subGain.gain.setValueAtTime(0.4, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.5);
    } catch (e) {
        console.warn('Doubles sound failed:', e);
    }
}
