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
  // Fail CLOSED: with no signing secret, HMAC verification would run with an
  // empty key — a value any caller can reproduce, which would let forged events
  // mark orders paid. Refuse to process anything until the secret is set.
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured — refusing to process webhook.');
    return new Response('Webhook secret not configured', { status: 500 });
  }

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
    // ---- Invoicing events (admin-generated Stripe invoices) ----------------
    if (event.type.startsWith('invoice.')) {
      const inv = event.data.object as Stripe.Invoice;
      const newStatus =
        event.type === 'invoice.paid'
          ? 'paid'
          : event.type === 'invoice.finalized'
          ? 'open'
          : event.type === 'invoice.voided'
          ? 'void'
          : event.type === 'invoice.marked_uncollectible'
          ? 'uncollectible'
          : inv.status ?? undefined;

      if (newStatus) {
        const { error: invErr } = await supabase
          .from('invoices')
          .update({
            status: newStatus,
            hosted_invoice_url: inv.hosted_invoice_url ?? undefined,
            invoice_pdf: inv.invoice_pdf ?? undefined,
            amount_due: (inv.amount_due ?? 0) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_invoice_id', inv.id);
        if (invErr) throw new Error(`invoice update failed: ${invErr.message}`);
      }

      // When an invoice for an order is paid, reflect it on the order too.
      if (event.type === 'invoice.paid' && inv.metadata?.order_id) {
        const { error: oErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            order_status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', inv.metadata.order_id);
        if (oErr) throw new Error(`order update failed: ${oErr.message}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
