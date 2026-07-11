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

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session?.metadata?.order_id;

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      if (orderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'processing',
            stripe_session: session.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }
    } else if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      // Payment never completed → release the reserved stock and fail the order.
      if (orderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('items, payment_status')
          .eq('id', orderId)
          .single();

        if (order && order.payment_status !== 'paid') {
          for (const it of order.items ?? []) {
            await supabase.rpc('restore_product_stock', {
              p_id: it.id,
              p_qty: it.quantity,
            });
          }
          await supabase
            .from('orders')
            .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', orderId);
        }
      }
    }
  } catch (e) {
    // Log and still 200 so Stripe doesn't hammer retries on a transient DB blip;
    // reconciliation can be handled out of band.
    console.error('webhook handling error', e);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
