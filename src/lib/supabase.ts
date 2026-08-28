/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Product, Order, OrderItem, AdminUser, StoreSettings, CategoryType, BadgeType } from '../types';

// Retrieve credentials from environment
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Security Note: Never expose SUPABASE_SERVICE_ROLE_KEY to the client-side bundle.
// If needed server-side, it is loaded via process.env in Node environments.

// Helper to check if credentials are valid (and not placeholders)
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('xxxx') || supabaseAnonKey.includes('xxxx')) return false;
  if (supabaseUrl.includes('supabase.co') && supabaseUrl.length > 25) return true;
  return false;
};

// Initialize the real Supabase client (only if credentials exist, otherwise create a mock dummy)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// HIGH-FIDELITY SANDBOX DATA SEED
// ==========================================

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'NEON CYBERPUNK DRIFTER JACKET',
    slug: 'neon-cyberpunk-drifter-jacket',
    category: 'mens',
    price: 189.99,
    sale_price: 149.99,
    description: 'High-visibility luminescent bomber jacket designed for cold cosmic nights. Water-resistant outer shell with interactive EL wire piping along the sleeves.',
    short_desc: 'Luminescent cyberpunk bomber jacket with EL wire piping.',
    sizes: ['M', 'L', 'XL'],
    colors: ['#FF007F', '#00F0FF', '#0F0F1A'],
    badge: 'HOT',
    stock: 12,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80'],
    is_active: true,
    is_featured: true,
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'MATRIX RETRO MONO GLASSES',
    slug: 'matrix-retro-mono-glasses',
    category: 'accessories',
    price: 45.00,
    sale_price: null,
    description: 'Polarized narrow frames with green grid terminal lens reflections. Full UV400 protection against high-altitude solar winds.',
    short_desc: 'Narrow cyberpunk sunglasses with green grid reflection.',
    sizes: ['OS'],
    colors: ['#000000', '#39FF14'],
    badge: 'NEW',
    stock: 45,
    images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80'],
    is_active: true,
    is_featured: true,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'LUSAKA SHADOW SECURITY HOODIE',
    slug: 'lusaka-shadow-security-hoodie',
    category: 'gym',
    price: 79.99,
    sale_price: 59.99,
    description: 'Heavyweight loopback cotton construction engineered by Shadow Root Security Technologies. Includes an integrated RFID-blocking stealth pocket.',
    short_desc: 'Heavyweight tactical hoodie with integrated RFID-blocking pocket.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['#0A0812', '#2A1F45'],
    badge: 'LIMITED',
    stock: 3,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80'],
    is_active: true,
    is_featured: false,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'ORBITAL AMULET COLLAR',
    slug: 'orbital-amulet-collar',
    category: 'jewelry',
    price: 120.00,
    sale_price: null,
    description: 'Polished titanium hardware suspended from a dark energy synthetic cord. Houses a glowing synthetic emerald center stone.',
    short_desc: 'Titanium orbital amulet with synthetic glowing emerald.',
    sizes: ['OS'],
    colors: ['#B68D40', '#39FF14'],
    badge: 'SALE',
    stock: 18,
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80'],
    is_active: true,
    is_featured: true,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'COSMIC RUNNER V1',
    slug: 'cosmic-runner-v1',
    category: 'gym',
    price: 150.00,
    sale_price: null,
    description: 'Aerodynamic mesh runners featuring gold-flecked synthetic leather reinforcement. Custom rubber grip pads matching space gravity standards.',
    short_desc: 'Gold-accented aerospace-grade training running shoes.',
    sizes: ['8', '9', '10', '11'],
    colors: ['#FFFFFF', '#B68D40'],
    badge: '',
    stock: 0, // Out of stock warning trigger
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'],
    is_active: true,
    is_featured: false,
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const SEED_ORDERS: Order[] = [
  {
    id: 'ord-802',
    customer_name: 'Mutale Chanda',
    customer_email: 'mutale@shadowroot.io',
    customer_phone: '+260 977 123456',
    country: 'Zambia',
    address: 'Plot 45, Great East Road, Lusaka',
    items: [
      { id: 'prod-3', name: 'LUSAKA SHADOW SECURITY HOODIE', price: 59.99, quantity: 1, color: '#0A0812', size: 'XL' },
      { id: 'prod-2', name: 'MATRIX RETRO MONO GLASSES', price: 45.00, quantity: 1, color: '#39FF14', size: 'OS' }
    ],
    subtotal: 104.99,
    total: 114.99,
    currency: 'USD',
    payment_method: 'Stripe Credit Card',
    payment_status: 'paid',
    order_status: 'completed',
    stripe_session: 'cs_live_0192381203',
    notes: 'Please drop at the security gate if front desk is closed.',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord-801',
    customer_name: 'Sarah Jenkins',
    customer_email: 'sarah.j@spacestation.com',
    customer_phone: '+1 415 982 1042',
    country: 'United States',
    address: '902 Orbit Way, Cape Canaveral, FL 32920',
    items: [
      { id: 'prod-1', name: 'NEON CYBERPUNK DRIFTER JACKET', price: 149.99, quantity: 1, color: '#0F0F1A', size: 'M' }
    ],
    subtotal: 149.99,
    total: 159.99,
    currency: 'USD',
    payment_method: 'Apple Pay',
    payment_status: 'paid',
    order_status: 'processing',
    stripe_session: 'cs_live_491028301',
    notes: 'Stealth packaging requested.',
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord-800',
    customer_name: 'Yuki Takahashi',
    customer_email: 'yuki@retrogrid.jp',
    customer_phone: '+81 90 2819 4021',
    country: 'Japan',
    address: '3-15 Akihabara, Chiyoda-ku, Tokyo 101-0021',
    items: [
      { id: 'prod-4', name: 'ORBITAL AMULET COLLAR', price: 120.00, quantity: 2, color: '#B68D40', size: 'OS' }
    ],
    subtotal: 240.00,
    total: 255.00,
    currency: 'USD',
    payment_method: 'Stripe Credit Card',
    payment_status: 'pending',
    order_status: 'pending',
    stripe_session: null,
    notes: null,
    created_at: new Date(Date.now() - 1.5 * 24 * 3600 * 1000).toISOString(),
  }
];

