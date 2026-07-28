// ============================================================================
// Supabase Edge Function: create-payment-intent
//
// Creates a Stripe PaymentIntent for a PENDING order and returns its
// client_secret so the browser can mount the on-site Payment Element. The
// amount is computed server-side from the order (never trusted from the
// client), and the order id is stamped into metadata so the webhook can settle
// it.
//
// Deploy:   supabase functions deploy create-payment-intent
// Secret:   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
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
    const { order_id } = await req.json();
    if (!order_id) return json({ error: 'order_id is required' }, 400);

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (error || !order) return json({ error: 'Order not found' }, 404);
    if (order.payment_status === 'paid') {
      return json({ error: 'Order is already paid' }, 409);
    }

    const amount = Math.round(Number(order.total) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: 'Invalid order amount' }, 400);
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: String(order.currency || 'usd').toLowerCase(),
      metadata: { order_id: order.id },
      receipt_email: order.customer_email || undefined,
      automatic_payment_methods: { enabled: true },
    });

    // Record the intent id against the order for reconciliation.
    await supabase
      .from('orders')
      .update({ stripe_session: intent.id })
      .eq('id', order.id);

    return json({ client_secret: intent.client_secret, amount });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? 'PaymentIntent failed' }, 500);
  }
});
