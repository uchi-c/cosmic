/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full font-body-mono">
        {label && (
          <label className="text-xs text-cream-muted uppercase tracking-wider flex justify-between">
            <span>{label}</span>
            {error && <span className="text-retro-red font-retro-mono text-sm tracking-normal">! {error}</span>}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            ref={ref}
            className={`w-full bg-retro-surface text-cream border-2 px-3 py-2 text-sm transition-all duration-200 focus:outline-none placeholder:text-cream-muted/30
              ${error ? 'border-retro-red focus:border-retro-red focus:shadow-[0_0_10px_rgba(255,68,68,0.4)]' : 'border-retro-border focus:border-accent-purple focus:shadow-[0_0_10px_rgba(155,109,255,0.4)]'}
              ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
export { Input as RetroInput };
