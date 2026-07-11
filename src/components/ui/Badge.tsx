/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'NEW' | 'LIMITED' | 'SALE' | 'HOT' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  // Base retro badge: VT323 pixel style, uppercase, solid flat border
  const baseStyle = 'inline-flex items-center px-2 py-0.5 font-retro-mono text-base uppercase tracking-wider border select-none';

  const variantStyles = {
    NEW: 'bg-transparent border-retro-green text-retro-green hover:shadow-[0_0_6px_rgba(57,255,20,0.3)]',
    LIMITED: 'bg-transparent border-retro-gold text-retro-gold hover:shadow-[0_0_6px_rgba(182,141,64,0.3)]',
    SALE: 'bg-retro-red/20 border-retro-red text-retro-red',
    HOT: 'bg-accent-purple/20 border-accent-purple text-accent-purple hover:shadow-[0_0_6px_rgba(155,109,255,0.3)]',
    
    // Status helpers
    success: 'bg-retro-green/10 border-retro-green text-retro-green',
    warning: 'bg-retro-gold/10 border-retro-gold text-retro-gold',
    danger: 'bg-retro-red/10 border-retro-red text-retro-red',
    info: 'bg-transparent border-accent-purple text-accent-purple',
    default: 'bg-transparent border-retro-border text-cream-muted',
  };

  return (
    <span className={`${baseStyle} ${variantStyles[variant] || variantStyles.default} ${className}`}>
      {children}
    </span>
  );
};
