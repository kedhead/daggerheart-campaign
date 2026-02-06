import { useRef, useEffect, useCallback } from 'react';

/**
 * MapAnimationOverlay - Canvas-based subtle animation effects for battle maps
 *
 * Renders particle effects and visual overlays on top of static map images.
 * Effects are purely visual and don't affect the underlying map data.
 */

// Particle class for rain, snow, dust, leaves
class Particle {
  constructor(canvas, type, config) {
    this.canvas = canvas;
    this.type = type;
    this.config = config;
    this.reset(true);
  }

  reset(initial = false) {
    const { width, height } = this.canvas;

    switch (this.type) {
      case 'rain':
        this.x = Math.random() * width * 1.2 - width * 0.1;
        this.y = initial ? Math.random() * height : -20;
        this.length = 10 + Math.random() * 20;
        this.speed = 15 + Math.random() * 10;
        this.opacity = 0.2 + Math.random() * 0.3;
        break;

      case 'snow':
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : -10;
        this.radius = 1 + Math.random() * 3;
        this.speed = 1 + Math.random() * 2;
        this.drift = (Math.random() - 0.5) * 0.5;
        this.opacity = 0.4 + Math.random() * 0.4;
        break;

      case 'dust':
      case 'leaves':
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = this.type === 'leaves' ? 2 + Math.random() * 4 : 1 + Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = 0.2 + Math.random() * 0.3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        break;

      case 'ember':
        this.x = Math.random() * width;
        this.y = height + 10;
        this.radius = 1 + Math.random() * 2;
        this.speed = 1 + Math.random() * 3;
        this.drift = (Math.random() - 0.5) * 2;
        this.opacity = 0.5 + Math.random() * 0.5;
        this.life = 1;
        break;
    }
  }

  update(deltaTime) {
    const dt = deltaTime / 16.67; // Normalize to ~60fps
    const { width, height } = this.canvas;

    switch (this.type) {
      case 'rain':
        this.x += 2 * dt;
        this.y += this.speed * dt;
        if (this.y > height + 20) this.reset();
        break;

      case 'snow':
        this.x += this.drift * dt;
        this.y += this.speed * dt;
        if (this.y > height + 10 || this.x < -10 || this.x > width + 10) this.reset();
        break;

      case 'dust':
      case 'leaves':
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;
        this.rotation += this.rotationSpeed * dt;
        // Wrap around
        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;
        break;

      case 'ember':
        this.x += this.drift * dt;
        this.y -= this.speed * dt;
        this.life -= 0.005 * dt;
        this.opacity = this.life * 0.8;
        if (this.life <= 0 || this.y < -10) this.reset();
        break;
    }
  }

