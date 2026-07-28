/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface InvoiceRecord {
  id: string;
  stripe_invoice_id: string | null;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void' | string;
  amount_due: number;
  currency: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}

/**
 * Generate + email a Stripe hosted invoice for an order. Calls the admin-only
 * `create-invoice` edge function (the admin's session JWT is sent automatically
 * by supabase-js and re-checked server-side against admin_users).
 */
export const generateInvoiceForOrder = async (
  orderId: string
): Promise<{ hosted_invoice_url?: string; status?: string; stripe_invoice_id?: string; warning?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Invoicing requires Supabase to be configured.');
  }
  const { data, error } = await supabase.functions.invoke('create-invoice', {
    body: { order_id: orderId },
  });
  if (error) throw new Error(error.message || 'Could not reach the invoicing service.');
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
};

/** List invoices already issued for an order (admin-readable under RLS). */
export const listInvoicesForOrder = async (orderId: string): Promise<InvoiceRecord[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const { data, error } = await supabase
    .from('invoices')
    .select('id,stripe_invoice_id,status,amount_due,currency,hosted_invoice_url,invoice_pdf,created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data as InvoiceRecord[]) || [];
};
