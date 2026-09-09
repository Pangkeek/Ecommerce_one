"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, UserRound, X, Sun, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "./store-provider";

export function Header() {
  const { locale, setLocale, cartCount, setCartOpen } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const th = locale === "th";
  return <>
    <a className="skip-link" href="#main-content">{th ? "ข้ามไปเนื้อหา" : "Skip to content"}</a>
    <div className="announcement"><Sun size={14}/><span>{th ? "เติมความสุขให้ทุกวัน · จัดส่งฟรีเมื่อครบ ฿1,000" : "A little joy, delivered. Free shipping on orders ฿1,000+"}</span><ArrowUpRight size={14}/></div>
    <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
      <Link className="wordmark" href="/" aria-label="Sunshine Whitening home"><Sun/><span>sunshine<small>WHITENING</small></span></Link>
      <nav id="main-nav" className={open ? "nav nav-open" : "nav"}>
        <Link className={path === "/shop" ? "active" : ""} href="/shop" onClick={() => setOpen(false)}>{th ? "เลือกซื้อ" : "Shop all"}</Link>
        <Link href="/#story" onClick={() => setOpen(false)}>{th ? "เรื่องราวของเรา" : "Our world"}</Link>
        <Link href="/admin" onClick={() => setOpen(false)}>{th ? "จัดการร้าน" : "Studio admin"}</Link>
      </nav>
      <div className="header-actions">
        <button className="locale" onClick={() => setLocale(th ? "en" : "th")}>{th ? "EN" : "TH"}</button>
        <Link className="search-link" href="/shop" aria-label="Search"><Search/></Link>
        <Link className="account-link" href="/account" aria-label="Account"><UserRound/></Link>
        <button className="bag-button" aria-label={`Cart, ${cartCount} items`} onClick={() => setCartOpen(true)}><ShoppingBag/><span>{cartCount}</span></button>
        <button className="icon-btn mobile-only" aria-label="Menu" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
      </div>
    </header>
  </>;
}
