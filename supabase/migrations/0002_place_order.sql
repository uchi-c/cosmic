-- ============================================================================
-- place_order — the ONLY way the storefront (anon) creates an order.
-- REQUIRES 0000_init_schema.sql and 0001_atomic_stock.sql first.
--
-- Runs SECURITY DEFINER so it can insert into orders and decrement products in
-- a single transaction while the anon/authenticated roles have NO direct INSERT
-- on orders and NO EXECUTE on the raw stock functions. It:
--   1. re-reads each product from the catalog (price is never trusted from the
--      client),
--   2. atomically decrements stock with a guarded UPDATE (never oversells /
--      never negative),
--   3. inserts the order with a forced-pending state and a server-computed total.
-- If any line fails, the whole transaction rolls back (no partial allocation).
-- ============================================================================

create or replace function public.place_order(
  p_customer_name  text,
  p_customer_email text,
  p_customer_phone text,
  p_country        text,
  p_address        text,
  p_items          jsonb,   -- [{ "id": uuid, "quantity": int, "size": text, "color": text }]
  p_payment_method text,
  p_notes          text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item     jsonb;
  v_prod     public.products%rowtype;
  v_qty      integer;
  v_price    numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_verified jsonb := '[]'::jsonb;
  v_order_id text := 'ord-' || floor(100000 + random() * 900000)::bigint::text;
  v_now      timestamptz := now();
  v_result   public.orders;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER: no items supplied' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item ->> 'quantity')::int, 0);
    if v_qty <= 0 then
      raise exception 'INVALID_QUANTITY: quantity must be positive' using errcode = 'P0001';
    end if;

    -- Atomic guarded decrement; only succeeds if the active product still holds
    -- enough stock. Returns the row so we can price it authoritatively.
    update public.products
       set stock = stock - v_qty,
           updated_at = v_now
     where id = (v_item ->> 'id')::uuid
       and is_active = true
       and stock >= v_qty
    returning * into v_prod;

    if not found then
      raise exception 'STOCK_OR_PRODUCT_UNAVAILABLE: %', (v_item ->> 'id')
        using errcode = 'P0001';
    end if;

    v_price := coalesce(v_prod.sale_price, v_prod.price);
    v_subtotal := v_subtotal + v_price * v_qty;

    v_verified := v_verified || jsonb_build_object(
      'id',       v_prod.id,
      'name',     v_prod.name,
      'price',    v_price,
      'quantity', v_qty,
      'image',    coalesce(v_prod.images[1], ''),
      'size',     coalesce(v_item ->> 'size', 'OS'),
      'color',    coalesce(v_item ->> 'color', '')
    );
  end loop;

  insert into public.orders (
    id, customer_name, customer_email, customer_phone, country, address,
    items, subtotal, total, currency, payment_method, payment_status,
    order_status, stripe_session, notes, created_at, updated_at
  ) values (
    v_order_id, p_customer_name, p_customer_email, p_customer_phone, p_country, p_address,
    v_verified, v_subtotal, v_subtotal, 'USD', p_payment_method, 'pending',
    'pending', null, p_notes, v_now, v_now
  )
  returning * into v_result;

  return v_result;
end;
$$;

-- The storefront (anon) and admins may create orders ONLY through this function.
grant execute on function public.place_order(text, text, text, text, text, jsonb, text, text)
  to anon, authenticated;
