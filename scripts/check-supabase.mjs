import { getCatalog } from "../src/lib/supabase/catalog.ts";

try {
  const products = await getCatalog();
  console.log(`Supabase catalog: ${products.length} products, ${products.reduce((sum, p) => sum + p.variants.length, 0)} variants.`);
  if (!products.length) { console.error("No visible products. Apply the setup SQL and check active flags / RLS."); process.exitCode = 1; }
} catch (error) {
  // Never print environment values or full SDK error objects.
  console.error(error instanceof Error && error.message.startsWith("Catalog query failed")
    ? error.message : "Catalog check failed. Check configuration and the catalog setup SQL.");
  process.exitCode = 1;
}
