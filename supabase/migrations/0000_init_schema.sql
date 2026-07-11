-- ============================================================================
-- COSMIC DEPT — base schema.
-- RUN THIS FIRST. 0001_atomic_stock.sql depends on public.products existing.
--
-- Mirrors the Product / Order / AdminUser shapes in src/types.ts. Safe to
-- re-run (idempotent): tables use IF NOT EXISTS and policies are dropped first.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  category    text not null check (category in ('mens','womens','gym','jewelry','accessories')),
  price       numeric(10,2) not null check (price >= 0),
  sale_price  numeric(10,2) check (sale_price is null or sale_price >= 0),
  description text,
  short_desc  text,
  sizes       text[] not null default '{}',
  colors      text[] not null default '{}',
  badge       text check (badge is null or badge in ('NEW','LIMITED','SALE','HOT','')),
  stock       integer not null default 0 check (stock >= 0),
  images      text[] not null default '{}',
  is_active   boolean not null default true,
  is_featured boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx   on public.products (is_active);
create index if not exists products_created_idx  on public.products (created_at desc);

-- ---------------------------------------------------------------------------
-- ORDERS
-- id is TEXT because the app generates human-readable ids ("ord-123456").
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id             text primary key,
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  country        text,
  address        text,
  items          jsonb not null default '[]'::jsonb,
  subtotal       numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  currency       text not null default 'USD',
  payment_method text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  order_status   text not null default 'pending' check (order_status in ('pending','processing','completed','cancelled')),
  stripe_session text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_email_idx   on public.orders (customer_email);

-- ---------------------------------------------------------------------------
-- ADMIN USERS (authorization allowlist; auth itself is Supabase Auth)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  role       text not null default 'viewer' check (role in ('super_admin','editor','viewer')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Storefront reads run with the anon key; admin actions require an
-- authenticated Supabase Auth session. Stock decrements during anonymous
-- checkout go through the SECURITY DEFINER RPC in 0001 (which bypasses these
-- policies safely), so anon never needs direct write access to products.
-- ============================================================================
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.admin_users enable row level security;

-- Products: public can read active items; authenticated admins manage everything.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select
  using (is_active = true or auth.role() = 'authenticated');

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all
  to authenticated
  using (true)
  with check (true);

-- Orders: anonymous customers may create orders; only admins may read/update.
drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders
  for insert
  with check (true);

drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders
  for select
  to authenticated
  using (true);

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update
  to authenticated
  using (true)
  with check (true);

-- Admin users: readable only by authenticated sessions.
drop policy if exists admin_users_read on public.admin_users;
create policy admin_users_read on public.admin_users
  for select
  to authenticated
  using (true);
