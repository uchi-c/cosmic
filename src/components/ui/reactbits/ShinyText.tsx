/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ShinyTextProps {
  children: React.ReactNode;
  /** Seconds per shimmer sweep. */
  speed?: number;
  /** Dim base colour of the text. */
  base?: string;
  /** Bright highlight colour swept across. */
  highlight?: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * ShinyText — a ReactBits-style animated shimmer that sweeps a highlight band
 * across the text using a clipped gradient. Great for eyebrow labels and
 * announcement copy. Falls back to a static tint under reduced-motion (handled
 * in index.css).
 */
export const ShinyText: React.FC<ShinyTextProps> = ({
  children,
  speed = 4,
  base,
  highlight,
  className = '',
  as = 'span',
}) => {
  const Tag = as as any;
  const style: React.CSSProperties & Record<string, string> = {
    ['--shiny-speed']: `${speed}s`,
  };
  if (base) style['--shiny-base'] = base;
  if (highlight) style['--shiny-highlight'] = highlight;

  return (
    <Tag className={`shiny-text ${className}`} style={style}>
      {children}
    </Tag>
  );
};

export default ShinyText;
