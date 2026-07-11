/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Target value to count toward. */
  value: number;
  /** Animation duration in ms. */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Group thousands with commas. */
  separator?: boolean;
  className?: string;
}

/**
 * CountUp — animates a number from 0 to `value` with an ease-out curve when it
 * first scrolls into view. ReactBits-style stat reveal for the admin
 * dashboard. Uses an IntersectionObserver so counts fire on entry, and
 * respects prefers-reduced-motion by snapping straight to the value.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = false,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const run = () => {
      if (started.current) return;
      started.current = true;

      if (prefersReduced) {
        setDisplay(value);
        return;
      }

      const start = performance.now();
      const from = 0;
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        // easeOutExpo
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(from + (value - from) * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const format = (n: number) => {
    const fixed = n.toFixed(decimals);
    if (!separator) return fixed;
    const [int, dec] = fixed.split('.');
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dec ? `${grouped}.${dec}` : grouped;
  };

  return (
    <span ref={ref} className={className}>
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
};

export default CountUp;
