/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from './supabase';

/** Card rails that route through Stripe Checkout. */
export const STRIPE_RAILS = ['Stripe Credit Card', 'Apple Pay'];

export const isStripeRail = (method: string) => STRIPE_RAILS.includes(method);

/**
 * Starts a hosted Stripe Checkout session for a pending order and returns the
 * redirect URL. The amount + line items are computed server-side by the
 * `create-checkout-session` edge function — the browser only passes the order
 * id and where to return to.
 */
export const startStripeCheckout = async (orderId: string): Promise<string> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Live payments require Supabase to be configured.');
  }

  const origin = window.location.origin;
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { order_id: orderId, success_url: origin, cancel_url: origin },
  });

  if (error) {
    throw new Error(error.message || 'Could not reach the payment gateway.');
  }
  if (!data?.url) {
    throw new Error((data as any)?.error || 'Payment gateway did not return a checkout URL.');
  }
  return data.url as string;
};
