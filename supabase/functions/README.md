# Cosmic Dept — Supabase Edge Functions (Stripe)

Hosted Stripe Checkout for live card payments. The browser never sees a Stripe
key and can never mark an order paid — the amount is computed server-side and
only the signed webhook settles the order.

## Flow

1. Checkout creates a **pending** order (`dbService.createOrder`) and reserves stock.
2. For a card rail (Stripe Credit Card / Apple Pay) the client calls
   `create-checkout-session` and redirects to Stripe's hosted page.
3. On payment, Stripe calls `stripe-webhook`, which verifies the signature and
   flips the order to `paid` / `processing`.
4. The shopper returns to `/?order_success=<id>` (or `/?order_cancelled=<id>`),
   handled in `App.tsx` → `OrderReturnView`.
5. If the session expires/fails, the webhook releases the reserved stock via
   `restore_product_stock`.

## One-time setup

Prerequisite: run the DB migrations first (`0000_init_schema.sql`, then
`0001_atomic_stock.sql`).

```bash
# Link the project
supabase link --project-ref ubpfikqzhznlvhckfdng

# Secrets (server-side only — never committed, never in the client)
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx   # from the step below

# Deploy
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into functions
automatically — do not set them by hand.

## Register the Stripe webhook

In the Stripe Dashboard → Developers → Webhooks → Add endpoint:

- URL: `https://ubpfikqzhznlvhckfdng.functions.supabase.co/stripe-webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`

Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` above and
re-deploy.

## Client env (Vercel / local `.env.local`)

```
VITE_SUPABASE_URL=https://ubpfikqzhznlvhckfdng.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## One-command deploy

A helper reads the secrets from your environment (never stores them) and does
the link + secrets + deploy in one go:

```bash
export STRIPE_SECRET_KEY=sk_test_your_own_key
export STRIPE_WEBHOOK_SECRET=whsec_...        # after registering the webhook
./supabase/deploy-functions.sh ubpfikqzhznlvhckfdng
```

## Local testing (no deploy)

```bash
cp supabase/functions/.env.example supabase/functions/.env   # add your TEST keys
supabase functions serve --env-file supabase/functions/.env
# in another shell, forward Stripe events + get a signing secret:
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Test

Use YOUR OWN Stripe **test** key + card `4242 4242 4242 4242`. The generic
example key from Stripe's public docs is not tied to your account and will not
create sessions for your store. Confirm the order flips to `paid` in the
`orders` table after completing the hosted checkout.
