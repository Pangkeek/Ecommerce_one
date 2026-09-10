import { createServerSupabase } from "@/lib/supabase/server";
import { AccountPanel } from "@/components/account-panel";
import type { StoreOrder } from "@/lib/order-types";

export default async function Account({searchParams}:{searchParams:Promise<{auth_error?:string}>}) {
 const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
 const query=await searchParams;
 if(!user)return <AccountPanel user={null} isAdmin={false} orders={[]} address={{}} loadError={false} authError={!!query.auth_error}/>;
 const [profile,orders,admin]=await Promise.all([
  supabase.from("profiles").select("full_name,address").eq("id",user.id).maybeSingle(),
  supabase.from("orders").select("id,email,status,total_satang,created_at,shipping_address,order_items(product_id,variant_id,name,label,quantity,unit_price_satang)").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50),
  supabase.rpc("is_store_admin"),
 ]);
 return <AccountPanel user={{email:user.email||"",name:profile.data?.full_name||user.user_metadata?.full_name||""}} isAdmin={admin.data===true}
 orders={(orders.data||[]) as StoreOrder[]} address={profile.data?.address||{}} loadError={!!profile.error||!!orders.error} authError={!!query.auth_error}/>;
}
