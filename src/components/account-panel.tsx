"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "./store-provider";
import { Button,Input } from "./ui";
import { authenticate,signOut,requestPasswordReset,updatePassword,saveAddress } from "@/app/account/actions";
import { addressSchema,credentialsSchema,type Address } from "@/lib/validation";
import { OrderList } from "./order-list";
import type { StoreOrder } from "@/lib/order-types";

type Props={user:{email:string;name:string}|null;isAdmin:boolean;orders:StoreOrder[];address:Partial<Address>;loadError:boolean;authError:boolean};
export function AccountPanel({user,isAdmin,orders,address,loadError,authError}:Props) {
 const {locale}=useStore();const th=locale==="th";const router=useRouter();
 const [mode,setMode]=useState<"login"|"register">("login");const [notice,setNotice]=useState(authError?"The confirmation link is invalid or expired. Try signing in or request a new link.":"");
 const [pending,start]=useTransition();
 const form=useForm<z.infer<typeof credentialsSchema>>({resolver:zodResolver(credentialsSchema),defaultValues:{email:"",password:"",fullName:""}});
 const addressForm=useForm<Address>({resolver:zodResolver(addressSchema),values:{fullName:address.fullName || user?.name || "",phone:address.phone||"",address:address.address||"",province:address.province||"",postcode:address.postcode||""}});
 const run=(action:()=>Promise<{error?:string;message?:string}>)=>start(async()=>{try{const result=await action();setNotice(result.error || result.message || "");router.refresh()}catch{setNotice("Connection failed. Please try again.")}});
 if(!user)return <section className="auth-page"><div className="auth-art"><span>S</span><p>small rituals,<br/>beautiful days.</p></div><form onSubmit={form.handleSubmit(data=>run(()=>authenticate(mode,data)))}>
  <span className="kicker">Sunshine account</span><h1>{mode==="login"?(th?"ยินดีต้อนรับกลับ":"Welcome back"):(th?"สร้างบัญชี":"Create an account")}</h1>
  {mode==="register"&&<label>{th?"ชื่อของคุณ":"Your name"}<Input autoComplete="name" {...form.register("fullName")}/></label>}
  <label>Email<Input type="email" autoComplete="email" {...form.register("email")}/></label>
  <label>{th?"รหัสผ่าน":"Password"}<Input type="password" autoComplete={mode==="login"?"current-password":"new-password"} {...form.register("password")}/></label>
  {Object.values(form.formState.errors).map((e,i)=><small role="alert" key={i}>{e.message}</small>)}
  <p role="status">{notice}</p><Button disabled={pending}>{pending?(th?"กำลังดำเนินการ…":"Please wait…"):mode==="login"?(th?"เข้าสู่ระบบ":"Sign in"):(th?"สมัครสมาชิก":"Create account")}</Button>
  <button type="button" className="text-link" disabled={pending} onClick={()=>{setMode(mode==="login"?"register":"login");setNotice("")}}>{mode==="login"?(th?"สมัครสมาชิกใหม่":"Create an account"):(th?"มีบัญชีแล้ว? เข้าสู่ระบบ":"Already registered? Sign in")}</button>
  <button type="button" className="text-link" disabled={pending} onClick={()=>run(()=>requestPasswordReset(form.getValues("email")))}>{th?"ลืมรหัสผ่าน":"Forgot password"}</button>
 </form></section>;
 return <section className="account-page"><div className="account-title"><div><span className="kicker">{user.email}</span><h1>{th?"สวัสดี":"Hello"}, {user.name||"Sunshine"}</h1></div>{isAdmin&&<Link href="/admin" className="text-arrow">{th?"จัดการร้าน":"Store admin"}</Link>}<Button variant="outline" disabled={pending} onClick={()=>run(signOut)}>{th?"ออกจากระบบ":"Sign out"}</Button></div>
 <p role="status">{notice}</p>{loadError&&<p role="alert">Could not load your account data. Please refresh.</p>}
 <h2>{th?"คำสั่งซื้อของคุณ":"Your orders"}</h2><OrderList orders={orders}/>
 <div className="account-grid"><article><h2>{th?"ที่อยู่จัดส่ง":"Delivery address"}</h2><form className="account-form" onSubmit={addressForm.handleSubmit(data=>run(()=>saveAddress(data)))}>
 {([['fullName',th?'ชื่อ-นามสกุล':'Full name'],['phone',th?'เบอร์โทรศัพท์':'Phone'],['address',th?'ที่อยู่':'Address'],['province',th?'จังหวัด':'Province'],['postcode',th?'รหัสไปรษณีย์':'Postcode']] as const).map(([key,label])=><label key={key}>{label}<Input {...addressForm.register(key)}/>{addressForm.formState.errors[key]&&<small role="alert">{addressForm.formState.errors[key]?.message}</small>}</label>)}
 <Button disabled={pending}>{th?"บันทึกที่อยู่":"Save address"}</Button></form></article>
 <article><h2>{th?"เปลี่ยนรหัสผ่าน":"Change password"}</h2><form className="account-form" onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);run(()=>updatePassword(fd.get("password")))}}><label>{th?"รหัสผ่านใหม่":"New password"}<Input name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password"/></label><Button disabled={pending}>{th?"เปลี่ยนรหัสผ่าน":"Update password"}</Button></form></article></div></section>;
}
