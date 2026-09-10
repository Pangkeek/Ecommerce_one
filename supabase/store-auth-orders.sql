create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table private.store_admin_emails (
 email text primary key check (email = lower(email))
);
alter table private.store_admin_emails enable row level security;
revoke all on private.store_admin_emails from public, anon, authenticated;
insert into private.store_admin_emails values ('supawatkhaithong@gmail.com');

-- This internal lookup deliberately reads protected Auth data. Never trust user_metadata.
create function private.is_store_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
 select auth.uid() is not null and exists (
   select 1 from auth.users u join private.store_admin_emails a on a.email = lower(u.email)
   where u.id = auth.uid() and u.email_confirmed_at is not null
 );
$$;
revoke all on function private.is_store_admin() from public, anon;
grant execute on function private.is_store_admin() to authenticated;
create function public.is_store_admin() returns boolean
language sql stable security invoker set search_path = ''
as $$ select private.is_store_admin(); $$;
revoke all on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to authenticated;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '' check (length(full_name) <= 100),
 address jsonb not null default '{}'::jsonb check (jsonb_typeof(address) = 'object'),
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
create policy "Read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Create own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "Edit own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table public.products add column image_url text;
alter table public.product_variants add column price_satang integer check (price_satang >= 0);
update public.product_variants set price_satang = 96000 where product_id = 'rose-clay' and id = 'trio';
grant update on public.products, public.product_variants to authenticated;
create policy "Admin read all products" on public.products for select to authenticated using ((select private.is_store_admin()));
create policy "Admin edit products" on public.products for update to authenticated using ((select private.is_store_admin())) with check ((select private.is_store_admin()));
create policy "Admin read all variants" on public.product_variants for select to authenticated using ((select private.is_store_admin()));
create policy "Admin edit variants" on public.product_variants for update to authenticated using ((select private.is_store_admin())) with check ((select private.is_store_admin()));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Admin image upload" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select private.is_store_admin()));
create policy "Admin image read" on storage.objects for select to authenticated
using (bucket_id = 'product-images' and (select private.is_store_admin()));
create policy "Admin image update" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select private.is_store_admin()))
with check (bucket_id = 'product-images' and (select private.is_store_admin()));
create policy "Admin image delete" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select private.is_store_admin()));

create table public.orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id),
 request_id uuid not null,
 email text not null,
 shipping_address jsonb not null,
 status text not null default 'pending' check (status in ('pending','cancelled')),
 subtotal_satang integer not null check (subtotal_satang >= 0),
 shipping_satang integer not null check (shipping_satang >= 0),
 total_satang integer not null check (total_satang = subtotal_satang + shipping_satang),
 created_at timestamptz not null default now(),
 unique (user_id, request_id)
);
create table public.order_items (
 order_id uuid not null references public.orders(id) on delete cascade,
 product_id text not null,
 variant_id text not null,
 name jsonb not null,
 label jsonb not null,
 quantity integer not null check (quantity between 1 and 99),
 unit_price_satang integer not null check (unit_price_satang >= 0),
 primary key (order_id,product_id,variant_id),
 foreign key (product_id,variant_id) references public.product_variants(product_id,id)
);
create index order_items_variant_idx on public.order_items(product_id,variant_id);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
revoke all on public.orders,public.order_items from public,anon,authenticated;
grant select on public.orders,public.order_items to authenticated;
create policy "Read own or admin orders" on public.orders for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_store_admin()));
create policy "Read permitted order items" on public.order_items for select to authenticated
using (exists(select 1 from public.orders o where o.id = order_items.order_id));

