#!/usr/bin/env bash
# ============================================================================
# Deploy the Cosmic Dept payment edge functions and set their secrets.
# Secrets are read from your environment — this script never stores them.
#
# Usage:
#   export FLW_SECRET_KEY=FLWSECK_TEST-your_own_key
#   export FLW_SECRET_HASH=your-own-random-string   # optional on first pass
#   export STRIPE_SECRET_KEY=sk_test_your_own_key   # optional — admin invoicing only
#   export STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret   # optional
#   ./supabase/deploy-functions.sh <project-ref>
#
# Example:
#   ./supabase/deploy-functions.sh ubpfikqzhznlvhckfdng
#
# Flutterwave is the live checkout provider (Stripe cannot activate a live
# merchant account for a Zambia-registered business). Stripe secrets are only
# needed if you're using create-invoice (admin-generated hosted invoices).
# ============================================================================
set -euo pipefail

PROJECT_REF="${1:?Pass your Supabase project ref, e.g. ubpfikqzhznlvhckfdng}"

if [[ -z "${FLW_SECRET_KEY:-}" ]]; then
  echo "ERROR: export FLW_SECRET_KEY before running (use your own TEST key first)." >&2
  exit 1
fi

echo "==> Linking project $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

echo "==> Setting Flutterwave secrets (server-side only)"
supabase secrets set "FLW_SECRET_KEY=$FLW_SECRET_KEY"
if [[ -n "${FLW_SECRET_HASH:-}" ]]; then
  supabase secrets set "FLW_SECRET_HASH=$FLW_SECRET_HASH"
else
  echo "    (FLW_SECRET_HASH not set yet — set it after registering the webhook, then re-run.)"
fi

if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "==> Setting Stripe secrets (admin invoicing only)"
  supabase secrets set "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
  if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
    supabase secrets set "STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
  fi
fi

echo "==> Deploying functions"
supabase functions deploy create-flutterwave-payment
supabase functions deploy flutterwave-webhook --no-verify-jwt
supabase functions deploy create-payment-intent
supabase functions deploy create-checkout-session
supabase functions deploy create-invoice
supabase functions deploy stripe-webhook --no-verify-jwt

echo "==> Done. Flutterwave webhook endpoint:"
echo "    https://$PROJECT_REF.functions.supabase.co/flutterwave-webhook"
echo "    Register it in Flutterwave (Dashboard → Settings → Webhooks), set the"
echo "    same string as FLW_SECRET_HASH there and here, then re-run this script."
