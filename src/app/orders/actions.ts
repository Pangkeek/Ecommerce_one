"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validation";
import { checkoutConfig, checkoutOrderSchema, createCheckoutSession, expireCheckoutSession, retrieveCheckoutSession } from "@/lib/stripe-checkout";

type CheckoutResult = { error?:string; orderId?:string; checkoutUrl?:string };

async function checkoutForOrder(supabase:Awaited<ReturnType<typeof createServerSupabase>>,userId:string,orderId:string):Promise<CheckoutResult> {
  const {data,error}=await supabase.from("orders")
    .select("id,user_id,email,status,created_at,subtotal_satang,shipping_satang,total_satang,stripe_session_id,order_items(product_id,variant_id,name,label,quantity,unit_price_satang)")
    .eq("id",orderId).eq("user_id",userId).single();
  const parsed=checkoutOrderSchema.safeParse(data);
  if(error||!parsed.success)return {orderId,error:"This order is unavailable for payment. Check your account."};
  try {
    const session=await createCheckoutSession(parsed.data);
    const {error:attachError}=await supabase.rpc("attach_stripe_checkout",{
      p_order_id:orderId,p_session_id:session.sessionId,p_expires_at:session.expiresAt,p_livemode:false,
    });
    if(attachError){
      try { await expireCheckoutSession(session.sessionId); } catch { /* Never expose an unattached payable session. */ }
      throw attachError;
    }
    return {orderId,checkoutUrl:session.checkoutUrl};
  }
  catch { return {orderId,error:"Could not open Stripe. Your order is saved. Retry payment from your account. Completed or expired checkouts cannot be reopened."}; }
}

export async function placeOrder(input:unknown):Promise<CheckoutResult> {
  const parsed=orderSchema.safeParse(input);if(!parsed.success)return {error:"Check your cart and delivery details."};
  const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {error:"Please sign in before placing your order."};
  try { checkoutConfig(); } catch { return {error:"Checkout is not available yet. Please try again later."}; }
  const {data,error}=await supabase.rpc("place_order",{p_request_id:parsed.data.requestId,p_lines:parsed.data.lines,p_address:parsed.data.address});
  if(error)return {error:"Order could not be placed. Confirm your email and check that the items are still in stock."};
  const result=await checkoutForOrder(supabase,user.id,String(data));
  revalidatePath("/","layout");return result;
}

export async function payOrder(id:unknown):Promise<CheckoutResult> {
  const parsed=z.uuid().safeParse(id);if(!parsed.success)return {error:"Invalid order."};
  const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {error:"Please sign in before paying."};
  return checkoutForOrder(supabase,user.id,parsed.data);
}
export async function cancelOrder(id:unknown) {
  const parsed=z.uuid().safeParse(id);if(!parsed.success)return {error:"Invalid order."};
  const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {error:"Sign in first."};
  const {data:row,error:readError}=await supabase.from("orders")
    .select("id,user_id,email,status,created_at,subtotal_satang,shipping_satang,total_satang,stripe_session_id,order_items(product_id,variant_id,name,label,quantity,unit_price_satang)")
    .eq("id",parsed.data).eq("user_id",user.id).single();
  if(readError)return {error:"Could not find this order."};
  if(row.status!=="pending")return {error:"Only unpaid orders can be cancelled."};
  const order=checkoutOrderSchema.safeParse(row);
  if(!order.success)return {error:"This order cannot be cancelled safely."};
  if(order.data.stripe_session_id){
    try {
      const session=await retrieveCheckoutSession(order.data.stripe_session_id);
      if(session.client_reference_id!==order.data.id||session.metadata.order_id!==order.data.id||session.metadata.user_id!==user.id||session.amount_total!==order.data.total_satang||session.currency!=="thb")
        return {error:"This payment session does not match the order."};
      if(session.status==="complete"||session.payment_status==="paid")return {error:"This order has already been paid and cannot be cancelled here."};
      if(session.status==="open")await expireCheckoutSession(session.id);
      revalidatePath("/","layout");
      return {message:"Cancellation requested. Stripe will release the reserved stock shortly."};
    } catch { return {error:"Could not cancel the Stripe checkout. Please try again."}; }
  }
  const {error}=await supabase.rpc("cancel_order",{p_order_id:parsed.data});
  if(error)return {error:"Could not cancel this order."};
  revalidatePath("/","layout");return {message:"Order cancelled and stock restored."};
}
