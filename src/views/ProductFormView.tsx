/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, X, Paintbrush, CircleHelp, ShieldAlert } from 'lucide-react';
import { Product, CategoryType, BadgeType } from '../types';
import { Button } from '../components/ui/Button';
import { RetroInput } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ImageUploader } from '../components/admin/ImageUploader';
import { ProductSchema, ProductFormValues } from '../lib/validations';
import { dbService } from '../lib/supabase';

interface ProductFormViewProps {
  productToEdit?: Product | null;
  onBack: () => void;
  onSave: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
}

export const ProductFormView: React.FC<ProductFormViewProps> = ({
  productToEdit,
  onBack,
  onSave,
}) => {
  const isEdit = !!productToEdit;

  // Form Field States
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<CategoryType>('mens');
  const [price, setPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [stock, setStock] = useState<string>('0');
  const [badge, setBadge] = useState<BadgeType>('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  // Sizes & Custom Additions
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');

  // Colors & Swatches
  const [colors, setColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('#9B6DFF');

  // Slug lock (auto-generate unless manually touched)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Errors & Loading state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Seed form if editing
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSlug(productToEdit.slug);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price.toString());
      setSalePrice(productToEdit.sale_price !== null ? productToEdit.sale_price.toString() : '');
      setStock(productToEdit.stock.toString());
      setBadge(productToEdit.badge || '');
      setShortDesc(productToEdit.short_desc || '');
      setFullDesc(productToEdit.description || '');
      setIsActive(productToEdit.is_active);
      setIsFeatured(productToEdit.is_featured);
      setImages(productToEdit.images || []);
      setSizes(productToEdit.sizes || []);
      setColors(productToEdit.colors || []);
      setIsSlugManuallyEdited(true); // Locked on edit
    } else {
      // Default reset
      setName('');
      setSlug('');
      setCategory('mens');
      setPrice('');
      setSalePrice('');
      setStock('0');
      setBadge('');
      setShortDesc('');
      setFullDesc('');
      setIsActive(true);
      setIsFeatured(false);
      setImages([]);
      setSizes(['M', 'L']); // defaults
      setColors(['#FF007F', '#00F0FF']); // defaults
      setIsSlugManuallyEdited(false);
    }
    setErrors({});
    setGeneralError(null);
  }, [productToEdit]);

  // Slugifier generator helper
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Name update hooks
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugManuallyEdited && !isEdit) {
      setSlug(slugify(val));
    }
  };

  // Slug input changes
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    setSlug(slugify(e.target.value));
  };

  // Toggle variant size chips
  const toggleSizeChip = (sz: string) => {
    setSizes((prev) =>
      prev.includes(sz) ? prev.filter((item) => item !== sz) : [...prev, sz]
    );
  };

  // Add custom size token
  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    const token = customSize.trim().toUpperCase();
    if (!token) return;
    if (!sizes.includes(token)) {
      setSizes((prev) => [...prev, token]);
    }
    setCustomSize('');
  };

  // Add custom color swatch hex code
  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    const hex = newColor.trim();
    if (!hex) return;
    if (!colors.includes(hex)) {
      setColors((prev) => [...prev, hex]);
    }
  };

  // Remove color swatch
  const handleRemoveColor = (hex: string) => {
    setColors((prev) => prev.filter((c) => c !== hex));
  };

  // Form submit handler with Zod & slug uniqueness verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setIsSaving(true);

    // Parse input fields to numeric/zod-ready formats
    const parsedPrice = parseFloat(price);
    const parsedSalePrice = salePrice.trim() !== '' ? parseFloat(salePrice) : null;
    const parsedStock = parseInt(stock, 10);

    const formValues: ProductFormValues = {
      name,
      slug,
      category,
      price: parsedPrice,
      sale_price: parsedSalePrice,
      stock: parsedStock,
      badge: badge || '',
      short_desc: shortDesc || null,
      description: fullDesc || null,
      is_active: isActive,
      is_featured: isFeatured,
      images,
      sizes,
      colors,
    };

    // Zod Validation Block
    const validationResult = ProductSchema.safeParse(formValues);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      setGeneralError('VALIDATION FAILURE: Review the highlighted parameters before cataloging inventory.');
      setIsSaving(false);
      return;
    }

    // Slug uniqueness check against mock/real DB
    try {
      const isUnique = await dbService.isSlugUnique(slug, productToEdit?.id);
      if (!isUnique) {
        setErrors((prev) => ({ ...prev, slug: 'URL Slug is already allocated. Must be unique.' }));
        setGeneralError('DUPLICATION EXCEPTION: The specified URL slug is already associated with another inventory item.');
        setIsSaving(false);
        return;
      }

      // Catalog/save to database
      await onSave({
        ...formValues,
        id: productToEdit?.id,
      });

    } catch (err: any) {
      console.error(err);
      setGeneralError(`SECURE TRANSACTION FAULT: ${err.message || 'Error occurred while saving product.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-body-mono text-cream select-none animate-fadeIn">
      
      {/* 1. Header Navigation block */}
      <div className="flex justify-between items-center bg-retro-surface border-2 border-retro-border p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cream-muted hover:text-accent-purple transition-colors text-xs font-bold font-retro-mono tracking-wider cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>BACK TO RECORDS</span>
        </button>

        <h3 className="text-sm font-retro-heading uppercase text-accent-purple tracking-widest hidden md:block">
          {isEdit ? ':: EDIT INVENTORY ENTRY' : ':: RECORD NEW ENTRY'}
        </h3>
      </div>

      {/* Errors Alert banner */}
      {generalError && (
        <div className="p-4 bg-retro-red/10 border-2 border-retro-red text-retro-red text-xs flex items-start gap-2.5">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <div className="font-bold">{generalError}</div>
        </div>
      )}

      {/* 2. Primary Layout Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main textual metadata details (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-5">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [PRIMARY PARAMETERS]
            </h4>

            {/* Title / Name */}
            <RetroInput
              label="PRODUCT SPECIFICATION NAME"
              value={name}
              onChange={handleNameChange}
              error={errors.name}
              placeholder="e.g. CYBERPUNK DRIFTER HOODIE"
              maxLength={100}
              required
            />

            {/* URL Slug */}
            <RetroInput
              label="SECURE URL SLUG"
              value={slug}
              onChange={handleSlugChange}
              error={errors.slug}
              placeholder="cyberpunk-drifter-hoodie"
              required
            />

            {/* Dual Column: Category & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="INVENTORY CATEGORY"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                options={[
                  { value: 'mens', label: 'MENSWEAR' },
                  { value: 'womens', label: 'WOMENSWEAR' },
                  { value: 'gym', label: 'GYM & TACTICAL' },
                  { value: 'jewelry', label: 'JEWELRY' },
                  { value: 'accessories', label: 'ACCESSORIES' },
                ]}
                error={errors.category}
              />

              <Select
                label="CATALOG BADGE (PROMOTIONAL)"
                value={badge}
                onChange={(e) => setBadge(e.target.value as BadgeType)}
                options={[
                  { value: '', label: 'NONE' },
                  { value: 'NEW', label: 'NEW' },
                  { value: 'LIMITED', label: 'LIMITED' },
                  { value: 'SALE', label: 'SALE' },
                  { value: 'HOT', label: 'HOT' },
                ]}
                error={errors.badge}
              />
            </div>

            {/* Description Paragraph blocks */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5 font-body-mono">
                <div className="flex justify-between items-center text-xs text-cream-muted uppercase tracking-wider">
                  <span>SHORT DESCRIPTION (SEO / CARD GRID)</span>
                  <span className={`${shortDesc.length > 160 ? 'text-retro-red' : 'text-cream-muted'}`}>
                    {shortDesc.length} / 160 CHARS
                  </span>
                </div>
                <textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Summarize product features for the listing grid card..."
                  maxLength={160}
                  className={`bg-space-black text-cream border-2 p-3 text-xs focus:outline-none placeholder:text-cream-muted/30 aspect-[5/1] resize-none
                    ${errors.short_desc ? 'border-retro-red' : 'border-retro-border focus:border-accent-purple'}`}
                />
                {errors.short_desc && <span className="text-retro-red text-xs">! {errors.short_desc}</span>}
              </div>

              <div className="flex flex-col gap-1.5 font-body-mono">
                <div className="flex justify-between items-center text-xs text-cream-muted uppercase tracking-wider">
                  <span>FULL DETAIL SPECIFICATION DESCRIPTION</span>
                  <span className={`${fullDesc.length > 2000 ? 'text-retro-red' : 'text-cream-muted'}`}>
                    {fullDesc.length} / 2000 CHARS
                  </span>
                </div>
                <textarea
                  value={fullDesc}
                  onChange={(e) => setFullDesc(e.target.value)}
                  placeholder="Enter rigorous product spec details, material layers, cybernetics..."
                  maxLength={2000}
                  className={`bg-space-black text-cream border-2 p-3 text-xs focus:outline-none placeholder:text-cream-muted/30 h-44 resize-y
                    ${errors.description ? 'border-retro-red' : 'border-retro-border focus:border-accent-purple'}`}
                />
                {errors.description && <span className="text-retro-red text-xs">! {errors.description}</span>}
              </div>
            </div>
          </div>

          {/* Core Image uploader */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [SECURE CDN ATTACHMENTS]
            </h4>
            <ImageUploader
              images={images}
              onChange={setImages}
              userId="ops-cyber-auth"
            />
            {errors.images && (
              <p className="text-retro-red font-retro-mono text-xs mt-1">! {errors.images}</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Numeric pricing, stock, sizing, color variants, statuses */}
        <div className="space-y-6">
          
          {/* Numbers panel */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4.5">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [PRICING & METRICS]
            </h4>

            {/* Standard Retail Price */}
            <RetroInput
              label="RETAIL PRICE USD ($)"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={errors.price}
              placeholder="129.99"
              required
            />

            {/* Sale price */}
            <RetroInput
              label="PROMOTIONAL SALE PRICE USD ($)"
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              error={errors.sale_price}
              placeholder="99.99 (OPTIONAL)"
            />

            {/* Physical Stock count */}
            <RetroInput
              label="PHYSICAL STOCK COUNT"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              error={errors.stock}
              placeholder="15"
              required
            />
          </div>

          {/* Variants panel: Sizes and Colors */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-5">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [VARIANTS CONFIG]
            </h4>

            {/* Sizing Chips selector */}
            <div className="space-y-2">
              <span className="text-xs text-cream-muted uppercase tracking-wider block">
                Authorized Sizes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'].map((sz) => {
                  const active = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSizeChip(sz)}
                      className={`px-2.5 py-1 text-xs border cursor-pointer font-bold font-retro-mono
                        ${active 
                          ? 'border-accent-purple text-accent-purple bg-accent-purple/10 hover:bg-transparent hover:text-cream hover:border-retro-border' 
                          : 'border-retro-border text-cream-muted hover:border-accent-purple hover:text-cream'}
                      `}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom size form */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-retro-border/40">
                <input
                  type="text"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  placeholder="CUSTOM SIZE..."
                  className="bg-space-black border border-retro-border text-cream text-[10px] px-2 py-1.5 focus:outline-none focus:border-accent-purple uppercase flex-1 max-w-[120px]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="px-2 py-1.5 bg-retro-surface border border-retro-border text-accent-purple hover:border-accent-purple hover:bg-space-black transition-colors text-[10px] flex items-center gap-1 cursor-pointer font-bold uppercase"
                >
                  <Plus size={12} /> ADD
                </button>
              </div>
              {errors.sizes && <p className="text-retro-red text-xs mt-1">! {errors.sizes}</p>}
            </div>

            {/* Color Swatch generator */}
            <div className="space-y-2 pt-2 border-t border-retro-border/40">
              <span className="text-xs text-cream-muted uppercase tracking-wider block">
                Color Swatches:
              </span>

              {/* Interactive preview row */}
              <div className="flex flex-wrap gap-2.5 min-h-[30px] items-center p-2 bg-space-black border border-retro-border">
                {colors.length > 0 ? (
                  colors.map((hex) => (
                    <div
                      key={hex}
                      className="group relative w-6 h-6 border-2 border-retro-border cursor-pointer flex items-center justify-center shrink-0"
                      style={{ backgroundColor: hex }}
                      onClick={() => handleRemoveColor(hex)}
                      title="Click to remove color swatch"
                    >
                      <X size={10} className="text-white drop-shadow-[0_0_2px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-cream-muted/40 uppercase">NO ACTIVE COLOR SWATCHES.</span>
                )}
              </div>

              {/* Color addition controls */}
              <div className="flex items-center gap-2 mt-2">
                {/* Visual Native Picker */}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 bg-transparent border-0 cursor-pointer shrink-0"
                  title="Tune Color Swatch"
                />
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="bg-space-black border border-retro-border text-cream text-[10px] px-2 py-2 focus:outline-none focus:border-accent-purple uppercase flex-1 max-w-[100px]"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-2.5 py-2 bg-retro-surface border border-retro-border text-accent-purple hover:border-accent-purple hover:bg-space-black transition-colors text-[10px] flex items-center gap-1.5 cursor-pointer font-bold uppercase"
                >
                  <Paintbrush size={12} /> ADD SWATCH
                </button>
              </div>
              {errors.colors && <p className="text-retro-red text-xs mt-1">! {errors.colors}</p>}
            </div>
          </div>

          {/* Feature toggles */}
          <div className="bg-retro-surface border-2 border-retro-border p-5 space-y-4">
            <h4 className="text-xs font-retro-heading uppercase tracking-widest text-cream border-b border-retro-border pb-3 mb-1">
              [DISTRIBUTION STATE]
            </h4>

            {/* Is Active Toggle */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5 max-w-[70%]">
                <span className="text-xs text-cream font-bold uppercase">AVAILABLE ONLINE</span>
                <span className="text-[10px] text-cream-muted uppercase leading-relaxed">
                  Visible to public storefront buyers.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="text-accent-purple focus:outline-none transition-transform hover:scale-105"
              >
                {isActive ? (
                  <span className="text-retro-green text-sm font-retro-mono font-bold tracking-wider cursor-pointer">
                    [● ACTIVE]
                  </span>
                ) : (
                  <span className="text-cream-muted text-sm font-retro-mono font-bold tracking-wider cursor-pointer">
                    [○ INACTIVE]
                  </span>
                )}
              </button>
            </div>

            {/* Is Featured Toggle */}
            <div className="flex justify-between items-center pt-3 border-t border-retro-border/40">
              <div className="flex flex-col gap-0.5 max-w-[70%]">
                <span className="text-xs text-cream font-bold uppercase">FEATURED SPOTLIGHT</span>
                <span className="text-[10px] text-cream-muted uppercase leading-relaxed">
                  Highlights on store primary display banners.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className="text-accent-purple focus:outline-none transition-transform hover:scale-105"
              >
                {isFeatured ? (
                  <span className="text-retro-gold text-sm font-retro-mono font-bold tracking-wider cursor-pointer">
                    [★ FEATURED]
                  </span>
                ) : (
                  <span className="text-cream-muted text-sm font-retro-mono font-bold tracking-wider cursor-pointer">
                    [☆ STANDARD]
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons save */}
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="w-full py-4 text-sm flex items-center justify-center gap-2 font-bold select-none cursor-pointer"
          >
            {isSaving ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-space-black border-t-transparent rounded-full mr-2" />
                <span>SAVING RECORDS...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>COMMIT & CATALOG ITEM</span>
              </>
            )}
          </Button>

        </div>

      </form>
    </div>
  );
};
export default ProductFormView;
