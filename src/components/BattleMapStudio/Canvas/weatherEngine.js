/**
 * Weather engine for battle maps.
 *
 * Draws ambient effects — rain, snow, fog, embers, light — over a map on a
 * single 2D canvas. Everything is sized from the canvas itself, so effects
 * look the same density on a laptop preview and a 4K battle map monitor.
 *
 * Design notes:
 * - Depth: rain and snow come in three layers (far / mid / near) that differ
 *   in size, speed and opacity, which is what makes weather read as falling
 *   *through* a scene rather than across a pane of glass.
 * - Wind: one shared wind value, with slow gusts, bends rain, pushes snow and
 *   carries leaves, so effects on the same map agree with each other.
 * - Sprites: soft glows (snow, embers, fireflies, sparks) and fog banks are
 *   pre-rendered once to offscreen canvases and stamped, instead of building
 *   a gradient per particle per frame.
 *
 * No React, no DOM beyond the canvas it is given — MapAnimationOverlay owns
 * the lifecycle.
 */

// Effect ids are stored on saved maps; never rename one.
export const AVAILABLE_EFFECTS = [
  { id: 'rain', label: 'Rain', category: 'Weather' },
  { id: 'heavyRain', label: 'Downpour', category: 'Weather' },
  { id: 'storm', label: 'Thunderstorm', category: 'Weather' },
  { id: 'snow', label: 'Snow', category: 'Weather' },
  { id: 'blizzard', label: 'Blizzard', category: 'Weather' },
  { id: 'fog', label: 'Fog', category: 'Atmosphere' },
  { id: 'mist', label: 'Mist', category: 'Atmosphere' },
  { id: 'night', label: 'Night', category: 'Atmosphere' },
  { id: 'dust', label: 'Dust Motes', category: 'Particles' },
  { id: 'leaves', label: 'Falling Leaves', category: 'Particles' },
  { id: 'embers', label: 'Embers', category: 'Particles' },
  { id: 'fireflies', label: 'Fireflies', category: 'Particles' },
  { id: 'arcane', label: 'Arcane Sparks', category: 'Particles' },
  { id: 'firelight', label: 'Firelight Flicker', category: 'Lighting' },
  { id: 'sunbeams', label: 'Sunbeams', category: 'Lighting' },
  { id: 'waterShimmer', label: 'Water Shimmer', category: 'Lighting' }
];

const KNOWN = new Set(AVAILABLE_EFFECTS.map(e => e.id));

// Particle counts are for a 1920x1080 area at intensity 1, scaled by area.
const REFERENCE_AREA = 1920 * 1080;

const PARTICLE_COUNTS = {
  rain: 260, heavyRain: 680, storm: 780,
  snow: 160, blizzard: 420,
  dust: 70, leaves: 36, embers: 70, fireflies: 34, arcane: 60
};

/** How many particles an effect gets on a canvas this size. Pure, for tests. */
export function particleCount(effect, width, height, intensity = 1) {
  const base = PARTICLE_COUNTS[effect] || 0;
  const area = Math.max(1, width * height) / REFERENCE_AREA;
  // Grow sublinearly with area: a 4K monitor needs more drops than 1080p,
  // but not 4x as many to look as wet.
  return Math.round(base * Math.sqrt(area) * Math.max(0, Math.min(2, intensity)));
}

/** Drop unknown ids (old saves, typos) and duplicates. */
export function normalizeEffects(effects) {
  return [...new Set((Array.isArray(effects) ? effects : []).filter(e => KNOWN.has(e)))];
}

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Sprites ──────────────────────────────────────────────────────────────────

