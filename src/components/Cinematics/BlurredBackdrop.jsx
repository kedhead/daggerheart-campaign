import { useEffect, useRef } from 'react';

// How wide the blurred copy is drawn. It is stretched to fill the screen, and
// the stretching itself softens it, so a few dozen pixels is plenty.
const WIDTH = 64;
// The look the CSS filter used to give it: blur(2.6vh) brightness(0.45) saturate(1.35).
const LOOK = 'blur(1.2px) brightness(0.45) saturate(1.35)';

/**
 * The blurred, darkened copy of a picture behind art shown whole. It is
 * blurred once, into a tiny canvas, rather than by a CSS filter: a filter is
 * redone on every frame the picture moves, which on a large monitor took the
 * reel down to a few frames a second.
 */
export default function BlurredBackdrop({ src, className = 'rr-backdrop' }) {
  const canvas = useRef(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || !src) return undefined;
    let gone = false;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (gone || !img.naturalWidth) return;
      const ctx = el.getContext('2d');
      if (!ctx) return;
      const filters = 'filter' in ctx;
      // Without a canvas blur, a smaller copy is stretched further, which blurs it more.
      const w = filters ? WIDTH : 24;
      const h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
      el.width = w;
      el.height = h;
      if (filters) {
        ctx.filter = LOOK;
        // Drawn a little past the edges so the blur doesn't fade them to clear.
        ctx.drawImage(img, -3, -3, w + 6, h + 6);
      } else {
        // No canvas filters (older Safari): a black wash darkens it.
        ctx.drawImage(img, 0, 0, w, h);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, w, h);
      }
    };
    img.src = src;
    return () => { gone = true; img.onload = null; };
  }, [src]);

  return <canvas ref={canvas} className={className} aria-hidden="true" />;
}
