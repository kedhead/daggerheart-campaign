/**
 * cinematicFX — ambient "living scene" particle effects for the Motion Comic.
 *
 * One tiny canvas-2D particle engine shared by both renderers:
 *  - CinematicPlayer.jsx draws onto an overlay <canvas> above the slide image
 *  - cinematicExporter.js draws onto the export canvas between image and text
 *
 * Effects are picked automatically from the slide's text (pickEffectForText),
 * so a scene that mentions a campfire gets drifting embers, a blizzard gets
 * snow, a ritual gets arcane sparkles. Everything is cheap: a few dozen
 * particles, no images, no allocation inside the frame loop.
 */

const EFFECT_KEYWORDS = [
  // order matters — first match wins
  { effect: 'embers',   re: /\b(fire|flame|burn|blaze|ember|torch|campfire|bonfire|forge|inferno|pyre|lava)\w*/i },
  { effect: 'rain',     re: /\b(rain|storm|thunder|downpour|drizzl|tempest|monsoon|squall)\w*/i },
  { effect: 'snow',     re: /\b(snow|blizzard|frost|frozen|ice|icy|winter|glacier|hail)\w*/i },
  { effect: 'sparkles', re: /\b(magic|spell|arcane|ritual|enchant|glow|shimmer|divine|celestial|starlight|rune)\w*/i },
  { effect: 'fog',      re: /\b(fog|mist|smoke|haze|swamp|marsh|shadow|haunt|crypt|tomb|grave|spectral|ghost)\w*/i },
];

/** Choose an ambient effect from free-form slide text. Defaults to soft dust motes. */
export function pickEffectForText(text) {
  const t = String(text || '');
  for (const { effect, re } of EFFECT_KEYWORDS) {
    if (re.test(t)) return effect;
  }
  return 'dust';
}

const COUNTS = { embers: 36, rain: 90, snow: 60, sparkles: 34, fog: 7, dust: 26 };

function rand(min, max) { return min + Math.random() * (max - min); }

function makeParticle(effect, w, h, initial) {
  switch (effect) {
    case 'embers':
      return {
        x: rand(0, w), y: initial ? rand(0, h) : h + rand(0, 40),
        vx: rand(-8, 8), vy: rand(-60, -25),
        r: rand(1, 3), life: rand(0.3, 1), decay: rand(0.05, 0.12),
        hue: rand(18, 42),
      };
    case 'rain':
      return {
        x: rand(-w * 0.2, w), y: initial ? rand(-h, h) : rand(-40, -5),
        vx: rand(120, 190), vy: rand(650, 900),
        len: rand(10, 22), alpha: rand(0.12, 0.3),
      };
    case 'snow':
      return {
        x: rand(0, w), y: initial ? rand(0, h) : rand(-20, -5),
        vy: rand(22, 55), sway: rand(0.4, 1.6), phase: rand(0, Math.PI * 2),
        r: rand(1, 3.2), alpha: rand(0.35, 0.85),
      };
    case 'sparkles':
      return {
        x: rand(0, w), y: rand(0, h),
        r: rand(0.6, 2.2), phase: rand(0, Math.PI * 2), speed: rand(1.2, 3.4),
        vy: rand(-9, -2), hue: Math.random() < 0.5 ? rand(255, 285) : rand(42, 55),
      };
    case 'fog':
      return {
        x: initial ? rand(-w * 0.3, w) : -w * 0.35, y: rand(h * 0.35, h * 1.02),
        vx: rand(9, 26), r: rand(w * 0.18, w * 0.4), alpha: rand(0.05, 0.12),
      };
    default: // dust
      return {
        x: rand(0, w), y: rand(0, h),
        vx: rand(-7, 7), vy: rand(-4, 4),
        r: rand(0.5, 1.6), phase: rand(0, Math.PI * 2), alpha: rand(0.08, 0.3),
      };
  }
}

/**
 * Create an effect instance bound to a canvas size.
 * @returns {{ effect: string, update(dt: number): void, draw(ctx): void }}
 */
export function createFX(effect, w, h) {
  if (!effect || effect === 'none') {
    return { effect: 'none', update() {}, draw() {} };
  }
  const count = COUNTS[effect] || COUNTS.dust;
  const parts = Array.from({ length: count }, () => makeParticle(effect, w, h, true));
  let t = 0;

  function update(dt) {
    t += dt;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      switch (effect) {
        case 'embers':
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= p.decay * dt * 4;
          if (p.y < -10 || p.life <= 0) parts[i] = makeParticle(effect, w, h, false);
          break;
        case 'rain':
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.y > h + 10) parts[i] = makeParticle(effect, w, h, false);
          break;
        case 'snow':
          p.y += p.vy * dt; p.x += Math.sin(t * p.sway + p.phase) * 14 * dt;
          if (p.y > h + 6) parts[i] = makeParticle(effect, w, h, false);
          break;
        case 'sparkles':
          p.y += p.vy * dt;
          if (p.y < -6) { parts[i] = makeParticle(effect, w, h, false); parts[i].y = h + 4; }
          break;
        case 'fog':
          p.x += p.vx * dt;
          if (p.x - p.r > w) { parts[i] = makeParticle(effect, w, h, false); parts[i].y = rand(h * 0.35, h * 1.02); }
          break;
        default: // dust — slow drift with wraparound
          p.x = (p.x + p.vx * dt + w) % w;
          p.y = (p.y + p.vy * dt + h) % h;
      }
    }
  }

  function draw(ctx) {
    ctx.save();
    for (const p of parts) {
      switch (effect) {
        case 'embers': {
          const a = Math.max(0, Math.min(1, p.life)) * 0.85;
          ctx.fillStyle = `hsla(${p.hue}, 95%, 58%, ${a})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'rain':
          ctx.strokeStyle = `rgba(170,195,230,${p.alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.016, p.y - p.len);
          ctx.stroke();
          break;
        case 'snow':
          ctx.fillStyle = `rgba(240,246,255,${p.alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          break;
        case 'sparkles': {
          const tw = 0.5 + 0.5 * Math.sin(t * p.speed + p.phase); // twinkle 0..1
          ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${0.25 + tw * 0.65})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.7 + tw * 0.6), 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'fog': {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, `rgba(190,200,215,${p.alpha})`);
          g.addColorStop(1, 'rgba(190,200,215,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          break;
        }
        default: {
          const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + p.phase);
          ctx.fillStyle = `rgba(235,225,200,${p.alpha * tw})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  return { effect, update, draw };
}
