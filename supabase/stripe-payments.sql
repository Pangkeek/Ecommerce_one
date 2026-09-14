-- Run once in the Supabase SQL editor before deploying stripe-webhook.
-- Checkout creation remains server-side; only this signed webhook path can mark an order paid.

begin;

alter table public.orders
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_livemode boolean,
  add column if not exists stripe_currency text,
  add column if not exists checkout_expires_at timestamptz,
  add column if not exists paid_at timestamptz;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','cancelled'));

create unique index if not exists orders_stripe_session_uidx
  on public.orders(stripe_session_id) where stripe_session_id is not null;
create unique index if not exists orders_stripe_payment_intent_uidx
  on public.orders(stripe_payment_intent_id) where stripe_payment_intent_id is not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='orders_stripe_session_format_check' and conrelid='public.orders'::regclass) then
    alter table public.orders add constraint orders_stripe_session_format_check
      check (stripe_session_id is null or stripe_session_id ~ '^cs_(test|live)_[A-Za-z0-9]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname='orders_stripe_payment_intent_format_check' and conrelid='public.orders'::regclass) then
    alter table public.orders add constraint orders_stripe_payment_intent_format_check
      check (stripe_payment_intent_id is null or stripe_payment_intent_id ~ '^pi_[A-Za-z0-9]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname='orders_stripe_currency_check' and conrelid='public.orders'::regclass) then
    alter table public.orders add constraint orders_stripe_currency_check
      check (stripe_currency is null or stripe_currency ~ '^[a-z]{3}$');
  end if;
  if not exists (select 1 from pg_constraint where conname='orders_paid_state_check' and conrelid='public.orders'::regclass) then
    alter table public.orders add constraint orders_paid_state_check check (
      (status <> 'paid' and paid_at is null)
      or
      (status = 'paid' and paid_at is not null and stripe_session_id is not null
       and stripe_payment_intent_id is not null and stripe_livemode is not null and stripe_currency is not null)
    );
  end if;
end $$;

create table if not exists private.stripe_webhook_events (
  event_id text primary key check (event_id ~ '^evt_[A-Za-z0-9]+$'),
  event_type text not null check (event_type in ('checkout.session.completed','checkout.session.expired')),
  session_id text not null check (session_id ~ '^cs_(test|live)_[A-Za-z0-9]+$'),
  order_id uuid,
  result text not null,
  received_at timestamptz not null default now()
);
alter table private.stripe_webhook_events enable row level security;
revoke all on private.stripe_webhook_events from public,anon,authenticated;
grant usage on schema private to service_role;

create or replace function private.attach_stripe_checkout(
  p_order_id uuid,p_session_id text,p_expires_at timestamptz,p_livemode boolean
) returns void
language plpgsql security definer set search_path='' as $$
declare v_order public.orders%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_session_id is null or p_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$' then raise exception 'Invalid Stripe session'; end if;
  if p_expires_at is null or p_expires_at <= now() then raise exception 'Stripe session already expired'; end if;
  if (p_livemode and p_session_id !~ '^cs_live_') or (not p_livemode and p_session_id !~ '^cs_test_') then raise exception 'Stripe mode mismatch'; end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found or v_order.user_id <> auth.uid() then raise exception 'Order unavailable'; end if;
  if v_order.status <> 'pending' then raise exception 'Only pending orders can enter checkout'; end if;
  if v_order.stripe_session_id is not null and v_order.stripe_session_id <> p_session_id then raise exception 'Order already has a Stripe session'; end if;
  if v_order.stripe_livemode is not null and v_order.stripe_livemode <> p_livemode then raise exception 'Stripe mode mismatch'; end if;

  update public.orders set
    stripe_session_id=p_session_id,
    stripe_livemode=p_livemode,
    stripe_currency='thb',
    checkout_expires_at=p_expires_at
  where id=p_order_id;
end $$;
revoke all on function private.attach_stripe_checkout(uuid,text,timestamptz,boolean) from public,anon;
grant execute on function private.attach_stripe_checkout(uuid,text,timestamptz,boolean) to authenticated;

create or replace function public.attach_stripe_checkout(
  p_order_id uuid,p_session_id text,p_expires_at timestamptz,p_livemode boolean
) returns void
language sql security invoker set search_path='' as $$
  select private.attach_stripe_checkout(p_order_id,p_session_id,p_expires_at,p_livemode);
$$;
revoke all on function public.attach_stripe_checkout(uuid,text,timestamptz,boolean) from public,anon;
grant execute on function public.attach_stripe_checkout(uuid,text,timestamptz,boolean) to authenticated;

create or replace function public.process_stripe_checkout_event(
  p_event_id text,
  p_event_type text,
  p_session_id text,
  p_order_id uuid,
  p_user_id uuid,
  p_payment_intent_id text,
  p_amount_total integer,
  p_currency text,
  p_livemode boolean,
  p_payment_status text
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_inserted integer;
  v_previous text;
  v_result text;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'Service role required'; end if;
  if p_event_id !~ '^evt_[A-Za-z0-9]+$'
     or p_event_type not in ('checkout.session.completed','checkout.session.expired')
     or p_session_id !~ '^cs_(test|live)_[A-Za-z0-9]+$' then raise exception 'Invalid Stripe event'; end if;

  insert into private.stripe_webhook_events(event_id,event_type,session_id,order_id,result)
  values(p_event_id,p_event_type,p_session_id,p_order_id,'processing')
  on conflict (event_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted=0 then
    select result into v_previous from private.stripe_webhook_events where event_id=p_event_id;
    return jsonb_build_object('result','duplicate','previous_result',v_previous);
  end if;

  select * into v_order from public.orders where id=p_order_id for update;
  if not found then v_result:='ignored_missing_order';
  elsif p_user_id is null or v_order.user_id <> p_user_id then v_result:='rejected_user';
  elsif p_amount_total is null or p_currency is null or v_order.total_satang <> p_amount_total or p_currency <> 'thb' then v_result:='rejected_amount_or_currency';
  elsif (p_livemode and p_session_id !~ '^cs_live_') or (not p_livemode and p_session_id !~ '^cs_test_') then v_result:='rejected_mode';
  elsif v_order.stripe_session_id is not null and v_order.stripe_session_id <> p_session_id then v_result:='rejected_session';
  elsif v_order.stripe_livemode is not null and v_order.stripe_livemode <> p_livemode then v_result:='rejected_mode';
  elsif p_event_type='checkout.session.completed' then
    if v_order.status='paid' and v_order.stripe_session_id=p_session_id then
      v_result:='already_paid';
    elsif v_order.status <> 'pending' then
      v_result:='rejected_order_status';
    elsif p_payment_status <> 'paid' or p_payment_intent_id is null or p_payment_intent_id !~ '^pi_[A-Za-z0-9]+$' then
      v_result:='rejected_unpaid';
    else
      update public.orders set
        status='paid',stripe_session_id=p_session_id,stripe_payment_intent_id=p_payment_intent_id,
        stripe_livemode=p_livemode,stripe_currency=p_currency,paid_at=now()
      where id=p_order_id;
      v_result:='paid';
    end if;
  else
    if v_order.status='cancelled' then
      v_result:='already_cancelled';
    elsif v_order.status='paid' then
      v_result:='ignored_paid';
    else
      for v_item in
        select product_id,variant_id,quantity from public.order_items
        where order_id=p_order_id order by product_id,variant_id
      loop
        update public.product_variants set stock=stock+v_item.quantity
        where product_id=v_item.product_id and id=v_item.variant_id;
      end loop;
      update public.orders set
        status='cancelled',stripe_session_id=p_session_id,stripe_livemode=p_livemode,
        stripe_currency=p_currency,checkout_expires_at=coalesce(checkout_expires_at,now())
      where id=p_order_id;
      v_result:='cancelled';
    end if;
  end if;

  update private.stripe_webhook_events set order_id=p_order_id,result=v_result where event_id=p_event_id;
  return jsonb_build_object('result',v_result,'order_id',p_order_id);
end $$;
revoke all on function public.process_stripe_checkout_event(text,text,text,uuid,uuid,text,integer,text,boolean,text) from public,anon,authenticated;
grant execute on function public.process_stripe_checkout_event(text,text,text,uuid,uuid,text,integer,text,boolean,text) to service_role;

-- A customer may directly cancel only before a payable Stripe session exists.
-- Once attached, the server expires the session and checkout.session.expired performs this stock restoration.
create or replace function private.cancel_order(p_order_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare v_order public.orders%rowtype; v_item record;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found or (v_order.user_id <> auth.uid() and not private.is_store_admin()) then raise exception 'Order unavailable'; end if;
  if v_order.status='cancelled' then return; end if;
  if v_order.status <> 'pending' then raise exception 'Only pending orders can be cancelled'; end if;
  if v_order.stripe_session_id is not null then raise exception 'Expire Stripe checkout before cancelling'; end if;
  for v_item in select product_id,variant_id,quantity from public.order_items where order_id=p_order_id order by product_id,variant_id loop
    update public.product_variants set stock=stock+v_item.quantity where product_id=v_item.product_id and id=v_item.variant_id;
  end loop;
  update public.orders set status='cancelled' where id=p_order_id;
end $$;

commit;
