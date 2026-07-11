#!/usr/bin/env bash
# ============================================================================
# Deploy the Cosmic Dept Stripe edge functions and set their secrets.
# Secrets are read from your environment — this script never stores them.
#
# Usage:
#   export STRIPE_SECRET_KEY=sk_test_your_own_key
#   export STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret   # optional on first pass
#   ./supabase/deploy-functions.sh <project-ref>
#
# Example:
#   ./supabase/deploy-functions.sh rxbbibzyyhyksqzlcnll
# ============================================================================
set -euo pipefail

PROJECT_REF="${1:?Pass your Supabase project ref, e.g. rxbbibzyyhyksqzlcnll}"

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "ERROR: export STRIPE_SECRET_KEY before running (use your own TEST key first)." >&2
  exit 1
fi

echo "==> Linking project $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo "==> Setting Stripe secrets (server-side only)"
supabase secrets set "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  supabase secrets set "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
else
  echo "    (STRIPE_WEBHOOK_SECRET not set yet — set it after registering the webhook, then re-run.)"
fi

echo "==> Deploying functions"
supabase functions deploy create-payment-intent
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt

echo "==> Done. Webhook endpoint:"
echo "    https://$PROJECT_REF.functions.supabase.co/stripe-webhook"
echo "    Register it in Stripe (events: checkout.session.completed,"
echo "    async_payment_succeeded, async_payment_failed, expired), then set"
echo "    STRIPE_WEBHOOK_SECRET and re-run this script."
