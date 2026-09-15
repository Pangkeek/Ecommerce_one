"use client";

import Link from "next/link";
import { ArrowUpRight, Sun } from "lucide-react";
import { useStore } from "./store-provider";

export function Footer({ isAdmin = false }: { isAdmin?: boolean }) {
  const { locale } = useStore();
  const th = locale === "th";
  return <footer className="site-footer">
    <div className="footer-top"><p>{th ? <>การดูแลตัวเอง<br/>ที่รู้สึกเป็นคุณ</> : <>Feel-good care.<br/>For your everyday.</>}</p><nav aria-label="Footer"><Link href="/shop">{th ? "เลือกซื้อ" : "Shop all"}<ArrowUpRight/></Link><Link href="/account">{th ? "บัญชีของคุณ" : "Your account"}<ArrowUpRight/></Link>{isAdmin && <Link href="/admin">{th ? "จัดการร้าน" : "Store admin"}<ArrowUpRight/></Link>}</nav><details className="shipping-info"><summary>{th ? "ข้อมูลการจัดส่ง" : "Delivery information"}</summary><p>{th ? "จัดส่งในประเทศไทย ฿60 ฟรีเมื่อสั่งซื้อครบ ฿1,000" : "Thailand delivery is ฿60, free on orders of ฿1,000 or more."}</p></details></div>
    <Link className="footer-wordmark" href="/" aria-label="Sunshine Whitening home">sunshine<Sun/></Link>
    <div className="footer-bottom"><span>© 2026 SUNSHINE WHITENING</span><span>{th ? "ร้านค้าตัวอย่าง · ใช้งานในเครื่อง" : "LOCAL DEMO STOREFRONT"}</span><a href="#main-content">{th ? "กลับด้านบน" : "Back to top"}<ArrowUpRight/></a></div>
  </footer>;
}
