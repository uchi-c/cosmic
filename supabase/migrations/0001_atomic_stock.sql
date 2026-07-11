-- ============================================================================
-- Atomic stock decrement for order placement (recommended production path).
--
-- The client-side dbService.createOrder uses a guarded conditional UPDATE
-- (`stock = stock - qty WHERE stock >= qty`) plus compensating rollback, which
-- prevents overselling the last unit. Under heavy concurrent load, however, the
-- only fully race-free approach is a single server-side transaction. Deploy this
-- function and call it via supabase.rpc('place_order_decrement', ...) from a
-- trusted backend / edge function so the whole allocation is atomic.
-- ============================================================================

create or replace function public.decrement_product_stock(
  p_id uuid,
  p_qty integer
)
returns integer
language plpgsql
as $$
declare
  remaining integer;
begin
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

-- Optional hard guard so stock can never be negative even via direct writes.
alter table public.products
  add constraint products_stock_nonnegative check (stock >= 0) not valid;
