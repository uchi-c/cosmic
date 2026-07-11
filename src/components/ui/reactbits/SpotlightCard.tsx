/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * SpotlightCard — a ReactBits-style wrapper that tracks the pointer and moves a
 * radial accent glow to follow the cursor (rendered by the `.spotlight-card`
 * layer in index.css, tinted with the active theme accent). Pointer-driven only
 * — no work happens off-hover, and touch devices simply never trigger it.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  ...rest
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`spotlight-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;
