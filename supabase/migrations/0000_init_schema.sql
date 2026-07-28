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
-- Storefront reads run with the anon key; admin actions require an allow-listed
-- authenticated Supabase Auth session (enforced by is_admin() below). Anonymous
-- checkout creates orders only via the place_order() SECURITY DEFINER RPC
-- (0002), so anon never needs direct INSERT on orders or write access to
-- products.
-- ============================================================================
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.admin_users enable row level security;

-- is_admin(): true when the current JWT's email is allow-listed in admin_users.
-- SECURITY DEFINER so it can read admin_users without tripping that table's own
-- RLS (and without recursion). This is the server-side enforcement of the admin
-- allowlist — the client-side check in LoginView is only UX.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Products: anyone may read active items; only allow-listed admins manage them.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select
  using (is_active = true or public.is_admin());

drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Orders: NO direct anon/authenticated INSERT. Order creation goes exclusively
-- through the place_order() SECURITY DEFINER RPC (0002_place_order.sql), which
-- forces the safe initial state (pending, no stripe_session) and computes
-- totals server-side. Only allow-listed admins may read/update.
drop policy if exists orders_public_insert on public.orders;

drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admin users: readable only by allow-listed admins.
drop policy if exists admin_users_read on public.admin_users;
create policy admin_users_read on public.admin_users
  for select
  to authenticated
  using (public.is_admin());
