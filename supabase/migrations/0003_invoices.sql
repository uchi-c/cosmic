-- ============================================================================
-- invoices — Stripe Invoicing records (admin-generated).
-- REQUIRES 0000_init_schema.sql (provides is_admin() + orders).
--
-- Rows are written ONLY by the server (the create-invoice edge function and the
-- stripe-webhook, both using service_role, which bypasses RLS). Allow-listed
-- admins may read; there is no anon/authenticated write path.
-- ============================================================================

create table if not exists public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  order_id           text references public.orders(id) on delete set null,
  stripe_invoice_id  text unique,
  stripe_customer_id text,
  customer_email     text not null,
  customer_name      text,
  amount_due         numeric(10,2) not null default 0,
  currency           text not null default 'USD',
  status             text not null default 'draft'
                       check (status in ('draft','open','paid','uncollectible','void')),
  hosted_invoice_url text,
  invoice_pdf        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists invoices_order_idx   on public.invoices (order_id);
create index if not exists invoices_status_idx  on public.invoices (status);
create index if not exists invoices_created_idx on public.invoices (created_at desc);

alter table public.invoices enable row level security;

-- Admins may read; all writes go through service_role (edge function + webhook).
drop policy if exists invoices_admin_read on public.invoices;
create policy invoices_admin_read on public.invoices
  for select
  to authenticated
  using (public.is_admin());
