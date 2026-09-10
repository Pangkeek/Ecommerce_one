create or replace function private.create_catalog_product(p_product_id text,p_slug text,p_name jsonb,p_eyebrow jsonb,p_description jsonb,p_ingredients jsonb,p_price_satang integer,p_category text,p_tone text,p_featured boolean,p_variant_id text,p_variant_label jsonb,p_stock integer) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_store_admin() then raise exception 'Administrator access required'; end if;
 insert into public.products(id,slug,name,eyebrow,description,ingredients,price_satang,category,tone,featured,active,sort_order) values(p_product_id,p_slug,p_name,p_eyebrow,p_description,p_ingredients,p_price_satang,p_category,p_tone,coalesce(p_featured,false),true,coalesce((select max(sort_order)+1 from public.products),0));
 insert into public.product_variants(product_id,id,label,stock,sort_order) values(p_product_id,p_variant_id,p_variant_label,p_stock,0);
end; $$;
grant execute on function private.create_catalog_product(text,text,jsonb,jsonb,jsonb,jsonb,integer,text,text,boolean,text,jsonb,integer) to authenticated;
create or replace function public.create_catalog_product(p_product_id text,p_slug text,p_name jsonb,p_eyebrow jsonb,p_description jsonb,p_ingredients jsonb,p_price_satang integer,p_category text,p_tone text,p_featured boolean,p_variant_id text,p_variant_label jsonb,p_stock integer) returns void language sql security invoker set search_path='' as $$ select private.create_catalog_product($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13); $$;
grant execute on function public.create_catalog_product(text,text,jsonb,jsonb,jsonb,jsonb,integer,text,text,boolean,text,jsonb,integer) to authenticated;
create or replace function private.delete_catalog_product(p_product_id text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_store_admin() then raise exception 'Administrator access required'; end if;
 if exists(select 1 from public.order_items where product_id=p_product_id) then raise exception 'Product has orders and cannot be deleted; archive it instead'; end if;
 delete from public.products where id=p_product_id;
end; $$;
grant execute on function private.delete_catalog_product(text) to authenticated;
create or replace function public.delete_catalog_product(p_product_id text) returns void language sql security invoker set search_path='' as $$ select private.delete_catalog_product($1); $$;
grant execute on function public.delete_catalog_product(text) to authenticated;
