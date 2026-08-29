// ============================================================================
// Supabase Edge Function: flutterwave-webhook
//
// The ONLY thing allowed to mark a Flutterwave-paid order settled. Two layers
// of verification before anything is trusted:
//   1. The `verif-hash` header must match FLW_SECRET_HASH (a secret you set in
//      the Flutterwave dashboard, distinct from your API keys).
//   2. The transaction is re-fetched from Flutterwave's own API via the
//      authenticated verify endpoint (GET /transactions/{id}/verify) — never
//      trust amount/status straight off the webhook body, since (a) it avoids
//      relying solely on the verif-hash mechanism, whose exact strength
//      (HMAC-of-payload vs. static string compare) isn't consistently
//      documented across Flutterwave's own doc versions, and (b) it's
//      Flutterwave's own recommended pattern.
//
// Deploy:   supabase functions deploy flutterwave-webhook --no-verify-jwt
// Secrets:  supabase secrets set FLW_SECRET_KEY=FLWSECK_TEST-...
//           supabase secrets set FLW_SECRET_HASH=your-own-random-string
// Flutterwave: Dashboard → Settings → Webhooks → set the same secret hash and
//              the endpoint URL https://<project>.functions.supabase.co/flutterwave-webhook
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const FLW_SECRET_KEY = Deno.env.get('FLW_SECRET_KEY') ?? '';
const FLW_SECRET_HASH = Deno.env.get('FLW_SECRET_HASH') ?? '';
const FLW_API = 'https://api.flutterwave.com/v3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Constant-time comparison — a plain `!==` on a webhook secret leaks timing
// information a network attacker could in principle use to guess it
// character-by-character.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req) => {
  // Fail CLOSED: with no secret hash configured, any caller could forge a
  // webhook and mark orders paid. Refuse until it's set.
  if (!FLW_SECRET_HASH || !FLW_SECRET_KEY) {
    console.error('FLW_SECRET_HASH / FLW_SECRET_KEY not configured — refusing to process webhook.');
    return new Response('Webhook not configured', { status: 500 });
  }

  const signature = req.headers.get('verif-hash');
  if (!signature || !timingSafeEqual(signature, FLW_SECRET_HASH)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event: any;
  try {
    event = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  try {
    const data = event?.data ?? {};
    const orderId: string | undefined = data.meta?.order_id ?? data.tx_ref;
    const transactionId = data.id;

    if (!orderId || !transactionId) {
      // Not a transaction event we care about (e.g. a transfer webhook) — ack.
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: order, error: ordErr } = await supabase
      .from('orders')
      .select('total, currency, payment_status')
      .eq('id', orderId)
      .single();
    if (ordErr) throw new Error(`order read failed: ${ordErr.message}`);
    if (!order) return new Response(JSON.stringify({ received: true }), { status: 200 });

    // Already settled (or already failed and not retryable) — nothing to do,
    // ack so Flutterwave stops retrying.
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Independently re-verify against Flutterwave's API — never trust the
    // webhook body's amount/status directly.
    const verifyRes = await fetch(`${FLW_API}/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
    });
    const verified = await verifyRes.json();
    const v = verified?.data;

    if (!verifyRes.ok || verified?.status !== 'success' || !v) {
      throw new Error(`verify call failed: ${JSON.stringify(verified)}`);
    }

    const expectedAmount = Number(order.total);
    const expectedCurrency = String(order.currency || 'USD').toUpperCase();
    const paidAmount = Number(v.amount);
    const paidCurrency = String(v.currency || '').toUpperCase();

    if (v.status === 'successful') {
      if (paidAmount < expectedAmount || paidCurrency !== expectedCurrency) {
        // Not transient — acknowledge (no retry) but DON'T auto-settle; a
        // human should reconcile the mismatch.
        console.error(
          `amount/currency mismatch for order ${orderId}: paid ${paidAmount} ${paidCurrency} vs expected ${expectedAmount} ${expectedCurrency}`
        );
        return new Response(
          JSON.stringify({ received: true, warning: 'amount_mismatch' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'processing',
          payment_provider: 'flutterwave',
          payment_reference: String(transactionId),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      if (error) throw new Error(`settle update failed: ${error.message}`);
    } else if (v.status === 'failed' || v.status === 'cancelled') {
      // Release the reserved stock — mirrors stripe-webhook's FAIL_EVENTS path.
      const { data: fullOrder, error: readErr } = await supabase
        .from('orders')
        .select('items')
        .eq('id', orderId)
        .single();
      if (readErr) throw new Error(`order read failed: ${readErr.message}`);

      for (const it of fullOrder?.items ?? []) {
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
    // Any other status (e.g. "pending") — ack and wait for a later event.

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('flutterwave webhook handling error', e);
    return new Response(
      JSON.stringify({ error: 'settlement failed; please retry' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
