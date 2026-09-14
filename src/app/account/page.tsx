import { createServerSupabase } from "@/lib/supabase/server";
import { AccountPanel } from "@/components/account-panel";
import type { StoreOrder } from "@/lib/order-types";
import { retrieveCheckoutSession } from "@/lib/stripe-checkout";
import { CheckoutNotice,type CheckoutNoticeStatus } from "@/components/checkout-notice";

export default async function Account({searchParams}:{searchParams:Promise<{auth_error?:string;checkout?:string;session_id?:string}>}) {
 const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
 const query=await searchParams;
 if(!user)return <AccountPanel user={null} isAdmin={false} orders={[]} address={{}} loadError={false} authError={!!query.auth_error}/>;
 const [profile,orders,admin]=await Promise.all([
  supabase.from("profiles").select("full_name,address").eq("id",user.id).maybeSingle(),
  supabase.from("orders").select("id,email,status,total_satang,created_at,shipping_address,stripe_session_id,order_items(product_id,variant_id,name,label,quantity,unit_price_satang)").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50),
  supabase.rpc("is_store_admin"),
 ]);
 let checkoutStatus:CheckoutNoticeStatus|undefined;
 if(query.checkout==="cancelled")checkoutStatus="cancelled";
 if(query.checkout==="returned") {
  checkoutStatus="unverified";
  try {
   const session=await retrieveCheckoutSession(query.session_id||"");
   const order=orders.data?.find(order=>order.id===session.client_reference_id);
   if(order&&session.metadata.user_id===user.id&&session.metadata.order_id===order.id&&session.currency==="thb"&&
      session.amount_total===order.total_satang&&session.status==="complete"&&session.payment_status==="paid")checkoutStatus="paid";
  } catch { /* A redirect query string alone never proves payment. */ }
 }
 return <>{checkoutStatus&&<CheckoutNotice status={checkoutStatus}/>}<AccountPanel user={{email:user.email||"",name:profile.data?.full_name||user.user_metadata?.full_name||""}} isAdmin={admin.data===true}
 orders={(orders.data||[]) as StoreOrder[]} address={profile.data?.address||{}} loadError={!!profile.error||!!orders.error} authError={!!query.auth_error}/></>;
}
