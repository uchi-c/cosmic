/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, X, ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { CategoryType } from '../../types';

interface NavbarProps {
  activePage: 'home' | 'shop' | 'product-detail' | 'checkout';
  onNavigate: (page: 'home' | 'shop' | 'checkout', category?: CategoryType | 'all') => void;
  onBack?: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onSearch: (query: string) => void;
  onToggleAdmin: () => void;
  isLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  onBack,
  cartCount,
  onOpenCart,
  onSearch,
  onToggleAdmin,
  isLoggedIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const categories: { label: string; value: CategoryType | 'all' }[] = [
    { label: 'ALL DEPT', value: 'all' },
    { label: 'MENSWEAR', value: 'mens' },
    { label: 'WOMENSWEAR', value: 'womens' },
    { label: 'GYM & TACTICAL', value: 'gym' },
    { label: 'JEWELRY', value: 'jewelry' },
    { label: 'ACCESSORIES', value: 'accessories' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
    onNavigate('shop');
    setSearchOpen(false);
  };

  const handleCategoryClick = (category: CategoryType | 'all') => {
    onNavigate('shop', category);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0A0812]/95 backdrop-blur-md border-b border-[#2A1F45] text-[#F8F3E9] font-sans selection:bg-[#9B6DFF] selection:text-[#0A0812]">
      {/* Top Editorial Announcement Bar */}
      <div className="bg-[#B68D40] text-[#0A0812] text-[10px] tracking-[0.25em] font-bold text-center py-1.5 px-4 font-body-mono uppercase select-none flex items-center justify-center gap-2">
        <span>COSMIC DEPT — NEW DROPS EVERY WEEK</span>
        <span className="hidden sm:inline opacity-65">•</span>
        <span className="hidden sm:inline">COMPLIMENTARY SHIPPING ON HIGH-ALTITUDE SHIPMENTS</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile menu trigger and Mobile navigation controls */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#F8F3E9] hover:text-[#9B6DFF] p-1.5 focus:outline-none cursor-pointer"
              title="Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            
            {activePage !== 'home' && onBack && (
              <button
                onClick={onBack}
                className="text-[#F8F3E9]/80 hover:text-[#9B6DFF] p-1.5 focus:outline-none cursor-pointer flex items-center gap-1"
                title="Go Back"
              >
                <ArrowLeft size={15} />
                <span className="text-[9px] font-body-mono tracking-wider font-bold">BACK</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('home')}
              className={`p-1.5 focus:outline-none cursor-pointer flex items-center gap-1 ${activePage === 'home' ? 'text-[#9B6DFF]' : 'text-[#F8F3E9]/80 hover:text-[#9B6DFF]'}`}
              title="Home Outpost"
            >
              <Home size={15} />
              <span className="text-[9px] font-body-mono tracking-wider font-bold hidden sm:inline">HOME</span>
            </button>
          </div>

          {/* Logo - Centered on Mobile, Left-aligned on Desktop */}
          <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
            <button
              onClick={() => onNavigate('home')}
              className="group text-center lg:text-left focus:outline-none cursor-pointer select-none flex items-center gap-2.5"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#2A1F45] group-hover:border-[#9B6DFF] transition-colors flex-shrink-0 bg-[#0A0812]">
                <img src="/logo.jpg" alt="COSMIC DEPT Logo" className="w-full h-full object-cover filter brightness-110" />
              </div>
              <div className="text-left">
                <h1 className="text-xs sm:text-sm font-retro-heading tracking-widest text-[#F8F3E9] group-hover:text-[#9B6DFF] transition-colors leading-none uppercase">
                  COSMIC DEPT
                </h1>
                <span className="text-[7px] tracking-[0.45em] text-[#B68D40] font-body-mono uppercase block mt-1">
                  LUSAKA • OUTER ORBIT
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex space-x-8 xl:space-x-10">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className="text-xs tracking-[0.2em] font-medium text-[#F8F3E9]/80 hover:text-[#B68D40] uppercase transition-colors relative py-2 cursor-pointer font-body-mono"
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons (Search, Admin portal switch, Cart) */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Inline Search Bar on Desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="SEARCH ARCHIVES..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="bg-[#120F1E] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none py-1.5 pl-3 pr-8 w-44 lg:w-56 text-[#F8F3E9] placeholder-[#F8F3E9]/30"
              />
              <button type="submit" className="absolute right-2.5 text-[#F8F3E9]/50 hover:text-[#9B6DFF] cursor-pointer">
                <Search size={14} />
              </button>
            </form>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden text-[#F8F3E9]/80 hover:text-[#9B6DFF] p-1 cursor-pointer"
            >
              <Search size={18} />
            </button>

            {/* Merchant Access Button */}
            <button
              onClick={onToggleAdmin}
              className={`text-xs px-2.5 py-1.5 border hover:bg-[#9B6DFF]/10 text-[10px] font-body-mono tracking-[0.15em] transition-colors flex items-center gap-1.5 cursor-pointer
                ${isLoggedIn 
                  ? 'text-[#39FF14] border-[#39FF14]/40 bg-[#39FF14]/5 hover:border-[#39FF14]' 
                  : 'text-[#9B6DFF] border-[#2A1F45] hover:border-[#9B6DFF] bg-[#120F1E]'}`}
              title={isLoggedIn ? "Access Authorized Admin Console" : "Access Admin Console — Sign In"}
            >
              <span className={`w-1.5 h-1.5 ${isLoggedIn ? 'bg-[#39FF14]' : 'bg-[#9B6DFF] animate-pulse'}`}></span>
              <span className="hidden sm:inline">{isLoggedIn ? 'CONSOLE' : 'CONSOLE [SIGN IN]'}</span>
              <span className="sm:hidden">{isLoggedIn ? 'CONSOLE' : 'SIGN IN'}</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#F8F3E9]/80 hover:text-[#9B6DFF] transition-colors cursor-pointer flex items-center"
            >
              <ShoppingBag size={18} className="text-[#F8F3E9] hover:text-[#9B6DFF]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-[#9B6DFF] text-[#0A0812] text-[9px] font-bold w-5 h-5 rounded-none flex items-center justify-center border border-[#0A0812] font-body-mono shadow-[0_0_6px_#9B6DFF]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Floating mobile search input */}
      {searchOpen && (
        <div className="md:hidden bg-[#120F1E] border-t border-[#2A1F45] p-3 animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="SEARCH CATALOG DEPT..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="bg-[#0A0812] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none p-2.5 flex-1 text-[#F8F3E9] placeholder-[#F8F3E9]/30"
              autoFocus
            />
            <button
              type="submit"
              className="bg-[#9B6DFF] text-[#0A0812] px-4 py-2 text-xs font-bold font-body-mono uppercase hover:bg-[#9B6DFF]/85 cursor-pointer"
            >
              FIND
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#120F1E]/98 border-b border-[#2A1F45] z-40 shadow-2xl animate-fadeIn">
          <div className="px-4 pt-4 pb-6 space-y-3">
            <span className="text-[9px] tracking-[0.25em] text-[#B68D40] font-bold block uppercase border-b border-[#2A1F45] pb-2">
              SECTORS / CLASSIFIED CATALOGS
            </span>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className="block w-full text-left py-2 text-sm tracking-widest text-[#F8F3E9]/90 hover:text-[#9B6DFF] transition-colors uppercase font-body-mono border-b border-[#2A1F45]/30"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
