/**
 * Dice Audio — Web Audio API sound synthesis for dice rolling
 * No external audio files needed.
 */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
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

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
}

/**
 * Play dice tumbling/rolling sound (~600ms of rapid clicks)
 */
export function playRollSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const tickCount = 12 + Math.floor(Math.random() * 6);

        for (let i = 0; i < tickCount; i++) {
            // Accelerate then decelerate — sounds like dice settling
            const progress = i / tickCount;
            const interval = 0.02 + progress * 0.04; // gaps get wider as dice settle
            const time = now + i * interval;
            const volume = 0.15 + (1 - progress) * 0.2; // quieter as they settle
            playTick(ctx, time, volume);
        }
    } catch (e) {
        // Silently fail if audio not available
    }
}

/**
 * Play triumphant ascending chime for CRIT!
 */
export function playCritSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Three ascending notes with sparkle
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);

            gain.gain.setValueAtTime(0, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.6);
        });

        // Add a shimmer/sparkle
        const noise = ctx.createOscillator();
        const noiseGain = ctx.createGain();
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(2000, now + 0.3);
        noise.frequency.exponentialRampToValueAtTime(4000, now + 0.8);
        noiseGain.gain.setValueAtTime(0, now + 0.3);
        noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.4);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(now + 0.3);
        noise.stop(now + 1.1);
    } catch (e) {
        // Silently fail
    }
}

/**
 * Play resonant harmonic chord for DOUBLES!
 */
export function playDoublesSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Powerful chord — root + fifth + octave
        const frequencies = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
        frequencies.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = i === 0 ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
            gain.gain.setValueAtTime(0.15, now + 0.3);
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
        subGain.gain.setValueAtTime(0.3, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.5);
    } catch (e) {
        // Silently fail
    }
}
