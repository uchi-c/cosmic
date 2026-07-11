/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

interface Tilt3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Max rotation in degrees at the card edges. */
  max?: number;
  /** Scale applied while hovering. */
  scale?: number;
  /** Render the pointer-tracked glare highlight. */
  glare?: boolean;
  /**
   * Classes for the transformed card itself (bg, border, padding, layout).
   * `className` is an alias for this — whichever you pass lands on the inner
   * element that actually rotates, so children lay out normally.
   */
  className?: string;
  /** Classes for the outer perspective wrapper (usually just sizing). */
  wrapperClassName?: string;
}

/**
 * Tilt3D — a ReactBits-style pointer-driven 3D rotation card. The outer element
 * owns the perspective; the inner element carries the card styling + the
 * spring-driven rotateX/rotateY/scale, plus an optional glare sheen that rides
 * the tilt. Disables itself under reduced-motion.
 */
export const Tilt3D: React.FC<Tilt3DProps> = ({
  children,
  max = 12,
  scale = 1.02,
  glare = true,
  className = '',
  wrapperClassName = '',
  ...rest
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const s = useMotionValue(1);
  const srx = useSpring(rx, { stiffness: 260, damping: 20, mass: 0.5 });
  const sry = useSpring(ry, { stiffness: 260, damping: 20, mass: 0.5 });
  const ss = useSpring(s, { stiffness: 260, damping: 20, mass: 0.5 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    ry.set((px - 0.5) * 2 * max); // left/right → rotateY
    rx.set(-(py - 0.5) * 2 * max); // up/down → rotateX
    s.set(scale);
    el.style.setProperty('--glare-x', `${px * 100}%`);
    el.style.setProperty('--glare-y', `${py * 100}%`);
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
    s.set(1);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`tilt-3d ${wrapperClassName}`}
      {...rest}
    >
      <motion.div
        className={`tilt-3d__inner ${className}`}
        style={{ rotateX: srx, rotateY: sry, scale: ss }}
      >
        {children}
        {glare && <span className="tilt-3d__glare" aria-hidden="true" />}
      </motion.div>
    </div>
  );
};

export default Tilt3D;
