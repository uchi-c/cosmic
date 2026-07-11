/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Wifi, Clock } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [live, setLive] = useState<boolean>(false);

  useEffect(() => {
    // Determine live status
    setLive(isSupabaseConfigured());

    // Sync live UTC time clock
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-retro-surface border-b-4 border-retro-border px-6 flex items-center justify-between font-body-mono text-cream select-none shrink-0">
      {/* Title block */}
      <div className="flex items-center gap-3">
        <span className="text-accent-purple font-retro-mono text-xl animate-pulse">■</span>
        <h2 className="text-sm font-retro-heading uppercase tracking-widest text-cream">
          {title}
        </h2>
      </div>

      {/* Clock and Integration Status bar */}
      <div className="flex items-center gap-4">
        {/* Real-time UTC clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-space-black border border-retro-border text-cream-muted text-xs font-mono">
          <Clock size={13} className="text-accent-purple" />
          <span>{timeStr || 'SYNCING CHRONOS...'}</span>
        </div>

        {/* Supabase status badge */}
        {live ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-retro-green/10 border border-retro-green text-retro-green text-xs font-bold font-retro-mono tracking-wider shadow-[0_0_8px_rgba(57,255,20,0.15)]">
            <ShieldCheck size={14} />
            <span className="text-base leading-none pt-0.5">SUPABASE SECURE LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-retro-gold/10 border border-retro-gold text-retro-gold text-xs font-bold font-retro-mono tracking-wider shadow-[0_0_8px_rgba(182,141,64,0.15)] animate-pulse">
            <ShieldAlert size={14} />
            <span className="text-base leading-none pt-0.5">SANDBOX EMULATION ACTIVE</span>
          </div>
        )}

        {/* Link indicator */}
        <div className="flex items-center gap-1.5 text-cream-muted text-xs">
          <Wifi size={13} className={live ? "text-retro-green" : "text-retro-gold"} />
          <span className="font-retro-mono text-base">NET:ONLINE</span>
        </div>
      </div>
    </header>
  );
};
export default Header;
