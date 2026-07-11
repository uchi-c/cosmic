/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { supabase, isSupabaseConfigured } from './supabase';

/** Card rails that route through Stripe. */
export const STRIPE_RAILS = ['Stripe Credit Card', 'Apple Pay'];

export const isStripeRail = (method: string) => STRIPE_RAILS.includes(method);

const publishableKey = String(
  ((import.meta as any).env || {}).VITE_STRIPE_PUBLISHABLE_KEY || ''
);

/** True when the on-site Payment Element can be used (pk + Supabase present). */
export const isStripeConfigured = (): boolean =>
  isSupabaseConfigured() && publishableKey.startsWith('pk_');

// Load Stripe.js once, lazily.
let stripePromise: Promise<Stripe | null> | null = null;
export const getStripe = (): Promise<Stripe | null> => {
  if (!publishableKey) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
};

/**
 * Creates a Stripe PaymentIntent for a pending order and returns its
 * client_secret. The amount + currency are computed server-side by the
 * `create-payment-intent` edge function — the browser only passes the order id.
 */
export const createPaymentIntent = async (orderId: string): Promise<string> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Live payments require Supabase to be configured.');
  }
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { order_id: orderId },
  });
  if (error) throw new Error(error.message || 'Could not reach the payment gateway.');
  if (!data?.client_secret) {
    throw new Error((data as any)?.error || 'Payment gateway did not return a client secret.');
  }
  return data.client_secret as string;
};

/**
 * Hosted Stripe Checkout (redirect) — kept as an alternative to the on-site
 * Payment Element. Returns the redirect URL.
 */
export const startStripeCheckout = async (orderId: string): Promise<string> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Live payments require Supabase to be configured.');
  }
  const origin = window.location.origin;
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { order_id: orderId, success_url: origin, cancel_url: origin },
  });
  if (error) throw new Error(error.message || 'Could not reach the payment gateway.');
  if (!data?.url) {
    throw new Error((data as any)?.error || 'Payment gateway did not return a checkout URL.');
  }
  return data.url as string;
};