  draw(ctx) {
    ctx.save();

    switch (this.type) {
      case 'rain':
        ctx.strokeStyle = `rgba(180, 200, 220, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 4, this.y + this.length);
        ctx.stroke();
        break;

      case 'snow':
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'dust':
        ctx.fillStyle = `rgba(200, 180, 150, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'leaves':
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = `rgba(80, 120, 60, ${this.opacity})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 2, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ember':
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        gradient.addColorStop(0, `rgba(255, 200, 50, ${this.opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 20, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}

// Effect configurations
const EFFECT_CONFIGS = {
  rain: {
    particleCount: 200,
    type: 'rain',
    overlay: { color: 'rgba(100, 120, 140, 0.1)' }
  },
  heavyRain: {
    particleCount: 400,
    type: 'rain',
    overlay: { color: 'rgba(80, 100, 120, 0.15)' }
  },
  snow: {
    particleCount: 100,
    type: 'snow',
    overlay: { color: 'rgba(200, 210, 220, 0.05)' }
  },
  blizzard: {
    particleCount: 250,
    type: 'snow',
    overlay: { color: 'rgba(220, 230, 240, 0.1)' }
  },
  dust: {
    particleCount: 50,
    type: 'dust',
    overlay: null
  },
  leaves: {
    particleCount: 30,
    type: 'leaves',
    overlay: null
  },
  embers: {
    particleCount: 40,
    type: 'ember',
    overlay: { color: 'rgba(255, 100, 50, 0.03)' }
  },
  fog: {
    particleCount: 0,
    type: null,
    fogEnabled: true,
    fogDensity: 0.3,
    fogColor: 'rgba(180, 190, 200, 0.4)'
  },
  mist: {
    particleCount: 0,
    type: null,
    fogEnabled: true,
    fogDensity: 0.15,
    fogColor: 'rgba(200, 210, 220, 0.25)'
  }
};

export default function MapAnimationOverlay({
  width,
  height,
  effects = [], // Array of effect names: ['rain', 'fog', etc.]
  intensity = 1, // 0-2 multiplier
  enabled = true
}) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const fogOffsetRef = useRef({ x: 0, y: 0 });

  // Initialize particles when effects change
  useEffect(() => {
    if (!enabled || !canvasRef.current) {
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    const particles = [];

    effects.forEach(effectName => {
      const config = EFFECT_CONFIGS[effectName];
      if (!config || !config.type) return;

      const count = Math.floor(config.particleCount * intensity);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(canvas, config.type, config));
      }
    });

    particlesRef.current = particles;
  }, [effects, intensity, enabled, width, height]);

  // Draw fog effect
  const drawFog = useCallback((ctx, deltaTime) => {
    effects.forEach(effectName => {
      const config = EFFECT_CONFIGS[effectName];
      if (!config?.fogEnabled) return;

      // Animate fog movement
      fogOffsetRef.current.x += 0.2 * (deltaTime / 16.67);
      fogOffsetRef.current.y += 0.1 * (deltaTime / 16.67);

      const density = config.fogDensity * intensity;
      const fogColor = config.fogColor;

      // Draw multiple fog layers for depth
      for (let layer = 0; layer < 3; layer++) {
        const layerOffset = layer * 100;
        const layerOpacity = density * (1 - layer * 0.25);

        ctx.save();
        ctx.globalAlpha = layerOpacity;

        // Create fog pattern using gradients
        const numBlobs = 8;
        for (let i = 0; i < numBlobs; i++) {
          const baseX = (i / numBlobs) * width + fogOffsetRef.current.x * (1 + layer * 0.5) + layerOffset;
          const baseY = height * 0.3 + Math.sin(fogOffsetRef.current.x * 0.01 + i) * height * 0.2;
          const x = ((baseX % (width + 200)) + width + 200) % (width + 200) - 100;
          const y = baseY + layer * 50;
          const radius = 150 + layer * 50;

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, fogColor);
          gradient.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }

        ctx.restore();
      }
    });
  }, [effects, intensity, width, height]);

  // Draw firelight flicker effect
  const drawFirelight = useCallback((ctx, time) => {
    if (!effects.includes('firelight')) return;

    const flicker = 0.7 + Math.sin(time * 0.005) * 0.15 + Math.sin(time * 0.013) * 0.1 + Math.random() * 0.05;
    const opacity = 0.08 * intensity * flicker;

    // Warm overlay
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(255, 150, 50, ${opacity})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Subtle vignette darkening at edges
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${0.2 * intensity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, [effects, intensity, width, height]);

  // Draw water shimmer effect
  const drawWaterShimmer = useCallback((ctx, time) => {
    if (!effects.includes('waterShimmer')) return;

    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.1 * intensity;

    // Create moving light pattern
    const stripeWidth = 30;
    const offset = (time * 0.05) % (stripeWidth * 2);

    ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
    for (let x = -stripeWidth + offset; x < width + stripeWidth; x += stripeWidth * 2) {
      const waveY = Math.sin(time * 0.002 + x * 0.01) * 5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + 20, height);
      ctx.lineTo(x + 20, height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }, [effects, intensity, width, height]);

  // Animation loop
  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const animate = (time) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw overlays
      effects.forEach(effectName => {
        const config = EFFECT_CONFIGS[effectName];
        if (config?.overlay) {
          ctx.fillStyle = config.overlay.color;
          ctx.fillRect(0, 0, width, height);
        }
      });

      // Draw fog
      drawFog(ctx, deltaTime);

      // Draw firelight
      drawFirelight(ctx, time);

      // Draw water shimmer
      drawWaterShimmer(ctx, time);

      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update(deltaTime);
        particle.draw(ctx);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, width, height, effects, drawFog, drawFirelight, drawWaterShimmer]);

  if (!enabled || effects.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
}

// Export effect names for use in UI
export const AVAILABLE_EFFECTS = [
  { id: 'rain', label: 'Rain', category: 'Weather' },
  { id: 'heavyRain', label: 'Heavy Rain', category: 'Weather' },
  { id: 'snow', label: 'Snow', category: 'Weather' },
  { id: 'blizzard', label: 'Blizzard', category: 'Weather' },
  { id: 'fog', label: 'Fog', category: 'Atmosphere' },
  { id: 'mist', label: 'Mist', category: 'Atmosphere' },
  { id: 'dust', label: 'Dust', category: 'Particles' },
  { id: 'leaves', label: 'Falling Leaves', category: 'Particles' },
  { id: 'embers', label: 'Embers', category: 'Particles' },
  { id: 'firelight', label: 'Firelight Flicker', category: 'Lighting' },
  { id: 'waterShimmer', label: 'Water Shimmer', category: 'Lighting' }
];
