/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'retro-outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  // Base retro theme styles: flat corners, monospace, sharp borders, animated
  // sheen sweep + subtle hover lift (tactile press + focus-visible handled
  // globally for every <button> in index.css).
  let baseStyle = 'btn-sheen relative inline-flex items-center justify-center font-body-mono uppercase tracking-wider transition-all duration-200 select-none cursor-pointer border-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:hover:translate-y-0';

  // Variant mappings
  const variantStyles = {
    primary: 'bg-accent-purple border-accent-purple text-space-black hover:bg-space-black hover:text-accent-purple hover:shadow-[0_0_12px_rgba(155,109,255,0.7)]',
    secondary: 'bg-retro-surface border-retro-border text-cream hover:border-accent-purple hover:text-accent-purple hover:shadow-[0_0_10px_rgba(155,109,255,0.3)]',
    success: 'bg-retro-green border-retro-green text-space-black hover:bg-space-black hover:text-retro-green hover:shadow-[0_0_12px_rgba(57,255,20,0.7)]',
    danger: 'bg-retro-red border-retro-red text-cream hover:bg-space-black hover:text-retro-red hover:shadow-[0_0_12px_rgba(255,68,68,0.7)]',
    warning: 'bg-retro-gold border-retro-gold text-space-black hover:bg-space-black hover:text-retro-gold hover:shadow-[0_0_12px_rgba(182,141,64,0.7)]',
    'retro-outline': 'bg-transparent border-retro-border text-cream-muted hover:border-accent-purple hover:text-cream hover:shadow-[0_0_8px_rgba(155,109,255,0.2)]',
  };

  // Size mappings
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 border-1.5',
    md: 'text-sm px-4 py-2 border-2',
    lg: 'text-base px-6 py-3 border-2',
    icon: 'p-2 border-2 text-sm',
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
