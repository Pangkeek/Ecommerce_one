"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { credentialsSchema, addressSchema } from "@/lib/validation";

export async function authenticate(mode:"login"|"register", input:unknown) {
  const parsed=credentialsSchema.safeParse(input);
  if(!parsed.success)return {error:"Check your email and password (at least 8 characters)."};
  const {email,password,fullName}=parsed.data;
  const supabase=await createServerSupabase();
  if(mode==="register") {
    const {data,error}=await supabase.auth.signUp({email,password,options:{
      data:{full_name:fullName ?? ""},
      emailRedirectTo:`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    }});
    if(error)return {error:"Sign-up could not be completed. Check your details or try again later."};
    revalidatePath("/","layout");
    return {message:data.session?"Account created.":"Check your email to confirm your account, then sign in."};
  }
  const {error}=await supabase.auth.signInWithPassword({email,password});
  if(error)return {error:"Sign-in failed. Check your credentials and confirm your email."};
  revalidatePath("/","layout");return {message:"Signed in."};
}
export async function signOut() {
  const supabase=await createServerSupabase();
  const {error}=await supabase.auth.signOut();
  if(error)return {error:"Could not sign out. Try again."};
  revalidatePath("/","layout");return {message:"Signed out."};
}
export async function requestPasswordReset(email:unknown) {
  const parsed=z.string().trim().email().safeParse(email);
  if(!parsed.success)return {error:"Enter a valid email address."};
  const supabase=await createServerSupabase();
  const {error}=await supabase.auth.resetPasswordForEmail(parsed.data,{redirectTo:`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`});
  if(error)return {error:"Could not send the reset email. Please try again later."};
  return {message:"If an account exists, a reset link has been sent. Follow it, then choose a new password on your account page."};
}
export async function updatePassword(password:unknown) {
  const parsed=z.string().min(8).max(128).safeParse(password);
  if(!parsed.success)return {error:"Use a password with at least 8 characters."};
  const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {error:"Sign in or follow your recovery link first."};
  const {error}=await supabase.auth.updateUser({password:parsed.data});
  return error?{error:"Password update failed. You may need a fresh recovery link."}:{message:"Password updated."};
}
export async function saveAddress(input:unknown) {
  const parsed=addressSchema.safeParse(input);if(!parsed.success)return {error:"Check your delivery details."};
  const supabase=await createServerSupabase();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return {error:"Sign in first."};
  const {error}=await supabase.from("profiles").upsert({id:user.id,full_name:parsed.data.fullName,address:parsed.data,updated_at:new Date().toISOString()});
  if(error)return {error:"Could not save your address."};
  revalidatePath("/account");return {message:"Address saved."};
}
