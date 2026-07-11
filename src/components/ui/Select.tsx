/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full font-body-mono">
        {label && (
          <label className="text-xs text-cream-muted uppercase tracking-wider flex justify-between">
            <span>{label}</span>
            {error && <span className="text-retro-red font-retro-mono text-sm tracking-normal">! {error}</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full bg-retro-surface text-cream border-2 px-3 py-2 text-sm appearance-none cursor-pointer transition-all duration-200 focus:outline-none
              ${error ? 'border-retro-red focus:border-retro-red focus:shadow-[0_0_10px_rgba(255,68,68,0.4)]' : 'border-retro-border focus:border-accent-purple focus:shadow-[0_0_10px_rgba(155,109,255,0.4)]'}
              ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-retro-surface text-cream">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom retro arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-cream-muted font-retro-mono text-lg">
            ▼
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
