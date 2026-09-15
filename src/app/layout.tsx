import type { Metadata } from "next"; import "./globals.css"; import { StoreProvider } from "@/components/store-provider"; import { Header } from "@/components/header"; import { CartDrawer } from "@/components/cart-drawer"; import { Footer } from "@/components/footer";
import { connection } from "next/server";
import { getCatalog } from "@/lib/supabase/catalog";
import { createServerSupabase } from "@/lib/supabase/server";
export const metadata:Metadata={title:{default:"Sunshine Whitening",template:"%s · Sunshine Whitening"},description:"สบู่ทำมือสำหรับทุกวัน — a local ecommerce demo."};
export default async function RootLayout({children}:{children:React.ReactNode}){
 const connected=process.env.SUPABASE_CATALOG_ENABLED==="true";
 if(connected)await connection();
 const initialProducts=connected?await getCatalog().catch(()=>undefined):undefined;
 const supabase=await createServerSupabase();
 const {data:{user}}=await supabase.auth.getUser();
 const admin = user ? await supabase.rpc("is_store_admin") : null;
 const isAdmin = !!user && !admin?.error && admin?.data === true;
 return <html lang="th"><body><StoreProvider initialProducts={initialProducts} signedIn={!!user}><Header isAdmin={isAdmin}/><main id="main-content">{children}</main><Footer isAdmin={isAdmin}/><CartDrawer/></StoreProvider></body></html>
}
