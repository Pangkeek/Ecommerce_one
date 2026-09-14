-- Run in Supabase SQL Editor after supabase/stripe-payments.sql.
-- All test mutations are rolled back.
begin;
select set_config('request.jwt.claim.role','service_role',true);

do $$
declare
  o public.orders%rowtype;
  r jsonb;
  before_stock bigint;
  after_stock bigint;
  line_quantity bigint;
  session_id text;
begin
  if has_function_privilege('authenticated','public.process_stripe_checkout_event(text,text,text,uuid,uuid,text,integer,text,boolean,text)','EXECUTE') then
    raise exception 'Authenticated users can execute the webhook processor';
  end if;
  if not has_function_privilege('service_role','public.process_stripe_checkout_event(text,text,text,uuid,uuid,text,integer,text,boolean,text)','EXECUTE') then
    raise exception 'Service role cannot execute the webhook processor';
  end if;

  select * into o from public.orders where status='pending' order by created_at limit 1;
  if not found then raise exception 'Create one pending order before running this test'; end if;
  session_id:=coalesce(o.stripe_session_id,'cs_test_CodexPaymentTest');

  r:=public.process_stripe_checkout_event(
    'evt_CodexPaymentTest','checkout.session.completed',session_id,o.id,o.user_id,
    'pi_CodexPaymentTest',o.total_satang,'thb',coalesce(o.stripe_livemode,false),'paid'
  );
  if r->>'result'<>'paid' or not exists(select 1 from public.orders where id=o.id and status='paid' and paid_at is not null) then
    raise exception 'Paid transition failed: %',r;
  end if;
  r:=public.process_stripe_checkout_event(
    'evt_CodexPaymentTest','checkout.session.completed',session_id,o.id,o.user_id,
    'pi_CodexPaymentTest',o.total_satang,'thb',coalesce(o.stripe_livemode,false),'paid'
  );
  if r->>'result'<>'duplicate' then raise exception 'Completed event was not idempotent: %',r; end if;
end $$;

rollback;

begin;
select set_config('request.jwt.claim.role','service_role',true);

do $$
declare
  o public.orders%rowtype;
  r jsonb;
  before_stock bigint;
  after_stock bigint;
  line_quantity bigint;
  session_id text;
begin
  select * into o from public.orders where status='pending' order by created_at limit 1;
  if not found then raise exception 'Create one pending order before running this test'; end if;
  session_id:=coalesce(o.stripe_session_id,'cs_test_CodexExpirationTest');
  select sum(v.stock),sum(i.quantity) into before_stock,line_quantity
  from public.order_items i join public.product_variants v on v.product_id=i.product_id and v.id=i.variant_id
  where i.order_id=o.id;

  r:=public.process_stripe_checkout_event(
    'evt_CodexExpirationTest','checkout.session.expired',session_id,o.id,o.user_id,
    null,o.total_satang,'thb',coalesce(o.stripe_livemode,false),'unpaid'
  );
  select sum(v.stock) into after_stock
  from public.order_items i join public.product_variants v on v.product_id=i.product_id and v.id=i.variant_id
  where i.order_id=o.id;
  if r->>'result'<>'cancelled' or after_stock<>before_stock+line_quantity then
    raise exception 'Expiration stock restoration failed: %',r;
  end if;
  r:=public.process_stripe_checkout_event(
    'evt_CodexExpirationTest','checkout.session.expired',session_id,o.id,o.user_id,
    null,o.total_satang,'thb',coalesce(o.stripe_livemode,false),'unpaid'
  );
  if r->>'result'<>'duplicate' then raise exception 'Expired event was not idempotent: %',r; end if;
  if (select sum(v.stock) from public.order_items i join public.product_variants v on v.product_id=i.product_id and v.id=i.variant_id where i.order_id=o.id)<>after_stock then
    raise exception 'Duplicate expiration restored stock twice';
  end if;
end $$;

rollback;
select 'stripe payment database tests passed' as result;
