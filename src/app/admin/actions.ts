"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

const schema=z.object({productId:z.string().min(1).max(100),variantId:z.string().min(1).max(100),price:z.number().min(0).max(100000),stock:z.number().int().min(0).max(100000),imageUrl:z.string().optional()});
const createSchema=z.object({productId:z.string().regex(/^[a-z0-9-]{2,80}$/),slug:z.string().regex(/^[a-z0-9-]{2,80}$/),nameEn:z.string().min(2).max(100),nameTh:z.string().min(2).max(100),eyebrowEn:z.string().min(2).max(100),eyebrowTh:z.string().min(2).max(100),descriptionEn:z.string().min(5).max(500),descriptionTh:z.string().min(5).max(500),ingredientsEn:z.string().min(2).max(500),ingredientsTh:z.string().min(2).max(500),price:z.number().min(0).max(100000),category:z.enum(["brightening","gentle","botanical"]),tone:z.string().min(2).max(40),variantId:z.string().regex(/^[a-z0-9-]{1,40}$/),variantEn:z.string().min(1).max(80),variantTh:z.string().min(1).max(80),stock:z.number().int().min(0).max(100000)});
async function requireAdmin(){const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();if(!user)return {supabase,error:"Sign in first."} as const;const {data:admin}=await supabase.rpc("is_store_admin");if(!admin)return {supabase,error:"Administrator access required."} as const;return {supabase,error:null} as const}
export async function createProduct(input:unknown){const parsed=createSchema.safeParse(input);if(!parsed.success)return {error:"Complete all product fields correctly."};const {supabase,error}=await requireAdmin();if(error)return {error};const p=parsed.data;const {error:rpcError}=await supabase.rpc("create_catalog_product",{p_product_id:p.productId,p_slug:p.slug,p_name:{en:p.nameEn,th:p.nameTh},p_eyebrow:{en:p.eyebrowEn,th:p.eyebrowTh},p_description:{en:p.descriptionEn,th:p.descriptionTh},p_ingredients:{en:p.ingredientsEn,th:p.ingredientsTh},p_price_satang:Math.round(p.price*100),p_category:p.category,p_tone:p.tone,p_featured:false,p_variant_id:p.variantId,p_variant_label:{en:p.variantEn,th:p.variantTh},p_stock:p.stock});if(rpcError)return {error:rpcError.message.includes("duplicate")?"Product ID or slug already exists.":"Product could not be created."};revalidatePath("/","layout");return {message:"Product created."}}
export async function deleteProduct(productId:string){if(!/^[a-z0-9-]{2,80}$/.test(productId))return {error:"Invalid product."};const {supabase,error}=await requireAdmin();if(error)return {error};const {error:rpcError}=await supabase.rpc("delete_catalog_product",{p_product_id:productId});if(rpcError)return {error:rpcError.message.includes("orders")?"This product has orders and cannot be deleted.":"Product could not be deleted."};revalidatePath("/","layout");return {message:"Product deleted."}}
export async function saveProduct(input:unknown) {
 const parsed=schema.safeParse(input);if(!parsed.success)return {error:"Check the product price and stock."};
 const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return {error:"Sign in first."};
 const {data:admin}=await supabase.rpc("is_store_admin");if(!admin)return {error:"Administrator access required."};
 const imageUrl=parsed.data.imageUrl;
 if(imageUrl) {
  const prefix=process.env.NEXT_PUBLIC_SUPABASE_URL+"/storage/v1/object/public/product-images/";
  if(!imageUrl.startsWith(prefix))return {error:"Use an image from this store's storage bucket."};
 }
 const {error}=await supabase.rpc("update_catalog_item",{p_product_id:parsed.data.productId,p_variant_id:parsed.data.variantId,p_price:Math.round(parsed.data.price*100),p_stock:parsed.data.stock,p_image_url:imageUrl||null});
 if(error)return {error:"Product could not be saved. Refresh and try again."};
 revalidatePath("/","layout");return {message:"Product saved."};
}
