/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface StarfieldProps {
  /** Number of drifting particles. Scaled down automatically on small screens. */
  density?: number;
  /** Base particle color (falls back to the active theme accent). */
  color?: string;
  /** Parallax drift speed multiplier. */
  speed?: number;
  className?: string;
}

/**
 * Starfield — a lightweight animated cosmic particle field rendered on a
 * <canvas>. Pure vanilla (no deps), theme-aware via the --theme-accent-rgb
 * CSS variable, and honours prefers-reduced-motion. ReactBits/Higgsfield-style
 * cinematic backdrop for the storefront hero.
 */
export const Starfield: React.FC<StarfieldProps> = ({
  density = 90,
  color,
  speed = 1,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Resolve the accent colour from the CSS variable so the field re-tints
    // with the per-category storefront theme.
    const resolveAccent = (): [number, number, number] => {
      if (color) return hexToRgb(color) ?? [155, 109, 255];
      const raw = getComputedStyle(canvas)
        .getPropertyValue('--theme-accent-rgb')
        .trim();
      const parts = raw.split(',').map((n) => parseInt(n.trim(), 10));
      if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
        return [parts[0], parts[1], parts[2]];
      }
      return [155, 109, 255];
    };

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let accent = resolveAccent();

    interface Star {
      x: number;
      y: number;
      z: number; // depth 0..1 → size + speed + opacity
      tw: number; // twinkle phase
    }

    let stars: Star[] = [];

    const count = () => {
      const areaFactor = Math.max(0.45, Math.min(1, width / 1200));
      return Math.floor(density * areaFactor);
    };

    const seed = () => {
      stars = Array.from({ length: count() }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      accent = resolveAccent();
      seed();
    };

    let raf = 0;
    let t = 0;

    const render = () => {
      t += 0.016 * speed;
      ctx.clearRect(0, 0, width, height);
      const [r, g, b] = accent;

      for (const s of stars) {
        // Slow downward drift, wrapping at edges.
        s.y += (0.08 + s.z * 0.35) * speed;
        if (s.y > height + 2) {
          s.y = -2;
          s.x = Math.random() * width;
        }

        const twinkle = 0.55 + 0.45 * Math.sin(t * (0.6 + s.z) + s.tw);
        const size = 0.4 + s.z * 1.6;
        // Depth-blend from cream to accent so nearer stars glow with the theme.
        const mix = s.z;
        const cr = Math.round(248 * (1 - mix) + r * mix);
        const cg = Math.round(243 * (1 - mix) + g * mix);
        const cb = Math.round(233 * (1 - mix) + b * mix);
        const alpha = (0.15 + s.z * 0.55) * twinkle;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Brighter near stars get a soft halo.
        if (s.z > 0.82) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.06 * twinkle})`;
          ctx.arc(s.x, s.y, size * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(render);
    };

    resize();

    if (prefersReduced) {
      // Draw a single static frame and stop.
      const [r, g, b] = accent;
      for (const s of stars) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + s.z * 0.4})`;
        ctx.arc(s.x, s.y, 0.4 + s.z * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      raf = requestAnimationFrame(render);
    }

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [density, color, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
};

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '');
  if (m.length !== 6) return null;
  const int = parseInt(m, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export default Starfield;
