import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Product } from "@/lib/types";

const localized = z.object({ th: z.string(), en: z.string() });
const row = z.object({
  id: z.string(), slug: z.string(), name: localized, eyebrow: localized,
  description: localized, ingredients: localized,
  price_satang: z.number().int().nonnegative(),
  category: z.enum(["brightening", "gentle", "botanical"]),
  tone: z.string(), featured: z.boolean(), image_url:z.string().nullable().optional(),
  product_variants: z.array(z.object({
    id: z.string(), label: localized, stock: z.number().int().nonnegative(),
    sort_order: z.number().int(), price_satang:z.number().int().nonnegative().nullable().optional(),
  })).min(1),
});

// Public catalog only. No privileged key or authentication session is needed.
export async function getCatalog(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase URL or publishable key.");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(10000) }) },
  });
  const { data, error } = await supabase.from("products")
    .select("id,slug,name,eyebrow,description,ingredients,price_satang,category,tone,featured,image_url,product_variants(id,label,stock,sort_order,price_satang)")
    .eq("active", true).order("sort_order");
  if (error) throw new Error(`Catalog query failed (${error.code || "network"}).`);
  return z.array(row).parse(data).map(({ price_satang, product_variants, image_url, ...product }) => ({
    ...product, price: price_satang / 100, ...(image_url?{imageUrl:image_url}:{}),
    variants: product_variants.sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id, label, stock, price_satang }) => ({ id, label, stock, ...(price_satang!=null?{price:price_satang/100}:{}) })),
  }));
}
