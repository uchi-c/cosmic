-- ============================================================================
-- 0004_fix_order_id_entropy.sql
--
-- SECURITY FIX: place_order() generated order ids as 'ord-' + a 6-digit random
-- number (900,000 possible values). Two public, unauthenticated edge functions
-- — create-payment-intent and create-checkout-session — accept any caller-
-- supplied order_id with no ownership check (by design: guest checkout has no
-- session to tie a caller to "their" order). That combination let an anonymous
-- attacker brute-force the entire order-id keyspace against those functions:
--   - create-checkout-session returns a Stripe-hosted checkout URL that Stripe
--     pre-fills with the order's customer_email — enumerating ids let an
--     attacker harvest every customer's email address.
--   - Both functions act as an existence oracle (200 vs 404) confirming which
--     order ids are real.
-- REQUIRES 0002_place_order.sql to already be applied (this replaces its
-- function body only — same signature, same TEXT id column, no data migration
-- needed for existing rows).
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
  -- 'ord-' + 32 hex chars derived from gen_random_uuid() (122 bits of entropy) —
  -- computationally infeasible to enumerate, unlike the old 6-digit number.
  v_order_id text := 'ord-' || upper(replace(gen_random_uuid()::text, '-', ''));
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

-- Grants are unchanged (already applied by 0002), but re-assert for a clean
-- fresh run of this file.
grant execute on function public.place_order(text, text, text, text, text, jsonb, text, text)
  to anon, authenticated;
