/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Entry direction of the reveal. */
  direction?: Direction;
  /** Seconds to wait before animating. */
  delay?: number;
  /** Travel distance in px. */
  distance?: number;
  /** Only animate the first time it enters the viewport. */
  once?: boolean;
  className?: string;
}

const offsetFor = (dir: Direction, d: number) => {
  switch (dir) {
    case 'up':
      return { y: d };
    case 'down':
      return { y: -d };
    case 'left':
      return { x: d };
    case 'right':
      return { x: -d };
    default:
      return {};
  }
};

/**
 * ScrollReveal — a motion wrapper that fades and slides its children in as they
 * enter the viewport. ReactBits-style scroll choreography built on the
 * `motion` library already bundled by the app. motion honours
 * prefers-reduced-motion globally, so no extra guard is needed here.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  distance = 28,
  once = true,
  className = '',
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsetFor(direction as Direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
