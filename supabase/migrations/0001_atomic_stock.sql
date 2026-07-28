-- ============================================================================
-- Atomic stock mutation for order placement.
-- REQUIRES 0000_init_schema.sql (public.products) to have been run first.
--
-- decrement_product_stock is the race-free allocation primitive: a single
-- guarded UPDATE (`stock = stock - qty WHERE stock >= qty`) inside one
-- statement, so two concurrent orders can never both claim the last unit and
-- stock can never go negative. It is SECURITY DEFINER so anonymous checkout can
-- call it via supabase.rpc('decrement_product_stock', ...) without needing
-- direct write access to the products table under RLS.
--
-- restore_product_stock is its inverse, used to compensate (roll back) an
-- allocation if a later item or the order insert fails.
-- ============================================================================

create or replace function public.decrement_product_stock(
  p_id uuid,
  p_qty integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'INVALID_QUANTITY: quantity must be a positive integer'
      using errcode = 'P0001';
  end if;

  update public.products
     set stock = stock - p_qty,
         updated_at = now()
   where id = p_id
     and is_active = true
     and stock >= p_qty
  returning stock into remaining;

  if not found then
    raise exception 'INSUFFICIENT_STOCK: product % lacks % units', p_id, p_qty
      using errcode = 'P0001';
  end if;

  return remaining;
end;
$$;

create or replace function public.restore_product_stock(
  p_id uuid,
  p_qty integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  if p_qty is null or p_qty <= 0 then
    return null;
  end if;

  update public.products
     set stock = stock + p_qty,
         updated_at = now()
   where id = p_id
  returning stock into remaining;

  return remaining;
end;
$$;

-- These raw mutators must NOT be reachable by the storefront (anon) or by
-- ordinary authenticated users: direct access would let any caller inflate or
-- decrement inventory for any product/quantity without ever creating an order.
-- Only two trusted paths touch stock:
--   • place_order() (SECURITY DEFINER, runs as owner) decrements stock inline
--   • the Stripe webhook (service_role) calls restore_product_stock on failure
revoke execute on function public.decrement_product_stock(uuid, integer) from public, anon, authenticated;
revoke execute on function public.restore_product_stock(uuid, integer)   from public, anon, authenticated;
grant  execute on function public.restore_product_stock(uuid, integer)   to service_role;
