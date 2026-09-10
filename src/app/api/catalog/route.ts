import { getCatalog } from "@/lib/supabase/catalog";

export async function GET() {
  try {
    const products = await getCatalog();
    return Response.json({ source: "supabase", count: products.length, products }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Catalog unavailable. Check your Supabase configuration and apply the catalog setup SQL." }, { status: 503 });
  }
}