function makeCanvas(w, h) {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function glowSprite(size, stops) {
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([at, color]) => grad.addColorStop(at, color));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

// A soft, lumpy fog bank: puffs gathered into a few clumps, with clear air
// between them, so fog drifts across the map in banks instead of greying it
// out evenly.
function fogSprite(w, h, tint) {
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');
  const clumps = Array.from({ length: 3 }, () => ({ x: rand(w * 0.15, w * 0.85), y: rand(h * 0.3, h * 0.7), s: rand(0.6, 1.1) }));
  for (let i = 0; i < 40; i++) {
    const k = clumps[i % clumps.length];
    const x = k.x + rand(-0.17, 0.17) * w * k.s;
    const y = k.y + rand(-0.2, 0.2) * h * k.s;
    const r = rand(h * 0.1, h * 0.26) * k.s;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${tint}, 0.3)`);
    grad.addColorStop(0.6, `rgba(${tint}, 0.12)`);
    grad.addColorStop(1, `rgba(${tint}, 0)`);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // Fade every edge to nothing. Banks are tiled across the screen, and a puff
  // cut off at the sprite's border shows as a hard vertical seam.
  g.globalCompositeOperation = 'destination-in';
  const fadeX = g.createLinearGradient(0, 0, w, 0);
  fadeX.addColorStop(0, 'rgba(0,0,0,0)');
  fadeX.addColorStop(0.2, 'rgba(0,0,0,1)');
  fadeX.addColorStop(0.8, 'rgba(0,0,0,1)');
  fadeX.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fadeX;
  g.fillRect(0, 0, w, h);
  const fadeY = g.createLinearGradient(0, 0, 0, h);
  fadeY.addColorStop(0, 'rgba(0,0,0,0)');
  fadeY.addColorStop(0.25, 'rgba(0,0,0,1)');
  fadeY.addColorStop(0.75, 'rgba(0,0,0,1)');
  fadeY.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fadeY;
  g.fillRect(0, 0, w, h);
  return c;
}

let SPRITES = null;
function sprites() {
  if (SPRITES) return SPRITES;
  SPRITES = {
    snow: glowSprite(32, [[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.85)'], [1, 'rgba(255,255,255,0)']]),
    ember: glowSprite(32, [[0, 'rgba(255,240,180,1)'], [0.25, 'rgba(255,170,60,0.9)'], [0.6, 'rgba(255,80,20,0.35)'], [1, 'rgba(255,40,0,0)']]),
    firefly: glowSprite(48, [[0, 'rgba(250,255,190,1)'], [0.15, 'rgba(220,255,120,0.9)'], [0.5, 'rgba(160,230,80,0.25)'], [1, 'rgba(120,200,60,0)']]),
    arcane: [
      glowSprite(32, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(190,140,255,0.9)'], [1, 'rgba(120,60,255,0)']]),
      glowSprite(32, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(120,230,255,0.9)'], [1, 'rgba(40,160,255,0)']])
    ],
    dust: glowSprite(16, [[0, 'rgba(255,240,210,0.9)'], [1, 'rgba(255,230,190,0)']]),
    fog: [fogSprite(1024, 512, '215,222,230'), fogSprite(1024, 512, '200,208,218'), fogSprite(1024, 512, '228,232,238')]
  };
  return SPRITES;
}

// ── Particles ────────────────────────────────────────────────────────────────

const LAYERS = [
  { depth: 0.45, alpha: 0.35 }, // far
  { depth: 0.75, alpha: 0.6 },  // mid
  { depth: 1.15, alpha: 0.85 }  // near
];

function spawn(kind, w, h, initial) {
  const layer = pick(LAYERS);
  const p = { kind, layer, x: rand(-0.1, 1.1) * w, y: initial ? rand(0, h) : rand(-0.15, -0.02) * h };
  switch (kind) {
    case 'rain':
      p.len = rand(22, 42) * layer.depth;
      p.speed = rand(24, 32) * layer.depth;
      p.landAt = rand(h * 0.1, h * 1.05); // where a near drop hits the ground
      break;
    case 'snow':
      p.r = rand(1.4, 3.4) * layer.depth * 1.6;
      p.speed = rand(0.8, 1.7) * layer.depth;
      p.phase = rand(0, Math.PI * 2);
      p.sway = rand(0.4, 1.2);
      break;
    case 'leaf':
      p.r = rand(7, 12) * layer.depth;
      p.speed = rand(0.7, 1.4) * layer.depth;
      p.rot = rand(0, Math.PI * 2);
      p.spin = rand(-0.04, 0.04);
      p.flip = rand(0, Math.PI * 2);
      p.color = pick(['176,86,32', '201,128,40', '150,60,30', '196,160,58', '120,96,40']);
      break;
    case 'ember':
      p.x = rand(0, w); p.y = initial ? rand(0, h) : h + rand(0, 40);
      p.r = rand(9, 17) * layer.depth;
      p.speed = rand(0.6, 1.8) * layer.depth;
      p.life = initial ? rand(0.2, 1) : 1;
      p.decay = rand(0.0018, 0.004);
      p.wiggle = rand(0, Math.PI * 2);
      break;
    case 'firefly':
    case 'dust':
    case 'arcane':
      p.x = rand(0, w); p.y = rand(0, h);
      p.r = kind === 'firefly' ? rand(15, 26) : kind === 'arcane' ? rand(9, 16) : rand(3, 6);
      p.vx = rand(-0.3, 0.3); p.vy = rand(-0.3, 0.3);
      p.phase = rand(0, Math.PI * 2);
      p.pulse = rand(0.6, 1.6);
      p.sprite = kind === 'arcane' ? pick(sprites().arcane) : null;
      break;
    default:
  }
  return p;
}

const KIND_FOR = { rain: 'rain', heavyRain: 'rain', storm: 'rain', snow: 'snow', blizzard: 'snow', leaves: 'leaf', embers: 'ember', fireflies: 'firefly', dust: 'dust', arcane: 'arcane' };

// ── The engine ───────────────────────────────────────────────────────────────

export function createWeather(canvas) {
  const ctx = canvas.getContext('2d');
  let w = canvas.width;
  let h = canvas.height;
  let effects = [];
  let intensity = 1;
  let particles = [];
  let splashes = [];
  let wind = 0;          // horizontal push, px per frame at 60 fps
  let windTarget = 0;
  let nextGust = 0;
  let flash = 0;         // lightning brightness 0..1
  let nextStrike = 0;
  let fogOffset = 0;
  const has = (id) => effects.includes(id);

  function populate() {
    particles = [];
    splashes = [];
    effects.forEach(id => {
      const kind = KIND_FOR[id];
      if (!kind) return;
      const n = particleCount(id, w, h, intensity);
      for (let i = 0; i < n; i++) particles.push(spawn(kind, w, h, true));
    });
  }

  function setEffects(list, level = 1) {
    effects = normalizeEffects(list);
    intensity = Math.max(0, Math.min(2, Number(level) || 0));
    populate();
  }

  function resize(width, height) {
    w = canvas.width = Math.max(1, Math.round(width));
    h = canvas.height = Math.max(1, Math.round(height));
    populate();
  }

  function updateWind(dt, t) {
    const stormy = has('blizzard') ? 5 : has('storm') || has('heavyRain') ? 3.2 : has('rain') || has('leaves') ? 1.6 : 0.8;
    if (t > nextGust) {
      windTarget = rand(0.2, 1) * stormy * (Math.random() < 0.15 ? -0.5 : 1);
      nextGust = t + rand(2500, 7000);
    }
    wind += (windTarget - wind) * Math.min(1, 0.02 * dt);
  }

  // ── Tints and light ─────────────────────────────────────────────────────

  function drawTints(t) {
    const k = intensity;
    const tint = (rgba) => { ctx.fillStyle = rgba; ctx.fillRect(0, 0, w, h); };
    if (has('night')) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      tint(`rgba(40, 60, 110, ${Math.min(0.85, 0.55 * k)})`);
      ctx.restore();
    }
    if (has('storm')) tint(`rgba(25, 32, 45, ${0.28 * k})`);
    else if (has('heavyRain')) tint(`rgba(55, 68, 85, ${0.18 * k})`);
    else if (has('rain')) tint(`rgba(80, 95, 115, ${0.1 * k})`);
    if (has('blizzard')) tint(`rgba(225, 232, 240, ${(0.14 + Math.sin(t * 0.0007) * 0.05) * k})`);
    else if (has('snow')) tint(`rgba(210, 220, 232, ${0.06 * k})`);
  }

  function drawVignette(strength) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.hypot(w, h) * 0.6);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawFirelight(t) {
    if (!has('firelight')) return;
    // Layered sines plus a little noise read as a living flame, not a strobe.
    const flicker = 0.75 + Math.sin(t * 0.004) * 0.1 + Math.sin(t * 0.011 + 1.3) * 0.07 + Math.sin(t * 0.027) * 0.04 + rand(-0.03, 0.03);
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255, 150, 60, ${0.15 * intensity * flicker})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    drawVignette(0.25 * intensity * (1.1 - flicker * 0.2));
  }

  function drawSunbeams(t) {
    if (!has('sunbeams')) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const beams = 6;
    for (let i = 0; i < beams; i++) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.0004 + i * 1.7);
      const x = ((i + 0.5) / beams) * w * 1.4 - w * 0.2 + Math.sin(t * 0.00012 + i) * w * 0.03;
      const width = w * (0.05 + (i % 3) * 0.025);
      const g = ctx.createLinearGradient(x, 0, x + h * 0.55, h);
      g.addColorStop(0, `rgba(255, 236, 190, ${0.16 * pulse * intensity})`);
      g.addColorStop(1, 'rgba(255, 236, 190, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, -10);
      ctx.lineTo(x + width, -10);
      ctx.lineTo(x + width + h * 0.55, h + 10);
      ctx.lineTo(x + h * 0.55, h + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWaterShimmer(t) {
    if (!has('waterShimmer')) return;
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const bands = 9;
    for (let i = 0; i < bands; i++) {
      const y = ((i / bands) * h + t * 0.012 * (1 + (i % 3) * 0.3)) % (h + 80) - 40;
      ctx.strokeStyle = `rgba(190, 230, 255, ${0.25 * intensity})`;
      ctx.lineWidth = 10 + (i % 4) * 6;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 40) {
        const yy = y + Math.sin(x * 0.012 + t * 0.0016 + i) * 14 + Math.sin(x * 0.031 - t * 0.001) * 6;
        if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFog(dt) {
    const fog = has('fog');
    const mist = has('mist');
    if (!fog && !mist) return;
    fogOffset += (0.12 + Math.abs(wind) * 0.15) * dt;
    const banks = sprites().fog;
    // Light enough to see the map through: fog drifts in banks, it doesn't white the screen out.
    const layers = fog ? [{ scale: 1.6, speed: 0.35, alpha: 0.6 }, { scale: 2.1, speed: 0.6, alpha: 0.5 }, { scale: 2.8, speed: 1, alpha: 0.4 }]
      : [{ scale: 1.4, speed: 0.7, alpha: 0.35 }, { scale: 1.9, speed: 1.1, alpha: 0.28 }];
    ctx.save();
    layers.forEach((L, i) => {
      const img = banks[i % banks.length];
      const bw = w * L.scale * 0.6;
      const bh = bw * 0.5;
      const x0 = -((fogOffset * L.speed) % bw);
      const rows = Math.ceil(h / (bh * 0.55)) + 1;
      ctx.globalAlpha = Math.min(1, L.alpha * intensity * (mist ? 0.8 : 1));
      for (let r = 0; r < rows; r++) {
        const y = r * bh * 0.55 - bh * 0.3 + Math.sin(fogOffset * 0.002 + r + i) * bh * 0.08;
        for (let x = x0 - bw; x < w + bw; x += bw * 0.7) ctx.drawImage(img, x + (r % 2) * bw * 0.35, y, bw, bh);
      }
    });
    ctx.restore();
  }

  function drawLightning(dt, t) {
    if (!has('storm')) { flash = 0; nextStrike = 0; return; }
    // The first strike waits a few seconds, rather than flashing the moment the map appears.
    if (!nextStrike) nextStrike = t + rand(3000, 7000);
    if (t > nextStrike) {
      // A strike is a bright flash with a weaker second pulse just after.
      flash = 1;
      setTimeout(() => { flash = Math.max(flash, 0.7); }, rand(90, 160));
      nextStrike = t + rand(5000, 13000) / Math.max(0.5, intensity);
    }
    if (flash > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(210, 225, 255, ${flash * 0.55})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
      flash *= Math.pow(0.86, dt);
    }
  }

  // ── Particles ───────────────────────────────────────────────────────────

  function stepParticles(dt, t) {
    const S = sprites();
    const rainAngle = Math.atan2(wind * 3, 28);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      switch (p.kind) {
        case 'rain': {
          const vx = wind * 3 * p.layer.depth;
          p.x += vx * dt;
          p.y += p.speed * dt;
          ctx.strokeStyle = `rgba(205, 220, 240, ${p.layer.alpha * 0.8})`;
          ctx.lineWidth = p.layer.depth > 1 ? 2 : p.layer.depth > 0.6 ? 1.4 : 0.9;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.sin(rainAngle) * p.len, p.y + Math.cos(rainAngle) * p.len);
          ctx.stroke();
          // Near drops "land" somewhere on the map and splash.
          if (p.layer.depth > 1 && p.y > p.landAt) {
            splashes.push({ x: p.x, y: p.y, r: 1, life: 1 });
            Object.assign(p, spawn('rain', w, h, false));
          }
          if (p.y > h + 30) Object.assign(p, spawn('rain', w, h, false));
          break;
        }
        case 'snow': {
          p.phase += 0.02 * dt;
          p.x += (Math.sin(p.phase) * p.sway + wind * 0.9 * p.layer.depth) * dt;
          p.y += p.speed * dt;
          const s = p.r * 2.4;
          ctx.globalAlpha = p.layer.alpha;
          ctx.drawImage(S.snow, p.x - s / 2, p.y - s / 2, s, s);
          ctx.globalAlpha = 1;
          if (p.y > h + 10 || p.x < -40 || p.x > w + 40) Object.assign(p, spawn('snow', w, h, false));
          break;
        }
        case 'leaf': {
          p.flip += 0.05 * dt;
          p.rot += p.spin * dt;
          p.x += (wind * 1.4 + Math.sin(p.flip * 0.5) * 0.6) * dt;
          p.y += p.speed * dt;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.max(0.15, Math.abs(Math.cos(p.flip))));
          ctx.fillStyle = `rgba(${p.color}, ${0.85 * p.layer.alpha + 0.15})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.6, p.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(60, 35, 15, 0.35)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-p.r * 1.5, 0);
          ctx.lineTo(p.r * 1.5, 0);
          ctx.stroke();
          ctx.restore();
          if (p.y > h + 20 || p.x > w + 40 || p.x < -40) Object.assign(p, spawn('leaf', w, h, false));
          break;
        }
        case 'ember': {
          p.wiggle += 0.06 * dt;
          p.x += (Math.sin(p.wiggle) * 0.6 + wind * 0.5) * dt;
          p.y -= p.speed * dt;
          p.life -= p.decay * dt;
          const flick = 0.75 + Math.sin(t * 0.02 + p.wiggle * 3) * 0.25;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = Math.max(0, p.life) * flick;
          const s = p.r * 2;
          ctx.drawImage(S.ember, p.x - s / 2, p.y - s / 2, s, s);
          ctx.restore();
          if (p.life <= 0 || p.y < -20) Object.assign(p, spawn('ember', w, h, false));
          break;
        }
        case 'firefly':
        case 'dust':
        case 'arcane': {
          p.phase += 0.03 * p.pulse * dt;
          // Wander: nudge the velocity a little each frame, then damp it.
          p.vx = (p.vx + rand(-0.05, 0.05)) * 0.98;
          p.vy = (p.vy + rand(-0.05, 0.05)) * 0.98 - (p.kind === 'arcane' ? 0.012 : 0);
          p.x += (p.vx + (p.kind === 'dust' ? wind * 0.2 : 0)) * dt;
          p.y += p.vy * dt;
          if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
          const glow = p.kind === 'dust' ? 0.35 + 0.35 * Math.sin(p.phase) : Math.max(0, Math.sin(p.phase)) ** 2;
          const img = p.kind === 'firefly' ? S.firefly : p.kind === 'arcane' ? p.sprite : S.dust;
          const s = p.r * 2;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = glow * Math.min(1, intensity + 0.2);
          ctx.drawImage(img, p.x - s / 2, p.y - s / 2, s, s);
          ctx.restore();
          break;
        }
        default:
      }
    }

    // Splashes: small rings that widen and fade where near drops land.
    if (splashes.length) {
      ctx.strokeStyle = 'rgba(210, 225, 240, 0.5)';
      ctx.lineWidth = 1;
      splashes = splashes.filter(s => {
        s.r += 0.45 * dt;
        s.life -= 0.06 * dt;
        if (s.life <= 0) return false;
        ctx.globalAlpha = s.life * 0.7;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.r * 1.6, s.r * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        return true;
      });
      ctx.globalAlpha = 1;
      if (splashes.length > 400) splashes.splice(0, splashes.length - 400);
    }
  }

  // ── Frame ───────────────────────────────────────────────────────────────

  function step(deltaMs, t) {
    // Clamp: a backgrounded tab returns with a huge delta.
    const dt = Math.min(3, Math.max(0, deltaMs / 16.67));
    ctx.clearRect(0, 0, w, h);
    if (!effects.length || intensity <= 0) return;
    updateWind(dt, t);
    drawTints(t);
    drawWaterShimmer(t);
    drawSunbeams(t);
    drawFog(dt);
    stepParticles(dt, t);
    drawFirelight(t);
    if (has('night')) drawVignette(0.45 * intensity);
    drawLightning(dt, t);
  }

  return { setEffects, resize, step, get effects() { return effects; } };
}
