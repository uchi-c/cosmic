/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductSchema } from './validations';
import { Product, CategoryType, BadgeType } from '../types';

export type ImportProduct = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

export interface ImportRow {
  index: number;
  name: string;
  category: string;
  product?: ImportProduct;
  errors: string[];
}

export interface ParseResult {
  rows: ImportRow[];
  headerMissing: string[];
  totalValid: number;
}

export const PRODUCT_CSV_HEADERS = [
  'name', 'category', 'price', 'sale_price', 'stock',
  'sizes', 'colors', 'images', 'badge', 'short_desc',
  'description', 'is_active', 'is_featured',
];

export const CSV_TEMPLATE = `name,category,price,sale_price,stock,sizes,colors,images,badge,short_desc,description,is_active,is_featured
NEON DRIFTER JACKET,mens,189.99,149.99,12,M|L|XL,#FF007F|#00F0FF,https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600,HOT,Luminescent bomber jacket,Full description here,true,true
MATRIX MONO GLASSES,accessories,45,,45,OS,#000000|#39FF14,https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600,NEW,Narrow cyberpunk sunglasses,,true,false`;

const CATEGORIES: CategoryType[] = ['mens', 'womens', 'gym', 'jewelry', 'accessories'];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'product';

// Multi-value cells use | or ; as the separator (commas are the CSV delimiter).
const splitList = (v: string) => (v || '').split(/[|;]/).map((x) => x.trim()).filter(Boolean);

const parseBool = (v: string, def: boolean) => {
  const t = (v || '').trim().toLowerCase();
  if (['true', 'yes', '1', 'y'].includes(t)) return true;
  if (['false', 'no', '0', 'n'].includes(t)) return false;
  return def;
};

/** RFC-4180-ish CSV parser: handles quoted fields, escaped quotes, and quoted commas/newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // Drop fully-empty lines.
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/**
 * Parse a product CSV into validated import rows. Column order is free (mapped
 * by header name). Required columns: name, category, price. Sensible defaults
 * fill the rest, and each row is validated against the shared ProductSchema so
 * import uses the exact same rules as the single-product form.
 */
export function parseProductsCsv(text: string): ParseResult {
  const table = parseCsv(text);
  if (table.length < 1) {
    return { rows: [], headerMissing: ['name', 'category', 'price'], totalValid: 0 };
  }

  const header = table[0].map((h) => h.trim().toLowerCase());
  const idxOf = (name: string) => header.indexOf(name);
  const headerMissing = ['name', 'category', 'price'].filter((h) => idxOf(h) === -1);

  const rows: ImportRow[] = [];
  const seenSlugs = new Set<string>();

  for (let r = 1; r < table.length; r++) {
    const cols = table[r];
    const get = (name: string) => { const i = idxOf(name); return i >= 0 ? (cols[i] ?? '').trim() : ''; };

    const name = get('name');
    const category = get('category').toLowerCase();
    const errors: string[] = [];

    if (!name) {
      rows.push({ index: r, name: `(row ${r})`, category, errors: ['Missing name'] });
      continue;
    }

    const priceNum = parseFloat(get('price'));
    const saleRaw = get('sale_price');
    const saleNum = saleRaw === '' ? null : parseFloat(saleRaw);
    const stockRaw = get('stock');
    const stockNum = stockRaw === '' ? 0 : parseInt(stockRaw, 10);
    let sizes = splitList(get('sizes')); if (sizes.length === 0) sizes = ['OS'];
    let colors = splitList(get('colors')); if (colors.length === 0) colors = ['#000000'];
    const images = splitList(get('images'));
    const badgeRaw = get('badge').toUpperCase();
    const badge = (['NEW', 'LIMITED', 'SALE', 'HOT', ''].includes(badgeRaw) ? badgeRaw : '') as BadgeType;

    // Batch-unique slug (DB-level collisions still surface at save time).
    let slug = slugify(name);
    const base = slug;
    let n = 2;
    while (seenSlugs.has(slug)) slug = `${base}-${n++}`;
    seenSlugs.add(slug);

    if (!CATEGORIES.includes(category as CategoryType)) {
      errors.push(`category: "${category}" is not one of ${CATEGORIES.join(', ')}`);
    }

    const candidate: ImportProduct = {
      name,
      slug,
      category: category as CategoryType,
      price: Number.isFinite(priceNum) ? priceNum : NaN,
      sale_price: saleNum,
      description: get('description') || null,
      short_desc: get('short_desc') || null,
      sizes,
      colors,
      badge,
      stock: Number.isNaN(stockNum) ? 0 : stockNum,
      images,
      is_active: parseBool(get('is_active'), true),
      is_featured: parseBool(get('is_featured'), false),
    };

    const parsed = ProductSchema.safeParse(candidate);
    if (!parsed.success) {
      for (const iss of parsed.error.issues) {
        errors.push(`${iss.path.join('.') || 'row'}: ${iss.message}`);
      }
    }

    rows.push({
      index: r,
      name,
      category,
      product: errors.length === 0 ? candidate : undefined,
      errors,
    });
  }

  return { rows, headerMissing, totalValid: rows.filter((r) => r.errors.length === 0).length };
}
