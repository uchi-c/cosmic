/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Settings, LogOut, Terminal } from 'lucide-react';

export type AdminViewType = 'dashboard' | 'products' | 'products-new' | 'products-edit' | 'products-import' | 'orders' | 'orders-detail' | 'settings';

interface SidebarProps {
  currentView: AdminViewType;
  onNavigate: (view: AdminViewType) => void;
  onLogout: () => void;
  adminEmail: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout, adminEmail }) => {
  // Navigation mapping helper
  const links = [
    { view: 'dashboard' as AdminViewType, label: 'DASHBOARD', icon: LayoutDashboard },
    { view: 'products' as AdminViewType, label: 'PRODUCTS', icon: ShoppingBag },
    { view: 'orders' as AdminViewType, label: 'ORDERS', icon: ShoppingCart },
    { view: 'settings' as AdminViewType, label: 'SETTINGS', icon: Settings },
  ];

  return (
    <div className="w-64 bg-retro-surface border-r-4 border-retro-border flex flex-col h-full font-body-mono text-cream select-none shrink-0">
      {/* Brand Logo header */}
      <div className="p-6 border-b-4 border-retro-border bg-space-black/30 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-accent-purple">
          <Terminal size={18} className="animate-pulse" />
          <h1 className="font-retro-heading text-xs tracking-wider leading-none">
            COSMIC DEPT
          </h1>
        </div>
        <p className="font-retro-mono text-retro-gold text-lg leading-none mt-1 uppercase tracking-wide">
          :: ADMIN TERMINAL v1.4
        </p>
      </div>

      {/* Nav Menu Links */}
      <nav className="flex-1 p-4 space-y-2.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentView === link.view || 
            (link.view === 'products' && (currentView === 'products-new' || currentView === 'products-edit' || currentView === 'products-import')) ||
            (link.view === 'orders' && currentView === 'orders-detail');
            
          return (
            <button
              key={link.view}
              onClick={() => onNavigate(link.view)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 border-2 text-xs font-bold tracking-wider transition-all duration-150 cursor-pointer
                ${isActive 
                  ? 'bg-accent-purple/10 border-accent-purple text-accent-purple shadow-[0_0_8px_rgba(155,109,255,0.25)]' 
                  : 'bg-transparent border-retro-border text-cream-muted hover:border-cream/40 hover:text-cream hover:bg-space-black/30'}
              `}
            >
              <Icon size={16} className={isActive ? 'text-accent-purple' : 'text-cream-muted'} />
              <span className="font-retro-mono text-xl tracking-normal font-normal leading-none mt-0.5">
                {link.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* System Admin status & Logout Footer */}
      <div className="p-4 border-t-4 border-retro-border bg-space-black/20 space-y-3">
        <div className="px-1 text-[10px] text-cream-muted space-y-1">
          <div className="uppercase tracking-widest font-bold text-[9px] text-retro-gold">
            OPERATOR IDENT:
          </div>
          <div className="truncate font-mono" title={adminEmail}>
            {adminEmail}
          </div>
          <div className="flex items-center gap-1.5 text-retro-green">
            <span className="w-1.5 h-1.5 bg-retro-green rounded-none animate-ping" />
            <span className="font-retro-mono text-sm tracking-wide uppercase">TERM-SESSION SECURE</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 border-2 border-retro-red/40 text-retro-red hover:bg-retro-red/10 hover:border-retro-red hover:shadow-[0_0_8px_rgba(255,68,68,0.3)] transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          <LogOut size={13} />
          <span className="font-retro-mono text-lg font-normal leading-none mt-0.5">LOGOUT</span>
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
