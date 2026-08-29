/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Card rails that route through Flutterwave's hosted checkout. Stripe cannot
 * activate a live merchant account for a Zambia-registered business (Zambia
 * isn't on Stripe's supported-country list), so international card payments
 * go through Flutterwave instead — it's licensed to operate with Zambian
 * merchants and processes Visa/Mastercard/Amex plus Apple Pay/Google Pay on
 * its hosted checkout page.
 */
export const CARD_RAILS = ['Card Payment', 'Apple Pay'];

export const isCardRail = (method: string) => CARD_RAILS.includes(method);

/**
 * True when the redirect-based card flow can be used. Unlike Stripe's
 * on-site Payment Element, Flutterwave's Standard checkout needs no
 * publishable key in the client bundle — the payment link is created
 * entirely server-side, so the only prerequisite is Supabase being reachable
 * to invoke the edge function.
 */
export const isCardPaymentConfigured = (): boolean => isSupabaseConfigured();

/**
 * Creates a Flutterwave Standard payment for a pending order and returns its
 * hosted checkout URL. The amount + currency are computed server-side by the
 * `create-flutterwave-payment` edge function — the browser only passes the
 * order id (and the origin, so the function can build a return URL).
 */
export const startCardPayment = async (orderId: string): Promise<string> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Live payments require Supabase to be configured.');
  }
  const { data, error } = await supabase.functions.invoke('create-flutterwave-payment', {
    body: { order_id: orderId, redirect_origin: window.location.origin },
  });
  if (error) throw new Error(error.message || 'Could not reach the payment gateway.');
  if (!data?.url) {
    throw new Error((data as any)?.error || 'Payment gateway did not return a checkout URL.');
  }
  return data.url as string;
};
