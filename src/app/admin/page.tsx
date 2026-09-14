import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/supabase/catalog";
import { AdminPanel } from "@/components/admin-panel";
import type { StoreOrder } from "@/lib/order-types";
export default async function Admin(){
 const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return <section className="account-page"><h1>Store administration</h1><p>Sign in with your administrator account.</p><Link className="pill-link" href="/account">Sign in</Link></section>;
 const {data:admin,error:adminError}=await supabase.rpc("is_store_admin");
 if(adminError || admin!==true)return <section className="account-page"><h1>Administrator access required</h1><p>Signed in as <strong>{user.email ?? "an unrecognised account"}</strong>.</p><p>Verify the account and sign in with the allowlisted administrator email <strong>supawatkhaithong@gmail.com</strong> to manage products, stock, images, and orders.</p><Link className="pill-link" href="/account">Open account</Link></section>;
 let products;
 try { products=await getCatalog(); } catch { return <section className="account-page"><h1>Store data is temporarily unavailable</h1><p>Supabase could not be reached, so the management dashboard is paused. Check your connection and refresh.</p><Link className="pill-link" href="/admin">Try again</Link></section>; }
 const {data:orders,error}=await supabase.from("orders").select("id,email,status,total_satang,created_at,shipping_address,stripe_session_id,order_items(product_id,variant_id,name,label,quantity,unit_price_satang)").order("created_at",{ascending:false}).limit(100);
 if(error)throw new Error("Could not load store orders.");
 return <AdminPanel products={products} orders={(orders||[]) as StoreOrder[]}/>;
}
