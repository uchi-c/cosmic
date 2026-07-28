// ============================================================================
// Supabase Edge Function: stripe-webhook
//
// The ONLY thing allowed to mark an order paid. Verifies the Stripe signature,
// then settles (or fails + releases stock for) the referenced order using the
// service-role key.
//
// Deploy:   supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets:  supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//           supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
// Stripe:   add an endpoint → https://<project>.functions.supabase.co/stripe-webhook
//           events: checkout.session.completed, checkout.session.async_payment_succeeded,
//                   checkout.session.async_payment_failed, checkout.session.expired
// ============================================================================

import Stripe from 'https://esm.sh/stripe@16.12.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature ?? '',
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  // Both flows stamp order_id into metadata: hosted Checkout (Session) and the
  // on-site Payment Element (PaymentIntent).
  const obj = event.data.object as
    | Stripe.Checkout.Session
    | Stripe.PaymentIntent;
  const orderId = (obj as any)?.metadata?.order_id as string | undefined;

  const SETTLE_EVENTS = new Set([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'payment_intent.succeeded',
  ]);
  // Terminal failures only. NOTE: `payment_intent.payment_failed` is
  // deliberately excluded — a declined card attempt is retryable and the same
  // PaymentIntent may still succeed, so releasing stock on it would return
  // inventory that a later success then resells. We only release on states the
  // PaymentIntent/session can no longer recover from.
  const FAIL_EVENTS = new Set([
    'checkout.session.expired',
    'checkout.session.async_payment_failed',
    'payment_intent.canceled',
  ]);

  try {
    if (SETTLE_EVENTS.has(event.type)) {
      if (orderId) {
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'processing',
            stripe_session: (obj as any).id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        if (error) throw new Error(`settle update failed: ${error.message}`);
      }
    } else if (FAIL_EVENTS.has(event.type)) {
      // Payment can no longer complete → release the reserved stock and fail it.
      if (orderId) {
        const { data: order, error: readErr } = await supabase
          .from('orders')
          .select('items, payment_status')
          .eq('id', orderId)
          .single();
        if (readErr) throw new Error(`order read failed: ${readErr.message}`);

        if (order && order.payment_status !== 'paid') {
          for (const it of order.items ?? []) {
            const { error: rErr } = await supabase.rpc('restore_product_stock', {
              p_id: it.id,
              p_qty: it.quantity,
            });
            if (rErr) throw new Error(`stock restore failed: ${rErr.message}`);
          }
          const { error: fErr } = await supabase
            .from('orders')
            .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', orderId);
          if (fErr) throw new Error(`fail update failed: ${fErr.message}`);
        }
      }
    }
  } catch (e) {
    // Settlement work failed (transient DB/RPC issue, or a missing RPC). Return
    // a non-2xx so Stripe redelivers the event instead of marking it handled
    // while the order is left in the wrong state.
    console.error('webhook handling error', e);
    return new Response(
      JSON.stringify({ error: 'settlement failed; please retry' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
