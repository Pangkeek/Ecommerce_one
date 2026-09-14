"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, MapPin, Package, Sun } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "./store-provider";
import { Button, Input } from "./ui";
import { authenticate, signOut, requestPasswordReset, updatePassword, saveAddress } from "@/app/account/actions";
import { addressSchema, credentialsSchema, type Address } from "@/lib/validation";
import { OrderList } from "./order-list";
import type { StoreOrder } from "@/lib/order-types";
import styles from "./account-panel.module.css";

type Props = { user: { email: string; name: string } | null; isAdmin: boolean; orders: StoreOrder[]; address: Partial<Address>; loadError: boolean; authError: boolean };
const accountSections = ["orders", "delivery", "security"] as const;
type AccountSection = typeof accountSections[number];

export function AccountPanel({ user, isAdmin, orders, address, loadError, authError }: Props) {
  const { locale } = useStore();
  const th = locale === "th";
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [activeSection, setActiveSection] = useState<AccountSection>("orders");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const form = useForm<z.infer<typeof credentialsSchema>>({ resolver: zodResolver(credentialsSchema), defaultValues: { email: "", password: "", fullName: "" } });
  const addressForm = useForm<Address>({ resolver: zodResolver(addressSchema), values: { fullName: address.fullName || user?.name || "", phone: address.phone || "", address: address.address || "", province: address.province || "", postcode: address.postcode || "" } });
  const run = (action: () => Promise<{ error?: string; message?: string }>) => start(async () => {
    setNotice("");
    try {
      const result = await action();
      setFailed(!!result.error);
      setNotice(result.error || result.message || "");
      router.refresh();
    } catch {
      setFailed(true);
      setNotice(th ? "เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง" : "Connection failed. Please try again.");
    }
  });
  const switchMode = (next: "login" | "register") => { setMode(next); setNotice(""); setShowPassword(false); form.clearErrors(); };
  const selectSection = (section: AccountSection) => {
    setActiveSection(section);
    setNotice("");
  };
  const navigateSections = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (pending) return;
    const current = accountSections.indexOf(activeSection);
    let next: number;
    switch (event.key) {
      case "ArrowRight": case "ArrowDown": next = (current + 1) % accountSections.length; break;
      case "ArrowLeft": case "ArrowUp": next = (current + accountSections.length - 1) % accountSections.length; break;
      case "Home": next = 0; break;
      case "End": next = accountSections.length - 1; break;
      default: return;
    }
    event.preventDefault();
    selectSection(accountSections[next]);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };
  const feedback = <>
    {authError && <p className={styles.notice} role="alert">{th ? "ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบหรือขอลิงก์ใหม่" : "The confirmation link is invalid or expired. Sign in or request a new link."}</p>}
    {notice && <p className={styles.notice} role={failed ? "alert" : "status"}>{notice}</p>}
  </>;

  if (!user) return <section className={styles.auth} aria-labelledby="account-heading">
    <div className={styles.story}>
      <div className={styles.storyCopy}>
        <Sun aria-hidden="true" />
        <h2>{th ? "พื้นที่เล็ก ๆ\nสำหรับคุณ" : "A little space,\njust for you."}</h2>
        <p>{th ? "เก็บรายละเอียดไว้ที่นี่ แล้วกลับไปใช้เวลากับสิ่งที่คุณรัก" : "Keep the details here. Make more time for the little things you love."}</p>
      </div>
      <div className={styles.storyPhoto}><Image src="/hero-soap.png" alt={th ? "สบู่สีชมพูและสีครีมบนแท่นหิน" : "Pink and cream soaps on a stone pedestal"} fill sizes="(max-width: 760px) 90vw, 45vw" /></div>
      <div className={styles.storyFoot}><span>Sunshine Whitening</span><span>{th ? "ดูแลตัวเองในทุกวัน" : "A little care, every day"}</span></div>
    </div>
    <div className={styles.authContent}>
      <Link href="/shop" className={styles.back}><ArrowLeft aria-hidden="true" />{th ? "กลับไปเลือกซื้อ" : "Back to the shop"}</Link>
      <div className={styles.authInner}>
        <div className={styles.modeSwitch} role="group" aria-label={th ? "เลือกเข้าสู่ระบบหรือสมัครสมาชิก" : "Sign in or create account"}>
          <button type="button" aria-pressed={mode === "login"} disabled={pending} onClick={() => switchMode("login")}>{th ? "เข้าสู่ระบบ" : "Sign in"}</button>
          <button type="button" aria-pressed={mode === "register"} disabled={pending} onClick={() => switchMode("register")}>{th ? "สมัครสมาชิก" : "Create account"}</button>
        </div>
        <h1 id="account-heading">{mode === "login" ? (th ? "ยินดีต้อนรับกลับ" : "Welcome back.") : (th ? "เริ่มต้นวันดี ๆ ด้วยกัน" : "Make yourself at home.")}</h1>
        <p className={styles.intro}>{th ? "ดูคำสั่งซื้อและจัดการที่อยู่จัดส่งของคุณได้ในที่เดียว" : "Your orders and delivery details, all in one place."}</p>
        <form className={styles.form} noValidate aria-busy={pending} onSubmit={form.handleSubmit(data => run(() => authenticate(mode, data)))}>
          {mode === "register" && <label htmlFor="account-name">{th ? "ชื่อของคุณ" : "Your name"}<Input id="account-name" autoComplete="name" maxLength={100} aria-invalid={!!form.formState.errors.fullName} {...form.register("fullName")} /></label>}
          <label htmlFor="account-email">{th ? "อีเมล" : "Email address"}<Input id="account-email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} aria-invalid={!!form.formState.errors.email} aria-describedby={form.formState.errors.email ? "email-error" : undefined} {...form.register("email")} />
            {form.formState.errors.email && <small id="email-error" role="alert">{th ? "กรุณากรอกอีเมลที่ถูกต้อง" : "Enter a valid email address."}</small>}
          </label>
          <div>
            <div className={styles.passwordLabel}><label htmlFor="account-password">{th ? "รหัสผ่าน" : "Password"}</label>{mode === "login" && <button className={styles.inlineLink} type="button" disabled={pending} onClick={() => run(() => requestPasswordReset(form.getValues("email")))}>{th ? "ลืมรหัสผ่าน?" : "Forgot password?"}</button>}</div>
            <div className={styles.passwordInput}><Input id="account-password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} maxLength={128} aria-invalid={!!form.formState.errors.password} aria-describedby="password-help" {...form.register("password")} /><button type="button" aria-label={showPassword ? (th ? "ซ่อนรหัสผ่าน" : "Hide password") : (th ? "แสดงรหัสผ่าน" : "Show password")} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button></div>
            <small id="password-help" className={form.formState.errors.password ? styles.fieldError : styles.hint} role={form.formState.errors.password ? "alert" : undefined}>{(mode === "register" || form.formState.errors.password) && (th ? "ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร" : "Use at least 8 characters.")}</small>
          </div>
          {feedback}
          <Button className={styles.submit} disabled={pending}>{pending ? (th ? "กำลังดำเนินการ…" : "Please wait…") : mode === "login" ? (th ? "เข้าสู่ระบบ" : "Sign in") : (th ? "สร้างบัญชี" : "Create account")}<ArrowRight aria-hidden="true" /></Button>
        </form>
        <p className={styles.authFoot}>{mode === "login" ? (th ? "เพิ่งรู้จักซันไชน์?" : "New to Sunshine?") : (th ? "มีบัญชีอยู่แล้ว?" : "Already part of Sunshine?")} <button className={styles.inlineLink} disabled={pending} onClick={() => switchMode(mode === "login" ? "register" : "login")}>{mode === "login" ? (th ? "สมัครสมาชิก" : "Create an account") : (th ? "เข้าสู่ระบบ" : "Sign in")}</button></p>
      </div>
    </div>
  </section>;

  return <section className={styles.account} aria-labelledby="account-heading">
    <header className={styles.accountHeader}><div><h1 id="account-heading">{th ? "สวัสดี" : "Hello"}, {user.name || "Sunshine"}.</h1><p>{th ? "ยินดีที่ได้พบกันอีกครั้ง จัดการรายละเอียดของคุณได้ที่นี่" : "Lovely to see you again. Make yourself at home."}</p></div><Link href="/shop" className={styles.back}>{th ? "เลือกซื้อต่อ" : "Continue shopping"}<ArrowRight aria-hidden="true" /></Link></header>
    <div className={styles.accountLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.identity}><Sun aria-hidden="true" /><div><strong>{th ? "บัญชีของคุณ" : "Your account"}</strong><p>{user.email}</p></div></div>
        <div className={styles.tabs} role="tablist" aria-label={th ? "เมนูบัญชี" : "Account sections"} style={{ "--account-tab": accountSections.indexOf(activeSection) } as CSSProperties}>
          <span className={styles.activeTab} aria-hidden="true" />
          {accountSections.map(section => {
            const Icon = section === "orders" ? Package : section === "delivery" ? MapPin : LockKeyhole;
            const label = section === "orders" ? (th ? "คำสั่งซื้อ" : "Your orders") : section === "delivery" ? (th ? "ที่อยู่จัดส่ง" : "Delivery address") : (th ? "รหัสผ่าน" : "Password");
            return <button key={section} id={`account-tab-${section}`} type="button" role="tab" aria-selected={activeSection === section} aria-controls={section} tabIndex={activeSection === section ? 0 : -1} disabled={pending} onClick={() => selectSection(section)} onKeyDown={navigateSections}><Icon aria-hidden="true" /><span>{label}</span></button>;
          })}
        </div>
        <div className={styles.sidebarActions}>{isAdmin && <Link href="/admin" className={styles.inlineLink}>{th ? "จัดการร้าน" : "Store admin"}</Link>}<button className={styles.inlineLink} disabled={pending} onClick={() => run(signOut)}>{th ? "ออกจากระบบ" : "Sign out"}</button></div>
      </aside>
      <div className={styles.accountMain}>
        {feedback}{loadError && <p className={styles.notice} role="alert">{th ? "โหลดข้อมูลบัญชีไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ" : "Could not load your account data. Please refresh."}</p>}
        <section id="orders" role="tabpanel" aria-labelledby="account-tab-orders" tabIndex={0} hidden={activeSection !== "orders"} className={styles.section}><div className={styles.sectionHeading}><h2>{th ? "คำสั่งซื้อของคุณ" : "Your orders"}</h2>{orders.length > 0 && <span>{orders.length}</span>}</div>
          {orders.length || loadError ? <OrderList orders={orders} /> : <div className={styles.emptyOrders}><div className={styles.emptyPhoto}><Image src="/product-soap.png" alt={th ? "สบู่โรสเคลย์และกลีบกุหลาบ" : "Rose clay soap with rose petals"} fill sizes="180px" /></div><div><h3>{th ? "เริ่มต้นด้วยก้อนที่ใช่" : "Your first little ritual."}</h3><p>{th ? "ยังไม่มีคำสั่งซื้อ เลือกสบู่ที่คุณชอบ แล้วกลับมาดูรายละเอียดได้ที่นี่" : "No orders yet. Find a soap you love, and your order details will appear here."}</p><Link className={styles.inlineLink} href="/shop">{th ? "พบกับคอลเลกชัน" : "Explore the collection"}<ArrowRight aria-hidden="true" /></Link></div></div>}
        </section>
        <section id="delivery" role="tabpanel" aria-labelledby="account-tab-delivery" tabIndex={0} hidden={activeSection !== "delivery"} className={styles.section}><h2>{th ? "ที่อยู่จัดส่ง" : "Delivery address"}</h2><p className={styles.sectionIntro}>{th ? "บันทึกที่อยู่สำหรับการสั่งซื้อครั้งต่อไป" : "Save your details for your next order."}</p><form className={`${styles.form} ${styles.addressForm}`} aria-busy={pending} onSubmit={addressForm.handleSubmit(data => run(() => saveAddress(data)))}>
          {([['fullName', th ? 'ชื่อ-นามสกุล' : 'Full name', 'name'], ['phone', th ? 'เบอร์โทรศัพท์' : 'Phone number', 'tel'], ['address', th ? 'ที่อยู่' : 'Street address', 'street-address'], ['province', th ? 'จังหวัด' : 'Province', 'address-level1'], ['postcode', th ? 'รหัสไปรษณีย์' : 'Postcode', 'postal-code']] as const).map(([key, label, autocomplete]) => <label key={key} className={key === 'address' ? styles.fullWidth : undefined} htmlFor={`delivery-${key}`}>{label}<Input id={`delivery-${key}`} type={key === 'phone' ? 'tel' : 'text'} inputMode={key === 'postcode' ? 'numeric' : undefined} autoComplete={autocomplete} aria-invalid={!!addressForm.formState.errors[key]} aria-describedby={addressForm.formState.errors[key] ? `delivery-${key}-error` : undefined} {...addressForm.register(key)} />{addressForm.formState.errors[key] && <small id={`delivery-${key}-error`} role="alert">{addressForm.formState.errors[key]?.message}</small>}</label>)}
          <div className={styles.fullWidth}><Button disabled={pending}>{pending ? (th ? "กำลังดำเนินการ…" : "Please wait…") : (th ? "บันทึกที่อยู่" : "Save address")}</Button></div>
        </form></section>
        <section id="security" role="tabpanel" aria-labelledby="account-tab-security" tabIndex={0} hidden={activeSection !== "security"} className={styles.section}><h2>{th ? "เปลี่ยนรหัสผ่าน" : "Change password"}</h2><p className={styles.sectionIntro}>{th ? "ใช้รหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร" : "Choose a new password with at least 8 characters."}</p><form className={`${styles.form} ${styles.securityForm}`} aria-busy={pending} onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); run(() => updatePassword(fd.get("password"))); }}><label htmlFor="new-password">{th ? "รหัสผ่านใหม่" : "New password"}<Input id="new-password" name="password" type="password" minLength={8} maxLength={128} required autoComplete="new-password" /></label><Button disabled={pending}>{pending ? (th ? "กำลังดำเนินการ…" : "Please wait…") : (th ? "เปลี่ยนรหัสผ่าน" : "Update password")}</Button></form></section>
      </div>
    </div>
  </section>;
}
