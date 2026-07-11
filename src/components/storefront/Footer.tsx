/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, ShieldCheck, HelpCircle, ArrowUpRight, Instagram, Globe } from 'lucide-react';
import { StoreSettings } from '../../types';

interface FooterProps {
  settings: StoreSettings;
  onNavigate: (page: 'home' | 'shop' | 'checkout') => void;
  onToggleAdmin: () => void;
  isLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate, onToggleAdmin, isLoggedIn }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0812] border-t border-[#2A1F45] text-[#F8F3E9] py-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#9B6DFF] selection:text-[#0A0812]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-[#2A1F45] pb-12">
        
        {/* Brand Mission Column */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg tracking-[0.2em] uppercase font-bold text-[#F8F3E9]">
            COSMIC DEPT
          </h3>
          <p className="text-xs text-[#F8F3E9]/65 leading-relaxed font-light">
            {settings.tagline || 'RETRORUNWAY APPAREL ENGINEERING FOR DEEP SPACE OPERATIVES.'}
          </p>
          <div className="flex items-center gap-2 pt-2 text-[10px] text-[#B68D40] font-body-mono font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-[#9B6DFF] animate-pulse"></span>
            <span>SYSTEM STATE: STABLE</span>
          </div>
        </div>

        {/* Navigation Categories Column */}
        <div className="space-y-4">
          <h4 className="text-xs tracking-[0.2em] text-[#B68D40] font-bold uppercase font-body-mono">
            SECTORS & SHOP
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button onClick={() => onNavigate('home')} className="text-[#F8F3E9]/75 hover:text-[#9B6DFF] transition-colors uppercase font-body-mono cursor-pointer">
                COLLECTIONS HOME
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop')} className="text-[#F8F3E9]/75 hover:text-[#9B6DFF] transition-colors uppercase font-body-mono cursor-pointer">
                EXPLORE CATALOGUE
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('checkout')} className="text-[#F8F3E9]/75 hover:text-[#9B6DFF] transition-colors uppercase font-body-mono cursor-pointer">
                ORDER DISPATCH DESK
              </button>
            </li>
          </ul>
        </div>

        {/* Support & Contact Column */}
        <div className="space-y-4">
          <h4 className="text-xs tracking-[0.2em] text-[#B68D40] font-bold uppercase font-body-mono">
            SUPPORT COMMUNICATIONS
          </h4>
          <ul className="space-y-2.5 text-xs text-[#F8F3E9]/75 font-body-mono">
            <li className="flex items-center gap-2">
              <Mail size={12} className="text-[#9B6DFF]" />
              <a href={`mailto:${settings.contact_email}`} className="hover:text-[#9B6DFF] transition-colors">
                {settings.contact_email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <HelpCircle size={12} className="text-[#9B6DFF]" />
              <span className="cursor-pointer hover:text-[#9B6DFF]">FREQUENCY SUPPORT 24/7</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={12} className="text-[#9B6DFF]" />
              <span className="uppercase text-[10px] text-[#39FF14] tracking-wider font-bold">100% SECURE TRANSACTIONING</span>
            </li>
          </ul>
        </div>

        {/* Social Media handles Column */}
        <div className="space-y-4">
          <h4 className="text-xs tracking-[0.2em] text-[#B68D40] font-bold uppercase font-body-mono">
            OPERATIONAL NETWORKS
          </h4>
          <div className="flex flex-col gap-3.5 text-xs font-body-mono">
            {settings.social_instagram && (
              <a
                href={settings.social_instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[#F8F3E9]/75 hover:text-[#9B6DFF] transition-colors group"
              >
                <Instagram size={13} className="text-[#9B6DFF]" />
                <span className="uppercase">INSTAGRAM</span>
                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
            {settings.social_tiktok && (
              <a
                href={settings.social_tiktok}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[#F8F3E9]/75 hover:text-[#9B6DFF] transition-colors group"
              >
                <Globe size={13} className="text-[#9B6DFF]" />
                <span className="uppercase">TIKTOK DISPATCH</span>
                <ArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}
            {settings.social_wechat && (
              <div className="flex items-center gap-2 text-[#F8F3E9]/75">
                <Globe size={13} className="text-[#9B6DFF]" />
                <span>WECHAT: <span className="text-[#B68D40]">{settings.social_wechat}</span></span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Bottom copyright and Console toggle link */}
      <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row gap-4 justify-between items-center text-[10px] text-[#F8F3E9]/45 uppercase font-body-mono">
        <div className="text-center sm:text-left select-none">
          &copy; {currentYear} COSMIC DEPT INC. ALL PROTOCOLS RESERVED. CRAFTED FOR SECURE SPACE TRAVEL.
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleAdmin}
            className="text-[#B68D40] hover:text-[#9B6DFF] font-bold tracking-wider hover:underline transition-all uppercase cursor-pointer"
          >
            {isLoggedIn ? ':: ACCESS ADMIN CONSOLE' : ':: ADMIN CONSOLE [SIGN IN]'}
          </button>
        </div>
      </div>
    </footer>
  );
};