const SEED_SETTINGS: StoreSettings = {
  store_name: 'COSMIC DEPT',
  tagline: 'RETROFUTURE CYBERPUNK GEAR FOR DEEP SPACE OPERATIVES',
  contact_email: 'ops@cosmicdept.com',
  currency_display: 'USD ($)',
  low_stock_threshold: 5,
  social_instagram: 'https://instagram.com/cosmicdept',
  social_tiktok: 'https://tiktok.com/@cosmicdept',
  social_wechat: 'cosmic_dept_ops',
};

// ==========================================
// LOCAL STORAGE PERSISTENCE ENGINE (SANDBOX)
// ==========================================

const getStored = <T>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultVal;
  }
};

const setStored = <T>(key: string, val: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

// ==========================================
// UNIFIED DATA SERVICE (MOCK OR REAL SUPABASE)
// ==========================================

export const dbService = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getStored<Product[]>('cosmic_products', SEED_PRODUCTS);
    }
  },

  async saveProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Product> {
    const isNew = !product.id;
    const now = new Date().toISOString();

    if (supabase) {
      if (isNew) {
        const { data, error } = await supabase.from('products').insert([product]).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('products').update({ ...product, updated_at: now }).eq('id', product.id).select().single();
        if (error) throw error;
        return data;
      }
    } else {
      const list = getStored<Product[]>('cosmic_products', SEED_PRODUCTS);
      let savedProd: Product;

      if (isNew) {
        savedProd = {
          ...product,
          id: `prod-${Date.now()}`,
          created_at: now,
          updated_at: now,
        } as Product;
        list.unshift(savedProd);
      } else {
        const index = list.findIndex(p => p.id === product.id);
        const original = list[index] || {};
        savedProd = {
          ...original,
          ...product,
          updated_at: now,
        } as Product;
        if (index > -1) {
          list[index] = savedProd;
        } else {
          list.unshift(savedProd);
        }
      }
      setStored('cosmic_products', list);
      return savedProd;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return true;
    } else {
      const list = getStored<Product[]>('cosmic_products', SEED_PRODUCTS);
      const filtered = list.filter(p => p.id !== id);
      setStored('cosmic_products', filtered);
      return true;
    }
  },

  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    if (supabase) {
      let query = supabase.from('products').select('id').eq('slug', slug);
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      const { data, error } = await query;
      if (error) return false;
      return (data || []).length === 0;
    } else {
      const list = getStored<Product[]>('cosmic_products', SEED_PRODUCTS);
      return !list.some(p => p.slug === slug && p.id !== excludeId);
    }
  },

  // ORDERS
  async getOrders(): Promise<Order[]> {
    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getStored<Order[]>('cosmic_orders', SEED_ORDERS);
    }
  },

  async saveOrder(order: Partial<Order> & { id: string }): Promise<Order> {
    if (supabase) {
      const { data, error } = await supabase.from('orders').update(order).eq('id', order.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const list = getStored<Order[]>('cosmic_orders', SEED_ORDERS);
      const index = list.findIndex(o => o.id === order.id);
      if (index > -1) {
        list[index] = { ...list[index], ...order } as Order;
      }
      setStored('cosmic_orders', list);
      return list[index] || (order as Order);
    }
  },

  async createOrder(orderPayload: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    country: string;
    address: string;
    items: { id: string; quantity: number; size?: string; color?: string }[];
    payment_method: string;
    notes?: string | null;
  }): Promise<Order> {
    const now = new Date().toISOString();
    // High-entropy id (crypto.getRandomValues, not Math.random) — matches the
    // hardening applied to the server-side place_order() RPC; see
    // supabase/migrations/0004_fix_order_id_entropy.sql for why a short
    // predictable id is unsafe once it's used to look up/pay for an order.
    const orderIdBytes = new Uint8Array(16);
    crypto.getRandomValues(orderIdBytes);
    const orderId = `ord-${Array.from(orderIdBytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

    let verifiedItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    if (supabase) {
      // Order creation is performed entirely server-side by the place_order()
      // SECURITY DEFINER RPC (supabase/migrations/0002_place_order.sql). It
      // recomputes every price from the catalog, decrements stock atomically,
      // and inserts a forced-pending order in one transaction. The browser
      // cannot set totals/status, cannot touch stock, and the anon role has no
      // direct INSERT on orders and no EXECUTE on the raw stock mutators.
      const { data, error } = await supabase.rpc('place_order', {
        p_customer_name: orderPayload.customer_name,
        p_customer_email: orderPayload.customer_email,
        p_customer_phone: orderPayload.customer_phone,
        p_country: orderPayload.country,
        p_address: orderPayload.address,
        p_items: orderPayload.items,
        p_payment_method: orderPayload.payment_method,
        p_notes: orderPayload.notes ?? null,
      });

      if (error) {
        const msg = error.message || '';
        if (/STOCK_OR_PRODUCT_UNAVAILABLE|INVALID_QUANTITY|EMPTY_ORDER/i.test(msg)) {
          throw new Error('One or more items are no longer available in the requested quantity. Please review your cargo bag and retry.');
        }
        throw new Error(`ORDER_EXCEPTION: ${msg}`);
      }
      return data as Order;

    } else {
      // Mock mode fallback for local sandbox development
      const list = getStored<Product[]>('cosmic_products', SEED_PRODUCTS);
      const ordersList = getStored<Order[]>('cosmic_orders', SEED_ORDERS);
      
      for (const item of orderPayload.items) {
        const prod = list.find(p => p.id === item.id);
        if (!prod) throw new Error('Product not found in mock store.');
        if (prod.stock < item.quantity) throw new Error('Insufficient mock stock.');

        const price = prod.sale_price !== null && prod.sale_price !== undefined ? prod.sale_price : prod.price;
        calculatedSubtotal += price * item.quantity;

        verifiedItems.push({
          id: prod.id,
          name: prod.name,
          price: price,
          quantity: item.quantity,
          image: prod.images[0] || '',
          size: item.size || 'OS',
          color: item.color || '',
        });

        prod.stock -= item.quantity;
      }
      setStored('cosmic_products', list);

      const newOrder: Order = {
        id: orderId,
        customer_name: orderPayload.customer_name,
        customer_email: orderPayload.customer_email,
        customer_phone: orderPayload.customer_phone,
        country: orderPayload.country,
        address: orderPayload.address,
        items: verifiedItems,
        subtotal: calculatedSubtotal,
        total: calculatedSubtotal,
        currency: 'USD',
        payment_method: orderPayload.payment_method,
        payment_status: 'pending',
        order_status: 'pending',
        stripe_session: null,
        notes: orderPayload.notes || null,
        created_at: now,
      };

      ordersList.unshift(newOrder);
      setStored('cosmic_orders', ordersList);
      return newOrder;
    }
  },

  async confirmPayment(orderId: string, stripeSessionId?: string): Promise<Order> {
    if (supabase) {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (fetchError || !order) {
        throw new Error('ORDER_NOT_FOUND: Failed to locate order in registry.');
      }

      if (order.payment_status === 'paid') {
        return order; // Already paid and processed
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'processing',
          stripe_session: stripeSessionId || order.stripe_session || `verified_${Math.random().toString(36).substring(2, 10)}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const ordersList = getStored<Order[]>('cosmic_orders', SEED_ORDERS);
      const index = ordersList.findIndex(o => o.id === orderId);
      if (index > -1) {
        ordersList[index].payment_status = 'paid';
        ordersList[index].order_status = 'processing';
        ordersList[index].stripe_session = stripeSessionId || `verified_${Math.random().toString(36).substring(2, 10)}`;
        setStored('cosmic_orders', ordersList);
        return ordersList[index];
      }
      throw new Error('Order not found in mock store.');
    }
  },

  // STORE SETTINGS
  getSettings(): StoreSettings {
    return getStored<StoreSettings>('cosmic_settings', SEED_SETTINGS);
  },

  saveSettings(settings: StoreSettings): StoreSettings {
    setStored('cosmic_settings', settings);
    return settings;
  },

  // ADMIN USERS (Simulated simple auth)
  async getAdminUser(email: string): Promise<AdminUser | null> {
    if (supabase) {
      const { data, error } = await supabase.from('admin_users').select('*').eq('email', email).maybeSingle();
      if (error) return null;
      return data;
    } else {
      // Offline allowlist is env-driven — no operator identities are baked
      // into the shipped bundle.
      const sandboxEmail = String(metaEnv.VITE_SANDBOX_ADMIN_EMAIL || '')
        .trim()
        .toLowerCase();
      if (sandboxEmail && email.trim().toLowerCase() === sandboxEmail) {
        return {
          id: 'admin-1',
          email,
          role: 'super_admin',
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  }
};
