// ============================================================================
// Supabase Edge Function: create-flutterwave-payment
//
// Creates a Flutterwave Standard payment link for a PENDING order and returns
// its hosted checkout URL. The order total + line items are read from the
// database server-side (never trusted from the client), and the order id is
// stamped into the tx_ref / meta so the webhook can settle it.
//
// Deploy:   supabase functions deploy create-flutterwave-payment
// Secret:   supabase secrets set FLW_SECRET_KEY=FLWSECK_TEST-...   (or live)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, json } from '../_shared/cors.ts';

const FLW_SECRET_KEY = Deno.env.get('FLW_SECRET_KEY') ?? '';
const FLW_API = 'https://api.flutterwave.com/v3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!FLW_SECRET_KEY) {
    console.error('FLW_SECRET_KEY is not configured.');
    return json({ error: 'Payment gateway is not configured.' }, 500);
  }

  try {
    const { order_id, redirect_origin } = await req.json();
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

    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: 'Invalid order amount' }, 400);
    }

    const currency = String(order.currency || 'USD').toUpperCase();
    const origin = String(redirect_origin || '').replace(/\/$/, '');

    // tx_ref = order id. A shopper who abandons and retries will reuse it,
    // which is fine — Flutterwave treats tx_ref as a caller-supplied label for
    // tracking, not a strict single-use idempotency key, and the webhook only
    // ever settles an order once (guarded by payment_status !== 'paid' below).
    const tx_ref = order.id;

    const flwRes = await fetch(`${FLW_API}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref,
        amount: amount.toFixed(2),
        currency,
        // Distinct param name from the Stripe return flow (?order_success=) so
        // App.tsx can tell which provider a shopper is returning from. Status
        // (successful/cancelled/failed) is appended by Flutterwave itself.
        redirect_url: `${origin}/?flw_return=${encodeURIComponent(order.id)}`,
        customer: {
          email: order.customer_email,
          name: order.customer_name || undefined,
          phonenumber: order.customer_phone || undefined,
        },
        customizations: {
          title: 'COSMIC DEPT',
          description: `Order ${order.id}`,
        },
        meta: { order_id: order.id },
      }),
    });

    const flwJson = await flwRes.json();
    if (!flwRes.ok || flwJson.status !== 'success' || !flwJson.data?.link) {
      console.error('Flutterwave payment init failed:', flwJson);
      return json({ error: flwJson.message || 'Payment gateway did not return a checkout link.' }, 502);
    }

    // Record the reference against the order for reconciliation.
    await supabase
      .from('orders')
      .update({ payment_provider: 'flutterwave', payment_reference: tx_ref })
      .eq('id', order.id);

    return json({ url: flwJson.data.link as string, tx_ref });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? 'Payment initialization failed' }, 500);
  }
});
