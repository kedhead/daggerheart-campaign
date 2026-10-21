import { useRef, useEffect } from 'react';
import { createWeather, AVAILABLE_EFFECTS } from './weatherEngine';

/**
 * MapAnimationOverlay — weather and ambient effects over a map.
 *
 * Fills its positioned parent and follows its size, so the effects always
 * cover exactly what is on screen (a 1440p battle map monitor, a phone
 * preview) instead of a map's stored pixel size. The drawing itself lives in
 * weatherEngine.js.
 *
 * `width`/`height` are accepted for older callers but no longer needed.
 */
export default function MapAnimationOverlay({ effects = [], intensity = 1, enabled = true, zIndex = 10 }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const active = enabled && effects.length > 0;
  const effectsKey = effects.join(',');

  // Create the engine and keep the canvas matched to its box.
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const engine = createWeather(canvas);
    engineRef.current = engine;

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) engine.resize(rect.width, rect.height);
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    observer?.observe(canvas);
    window.addEventListener('resize', fit);
    fit();

    let frame = 0;
    let last = performance.now();
    const loop = (now) => {
      engine.step(now - last, now);
      last = now;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', fit);
      engineRef.current = null;
    };
  }, [active]);

  // Changing effects or intensity doesn't restart the loop.
  useEffect(() => {
    engineRef.current?.setEffects(effects, intensity);
  }, [effectsKey, intensity, active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex
      }}
    />
  );
}

export { AVAILABLE_EFFECTS };
