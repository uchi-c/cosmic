# Cosmic Dept — Supabase Edge Functions (Flutterwave + legacy Stripe)

Hosted Flutterwave checkout for live international card + mobile money
payments. The browser never sees a Flutterwave secret key and can never mark
an order paid — the amount is computed server-side and only the
independently-verified webhook settles the order.

**Why Flutterwave and not Stripe for checkout:** Stripe cannot activate a live
merchant account for a Zambia-registered business — Zambia isn't on Stripe's
supported-country list. Flutterwave is licensed to operate with Zambian
merchants and processes international Visa/Mastercard/Amex + Apple
Pay/Google Pay on its hosted checkout page, plus local mobile money (Airtel,
MTN) as a bonus. The original Stripe functions are still in this directory —
`create-invoice` (admin-generated hosted invoices) still uses Stripe, since
Flutterwave has no direct equivalent — but `create-payment-intent` and
`create-checkout-session` are no longer reachable from the storefront.

## Flow

1. Checkout creates a **pending** order (`dbService.createOrder`, via the
   `place_order()` RPC) and reserves stock.
2. For a card rail (Card Payment / Apple Pay) the client calls
   `create-flutterwave-payment` and redirects to Flutterwave's hosted page.
3. On payment, Flutterwave calls `flutterwave-webhook`, which verifies the
   `verif-hash` header, **independently re-verifies the transaction against
   Flutterwave's own API** (never trusts the webhook body alone), then flips
   the order to `paid` / `processing`.
4. The shopper returns to `/?flw_return=<id>&status=successful|cancelled|failed`
   (the `status` param is appended by Flutterwave), handled in `App.tsx` →
   `OrderReturnView`.
5. If the transaction failed/was cancelled, the webhook releases the reserved
   stock via `restore_product_stock`.

## One-time setup

Prerequisite: run the DB migrations first, in order (`0000` through `0005`).

```bash
# Link the project
supabase link --project-ref ubpfikqzhznlvhckfdng

# Secrets (server-side only — never committed, never in the client)
supabase secrets set FLW_SECRET_KEY=FLWSECK-xxx
supabase secrets set FLW_SECRET_HASH=your-own-random-string   # from the step below

# Deploy
supabase functions deploy create-flutterwave-payment
supabase functions deploy flutterwave-webhook --no-verify-jwt
```

## Register the Flutterwave webhook

In the Flutterwave Dashboard → Settings → Webhooks:

- URL: `https://ubpfikqzhznlvhckfdng.functions.supabase.co/flutterwave-webhook`
- Secret hash: any string you choose — set the *same* string as the
  `FLW_SECRET_HASH` secret above.

## Client env (Vercel / local `.env.local`)

No Flutterwave key needed client-side — the checkout link is created entirely
server-side.

```
VITE_SUPABASE_URL=https://ubpfikqzhznlvhckfdng.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## One-command deploy

```bash
export FLW_SECRET_KEY=FLWSECK_TEST-your_own_key
export FLW_SECRET_HASH=your-own-random-string   # after registering the webhook
./supabase/deploy-functions.sh ubpfikqzhznlvhckfdng
```

## Local testing (no deploy)

```bash
cp supabase/functions/.env.example supabase/functions/.env   # add your TEST keys
supabase functions serve --env-file supabase/functions/.env
```

Flutterwave doesn't have a CLI event-forwarder like `stripe listen` — trigger
a real test transaction against your sandbox keys and either point the
webhook URL at a tunneled localhost (e.g. `ngrok http 54321`) or test against
a deployed function directly.

## Test

Use YOUR OWN Flutterwave **test** secret key and one of Flutterwave's
documented test cards (Dashboard → test cards reference). Confirm the order
flips to `paid` in the `orders` table after completing the hosted checkout.

---

## Legacy: Stripe (admin invoicing only)

`create-invoice` generates + emails a Stripe hosted invoice for an order and
is **admin-gated**: it resolves the caller's JWT to a user and requires that
email to be in `admin_users`. Admins trigger it from Orders → an order →
**Generate & Send Invoice**. This still requires a live Stripe account, which
— per the note above — a Zambia-registered business can't activate directly
(the usual workaround is a foreign entity + bank account, which is a business
decision, not something this codebase can route around).

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx

supabase functions deploy create-invoice           # admin-only (JWT verification ON)
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy create-payment-intent    # orphaned — no client caller anymore
supabase functions deploy create-checkout-session  # orphaned — no client caller anymore
```

Register the Stripe webhook (Dashboard → Developers → Webhooks):

- URL: `https://ubpfikqzhznlvhckfdng.functions.supabase.co/stripe-webhook`
- Events: `invoice.finalized`, `invoice.paid`, `invoice.voided`,
  `invoice.marked_uncollectible`, `charge.refunded` (the `checkout.session.*`
  and `payment_intent.*` events are only relevant if `create-checkout-session`
  / `create-payment-intent` are ever wired back into the client).

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into every
function automatically — do not set them by hand.
