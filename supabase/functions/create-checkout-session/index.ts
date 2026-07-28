// ============================================================================
// Supabase Edge Function: create-checkout-session
//
// Creates a Stripe Checkout Session for a PENDING order and returns its hosted
// URL. The order total + line items are read from the database server-side
// (never trusted from the client), and the order id is stamped into the session
// metadata so the webhook can settle it.
//
// Deploy:   supabase functions deploy create-checkout-session
// Secrets:  supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//           (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected for you)
// ============================================================================

import Stripe from 'https://esm.sh/stripe@16.12.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, json } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { order_id, success_url, cancel_url } = await req.json();
    if (!order_id) return json({ error: 'order_id is required' }, 400);

    // Load the order server-side — the client never dictates price.
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (error || !order) return json({ error: 'Order not found' }, 404);
    if (order.payment_status === 'paid') {
      return json({ error: 'Order is already paid' }, 409);
    }

    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return json({ error: 'Order has no items' }, 400);

    const currency = String(order.currency || 'usd').toLowerCase();
    const line_items = items.map((it: any) => ({
      quantity: Number(it.quantity) || 1,
      price_data: {
        currency,
        unit_amount: Math.round(Number(it.price) * 100),
        product_data: {
          name: it.name,
          metadata: {
            product_id: it.id ?? '',
            size: it.size ?? '',
            color: it.color ?? '',
          },
        },
      },
    }));

    const origin = success_url || cancel_url || '';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: order.customer_email || undefined,
      metadata: { order_id: order.id },
      success_url: `${origin}?order_success=${encodeURIComponent(order.id)}`,
      cancel_url: `${origin}?order_cancelled=${encodeURIComponent(order.id)}`,
    });

    // Record the session id against the order for reconciliation.
    await supabase
      .from('orders')
      .update({ stripe_session: session.id })
      .eq('id', order.id);

    return json({ url: session.url, id: session.id });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? 'Checkout failed' }, 500);
  }
});
