/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, CreditCard, ChevronRight, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Product, StoreSettings, CategoryType } from '../../types';

interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  settings: StoreSettings;
  onAddToCart: (product: Product, quantity: number, size: string, color: string) => void;
  onBuyNow: (product: Product, size: string, color: string) => void;
  onNavigate: (page: 'home' | 'shop' | 'checkout') => void;
  onViewProduct: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  settings,
  onAddToCart,
  onBuyNow,
  onNavigate,
  onViewProduct,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  // Simulated retro-loading latency on active product transitions
  useEffect(() => {
    setIsFetching(true);
    const timer = setTimeout(() => {
      setIsFetching(false);
    }, 650);
    return () => clearTimeout(timer);
  }, [product]);

  // Reset local component states when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setSelectedSize(product.sizes[0] || 'OS');
    setSelectedColor(product.colors[0] || '');
    setQuantity(1);
    setFeedbackMsg('');
  }, [product]);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= (settings.low_stock_threshold || 5);
  const hasSale = product.sale_price !== null && product.sale_price !== undefined;

  // Filter out related department products (same category, excluding current product)
  const relatedProducts = allProducts
    .filter((p) => p.is_active && p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCartClick = () => {
    if (isOutOfStock) return;
    onAddToCart(product, quantity, selectedSize, selectedColor);
    setFeedbackMsg('ITEM SUCCESSFULLY CONSIGNED TO CARGO BAG.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleBuyNowClick = () => {
    if (isOutOfStock) return;
    onBuyNow(product, selectedSize, selectedColor);
  };

  return (
    <div className="text-[#F8F3E9] font-sans selection:bg-[#9B6DFF] selection:text-[#0A0812]">
      
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('shop')}
          className="text-[10px] sm:text-xs font-body-mono uppercase text-[#9B6DFF] hover:text-[#9B6DFF]/80 transition-colors flex items-center gap-2 group cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>&lt;= DEPART FROM SPECIALIST FILE</span>
        </button>
      </div>

      {/* 1. Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs font-body-mono uppercase text-[#F8F3E9]/50 mb-10 select-none">
        <button onClick={() => onNavigate('shop')} className="hover:text-[#9B6DFF] cursor-pointer">
          ARCHIVE SECTOR
        </button>
        <ChevronRight size={12} className="text-[#B68D40]" />
        <span className="text-[#B68D40]">{product.category} dept</span>
        <ChevronRight size={12} className="text-[#B68D40]" />
        <span className="text-[#F8F3E9] truncate max-w-[150px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* 2. Main Product layout */}
      {isFetching ? (
        <>
          {/* Main Product layout Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
            
            {/* LEFT: IMAGE GALLERY MODULE SKELETON */}
            <div className="space-y-4 w-full animate-retro-pulse-glow">
              <div className="aspect-[4/5] bg-[#120F1E] border border-[#2A1F45] overflow-hidden relative flex items-center justify-center min-h-[400px] w-full">
                <div className="skeleton-scan-line" />
                <span className="text-[10px] font-body-mono tracking-[0.25em] text-[#F8F3E9]/20 uppercase">
                  RETRIEVING IMAGE SPECS...
                </span>
              </div>
              <div className="flex gap-3 select-none">
                <div className="w-20 h-24 bg-[#120F1E] border border-[#2A1F45]" />
                <div className="w-20 h-24 bg-[#120F1E] border border-[#2A1F45]" />
              </div>
            </div>

            {/* RIGHT: DETAILED TEXT DETAILS SKELETON */}
            <div className="space-y-6 w-full animate-retro-pulse-glow">
              {/* Header Metadata Skeleton */}
              <div className="space-y-3 border-b border-[#2A1F45] pb-6">
                <div className="h-3 bg-[#2A1F45] w-2/5" />
                <div className="h-8 bg-[#2A1F45] w-3/4" />
                <div className="h-6 bg-[#2A1F45] w-1/4 mt-2" />
              </div>

              {/* Description Block Skeleton */}
              <div className="space-y-3">
                <div className="h-3 bg-[#2A1F45] w-1/3" />
                <div className="h-3.5 bg-[#2A1F45] w-full" />
                <div className="h-3.5 bg-[#2A1F45] w-5/6" />
                <div className="h-3.5 bg-[#2A1F45] w-4/5" />
              </div>

              {/* Sizers/Customizers Skeletons */}
              <div className="space-y-4 pt-4 border-t border-[#2A1F45]/50">
                <div className="h-3 bg-[#2A1F45] w-1/4" />
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-[#120F1E] border border-[#2A1F45]" />
                  <div className="w-10 h-10 bg-[#120F1E] border border-[#2A1F45]" />
                  <div className="w-10 h-10 bg-[#120F1E] border border-[#2A1F45]" />
                </div>
              </div>

              {/* CTA Buttons Skeleton */}
              <div className="pt-4 space-y-3">
                <div className="h-12 bg-[#2A1F45] w-full" />
                <div className="h-10 bg-[#120F1E] border border-[#2A1F45] w-full" />
              </div>
            </div>
          </div>

          {/* Related Products Skeleton list */}
          <section className="pt-24 border-t border-[#2A1F45] mt-24">
            <div className="space-y-2 mb-10 select-none animate-retro-pulse-glow">
              <div className="h-3 bg-[#2A1F45] w-1/4" />
              <div className="h-6 bg-[#2A1F45] w-1/3" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`related-skeleton-${idx}`} className="flex flex-col bg-[#120F1E] border border-[#2A1F45] overflow-hidden relative animate-retro-pulse-glow h-[280px]">
                  <div className="aspect-[4/5] bg-[#0A0812] relative overflow-hidden flex items-center justify-center shrink-0 h-[180px]">
                    <div className="skeleton-scan-line" />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between border-t border-[#2A1F45]/60">
                    <div className="space-y-2">
                      <div className="h-2 bg-[#2A1F45] w-1/3" />
                      <div className="h-3.5 bg-[#2A1F45] w-3/4" />
                    </div>
                    <div className="h-3 bg-[#2A1F45] w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
            
            {/* LEFT: IMAGE GALLERY MODULE */}
            <div className="space-y-4">
              <div className="aspect-[4/5] bg-[#120F1E] border border-[#2A1F45] overflow-hidden relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImageIndex]}
                    alt={`${product.name} full spec view`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#F8F3E9]/20 font-body-mono text-xs uppercase">
                    NO ASSETS FOUND IN STORAGE
                  </div>
                )}

                {product.badge && (
                  <span className={`absolute top-4 left-4 z-10 text-[9px] tracking-widest px-2.5 py-1 font-body-mono font-bold uppercase select-none
                    ${product.badge === 'NEW' ? 'bg-[#39FF14] text-[#0A0812]' : ''}
                    ${product.badge === 'LIMITED' ? 'bg-[#9B6DFF] text-[#0A0812] shadow-[0_0_10px_rgba(155,109,255,0.6)]' : ''}
                    ${product.badge === 'SALE' ? 'bg-[#FF4444] text-[#F8F3E9]' : ''}
                    ${product.badge === 'HOT' ? 'bg-[#B68D40] text-[#0A0812]' : ''}
                  `}>
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Gallery Thumbnails List */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin select-none">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-20 h-24 border bg-[#120F1E] flex-shrink-0 overflow-hidden cursor-pointer transition-all
                        ${selectedImageIndex === index ? 'border-[#9B6DFF] ring-1 ring-[#9B6DFF]' : 'border-[#2A1F45] hover:border-[#F8F3E9]/30'}`}
                    >
                      <img src={img} alt={`Thumbnail preview ${index}`} className="w-full h-full object-cover filter brightness-90" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: DETAILED TEXT DETAILS & CUSTOMIZERS */}
            <div className="space-y-6">
              
              {/* Header Metadata */}
              <div className="space-y-2 border-b border-[#2A1F45] pb-6">
                <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold uppercase select-none">
                  DEPT COMPILATION // SLUG: {product.slug}
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl tracking-wide text-[#F8F3E9]">
                  {product.name}
                </h1>
                
                {/* Price values */}
                <div className="flex items-baseline gap-3 pt-2 pricing-data select-none">
                  {hasSale ? (
                    <>
                      <span className="text-xl sm:text-2xl text-[#9B6DFF] font-bold">
                        ${product.sale_price?.toFixed(2)}
                      </span>
                      <span className="text-xs text-[#F8F3E9]/40 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[9px] bg-[#FF4444]/15 text-[#FF4444] border border-[#FF4444]/25 px-1.5 py-0.5 font-bold">
                        PROMOTION SAVINGS
                      </span>
                    </>
                  ) : (
                    <span className="text-xl sm:text-2xl text-[#F8F3E9] font-bold">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Description Block */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-body-mono text-[#B68D40] tracking-wider uppercase font-bold select-none">
                  ARCHIVE SPECIFICATION
                </h3>
                <p className="text-xs text-[#F8F3E9]/80 leading-relaxed font-light">
                  {product.description || 'No descriptive record currently cataloged in the outer orbit server buffer.'}
                </p>
              </div>

              {/* Availability Indicators */}
              <div className="select-none font-body-mono">
                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-2 text-xs bg-[#FF4444]/15 text-[#FF4444] border border-[#FF4444]/25 px-3 py-1.5 font-bold uppercase">
                    <AlertTriangle size={13} />
                    <span>OUT OF STOCK // BACKORDER SUSPENDED</span>
                  </div>
                ) : isLowStock ? (
                  <div className="inline-flex items-center gap-2 text-xs bg-[#B68D40]/15 text-[#B68D40] border border-[#B68D40]/25 px-3 py-1.5 font-bold uppercase animate-pulse">
                    <AlertTriangle size={13} />
                    <span>CRITICAL INVENTORY: {product.stock} UNITS REMAINING</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 text-xs bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20 px-3 py-1.5 font-bold uppercase">
                    <Check size={13} />
                    <span>SECTOR BUFFER SECURED // IN STOCK</span>
                  </div>
                )}
              </div>

              {/* Variants Selectors Container */}
              {!isOutOfStock && (
                <div className="space-y-6 pt-4 border-t border-[#2A1F45]/50 select-none">
                  
                  {/* SIZE CUSTOMIZER CHIPS */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-body-mono text-[#F8F3E9]/60 uppercase tracking-wider block">
                        1. SELECTED SIZE
                      </span>
                      <div className="flex flex-wrap gap-2 font-body-mono">
                        {product.sizes.map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`px-3 py-1.5 text-xs border cursor-pointer font-bold uppercase transition-all
                              ${selectedSize === sz
                                ? 'border-[#9B6DFF] text-[#9B6DFF] bg-[#9B6DFF]/15'
                                : 'border-[#2A1F45] text-[#F8F3E9]/50 hover:border-[#F8F3E9]/35 hover:text-[#F8F3E9]'}`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* COLOR SWATCH INDICATOR CHIPS */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-body-mono text-[#F8F3E9]/60 uppercase tracking-wider block">
                        2. CORE COLOR PALETTE
                      </span>
                      <div className="flex gap-2.5 items-center">
                        {product.colors.map((col) => (
                          <button
                            key={col}
                            onClick={() => setSelectedColor(col)}
                            style={{ backgroundColor: col }}
                            className={`w-7 h-7 rounded-none cursor-pointer border transition-all flex items-center justify-center relative
                              ${selectedColor === col ? 'ring-2 ring-[#9B6DFF] border-[#0A0812]' : 'border-black/50 hover:scale-105'}`}
                            title={col}
                          >
                            {selectedColor === col && (
                              <Check size={11} className="text-white mix-blend-difference" />
                            )}
                          </button>
                        ))}
                        <span className="text-[10px] font-body-mono text-[#B68D40] uppercase tracking-wider ml-1">
                          {selectedColor}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* QUANTITY FIELD */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-body-mono text-[#F8F3E9]/60 uppercase tracking-wider block">
                      3. TRANSFER COUNT
                    </span>
                    <div className="flex items-center gap-1 font-body-mono">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 bg-[#120F1E] hover:bg-[#2A1F45] border border-[#2A1F45] text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-xs font-bold py-1.5 border-y border-[#2A1F45] select-none">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="w-8 h-8 bg-[#120F1E] hover:bg-[#2A1F45] border border-[#2A1F45] text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Feedbacks message */}
              {feedbackMsg && (
                <div className="bg-[#39FF14]/10 border border-[#39FF14]/25 p-3 text-xs font-body-mono text-[#39FF14] animate-fadeIn uppercase select-none">
                  {feedbackMsg}
                </div>
              )}

              {/* Action triggers Buttons */}
              <div className="pt-6 border-t border-[#2A1F45]/50 flex flex-col sm:flex-row gap-4 select-none">
                <button
                  onClick={handleAddToCartClick}
                  disabled={isOutOfStock}
                  className={`flex-1 py-4 px-6 text-xs font-body-mono tracking-[0.2em] font-bold text-[#0A0812] bg-[#9B6DFF] hover:bg-[#9B6DFF]/85 cursor-pointer flex items-center justify-center gap-2 uppercase transition-all
                    ${isOutOfStock ? 'opacity-35 cursor-not-allowed bg-[#2A1F45] text-[#F8F3E9]/45' : ''}`}
                >
                  <ShoppingBag size={14} />
                  <span>CONSIGN TO CARGO</span>
                </button>

                <button
                  onClick={handleBuyNowClick}
                  disabled={isOutOfStock}
                  className={`flex-1 py-4 px-6 text-xs font-body-mono tracking-[0.2em] font-bold text-[#F8F3E9] border border-[#2A1F45] hover:border-[#9B6DFF] hover:bg-[#9B6DFF]/10 cursor-pointer flex items-center justify-center gap-2 uppercase transition-all
                    ${isOutOfStock ? 'opacity-35 cursor-not-allowed border-[#2A1F45] text-[#F8F3E9]/45' : ''}`}
                >
                  <CreditCard size={14} className="text-[#B68D40]" />
                  <span>LAUNCH IMMEDIATE DISPATCH</span>
                </button>
              </div>

            </div>
          </div>

          {/* 3. RELATED PRODUCTS LIST SECTION */}
          {relatedProducts.length > 0 && (
            <section className="pt-24 border-t border-[#2A1F45] mt-24">
              <div className="text-center md:text-left space-y-2 mb-10 select-none">
                <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold uppercase block">
                  FILES OF KINDRED TELEMETRY
                </span>
                <h3 className="font-serif text-2xl tracking-wider text-[#F8F3E9] italic">
                  Related Department Catalogues
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProd) => {
                  const relatedSale = relatedProd.sale_price !== null && relatedProd.sale_price !== undefined;
                  
                  return (
                    <div
                      key={relatedProd.id}
                      onClick={() => onViewProduct(relatedProd)}
                      className="group flex flex-col bg-[#120F1E] border border-[#2A1F45] overflow-hidden cursor-pointer transition-all relative product-card-lift-glow"
                    >
                      <div className="aspect-[4/5] bg-[#0A0812] overflow-hidden relative">
                        {relatedProd.images && relatedProd.images.length > 0 ? (
                          <img
                            src={relatedProd.images[0]}
                            alt={relatedProd.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#F8F3E9]/20 font-body-mono text-xs uppercase">
                            NO RECORD
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
                        <div>
                          <span className="text-[8px] text-[#B68D40] font-body-mono tracking-widest uppercase block mb-1">
                            {relatedProd.category} // units: {relatedProd.stock}
                          </span>
                          <h4 className="font-serif text-xs tracking-wide text-[#F8F3E9] group-hover:text-[#9B6DFF] transition-colors line-clamp-1">
                            {relatedProd.name}
                          </h4>
                        </div>

                        <div className="flex items-baseline gap-2 pricing-data">
                          {relatedSale ? (
                            <>
                              <span className="text-[#9B6DFF] text-sm">
                                ${relatedProd.sale_price?.toFixed(2)}
                              </span>
                              <span className="text-[#F8F3E9]/35 text-[10px] line-through font-normal">
                                ${relatedProd.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#F8F3E9] text-sm">
                              ${relatedProd.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

    </div>
  );
};