-- Privileged writes are confined to a private function with explicit identity checks,
-- authoritative prices, ordered row locks, and idempotency. Clients cannot write totals.
create function private.place_order(p_request_id uuid,p_lines jsonb,p_address jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
 v_user uuid := auth.uid(); v_email text; v_order uuid; v_subtotal integer := 0; v_shipping integer;
 v_line record; v_product record; v_variant record; v_price integer;
begin
 if v_user is null then raise exception 'Sign in to place an order'; end if;
 select email into v_email from auth.users where id=v_user and email_confirmed_at is not null for update;
 if v_email is null then raise exception 'Verify your email before ordering'; end if;
 if p_request_id is null then raise exception 'Missing request ID'; end if;
 select id into v_order from public.orders where user_id=v_user and request_id=p_request_id;
 if v_order is not null then return v_order; end if;
 if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) not between 1 and 30 then raise exception 'Invalid cart'; end if;
 if p_address is null or jsonb_typeof(p_address) <> 'object' then raise exception 'Invalid address'; end if;
 if coalesce(length(trim(p_address->>'fullName')),0) not between 2 and 100
 or coalesce(length(trim(p_address->>'phone')),0) not between 8 and 20
 or coalesce(length(trim(p_address->>'address')),0) not between 5 and 500
 or coalesce(length(trim(p_address->>'province')),0) not between 2 and 100
 or coalesce(p_address->>'postcode','') !~ '^[0-9]{5}$' then raise exception 'Invalid delivery details'; end if;
 if exists(select 1 from jsonb_to_recordset(p_lines) as l("productId" text,"variantId" text,quantity integer)
 where l."productId" is null or l."variantId" is null or l.quantity is null or l.quantity not between 1 and 99) then raise exception 'Invalid cart line'; end if;
 if exists(select 1 from jsonb_to_recordset(p_lines) as l("productId" text,"variantId" text,quantity integer)
 group by l."productId",l."variantId" having count(*) > 1) then raise exception 'Duplicate cart line'; end if;
 insert into public.orders(user_id,request_id,email,shipping_address,subtotal_satang,shipping_satang,total_satang)
 values(v_user,p_request_id,v_email,p_address,0,0,0) returning id into v_order;
 for v_line in select * from jsonb_to_recordset(p_lines) as l("productId" text,"variantId" text,quantity integer) order by l."productId",l."variantId" loop
   select * into v_product from public.products where id=v_line."productId" and active;
   if not found then raise exception 'Product is unavailable'; end if;
   select * into v_variant from public.product_variants where product_id=v_line."productId" and id=v_line."variantId" for update;
   if not found then raise exception 'Variant is unavailable'; end if;
   if v_variant.stock < v_line.quantity then raise exception 'Not enough stock'; end if;
   v_price := coalesce(v_variant.price_satang,v_product.price_satang);
   v_subtotal := v_subtotal + v_price*v_line.quantity;
   insert into public.order_items(order_id,product_id,variant_id,name,label,quantity,unit_price_satang)
   values(v_order,v_product.id,v_variant.id,v_product.name,v_variant.label,v_line.quantity,v_price);
   update public.product_variants set stock=stock-v_line.quantity where product_id=v_product.id and id=v_variant.id;
 end loop;
 v_shipping := case when v_subtotal >= 100000 then 0 else 6000 end;
 update public.orders set subtotal_satang=v_subtotal,shipping_satang=v_shipping,total_satang=v_subtotal+v_shipping where id=v_order;
 return v_order;
end;
$$;
revoke all on function private.place_order(uuid,jsonb,jsonb) from public,anon;
grant execute on function private.place_order(uuid,jsonb,jsonb) to authenticated;
create function public.place_order(p_request_id uuid,p_lines jsonb,p_address jsonb) returns uuid
language sql security invoker set search_path = '' as $$ select private.place_order(p_request_id,p_lines,p_address); $$;
revoke all on function public.place_order(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.place_order(uuid,jsonb,jsonb) to authenticated;

create function private.cancel_order(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_order record; v_item record;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 select * into v_order from public.orders where id=p_order_id for update;
 if not found or (v_order.user_id <> auth.uid() and not private.is_store_admin()) then raise exception 'Order unavailable'; end if;
 if v_order.status = 'cancelled' then return; end if;
 for v_item in select * from public.order_items where order_id=p_order_id order by product_id,variant_id loop
  update public.product_variants set stock=stock+v_item.quantity where product_id=v_item.product_id and id=v_item.variant_id;
 end loop;
 update public.orders set status='cancelled' where id=p_order_id;
end; $$;
revoke all on function private.cancel_order(uuid) from public,anon;
grant execute on function private.cancel_order(uuid) to authenticated;
create function public.cancel_order(p_order_id uuid) returns void
language sql security invoker set search_path = '' as $$ select private.cancel_order(p_order_id); $$;
revoke all on function public.cancel_order(uuid) from public,anon;
grant execute on function public.cancel_order(uuid) to authenticated;
