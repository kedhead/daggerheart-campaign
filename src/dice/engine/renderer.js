// Draws and plays back pre-computed throws with three.js.
//
// Nothing here simulates anything: simulate.js has already recorded every
// frame of a throw, so playback just looks up where each die is at the
// current time and interpolates. That makes a frame cheap, and a slow or
// throttled machine only drops frames — the dice still land on time.
//
// Each die gets its own small texture with its numbers, drawn for that throw:
// labels.js has already moved the rolled number onto the face that lands on
// top, so what you see is the canonical result.

import * as THREE from 'three';
import { dieShape } from './dice.js';
import { STEP, FRAME_STRIDE } from './seed.js';

const CELL = 128; // texture pixels per face

// Pixels per die unit: dice stay a similar size on a phone and a big screen.
export function arenaFor(widthPx, heightPx) {
  const unitPx = Math.max(38, Math.min(72, Math.min(widthPx, heightPx) / 9));
  return { width: widthPx / unitPx, depth: heightPx / unitPx, unitPx };
}

function luminance(hex) {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

// A 2D frame for each face: its centre, and the face's corners projected onto
// the face plane, with the first corner pointing "up" for the text.
function faceFrames(shape) {
  return shape.faces.map((face, i) => {
    const n = new THREE.Vector3(...shape.normals[i]);
    const pts = face.map(k => new THREE.Vector3(...shape.vertices[k]));
    const centre = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const up = pts[0].clone().sub(centre).normalize();
    const right = new THREE.Vector3().crossVectors(up, n).normalize();
    const corners = pts.map(p => { const d = p.clone().sub(centre); return [d.dot(right), d.dot(up)]; });
    const radius = Math.max(...corners.map(([x, y]) => Math.hypot(x, y)));
    return { centre, pts, corners, radius };
  });
}

const geometryCache = new Map();

// Flat-shaded geometry with one atlas cell per face. Shared by every die of
// the same kind; only the texture differs.
function dieGeometry(sides) {
  if (geometryCache.has(sides)) return geometryCache.get(sides);
  const shape = dieShape(sides);
  const frames = faceFrames(shape);
  const cols = Math.ceil(Math.sqrt(shape.faces.length));
  const rows = Math.ceil(shape.faces.length / cols);
  const positions = [], normals = [], uvs = [];
  shape.faces.forEach((face, i) => {
    const { pts, corners, radius } = frames[i];
    const col = i % cols, row = Math.floor(i / cols);
    const uv = ([x, y]) => [
      (col * CELL + CELL / 2 + (x / radius) * CELL * 0.46) / (cols * CELL),
      1 - (row * CELL + CELL / 2 - (y / radius) * CELL * 0.46) / (rows * CELL),
    ];
    for (let k = 1; k < face.length - 1; k++) {
      for (const j of [0, k, k + 1]) {
        positions.push(pts[j].x, pts[j].y, pts[j].z);
        normals.push(...shape.normals[i]);
        uvs.push(...uv(corners[j]));
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  const edges = new THREE.EdgesGeometry(geometry, 1);
  const entry = { geometry, edges, frames, cols, rows };
  geometryCache.set(sides, entry);
  return entry;
}

// The number texture for one die: its colour, and `labels` on its faces.
function dieTexture(sides, color, labels) {
  const shape = dieShape(sides);
  const { frames, cols, rows } = dieGeometry(sides);
  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL;
  canvas.height = rows * CELL;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const light = luminance(color) > 0.6;
  ctx.fillStyle = light ? '#111827' : '#ffffff';
  ctx.strokeStyle = light ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const draw = (text, x, y, angle, size) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `800 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.lineWidth = Math.max(2, size / 9);
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
    // 6 and 9 look alike upside down: underline them, as real dice do.
    if (sides >= 10 && (text === '6' || text === '9')) {
      ctx.fillRect(-size * 0.22, size * 0.42, size * 0.44, Math.max(2, size * 0.08));
    }
    ctx.restore();
  };

  shape.faces.forEach((face, i) => {
    const cx = (i % cols) * CELL + CELL / 2;
    const cy = Math.floor(i / cols) * CELL + CELL / 2;
    const { corners, radius } = frames[i];
    if (shape.readAtVertex) {
      // d4: each corner carries its vertex's number, pointing at the corner,
      // so the number at the top vertex reads the same on every face.
      face.forEach((vertex, j) => {
        const [x, y] = corners[j];
        const px = cx + (x / radius) * CELL * 0.27;
        const py = cy - (y / radius) * CELL * 0.27;
        draw(String(labels[vertex]), px, py, Math.atan2(x, y), CELL * 0.27);
      });
      return;
    }
    const text = String(labels[i]);
    const size = CELL * (sides <= 6 ? 0.5 : sides <= 12 ? 0.4 : 0.32) * (text.length > 1 ? 0.85 : 1);
    draw(text, cx, cy, 0, size);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3b3550, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(-6, 20, 10);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 500);
  camera.up.set(0, 0, -1); // screen-up is -z: dice are thrown up the screen
  let arena = arenaFor(container.clientWidth || 800, container.clientHeight || 600);

  const throws = new Map(); // id -> { group, frames, n, steps, start, meshes, done, resolve }
  let raf = 0;

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return false; // hidden: keep the last good size
    // Cap the drawing buffer: a big high-DPI screen gains nothing visible
    // from more than ~2.5 megapixels of dice.
    const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.5e6 / (w * h)));
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    arena = arenaFor(w, h);
    camera.aspect = w / h;
    camera.position.set(0, arena.depth / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))), 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    return true;
  }
  resize();

  const tmpA = new THREE.Quaternion(), tmpB = new THREE.Quaternion();

  function pose(t, now) {
    const pos = Math.min(t.steps, (now - t.start) / 1000 / STEP);
    const i = Math.floor(pos), f = pos - i;
    const j = Math.min(t.steps, i + 1);
    t.meshes.forEach((mesh, d) => {
      const a = (i * t.n + d) * FRAME_STRIDE, b = (j * t.n + d) * FRAME_STRIDE;
      const fr = t.frames;
      mesh.position.set(fr[a] + (fr[b] - fr[a]) * f, fr[a + 1] + (fr[b + 1] - fr[a + 1]) * f, fr[a + 2] + (fr[b + 2] - fr[a + 2]) * f);
      tmpA.set(fr[a + 3], fr[a + 4], fr[a + 5], fr[a + 6]);
      tmpB.set(fr[b + 3], fr[b + 4], fr[b + 5], fr[b + 6]);
      mesh.quaternion.slerpQuaternions(tmpA, tmpB, f);
    });
    return pos >= t.steps;
  }

  function frame() {
    raf = 0;
    const now = performance.now();
    let playing = false;
    for (const t of throws.values()) {
      if (t.done) continue;
      if (pose(t, now)) { t.done = true; t.resolve(); } else playing = true;
    }
    renderer.render(scene, camera);
    if (playing) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  function disposeThrow(t) {
    scene.remove(t.group);
    t.meshes.forEach((m) => { m.material.map?.dispose(); m.material.dispose(); m.children.forEach(c => c.material?.dispose()); });
    if (!t.done) { t.done = true; t.resolve(); }
  }

  return {
    get arena() { return arena; },
    resize() { if (resize()) kick(); },

    /**
     * Play a simulated throw. `dice` is [{ sides, color, labels }] in the
     * simulation's order. Resolves when the dice come to rest.
     */
    play(id, { dice, frames, steps }) {
      if (throws.has(id)) disposeThrow(throws.get(id));
      const group = new THREE.Group();
      const meshes = dice.map(({ sides, color, labels }) => {
        const { geometry, edges } = dieGeometry(sides);
        const material = new THREE.MeshStandardMaterial({
          map: dieTexture(sides, color, labels), roughness: 0.42, metalness: 0.08, flatShading: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        const edgeColor = new THREE.Color(color).multiplyScalar(luminance(color) > 0.6 ? 0.55 : 0.4);
        mesh.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.7 })));
        group.add(mesh);
        return mesh;
      });
      scene.add(group);
      return new Promise((resolve) => {
        const t = { group, frames, n: dice.length, sides: dice.map(d => d.sides), steps, start: performance.now(), meshes, done: false, resolve };
        throws.set(id, t);
        pose(t, t.start);
        kick();
      });
    },

    remove(id) {
      const t = throws.get(id);
      if (!t) return;
      throws.delete(id);
      disposeThrow(t);
      kick();
    },

    clear() {
      for (const t of throws.values()) disposeThrow(t);
      throws.clear();
      kick();
    },

    get activeCount() { return [...throws.values()].filter(t => !t.done).length; },

    /** Every throw on the table, where its playback is now — for simulate.js. */
    obstacles() {
      const now = performance.now();
      return [...throws.values()].map(t => ({
        dice: t.sides,
        frames: t.frames,
        steps: t.steps,
        from: Math.min(t.steps, Math.floor((now - t.start) / 1000 / STEP)),
      }));
    },

    dispose() {
      if (raf) cancelAnimationFrame(raf);
      for (const t of throws.values()) disposeThrow(t);
      throws.clear();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
