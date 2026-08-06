/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal, Search, ArrowUpDown, Eye, ShoppingCart, RefreshCw, X } from 'lucide-react';
import { Product, CategoryType, BadgeType } from '../../types';
import { Tilt3D } from '../../components/ui/reactbits';

interface ShopViewProps {
  products: Product[];
  initialCategory: CategoryType | 'all';
  searchQuery: string;
  onClearSearch: () => void;
  onQuickAdd: (product: Product, size?: string, color?: string) => void;
  onViewProduct: (product: Product) => void;
  onCategoryChange?: (category: CategoryType | 'all') => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  initialCategory,
  searchQuery,
  onClearSearch,
  onQuickAdd,
  onViewProduct,
  onCategoryChange,
}) => {
  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>(initialCategory);
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'all' | 'instock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'newest'>('default');
  const [localSearch, setLocalSearch] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Simulated retro-loading latency on filter and query modifications
  useEffect(() => {
    setIsFetching(true);
    const timer = setTimeout(() => {
      setIsFetching(false);
    }, 650);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSize, selectedPriceRange, selectedStockStatus, sortBy, localSearch]);

  // Sync initialCategory when it changes from Navbar category clicks
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Propagate selectedCategory changes up to parent for dynamic portal theme styling
  useEffect(() => {
    if (onCategoryChange) {
      onCategoryChange(selectedCategory);
    }
  }, [selectedCategory, onCategoryChange]);

  // Sync searchQuery when it changes from Navbar search bar submissions
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Clean filters reset
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSize('all');
    setSelectedPriceRange('all');
    setSelectedStockStatus('all');
    setSortBy('default');
    setLocalSearch('');
    onClearSearch();
  };

  // Static options lists
  const categories: { label: string; value: CategoryType | 'all' }[] = [
    { label: 'ALL DEPT', value: 'all' },
    { label: 'MENSWEAR', value: 'mens' },
    { label: 'WOMENSWEAR', value: 'womens' },
    { label: 'GYM & TACTICAL', value: 'gym' },
    { label: 'JEWELRY', value: 'jewelry' },
    { label: 'ACCESSORIES', value: 'accessories' },
  ];

  const sizes = ['all', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'];

  const priceRanges = [
    { label: 'ALL VALUES', value: 'all' },
    { label: 'UNDER $50.00', value: 'under-50' },
    { label: '$50.00 — $100.00', value: '50-100' },
    { label: '$100.00 — $200.00', value: '100-200' },
    { label: 'OVER $200.00', value: 'over-200' },
  ];

  // Process filters dynamically
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.is_active);

    // 1. Search Query filter (local search + global navbar search)
    if (localSearch.trim()) {
      const query = localSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 3. Size Filter
    if (selectedSize !== 'all') {
      result = result.filter((p) => p.sizes.includes(selectedSize));
    }

    // 4. Price range Filter
    if (selectedPriceRange !== 'all') {
      result = result.filter((p) => {
        const actualPrice = p.sale_price !== null ? p.sale_price : p.price;
        if (selectedPriceRange === 'under-50') return actualPrice < 50;
        if (selectedPriceRange === '50-100') return actualPrice >= 50 && actualPrice <= 100;
        if (selectedPriceRange === '100-200') return actualPrice >= 100 && actualPrice <= 200;
        if (selectedPriceRange === 'over-200') return actualPrice > 200;
        return true;
      });
    }

    // 5. Availability Stock status Filter
    if (selectedStockStatus === 'instock') {
      result = result.filter((p) => p.stock > 0);
    }

    // 6. Sort parameters
    if (sortBy === 'price-asc') {
      result.sort((a, b) => {
        const pA = a.sale_price !== null ? a.sale_price : a.price;
        const pB = b.sale_price !== null ? b.sale_price : b.price;
        return pA - pB;
      });
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const pA = a.sale_price !== null ? a.sale_price : a.price;
        const pB = b.sale_price !== null ? b.sale_price : b.price;
        return pB - pA;
      });
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [products, localSearch, selectedCategory, selectedSize, selectedPriceRange, selectedStockStatus, sortBy]);

  return (
    <div className="text-[#F8F3E9] font-sans selection:bg-[#9B6DFF] selection:text-[#0A0812]">
      
      {/* 1. Shop Header banner */}
      <div className="border-b border-[#2A1F45] pb-8 mb-10">
        <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.3em] font-bold uppercase block mb-2 select-none">
          SECURE SECTOR ACCESS // ACTIVE FILES
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl tracking-wider uppercase font-semibold">
          {selectedCategory === 'all' ? 'CENTRAL CATALOGUE' : `${selectedCategory} DEPARTMENT`}
        </h2>
        <p className="text-xs text-[#F8F3E9]/65 font-light max-w-2xl mt-2">
          Browse our compiled archives of technical streetwear, retro jewelry, and aerospace tactical layers. All items cataloged live in real-time.
        </p>
      </div>

      {/* 2. Mobile Filters Toggle & Search & Sort controls bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#120F1E] border border-[#2A1F45] p-4 mb-8 select-none">
        
        {/* Left: Filter Toggle & Total count */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center justify-center gap-2 text-xs font-body-mono font-bold tracking-wider px-3.5 py-2 border border-[#2A1F45] hover:border-[#9B6DFF] hover:bg-[#9B6DFF]/10 text-[#F8F3E9] cursor-pointer w-full sm:w-auto"
          >
            <SlidersHorizontal size={14} className="text-[#B68D40]" />
            <span>FILTER ARCHIVES</span>
          </button>

          <span className="hidden lg:inline text-[11px] font-body-mono text-[#F8F3E9]/50 uppercase">
            STATUS: <span className="text-[#39FF14] font-bold">{filteredProducts.length}</span> ITEMS ARCHIVED IN SECTOR BUFFER
          </span>
        </div>

        {/* Right: Sort controls & Local keyword Search */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
          {/* Keyword Search field */}
          <div className="relative w-full sm:w-48 lg:w-60">
            <input
              type="text"
              placeholder="SEARCH BY KEYWORD..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-[#0A0812] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none py-2 pl-3 pr-8 text-[#F8F3E9] placeholder-[#F8F3E9]/30"
            />
            {localSearch ? (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-2 text-[#FF4444] hover:scale-105 cursor-pointer"
              >
                <X size={12} />
              </button>
            ) : (
              <Search size={12} className="absolute right-2.5 top-2.5 text-[#F8F3E9]/30" />
            )}
          </div>

          {/* Sort selection drop dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown size={12} className="text-[#B68D40]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0A0812] text-xs font-body-mono border border-[#2A1F45] focus:border-[#9B6DFF] focus:outline-none py-2 px-3 text-[#F8F3E9] cursor-pointer flex-1 sm:flex-initial uppercase"
            >
              <option value="default">DEFAULT TELEMETRY</option>
              <option value="price-asc">VALUE: LOW TO HIGH</option>
              <option value="price-desc">VALUE: HIGH TO LOW</option>
              <option value="newest">DROP DATE: NEWEST</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main dual panel Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* DESKTOP FILTER SIDEBAR (Visible only on lg: screens) */}
        <aside className="hidden lg:block space-y-8 select-none">
          <div className="bg-[#120F1E] border border-[#2A1F45] p-5 space-y-6">
            <div className="flex justify-between items-center border-b border-[#2A1F45] pb-3">
              <h3 className="text-xs font-body-mono font-bold tracking-[0.2em] text-[#B68D40] uppercase">
                FILTER MATRIX
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-[10px] font-body-mono text-[#F8F3E9]/40 hover:text-[#9B6DFF] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                title="Reset parameters"
              >
                <RefreshCw size={10} />
                <span>CLEAR</span>
              </button>
            </div>

            {/* A. Category Filter List */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-body-mono text-[#F8F3E9]/80 font-semibold uppercase tracking-wider">
                Sectors / Categories
              </h4>
              <div className="space-y-1.5 text-xs font-body-mono">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`block w-full text-left py-1 px-1.5 transition-colors uppercase cursor-pointer
                      ${selectedCategory === cat.value
                        ? 'text-[#9B6DFF] font-bold bg-[#9B6DFF]/5 border-l-2 border-[#9B6DFF]'
                        : 'text-[#F8F3E9]/60 hover:text-[#F8F3E9]'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* B. Price limits */}
            <div className="space-y-3 pt-4 border-t border-[#2A1F45]/60">
              <h4 className="text-[11px] font-body-mono text-[#F8F3E9]/80 font-semibold uppercase tracking-wider">
                Pricing Limits (USD)
              </h4>
              <div className="space-y-1.5 text-xs font-body-mono">
                {priceRanges.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setSelectedPriceRange(range.value)}
                    className={`block w-full text-left py-1 px-1.5 transition-colors uppercase cursor-pointer
                      ${selectedPriceRange === range.value
                        ? 'text-[#9B6DFF] font-bold bg-[#9B6DFF]/5 border-l-2 border-[#9B6DFF]'
                        : 'text-[#F8F3E9]/60 hover:text-[#F8F3E9]'}`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* C. Size variants */}
            <div className="space-y-3 pt-4 border-t border-[#2A1F45]/60">
              <h4 className="text-[11px] font-body-mono text-[#F8F3E9]/80 font-semibold uppercase tracking-wider">
                Variant Size Chips
              </h4>
              <div className="flex flex-wrap gap-1.5 font-body-mono">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-2 py-1 text-[10px] border cursor-pointer font-bold uppercase transition-all
                      ${selectedSize === sz
                        ? 'border-[#9B6DFF] text-[#9B6DFF] bg-[#9B6DFF]/10'
                        : 'border-[#2A1F45] text-[#F8F3E9]/50 hover:border-[#F8F3E9]/30 hover:text-[#F8F3E9]'}`}
                  >
                    {sz === 'all' ? 'ALL' : sz}
                  </button>
                ))}
              </div>
            </div>

            {/* D. Availability */}
            <div className="space-y-3 pt-4 border-t border-[#2A1F45]/60">
              <h4 className="text-[11px] font-body-mono text-[#F8F3E9]/80 font-semibold uppercase tracking-wider">
                AVAILABILITY LIMITS
              </h4>
              <div className="flex flex-col gap-2 text-xs font-body-mono">
                <button
                  onClick={() => setSelectedStockStatus('all')}
                  className={`block w-full text-left py-1 px-1.5 transition-colors uppercase cursor-pointer
                    ${selectedStockStatus === 'all'
                      ? 'text-[#9B6DFF] font-bold bg-[#9B6DFF]/5 border-l-2 border-[#9B6DFF]'
                      : 'text-[#F8F3E9]/60 hover:text-[#F8F3E9]'}`}
                >
                  SHOW ALL ARCHIVES
                </button>
                <button
                  onClick={() => setSelectedStockStatus('instock')}
                  className={`block w-full text-left py-1 px-1.5 transition-colors uppercase cursor-pointer
                    ${selectedStockStatus === 'instock'
                      ? 'text-[#9B6DFF] font-bold bg-[#9B6DFF]/5 border-l-2 border-[#9B6DFF]'
                      : 'text-[#F8F3E9]/60 hover:text-[#F8F3E9]'}`}
                >
                  IN STOCK ONLY
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* SHOP CATALOG PRODUCT GRID */}
        <section className="lg:col-span-3">
          {isFetching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`skeleton-${idx}`} className="flex flex-col bg-[#120F1E] border border-[#2A1F45] overflow-hidden relative animate-retro-pulse-glow h-[420px]">
                  {/* Image skeleton area */}
                  <div className="aspect-[4/5] bg-[#0A0812] relative overflow-hidden flex items-center justify-center shrink-0">
                    <div className="skeleton-scan-line" />
                    <span className="text-[9px] font-body-mono tracking-[0.2em] text-[#F8F3E9]/25 uppercase animate-pulse">
                      RETRIEVING RECORD...
                    </span>
                  </div>
                  
                  {/* Info area skeleton */}
                  <div className="p-4 flex-1 flex flex-col justify-between border-t border-[#2A1F45]/60">
                    <div className="space-y-2.5">
                      <div className="h-2 bg-[#2A1F45] w-1/3" />
                      <div className="h-4 bg-[#2A1F45]/80 w-3/4" />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-[#2A1F45]/30">
                      <div className="h-3.5 bg-[#2A1F45] w-1/4" />
                      <div className="h-6 w-16 bg-[#2A1F45]/60" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const hasSale = product.sale_price !== null && product.sale_price !== undefined;

                return (
                  <Tilt3D key={product.id} max={9} className="group flex flex-col bg-[#120F1E] border border-[#2A1F45] overflow-hidden transition-all relative product-card-lift-glow">

                    {/* Promotional Badge overlay */}
                    {product.badge && (
                      <span className={`absolute top-3 left-3 z-10 text-[9px] tracking-widest px-2.5 py-1 font-body-mono font-bold uppercase select-none
                        ${product.badge === 'NEW' ? 'bg-[#39FF14] text-[#0A0812]' : ''}
                        ${product.badge === 'LIMITED' ? 'bg-[#9B6DFF] text-[#0A0812] shadow-[0_0_8px_rgba(155,109,255,0.6)]' : ''}
                        ${product.badge === 'SALE' ? 'bg-[#FF4444] text-[#F8F3E9]' : ''}
                        ${product.badge === 'HOT' ? 'bg-[#B68D40] text-[#0A0812]' : ''}
                      `}>
                        {product.badge}
                      </span>
                    )}

                    {/* Image Aspect — tappable on mobile (no hover to rely on) */}
                    <div
                      className="aspect-[4/5] bg-[#0A0812] relative overflow-hidden shrink-0 cursor-pointer md:cursor-default"
                      onClick={() => onViewProduct(product)}
                    >
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#F8F3E9]/20 font-body-mono text-xs">
                          NO IMAGE PROVIDED
                        </div>
                      )}

                      {/* Quick Actions Hover overlay — desktop only. Pure CSS :hover
                         never sticks on touch devices (tap simulates hover then
                         drops it), so mobile gets a persistent icon instead below. */}
                      <div className="hidden md:flex absolute inset-0 bg-[#0A0812]/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-center items-center gap-2.5 p-4 select-none">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewProduct(product); }}
                          className="w-full py-2 bg-[#F8F3E9] text-[#0A0812] font-body-mono text-[10px] tracking-widest font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-[#B68D40] hover:text-[#0A0812] transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>INSPECT SPECIFICATION</span>
                        </button>

                        {!isOutOfStock ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onQuickAdd(product, product.sizes[0], product.colors[0]); }}
                            className="w-full py-2 bg-transparent border border-[#9B6DFF] text-[#9B6DFF] font-body-mono text-[10px] tracking-widest font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-[#9B6DFF] hover:text-[#0A0812] transition-colors cursor-pointer"
                          >
                            <ShoppingCart size={13} />
                            <span>QUICK ADD TO BAG</span>
                          </button>
                        ) : (
                          <div className="w-full py-2 border border-[#FF4444]/30 text-[#FF4444]/50 font-body-mono text-[10px] tracking-widest font-bold uppercase text-center select-none bg-[#FF4444]/15">
                            OUT OF STOCK
                          </div>
                        )}
                      </div>

                      {/* Mobile quick-add — always visible, no hover/tap-reveal needed */}
                      {!isOutOfStock && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onQuickAdd(product, product.sizes[0], product.colors[0]); }}
                          className="md:hidden absolute bottom-2.5 right-2.5 p-2.5 bg-[#0A0812]/85 border border-[#9B6DFF]/50 text-[#9B6DFF] active:bg-[#9B6DFF] active:text-[#0A0812] transition-colors cursor-pointer"
                          aria-label="Quick add to bag"
                        >
                          <ShoppingCart size={15} />
                        </button>
                      )}
                    </div>

                    {/* Text Details details */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[9px] text-[#B68D40] font-body-mono tracking-widest uppercase block mb-1 select-none">
                          {product.category} // stock: {product.stock} units
                        </span>
                        <h4 className="font-serif text-sm tracking-wide text-[#F8F3E9] group-hover:text-[#9B6DFF] transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                      </div>

                      <div className="flex items-baseline gap-2 pricing-data select-none">
                        {hasSale ? (
                          <>
                            <span className="text-[#9B6DFF] font-bold text-lg">
                              ${product.sale_price?.toFixed(2)}
                            </span>
                            <span className="text-[#F8F3E9]/35 text-xs line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#F8F3E9] font-bold text-lg">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                  </Tilt3D>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#120F1E] border border-[#2A1F45] text-[#F8F3E9]/50 font-body-mono text-xs uppercase flex flex-col gap-4 items-center justify-center select-none">
              <span>UNABLE TO FIND FILE RECS MATCHING MATRIX FILTERS.</span>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#9B6DFF] text-[#0A0812] font-bold tracking-widest text-[10px] hover:bg-[#9B6DFF]/80 cursor-pointer"
              >
                REBOOT FILTERS
              </button>
            </div>
          )}
        </section>

      </div>

      {/* MOBILE FILTER SIDEBAR OVERLAY DRAWER */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden font-body-mono select-none">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-xs bg-[#120F1E] border-l border-[#2A1F45] flex flex-col h-full shadow-2xl">
              
              {/* Drawer Header */}
              <div className="px-4 py-5 border-b border-[#2A1F45] flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.2em] text-[#B68D40]">FILTER MATRIX</span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-[#F8F3E9] hover:text-[#9B6DFF] p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* 1. Category */}
                <div className="space-y-2">
                  <span className="text-[10px] text-[#B68D40] uppercase tracking-wider block">Sectors / Categories</span>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setSelectedCategory(cat.value);
                          setMobileFiltersOpen(false);
                        }}
                        className={`block w-full text-left py-1.5 px-2 text-xs uppercase cursor-pointer
                          ${selectedCategory === cat.value ? 'text-[#9B6DFF] bg-[#9B6DFF]/5 border-l-2 border-[#9B6DFF]' : 'text-[#F8F3E9]/60'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Price */}
                <div className="space-y-2 pt-4 border-t border-[#2A1F45]/50">
                  <span className="text-[10px] text-[#B68D40] uppercase tracking-wider block">Price limits (USD)</span>
                  <div className="space-y-1">
                    {priceRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setSelectedPriceRange(range.value);
                          setMobileFiltersOpen(false);
                        }}
                        className={`block w-full text-left py-1.5 px-2 text-xs uppercase cursor-pointer
                          ${selectedPriceRange === range.value ? 'text-[#9B6DFF] bg-[#9B6DFF]/5 border-l-2 border-[#9B6DFF]' : 'text-[#F8F3E9]/60'}`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Sizes */}
                <div className="space-y-2 pt-4 border-t border-[#2A1F45]/50">
                  <span className="text-[10px] text-[#B68D40] uppercase tracking-wider block">Size chips</span>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => {
                          setSelectedSize(sz);
                          setMobileFiltersOpen(false);
                        }}
                        className={`px-2 py-1 text-[10px] border cursor-pointer uppercase font-bold
                          ${selectedSize === sz ? 'border-[#9B6DFF] text-[#9B6DFF] bg-[#9B6DFF]/10' : 'border-[#2A1F45] text-[#F8F3E9]/50'}`}
                      >
                        {sz === 'all' ? 'ALL' : sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Availability */}
                <div className="space-y-2 pt-4 border-t border-[#2A1F45]/50">
                  <span className="text-[10px] text-[#B68D40] uppercase tracking-wider block">Availability</span>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedStockStatus('all');
                        setMobileFiltersOpen(false);
                      }}
                      className={`block w-full text-left py-1.5 px-2 text-xs uppercase cursor-pointer
                        ${selectedStockStatus === 'all' ? 'text-[#9B6DFF] bg-[#9B6DFF]/5 border-l-2 border-[#9B6DFF]' : 'text-[#F8F3E9]/60'}`}
                    >
                      SHOW ALL ARCHIVES
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStockStatus('instock');
                        setMobileFiltersOpen(false);
                      }}
                      className={`block w-full text-left py-1.5 px-2 text-xs uppercase cursor-pointer
                        ${selectedStockStatus === 'instock' ? 'text-[#9B6DFF] bg-[#9B6DFF]/5 border-l-2 border-[#9B6DFF]' : 'text-[#F8F3E9]/60'}`}
                    >
                      IN STOCK ONLY
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset trigger in footer */}
              <div className="p-4 border-t border-[#2A1F45] bg-[#0A0812]">
                <button
                  onClick={() => {
                    handleResetFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="w-full py-2.5 bg-[#FF4444] text-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#FF4444]/80"
                >
                  CLEAR ALL FILTERS
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
