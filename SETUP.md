# COSMIC DEPT — Production Setup Guide

End-to-end setup for **Supabase** (database + auth + edge functions), the
**environment variables**, and **Stripe** payments.

Order matters: **Supabase database → env vars → Stripe → deploy**.

---

## 0. Prerequisites

- **Node.js** 20+ and npm
- **Supabase CLI** — `npm i -g supabase` (or `brew install supabase/tap/supabase`)
- A **Supabase** project (this repo targets ref `rxbbibzyyhyksqzlcnll`)
- A **Stripe** account (start in **Test mode**)

```bash
npm install          # install app dependencies
npm run dev          # local dev at http://localhost:3000
```

With no env configured the app runs in **offline sandbox mode** (seeded demo
data in localStorage). Configure the steps below to go live.

---

## 1. Supabase — database

### 1a. Run the SQL, in order

Supabase Dashboard → **SQL Editor** → paste + run each file **in this order**:

1. `supabase/migrations/0000_init_schema.sql` — tables (`products`, `orders`,
   `admin_users`) + indexes + Row Level Security + policies.
2. `supabase/migrations/0001_atomic_stock.sql` — atomic stock RPCs
   (`decrement_product_stock`, `restore_product_stock`).
3. `supabase/seed.sql` — demo catalog + admin allowlist row.

> Running `0001` before `0000` is the cause of `ERROR: 42P01: relation
> "public.products" does not exist`. Always run `0000` first.

CLI alternative (runs migrations + seed automatically):

```bash
supabase link --project-ref rxbbibzyyhyksqzlcnll
supabase db push          # applies supabase/migrations/*
# seed.sql is applied by `supabase db reset` locally; in prod paste it once in the SQL editor
```

### 1b. Create your admin operator

Auth and authorization are two things:

1. **Auth user** — Dashboard → **Authentication → Users → Add user**: create a
   user with your email + a password (this is what you log in with).
2. **Authorization** — the `admin_users` table must contain that email. `seed.sql`
   already inserts `uchichinyama@gmail.com` as `super_admin`; change it or add
   your own:

   ```sql
   insert into public.admin_users (email, role)
   values ('you@example.com', 'super_admin')
   on conflict (email) do nothing;
   ```

Login fails with "not registered in the admin_users registry" if the email is
authenticated but missing from `admin_users`.

### 1c. Get your API keys

Dashboard → **Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **Publishable / anon key** (`sb_publishable_…` or the legacy `anon` JWT) →
  `VITE_SUPABASE_ANON_KEY`

Never expose the **service_role** key — it's injected into edge functions
automatically and must never reach the client.

---

## 2. Environment variables

### Client (Vite) — safe to expose, go in `.env.local` and Vercel

| Variable | Where to get it | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | yes (live) |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → publishable/anon key | yes (live) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys → **Publishable** | yes (payments) |
| `VITE_SANDBOX_ADMIN_EMAIL` | your choice | only for offline mode |
| `VITE_SANDBOX_ADMIN_PASSCODE` | your choice | only for offline mode |

`.env.local` (git-ignored — never committed):

```bash
VITE_SUPABASE_URL="https://rxbbibzyyhyksqzlcnll.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_xxx"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
```

In **Vercel** → Project → Settings → **Environment Variables**, add the same
three, then redeploy.

### Server-side (Supabase secrets) — NEVER in the repo or client

| Secret | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → **Secret** (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → your endpoint → **Signing secret** (`whsec_…`) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to functions
automatically — do not set them.

---

## 3. Stripe — payments

The browser never sees a secret key and can never mark an order paid: the app
creates a **pending** order, an edge function creates the PaymentIntent
server-side, and the **webhook** is the only thing that settles it.

### 3a. Set secrets + deploy the functions

One command (reads secrets from your shell, stores nothing):

```bash
export STRIPE_SECRET_KEY=sk_test_your_secret_key
./supabase/deploy-functions.sh rxbbibzyyhyksqzlcnll
```

Or manually:

```bash
supabase link --project-ref rxbbibzyyhyksqzlcnll
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase functions deploy create-payment-intent
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 3b. Register the webhook

Stripe Dashboard → **Developers → Webhooks → Add endpoint**:

- **Endpoint URL:** `https://rxbbibzyyhyksqzlcnll.functions.supabase.co/stripe-webhook`
- **Events:**
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`

Copy the endpoint's **Signing secret** (`whsec_…`), then:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
# re-deploy so the function picks up the new secret:
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 3c. Local testing (optional)

```bash
cp supabase/functions/.env.example supabase/functions/.env   # add your TEST keys
supabase functions serve --env-file supabase/functions/.env
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

### 3d. Test the flow

Checkout with a Stripe **test card**:

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

Any future expiry, any CVC, any ZIP. After paying, the order should flip to
`payment_status = 'paid'` in the `orders` table.

### 3e. Going live

Swap **all** test keys for live keys (`pk_live_…`, `sk_live_…`), create a
**live-mode** webhook endpoint with its own signing secret, re-run the deploy,
and update `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel.

---

## 4. Deploy to Vercel

The repo is Vite-ready (`vercel.json` present).

1. Vercel → **Add New → Project** → import `uchi-c/cosmic`.
2. Framework auto-detects **Vite** (build `vite build`, output `dist`).
3. Add the three `VITE_…` env vars (section 2).
4. Deploy. Pushes to the connected branch auto-deploy.

---

## 5. Verification checklist

- [ ] `0000` → `0001` → `seed.sql` run without error; `products` has rows.
- [ ] Storefront lists products (no red DB banner).
- [ ] Auth user created **and** email present in `admin_users`; admin login works.
- [ ] `VITE_*` set locally and in Vercel.
- [ ] `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` set as Supabase secrets.
- [ ] All three functions deployed; webhook registered with the 6 events.
- [ ] Test payment with `4242…` flips the order to `paid`.

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `42P01: relation "public.products" does not exist` | Ran `0001` before `0000`. Run `0000_init_schema.sql` first. |
| Storefront empty / red "DATABASE" banner | `VITE_SUPABASE_URL`/`ANON_KEY` unset or wrong, or tables/seed not created. |
| Boot loader then "degraded mode" banner | The 9s failsafe fired — the DB was unreachable (bad URL/key or network). |
| Login: "not registered in the admin_users registry" | Auth user exists but email missing from `admin_users` — insert it. |
| Payment never becomes `paid` | Webhook not registered / missing `payment_intent.succeeded` / wrong `STRIPE_WEBHOOK_SECRET` (re-deploy after setting it). |
| "Payment gateway did not return a client secret" | `create-payment-intent` not deployed, or `STRIPE_SECRET_KEY` unset. |
| Payment Element doesn't appear | `VITE_STRIPE_PUBLISHABLE_KEY` missing → app falls back to hosted Checkout. |
