import test from "node:test";
import assert from "node:assert/strict";
import { getCatalog } from "../src/lib/supabase/catalog.ts";
import { products } from "../src/lib/data.ts";

test("catalog preserves Thai/English fields, cart IDs, variant order and baht prices", async t => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://catalog-test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  t.after(() => {
    if(previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if(previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  });
  const rows = products.map(({price, variants, ...p}) => ({...p, featured:!!p.featured,
    price_satang:price * 100, product_variants:variants.map((v,i)=>({...v,sort_order:i})).reverse()}));
  t.mock.method(globalThis,"fetch", async input => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("active"),"eq.true");
    return Response.json(rows);
  });
  assert.deepEqual(await getCatalog(),products.map(p=>({...p,featured:!!p.featured})));
  rows[0].product_variants[0].stock = -1;
  await assert.rejects(getCatalog(), /Too small/);
});
