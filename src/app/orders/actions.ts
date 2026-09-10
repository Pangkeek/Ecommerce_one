"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { orderSchema } from "@/lib/validation";

export async function placeOrder(input:unknown) {
  const parsed=orderSchema.safeParse(input);if(!parsed.success)return {error:"Check your cart and delivery details."};
  const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {error:"Please sign in before placing your order."};
  const {data,error}=await supabase.rpc("place_order",{p_request_id:parsed.data.requestId,p_lines:parsed.data.lines,p_address:parsed.data.address});
  if(error)return {error:"Order could not be placed. Confirm your email and check that the items are still in stock."};
  revalidatePath("/","layout");return {orderId:String(data)};
}
export async function cancelOrder(id:unknown) {
  const parsed=z.uuid().safeParse(id);if(!parsed.success)return {error:"Invalid order."};
  const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {error:"Sign in first."};
  const {error}=await supabase.rpc("cancel_order",{p_order_id:parsed.data});
  if(error)return {error:"Could not cancel this order."};
  revalidatePath("/","layout");return {message:"Order cancelled and stock restored."};
}
