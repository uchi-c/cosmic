-- ============================================================================
-- 0005_flutterwave_support.sql
--
-- Adds provider-agnostic payment reference columns. Stripe cannot activate a
-- live merchant account for a Zambia-registered business (not on Stripe's
-- supported-country list), so card checkout is moving to Flutterwave, which is
-- licensed to operate with Zambian merchants and processes international
-- Visa/Mastercard/Amex plus local mobile money.
--
-- `stripe_session` is left in place untouched (existing rows keep their
-- history; the Stripe edge functions are still in the repo, just unreached
-- from the client checkout flow now) — this just adds a provider-neutral pair
-- of columns so new orders don't have to overload a Stripe-named column with
-- a different processor's reference.
-- ============================================================================

alter table public.orders
  add column if not exists payment_provider  text,
  add column if not exists payment_reference text;

create index if not exists orders_payment_reference_idx
  on public.orders (payment_reference)
  where payment_reference is not null;
