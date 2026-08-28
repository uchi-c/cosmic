// ============================================================================
// Supabase Edge Function: create-invoice  (ADMIN ONLY)
//
// Generates and sends a Stripe hosted invoice for an existing order. Unlike the
// public payment functions, this requires an authenticated admin: the caller's
// JWT is resolved to a user and that email must be in admin_users. All catalog
// data is read server-side; the browser only passes the order id.
//
// Deploy:   supabase functions deploy create-invoice        (JWT verification ON)
// Secret:   supabase secrets set STRIPE_SECRET_KEY=sk_...
// ============================================================================

import Stripe from 'https://esm.sh/stripe@16.12.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders, json } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Privileged client for reads/writes (bypasses RLS).
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. AUTHENTICATE + AUTHORIZE the caller as an admin.
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const email = userData?.user?.email?.toLowerCase();
    if (userErr || !email) return json({ error: 'Unauthorized' }, 401);

    const { data: adminRow } = await admin
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    if (!adminRow) return json({ error: 'Forbidden: operator is not an admin' }, 403);

    // 2. Load the order (server-side is the source of truth for line items).
    const { order_id, days_until_due = 30 } = await req.json();
    if (!order_id) return json({ error: 'order_id is required' }, 400);

    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();
    if (orderErr || !order) return json({ error: 'Order not found' }, 404);

    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return json({ error: 'Order has no items to invoice' }, 400);
    const currency = String(order.currency || 'usd').toLowerCase();

    // 3. Find or create the Stripe customer by email.
    let customerId: string;
    const existing = await stripe.customers.list({ email: order.customer_email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const created = await stripe.customers.create({
        email: order.customer_email,
        name: order.customer_name || undefined,
        metadata: { order_id: order.id },
      });
      customerId = created.id;
    }

    // 4. Add an invoice item per order line (prices from the stored order).
    for (const it of items) {
      await stripe.invoiceItems.create({
        customer: customerId,
        currency,
        unit_amount: Math.round(Number(it.price) * 100),
        quantity: Number(it.quantity) || 1,
        description: `${it.name}${it.size ? ` (${it.size})` : ''}`,
        metadata: { product_id: it.id ?? '' },
      });
    }

    // 5. Create → finalize → email the hosted invoice.
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due,
      metadata: { order_id: order.id },
      auto_advance: false,
    });
    const sent = await stripe.invoices.sendInvoice(invoice.id);

    // 6. Persist a record (service_role → bypasses RLS).
    const amountDue = (sent.amount_due ?? 0) / 100;
    const { data: row, error: insErr } = await admin
      .from('invoices')
      .insert({
        order_id: order.id,
        stripe_invoice_id: sent.id,
        stripe_customer_id: customerId,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        amount_due: amountDue,
        currency: String(sent.currency || currency).toUpperCase(),
        status: sent.status ?? 'open',
        hosted_invoice_url: sent.hosted_invoice_url ?? null,
        invoice_pdf: sent.invoice_pdf ?? null,
      })
      .select()
      .single();

    if (insErr) {
      // The invoice IS live in Stripe; surface the link even if the DB write failed.
      return json({
        warning: `Invoice sent, but the local record failed: ${insErr.message}`,
        stripe_invoice_id: sent.id,
        status: sent.status,
        hosted_invoice_url: sent.hosted_invoice_url,
      });
    }

    return json({
      id: row.id,
      stripe_invoice_id: sent.id,
      status: sent.status,
      hosted_invoice_url: sent.hosted_invoice_url,
      invoice_pdf: sent.invoice_pdf,
      amount_due: amountDue,
    });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? 'Invoice creation failed' }, 500);
  }
});
