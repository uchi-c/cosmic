/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { ArrowRight, ShoppingCart, Sparkles, Eye, Compass } from 'lucide-react';
import { Product, CategoryType } from '../../types';
import {
  Starfield,
  ShinyText,
  ScrollReveal,
  Tilt3D,
  MagneticButton,
  AccordionGallery,
} from '../../components/ui/reactbits';
import { AlienModel } from '../../components/storefront/AlienModel';

// three.js is heavy and purely decorative here — code-split so it never
// blocks the hero's initial paint.
const ASCIIText = React.lazy(() => import('../../components/ui/reactbits/ASCIIText'));

interface HomeViewProps {
  products: Product[];
  onNavigate: (page: 'home' | 'shop' | 'checkout', category?: CategoryType | 'all') => void;
  onQuickAdd: (product: Product, qty: number, size?: string, color?: string) => void;
  onViewProduct: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  onNavigate,
  onQuickAdd,
  onViewProduct,
}) => {
  // Filter active products
  const activeProducts = products.filter((p) => p.is_active);

  // New Arrivals: 4 newest products
  const newArrivals = [...activeProducts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // Featured Collection: is_featured products
  const featuredProducts = activeProducts.filter((p) => p.is_featured).slice(0, 4);

  // Trending Products: products with badges (HOT, LIMITED, SALE) or newest
  const trendingProducts = activeProducts
    .filter((p) => p.badge && p.badge !== '')
    .slice(0, 4);

  // Fallback if no trending badge products: use next slice
  const actualTrending = trendingProducts.length > 0 ? trendingProducts : activeProducts.slice(2, 6);

  // Categories definitions
  const categoriesList: { label: string; value: CategoryType; image: string; count: number }[] = [
    {
      label: 'MENSWEAR',
      value: 'mens',
      image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&auto=format&fit=crop&q=80',
      count: activeProducts.filter((p) => p.category === 'mens').length,
    },
    {
      label: 'WOMENSWEAR',
      value: 'womens',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
      count: activeProducts.filter((p) => p.category === 'womens').length,
    },
    {
      label: 'GYM & TACTICAL',
      value: 'gym',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
      count: activeProducts.filter((p) => p.category === 'gym').length,
    },
    {
      label: 'JEWELRY',
      value: 'jewelry',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80',
      count: activeProducts.filter((p) => p.category === 'jewelry').length,
    },
    {
      label: 'ACCESSORIES',
      value: 'accessories',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      count: activeProducts.filter((p) => p.category === 'accessories').length,
    },
  ];

  // Helper component to render item card
  const ProductCard = ({ product }: { product: Product; key?: any }) => {
    const isOutOfStock = product.stock <= 0;
    const hasSale = product.sale_price !== null && product.sale_price !== undefined;

    return (
      <Tilt3D max={9} className="group flex flex-col bg-[#120F1E] border border-[#2A1F45] overflow-hidden transition-all relative product-card-lift-glow">
        {/* Promotional Badge */}
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

        {/* Product image — tappable on mobile (no hover to rely on) */}
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

          {/* Quick Action Overlays — desktop only. Pure CSS :hover never sticks
             on touch devices (tap simulates hover then drops it), so mobile
             gets a persistent icon instead below. */}
          <div className="hidden md:flex absolute inset-0 bg-[#0A0812]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-center items-center gap-3 p-4">
            <button
              onClick={(e) => { e.stopPropagation(); onViewProduct(product); }}
              className="w-full py-2.5 bg-[#F8F3E9] text-[#0A0812] font-body-mono text-[10px] tracking-widest font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-[#B68D40] hover:text-[#0A0812] transition-colors cursor-pointer"
            >
              <Eye size={13} />
              <span>INSPECT DETAILS</span>
            </button>

            {!isOutOfStock ? (
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAdd(product, 1, product.sizes[0], product.colors[0]); }}
                className="w-full py-2.5 bg-transparent border border-[#9B6DFF] text-[#9B6DFF] font-body-mono text-[10px] tracking-widest font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-[#9B6DFF] hover:text-[#0A0812] transition-colors cursor-pointer"
              >
                <ShoppingCart size={13} />
                <span>QUICK DISPATCH</span>
              </button>
            ) : (
              <div className="w-full py-2.5 border border-[#FF4444]/30 text-[#FF4444]/60 font-body-mono text-[10px] tracking-widest font-bold uppercase text-center select-none bg-[#FF4444]/10">
                OUT OF INVENTORY
              </div>
            )}
          </div>

          {/* Mobile quick-add — always visible, no hover/tap-reveal needed */}
          {!isOutOfStock && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickAdd(product, 1, product.sizes[0], product.colors[0]); }}
              className="md:hidden absolute bottom-2.5 right-2.5 p-2.5 bg-[#0A0812]/85 border border-[#9B6DFF]/50 text-[#9B6DFF] active:bg-[#9B6DFF] active:text-[#0A0812] transition-colors cursor-pointer"
              aria-label="Quick add to bag"
            >
              <ShoppingCart size={15} />
            </button>
          )}
        </div>

        {/* Product specs row */}
        <div className="p-4 flex-1 flex flex-col justify-between gap-2.5">
          <div>
            <span className="text-[9px] text-[#B68D40] font-body-mono tracking-widest uppercase block mb-1">
              {product.category} dept // {product.stock} units remaining
            </span>
            <h4 className="font-serif text-sm tracking-wide text-[#F8F3E9] group-hover:text-[#9B6DFF] transition-colors line-clamp-1">
              {product.name}
            </h4>
          </div>

          <div className="flex items-baseline gap-2 pricing-data">
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
  };

  return (
    <div className="space-y-24 pb-16 text-[#F8F3E9] font-sans">
      
      {/* 1. LITERARY EDITORIAL HERO BLOCK */}
      <section className="relative h-[90vh] bg-[#0A0812] border-b border-[#2A1F45] overflow-hidden flex items-center">
        {/* Deep space nebula backdrop (self-contained — no external host) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(155,109,255,0.28),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(57,255,20,0.10),transparent_50%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0812] via-[#0A0812]/85 to-transparent z-10" />
        </div>

        {/* House model — extraterrestrial couture focal figure (right of copy) */}
        <div className="absolute right-0 top-0 bottom-0 z-[5] w-1/2 hidden md:flex items-center justify-center pointer-events-none">
          <AlienModel variant="hero" className="h-[88%] w-auto drop-shadow-[0_0_45px_rgba(155,109,255,0.35)] animate-floatY" />
        </div>

        {/* Animated cosmic starfield (theme-tinted, honours reduced-motion) */}
        <Starfield className="z-0 opacity-70" density={110} speed={0.9} />

        {/* Ambient drifting glow meshes */}
        <div className="absolute top-1/4 right-1/4 w-[35rem] h-[35rem] bg-[#9B6DFF]/10 rounded-full blur-[120px] pointer-events-none z-0 animate-aurora" />
        <div className="absolute bottom-0 left-1/4 w-[26rem] h-[26rem] bg-[var(--theme-accent)]/10 rounded-full blur-[130px] pointer-events-none z-0 animate-aurora" style={{ animationDelay: '3s' }} />

        {/* ASCII signature mark — small decorative accent beside the house model,
           not a replacement for it. Code-split (three.js) via React.lazy so it
           never delays the hero's first paint. */}
        <div className="hidden lg:block absolute bottom-8 right-8 z-[6] w-64 h-28 pointer-events-none opacity-80">
          <Suspense fallback={null}>
            <ASCIIText text="COSMIC_DEPT" asciiFontSize={6} textFontSize={140} planeBaseHeight={6} enableWaves />
          </Suspense>
        </div>

        {/* Hero Copy Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full select-none">
          <ScrollReveal direction="up" distance={24}>
            <div className="max-w-xl md:max-w-2xl space-y-6">
              <div className="flex items-center gap-2 text-[#B68D40] text-[10px] font-body-mono font-bold tracking-[0.3em] uppercase">
                <Sparkles size={14} className="animate-spin duration-3000" />
                <ShinyText
                  base="rgba(182, 141, 64, 0.55)"
                  highlight="#F8F3E9"
                  speed={5}
                >
                  COLLECTION DROP III • COLD HARBOR SYSTEM
                </ShinyText>
              </div>

              <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-extralight tracking-wide leading-tight text-[#F8F3E9] italic">
                WEAR YOUR <br className="hidden sm:block" />
                <span className="not-italic text-[#9B6DFF] font-semibold drop-shadow-[0_0_15px_rgba(155,109,255,0.3)]">OWN UNIVERSE</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#F8F3E9]/70 leading-relaxed font-light tracking-wide">
                Retro-engineered performance apparel made for modern space travel, luxury streetwear archives, and high-contrast styling. Structured contours paired with luminescent fabrics.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <MagneticButton
                  onClick={() => onNavigate('shop')}
                  className="py-4 px-8 text-xs font-body-mono tracking-[0.2em] font-bold text-[#0A0812] bg-[#9B6DFF] hover:bg-[#9B6DFF]/85 border-none shadow-[0_0_20px_rgba(155,109,255,0.4)] cursor-pointer flex items-center justify-center gap-2 uppercase transition-colors"
                >
                  <span>SHOP COLLECTION</span>
                  <ArrowRight size={13} />
                </MagneticButton>

                <MagneticButton
                  onClick={() => onNavigate('shop', 'all')}
                  strength={0.25}
                  className="py-4 px-8 text-xs font-body-mono tracking-[0.2em] font-bold text-[#F8F3E9] border border-[#2A1F45] hover:border-[#9B6DFF] hover:bg-[#9B6DFF]/10 transition-colors cursor-pointer flex items-center justify-center gap-2 uppercase"
                >
                  <Compass size={13} className="text-[#B68D40]" />
                  <span>EXPLORE DROPS</span>
                </MagneticButton>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 2. CATEGORIES GRID SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold uppercase block">
            :: SYSTEM SECTORS ::
          </span>
          <h3 className="font-serif text-3xl text-[#F8F3E9] tracking-wider italic">
            Shop by Department
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categoriesList.map((cat, i) => (
            <ScrollReveal key={cat.value} direction="up" delay={i * 0.08} distance={30}>
              <button
                onClick={() => onNavigate('shop', cat.value)}
                className="group relative aspect-[3/4] w-full overflow-hidden border border-[#2A1F45] hover:border-[#9B6DFF] transition-all bg-[#120F1E] text-left cursor-pointer flex flex-col justify-end p-4"
              >
                {/* Image backdrop */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0812] via-[#0A0812]/50 to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity" />
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter grayscale"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Text labels */}
                <div className="relative z-20">
                  <span className="text-[8px] font-body-mono text-[#B68D40] uppercase tracking-widest block mb-0.5">
                    {cat.count} files listed
                  </span>
                  <h4 className="font-serif text-base text-[#F8F3E9] tracking-wider group-hover:text-[#9B6DFF] uppercase transition-colors">
                    {cat.label}
                  </h4>
                </div>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 3. NEW ARRIVALS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 border-b border-[#2A1F45] pb-4">
          <div>
            <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold uppercase">
              SECTOR RECON Drop
            </span>
            <h3 className="font-serif text-3xl text-[#F8F3E9] tracking-wider italic mt-1">
              New Arrivals
            </h3>
          </div>
          <button
            onClick={() => onNavigate('shop', 'all')}
            className="text-xs font-body-mono text-[#9B6DFF] hover:text-[#B68D40] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>VIEW ALL ITEMS</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-[#120F1E] border border-[#2A1F45] text-[#F8F3E9]/50 font-body-mono text-xs uppercase">
            No items currently cataloged in database buffer.
          </div>
        )}
      </section>

      {/* 3.5. LOOKBOOK SECTOR GALLERY — hover-expand panel per department */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold uppercase block">
            :: FIELD LOOKBOOK ::
          </span>
          <h3 className="font-serif text-3xl text-[#F8F3E9] tracking-wider italic">
            Survey the Sectors
          </h3>
        </div>

        <AccordionGallery
          items={categoriesList.map((cat) => ({ image: cat.image, label: cat.label, alt: `${cat.label} lookbook` }))}
          onSelect={(_item, i) => onNavigate('shop', categoriesList[i].value)}
          defaultIndex={2}
          expandRatio={0.42}
          height={420}
          gap={8}
          radius={4}
          accentColor="#9B6DFF"
          overlayColor="#0A0812"
          textColor="#F8F3E9"
          trigger="hover"
        />
      </section>

      {/* 4. LUXURIOUS BRAND EDITORIAL / STORY SECTION */}
      <section className="bg-[#120F1E] border-y border-[#2A1F45] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] overflow-hidden border border-[#2A1F45] relative bg-[radial-gradient(circle_at_50%_30%,rgba(155,109,255,0.22),#0A0812_70%)] flex items-center justify-center">
            <Starfield className="z-0 opacity-60" density={70} speed={0.5} />
            <AlienModel variant="editorial" className="relative z-10 h-[92%] w-auto drop-shadow-[0_0_35px_rgba(182,141,64,0.25)]" />
          </div>

          <div className="space-y-6">
            <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.3em] font-bold uppercase block">
              ESTABLISHED IN LUSAKA ORBITAL SPACE
            </span>
            <h3 className="font-serif text-4xl text-[#F8F3E9] leading-tight font-extralight italic">
              Legacy fabrics meets <br />
              <span className="not-italic text-[#9B6DFF] font-semibold">future space design.</span>
            </h3>
            <p className="text-xs text-[#F8F3E9]/75 leading-relaxed font-light font-sans">
              Founded as an experimental tailoring house crafting performance streetwear for deep-space logistics crews, Cosmic Dept quickly merged aerospace shielding technology with the meticulous tailoring standards of traditional fashion houses.
            </p>
            <p className="text-xs text-[#F8F3E9]/75 leading-relaxed font-light font-sans">
              Every garment undergoes high-contrast styling and rigor testing. From reflective structural piping to custom heavy-knitted textiles, we engineer wearables that preserve your thermal shield while asserting your stylistic presence in the stars.
            </p>
            <div className="pt-2 font-serif text-[#B68D40] text-sm italic font-medium">
              — "The universe is cold, wear your own shield."
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURED COLLECTION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 border-b border-[#2A1F45] pb-4">
          <div>
            <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold uppercase">
              CURATED SELECTION
            </span>
            <h3 className="font-serif text-3xl text-[#F8F3E9] tracking-wider italic mt-1">
              Featured Collection
            </h3>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-body-mono text-[#9B6DFF] hover:text-[#B68D40] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>DISCOVER ALL</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-[#120F1E] border border-[#2A1F45] text-[#F8F3E9]/50 font-body-mono text-xs uppercase">
            No featured items currently cataloged.
          </div>
        )}
      </section>

      {/* 6. TRENDING ITEMS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 border-b border-[#2A1F45] pb-4">
          <div>
            <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.25em] font-bold uppercase">
              HIGH TRANSACTION SPEED
            </span>
            <h3 className="font-serif text-3xl text-[#F8F3E9] tracking-wider italic mt-1">
              Trending Products
            </h3>
          </div>
        </div>

        {actualTrending.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {actualTrending.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-[#120F1E] border border-[#2A1F45] text-[#F8F3E9]/50 font-body-mono text-xs uppercase">
            No trending products currently recorded.
          </div>
        )}
      </section>

      {/* 7. INSTAGRAM/SOCIAL SECTION MOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] font-body-mono text-[#B68D40] tracking-[0.3em] font-bold uppercase block">
            @COSMICDEPT // GRID FEED
          </span>
          <h3 className="font-serif text-3xl text-[#F8F3E9] tracking-wider italic">
            Operatives on Active Duty
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=80'
          ].map((url, index) => (
            <div key={index} className="aspect-square relative group overflow-hidden border border-[#2A1F45] hover:border-[#9B6DFF] bg-[#120F1E] transition-all">
              <img
                src={url}
                alt="Cosmic Dept instagram operatives"
                className="w-full h-full object-cover filter brightness-90 grayscale group-hover:grayscale-0 group-hover:scale-103 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#0A0812]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-body-mono text-[#9B6DFF] tracking-wider font-bold uppercase">
                  #COSMICDEPT // ACTIVATE
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
