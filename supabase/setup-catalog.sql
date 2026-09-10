-- Initial catalog setup for a NEW project (not an incremental migration).
-- Run once in Supabase SQL Editor. This transaction fails safely if tables already exist.
-- Catalog prices are integer satang: 32000 = THB 320.00.
begin;
create table public.products (
  id text primary key,
  slug text not null unique,
  name jsonb not null,
  eyebrow jsonb not null,
  description jsonb not null,
  ingredients jsonb not null,
  price_satang integer not null check (price_satang >= 0),
  category text not null check (category in ('brightening','gentle','botanical')),
  tone text not null,
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint name_translations check (jsonb_typeof(name->'th') = 'string' and jsonb_typeof(name->'en') = 'string' and name ?& array['th','en']),
  constraint eyebrow_translations check (jsonb_typeof(eyebrow->'th') = 'string' and jsonb_typeof(eyebrow->'en') = 'string' and eyebrow ?& array['th','en']),
  constraint description_translations check (jsonb_typeof(description->'th') = 'string' and jsonb_typeof(description->'en') = 'string' and description ?& array['th','en']),
  constraint ingredients_translations check (jsonb_typeof(ingredients->'th') = 'string' and jsonb_typeof(ingredients->'en') = 'string' and ingredients ?& array['th','en'])
);
create table public.product_variants (
  product_id text not null references public.products(id) on delete cascade,
  id text not null,
  label jsonb not null,
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  primary key (product_id, id),
  constraint label_translations check (jsonb_typeof(label->'th') = 'string' and jsonb_typeof(label->'en') = 'string' and label ?& array['th','en'])
);
-- The composite primary key also indexes the product_id foreign key.
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
revoke all on public.products, public.product_variants from public, anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.products, public.product_variants to anon, authenticated;
create policy "Read active catalog" on public.products for select to anon, authenticated using (active);
create policy "Read active variants" on public.product_variants for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_variants.product_id and p.active));
-- No browser writes. Manage catalog in the dashboard until admin authorization is implemented.
insert into public.products (id,slug,name,eyebrow,description,ingredients,price_satang,category,tone,featured,sort_order) values
('rose-clay','rose-clay','{"th":"สบู่โรสเคลย์","en":"Rose Clay Bar"}','{"th":"ผิวดูสดใส","en":"Illuminating"}','{"th":"สบู่เนื้อเนียน กลิ่นกุหลาบอ่อน ๆ สำหรับพิธีดูแลผิวในทุกวัน","en":"A silky rose-scented bar for an unhurried everyday ritual."}','{"th":"น้ำมันมะพร้าว, เชียบัตเตอร์, โรสเคลย์","en":"Coconut oil, shea butter, rose clay"}',32000,'brightening','rose',true,0),
('rice-milk','rice-milk','{"th":"สบู่น้ำนมข้าว","en":"Rice Milk Bar"}','{"th":"อ่อนโยน","en":"Gentle"}','{"th":"ฟองครีมนุ่มละมุน พร้อมกลิ่นสะอาดบางเบา","en":"A soft, creamy lather with a barely-there clean scent."}','{"th":"น้ำมันรำข้าว, น้ำนมข้าว, กลีเซอรีน","en":"Rice bran oil, rice milk, glycerin"}',29000,'gentle','ivory',true,1),
('hibiscus','hibiscus','{"th":"สบู่ชบา","en":"Hibiscus Bloom"}','{"th":"พฤกษา","en":"Botanical"}','{"th":"กลิ่นดอกไม้ใสสะอาดกับผงชบาบดละเอียด","en":"A clear floral note with finely milled hibiscus."}','{"th":"น้ำมันมะกอก, ผงชบา, วิตามินอี","en":"Olive oil, hibiscus powder, vitamin E"}',34000,'botanical','berry',false,2),
('coconut-silk','coconut-silk','{"th":"สบู่โคโคนัทซิลค์","en":"Coconut Silk"}','{"th":"ครีมมี่","en":"Creamy"}','{"th":"ฟองแน่นนุ่มและกลิ่นมะพร้าวอ่อน ๆ","en":"Dense, cushiony foam with a delicate coconut note."}','{"th":"น้ำมันมะพร้าว, เชียบัตเตอร์, ดินขาว","en":"Coconut oil, shea butter, white clay"}',28000,'gentle','sand',false,3),
('pink-salt','pink-salt','{"th":"สบู่พิงก์ซอลต์","en":"Pink Salt Bar"}','{"th":"ผลัดผิวอย่างนุ่มนวล","en":"Soft polish"}','{"th":"เกลือชมพูเม็ดละเอียดในสบู่สีบลัช","en":"Fine pink salt suspended in a warm blush bar."}','{"th":"เกลือชมพู, น้ำมันอัลมอนด์, กลีเซอรีน","en":"Pink salt, almond oil, glycerin"}',31000,'brightening','blush',false,4),
('lotus-dew','lotus-dew','{"th":"สบู่โลตัสดิว","en":"Lotus Dew"}','{"th":"กลิ่นดอกไม้","en":"Floral"}','{"th":"กลิ่นดอกบัวโปร่งเบา สำหรับช่วงเวลาเงียบสงบ","en":"An airy lotus note made for quieter moments."}','{"th":"น้ำมันมะกอก, สารสกัดดอกบัว, วิตามินอี","en":"Olive oil, lotus extract, vitamin E"}',36000,'botanical','pearl',false,5);
insert into public.product_variants (product_id,id,label,stock,sort_order) values
('rose-clay','90g','{"th":"90 กรัม","en":"90 g"}',12,0),
('rose-clay','trio','{"th":"เซ็ต 3 ก้อน","en":"Set of 3"}',6,1),
('rice-milk','90g','{"th":"90 กรัม","en":"90 g"}',18,0),
('hibiscus','90g','{"th":"90 กรัม","en":"90 g"}',9,0),
('coconut-silk','90g','{"th":"90 กรัม","en":"90 g"}',20,0),
('pink-salt','90g','{"th":"90 กรัม","en":"90 g"}',7,0),
('lotus-dew','90g','{"th":"90 กรัม","en":"90 g"}',11,0);
commit;
