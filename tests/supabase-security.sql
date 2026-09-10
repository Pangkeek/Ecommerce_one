begin;
select set_config('test.customer', gen_random_uuid()::text, true);
select set_config('test.other', gen_random_uuid()::text, true);
select set_config('test.admin', gen_random_uuid()::text, true);
select set_config('test.request', gen_random_uuid()::text, true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
values(current_setting('test.customer')::uuid,'customer@integration.invalid',now(),'{"role":"admin"}'),
(current_setting('test.other')::uuid,'other@integration.invalid',now(),'{}'),
(current_setting('test.admin')::uuid,'admin@integration.invalid',now(),'{}');
insert into private.store_admin_emails values('admin@integration.invalid');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.customer'),'role','authenticated')::text,true);
do $$
declare v_order uuid; v_repeat uuid; v_initial integer; v_count integer;
begin
 if public.is_store_admin() then raise exception 'User metadata escalated admin'; end if;
 update public.products set price_satang=1 where id='rose-clay';
 get diagnostics v_count = row_count;
 if v_count<>0 then raise exception 'Customer changed price'; end if;
 if has_table_privilege('authenticated','public.orders','INSERT') then raise exception 'Direct order insert allowed'; end if;
 if has_table_privilege('authenticated','private.store_admin_emails','INSERT') then raise exception 'Admin allowlist writable'; end if;
 select stock into v_initial from public.product_variants where product_id='rose-clay' and id='90g';
 v_order:=public.place_order(current_setting('test.request')::uuid,'[{"productId":"rose-clay","variantId":"90g","quantity":2}]','{"fullName":"Test Customer","phone":"0812345678","address":"123 Test Road","province":"Bangkok","postcode":"10110"}');
 v_repeat:=public.place_order(current_setting('test.request')::uuid,'[{"productId":"rose-clay","variantId":"90g","quantity":2}]','{"fullName":"Test Customer","phone":"0812345678","address":"123 Test Road","province":"Bangkok","postcode":"10110"}');
 if v_order<>v_repeat then raise exception 'Idempotency failed'; end if;
 if (select stock from public.product_variants where product_id='rose-clay' and id='90g')<>v_initial-2 then raise exception 'Stock reservation failed'; end if;
 if (select total_satang from public.orders where id=v_order)<>70000 then raise exception 'Authoritative total failed'; end if;
 perform set_config('test.order',v_order::text,true);
 begin
  perform public.place_order(gen_random_uuid(),'[{"productId":"rose-clay","variantId":"90g","quantity":99}]','{"fullName":"Test Customer","phone":"0812345678","address":"123 Test Road","province":"Bangkok","postcode":"10110"}');
  raise exception 'Overselling allowed' using errcode='XX001';
 exception when raise_exception then null;
 end;
 if (select count(*) from public.orders)<>1 then raise exception 'Failed order was not rolled back'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.other'),'role','authenticated')::text,true);
 if (select count(*) from public.orders)<>0 or (select count(*) from public.order_items)<>0 then raise exception 'Cross-user order leak'; end if;
 begin
  perform public.cancel_order(v_order);
  raise exception 'Cross-user cancellation allowed' using errcode='XX001';
 exception when raise_exception then null;
 end;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.customer'),'role','authenticated')::text,true);
 perform public.cancel_order(v_order);perform public.cancel_order(v_order);
 if (select stock from public.product_variants where product_id='rose-clay' and id='90g')<>v_initial then raise exception 'Restock/idempotent cancellation failed'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
 if not public.is_store_admin() then raise exception 'Verified admin not recognized'; end if;
 perform public.update_catalog_item('rose-clay','90g',33000,v_initial,null);
 if (select price_satang from public.products where id='rose-clay')<>33000 then raise exception 'Admin save failed'; end if;
end; $$;
reset role;
update auth.users set email_confirmed_at=null where id=current_setting('test.admin')::uuid;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
do $$ begin if public.is_store_admin() then raise exception 'Unverified admin accepted'; end if; end $$;
reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
 if (select count(*) from public.products)<>6 then raise exception 'Public catalog denied'; end if;
 if has_function_privilege('anon','public.place_order(uuid,jsonb,jsonb)','EXECUTE') then raise exception 'Anonymous order writes allowed'; end if;
 if has_table_privilege('anon','public.profiles','SELECT') then raise exception 'Profiles publicly exposed'; end if;
end $$;
reset role;
rollback;
select 'PASS: RLS isolation, admin verification, server prices, idempotency, stock rollback and cancellation; all fixtures rolled back' as result;
