/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { CountUp } from '../ui/reactbits';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext: string;
  color?: 'purple' | 'gold' | 'green' | 'red';
  /** When set, a numeric `value` animates with a count-up on first view. */
  countUp?: boolean;
  prefix?: string;
  decimals?: number;
  separator?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  color = 'purple',
  countUp = false,
  prefix = '',
  decimals = 0,
  separator = false,
}) => {
  const colorClasses = {
    purple: {
      border: 'border-retro-border hover:border-accent-purple',
      iconBg: 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple',
      glow: 'hover:shadow-[0_0_15px_rgba(155,109,255,0.25)]',
      valueText: 'text-accent-purple',
    },
    gold: {
      border: 'border-retro-border hover:border-retro-gold',
      iconBg: 'bg-retro-gold/10 border-retro-gold/30 text-retro-gold',
      glow: 'hover:shadow-[0_0_15px_rgba(182,141,64,0.25)]',
      valueText: 'text-retro-gold',
    },
    green: {
      border: 'border-retro-border hover:border-retro-green',
      iconBg: 'bg-retro-green/10 border-retro-green/30 text-retro-green',
      glow: 'hover:shadow-[0_0_15px_rgba(57,255,20,0.25)]',
      valueText: 'text-retro-green',
    },
    red: {
      border: 'border-retro-border hover:border-retro-red',
      iconBg: 'bg-retro-red/10 border-retro-red/30 text-retro-red',
      glow: 'hover:shadow-[0_0_15px_rgba(255,68,68,0.25)]',
      valueText: 'text-retro-red',
    },
  };

  const scheme = colorClasses[color];

  return (
    <div
      className={`bg-retro-surface border-2 p-5 transition-all duration-200 flex items-start gap-4 select-none ${scheme.border} ${scheme.glow}`}
    >
      {/* Icon frame */}
      <div className={`p-3 border-2 ${scheme.iconBg}`}>
        <Icon size={20} />
      </div>

      {/* Numerical Data content */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-cream-muted uppercase tracking-widest font-body-mono font-bold">
          {title}
        </p>
        <p className={`font-retro-heading text-xl md:text-2xl mt-1 tracking-tight truncate leading-none py-1 ${scheme.valueText}`}>
          {countUp && typeof value === 'number' ? (
            <CountUp
              value={value}
              prefix={prefix}
              decimals={decimals}
              separator={separator}
            />
          ) : (
            value
          )}
        </p>
        <p className="text-xs text-cream-muted font-retro-mono mt-1.5 uppercase leading-none tracking-wide">
          {subtext}
        </p>
      </div>
    </div>
  );
};
export default StatsCard;
