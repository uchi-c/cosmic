/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType = 'mens' | 'womens' | 'gym' | 'jewelry' | 'accessories';
export type BadgeType = 'NEW' | 'LIMITED' | 'SALE' | 'HOT' | '';
export type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatusType = 'pending' | 'processing' | 'completed' | 'cancelled';
export type AdminRoleType = 'super_admin' | 'editor' | 'viewer';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategoryType;
  price: number;
  sale_price: number | null;
  description: string | null;
  short_desc: string | null;
  sizes: string[];
  colors: string[];
  badge: BadgeType | null;
  stock: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  country: string | null;
  address: string | null;
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  payment_method: string | null;
  payment_status: PaymentStatusType;
  order_status: OrderStatusType;
  stripe_session: string | null;
  notes: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRoleType;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  contact_email: string;
  currency_display: string;
  low_stock_threshold: number;
  social_instagram: string;
  social_tiktok: string;
  social_wechat: string;
}
