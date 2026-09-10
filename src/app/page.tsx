"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, ArrowRight, Sun, Flower2, Sparkles } from "lucide-react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { ProductGrid } from "@/components/product-grid";
import { Reveal } from "@/components/reveal";
import { useSiteMotion } from "@/components/motion-preferences";
import { useStore } from "@/components/store-provider";

export default function Home() {
  const { locale, products } = useStore();
  const { enabled } = useSiteMotion();
  const th = locale === "th";
  const hero = useRef<HTMLElement>(null);
  const story = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const parallax = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const { scrollYProgress: storyProgress } = useScroll({ target: story, offset: ["start end", "end start"] });
  const storyY = useTransform(storyProgress, [0, 1], [40, -40]);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(pointerX, { stiffness: 110, damping: 25 });
  const rotateX = useSpring(pointerY, { stiffness: 110, damping: 25 });
  const sunX = useTransform(pointerX, [-7, 7], [-22, 22]);
  const sunY = useTransform(pointerY, [-7, 7], [14, -14]);
  const heroProduct = products[0];
  return <>
    <section className="campaign hero-stage" ref={hero}>
      <div className="hero-copy">
        <Reveal><div className="hero-index"><span>01</span><span>{th ? "สบู่ทำมือสำหรับทุกวัน" : "HANDMADE BODY CARE / THAILAND"}</span></div></Reveal>
        <Reveal delay={.1}><h1>{th ? <>ช่วงเวลาอ่อนโยน<br/>เริ่มต้นที่<span>คุณ</span></> : <>A softer way<br/>to start the day.</>}</h1></Reveal>
        <Reveal delay={.2}><p className="campaign-description">{th ? "สบู่ก้อนเล็ก กลิ่นละมุน และฟองนุ่ม ๆ ที่ทำให้การดูแลตัวเองเป็นช่วงเวลาที่รอคอย" : "Small-batch bars, quiet scents, and a soft lather for the part of your day that belongs only to you."}</p></Reveal>
        <Reveal delay={.3}><div className="hero-actions"><Link className="pill-link" href="/shop"><span>{th ? "เลือกก้อนที่ใช่" : "Find your everyday bar"}</span><span className="arrow-disc"><ArrowUpRight/></span></Link><span className="hero-caption">{th ? "ส่งฟรีเมื่อครบ ฿1,000" : "Free delivery over ฿1,000"}</span></div></Reveal>
        <Reveal delay={.35}><div className="campaign-foot"><div className="mini-stack"><Image src="/product-soap.png" alt="" width={52} height={52}/><Image src="/hero-soap.png" alt="" width={52} height={52}/><span aria-hidden="true"><Flower2/></span></div><span>{th ? `${products.length} สูตร · ทำทีละเล็กทีละน้อย` : `${products.length} formulas / made in small batches`}</span></div></Reveal>
      </div>
      <div className="campaign-art hero-art" onPointerMove={event => {
        if (!enabled || event.pointerType !== "mouse") return;
        const box = event.currentTarget.getBoundingClientRect();
        pointerX.set(((event.clientX - box.left) / box.width - .5) * 7);
        pointerY.set(((event.clientY - box.top) / box.height - .5) * -7);
      }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
        <div className="art-caption"><span>{th ? "ซันไชน์ / ดูแลผิว" : "SUNSHINE / BODY CARE"}</span><span>{th ? "ทำเพื่อช่วงเวลาของคุณ" : "MADE FOR YOUR EVERYDAY"}</span></div>
        <motion.div className="campaign-photo-shell" style={{ y: enabled ? parallax : 0, rotateX: enabled ? rotateX : 0, rotateY: enabled ? rotateY : 0 }}>
          <Reveal className="campaign-photo" variant="wipe"><Image src="/hero-soap.png" alt={th ? "สบู่สีชมพูและสีครีมบนแท่นหิน" : "Pink and cream soap bars in soft sunlight"} fill priority sizes="(max-width: 760px) 100vw, 55vw"/></Reveal>
        </motion.div>
        <motion.div className="sun-path" style={{ x: enabled ? sunX : 0, y: enabled ? sunY : 0 }} aria-hidden="true"><span/></motion.div>
        <Reveal className="floating-note" delay={.3} variant="drift"><Sun/><span>{th ? <>แสงเล็ก ๆ<br/>สำหรับผิว<br/><i>และใจ</i></> : <>A LITTLE<br/>SUNSHINE<br/><i>for your skin.</i></>}</span></Reveal>
        {heroProduct ? <Reveal className="floating-product" delay={.35} variant="drift"><Link href={`/product/${heroProduct.slug}`}><Image src={heroProduct.imageUrl || "/product-soap.png"} alt={heroProduct.name[locale]} width={150} height={150}/><div><small>{th ? "รู้จักกับ" : "MEET YOUR NEW RITUAL"}</small><strong>{heroProduct.name[locale]}</strong></div><ArrowUpRight/></Link></Reveal> : null}
        <div className="hero-stamp" aria-hidden="true"><Sparkles/><span>{th ? "เนื้อนุ่ม" : "SOFT SKIN"}</span><span>{th ? "กลิ่นละมุน" : "SLOW SCENT"}</span></div>
      </div>
      <a className="campaign-scroll" href="#collection"><ArrowDown/><span>{th ? "เลื่อนเพื่อค้นพบ" : "Scroll to feel good"}</span></a>
    </section>
    <section className="collection-section" id="collection">
      <div className="section-heading"><Reveal><h2>{th ? <>ก้อนเล็ก ๆ<br/><span>ความสุขเต็มมือ</span></> : <>Small bars.<br/><span>Big little moments.</span></>}</h2></Reveal><Reveal delay={.15} className="collection-aside"><p>{th ? "เลือกจากเนื้อสัมผัสและกลิ่นที่คุณชอบ แล้วทำให้ทุกวันเป็นวันของคุณ" : "Find the texture and scent you love. Make the everyday feel a little more like you."}</p><Link className="text-arrow" href="/shop">{th ? `ดูทั้ง ${products.length} สูตร` : `Explore all ${products.length} bars`}<ArrowUpRight/></Link></Reveal></div>
      <ProductGrid compact/>
    </section>
    <section className="brand-story" id="story" ref={story}>
      <div className="story-photo-wrap"><motion.div className="story-photo" style={{ y: enabled ? storyY : 0 }}><Image src="/product-soap.png" alt={th ? "สบู่โรสเคลย์และกลีบกุหลาบ" : "Rose clay soap with a fallen rose petal"} fill sizes="(max-width: 760px) 100vw, 45vw"/></motion.div><div className="story-photo-label"><Flower2/><span>{th ? <>ค่อย ๆ<br/>แต่ทุกวัน</> : <>LESS RUSH.<br/>MORE RITUAL.</>}</span></div></div>
      <div className="brand-story-copy"><Reveal><h2>{th ? <>ให้เวลากับ<br/>ตัวเอง<span>อีกนิด</span></> : <>Life moves fast.<br/>Your ritual<br/><span>doesn’t have to.</span></>}</h2></Reveal><Reveal delay={.12}><p>{th ? "เริ่มจากกลิ่นที่ชอบ ฟองนุ่ม ๆ และเวลาสักนิด ซันไชน์ชวนคุณเปลี่ยนการดูแลตัวเองให้เป็นช่วงเวลาที่มีความหมาย แม้ในวันที่ธรรมดาที่สุด" : "A scent you love. A soft lather. A moment to slow down. Sunshine is about making a little space for yourself, even on the most ordinary days."}</p><Link href="/shop" className="pill-link pill-light"><span>{th ? "สร้างช่วงเวลาของคุณ" : "Make it your ritual"}</span><span className="arrow-disc"><ArrowUpRight/></span></Link></Reveal><div className="story-signature">{th ? "ด้วยรัก, ซันไชน์" : "with love, sunshine"} <Sun/></div></div>
    </section>
    <section className="closing-note"><Reveal><Sun/><h2>{th ? <>วันดี ๆ เริ่มจาก<span>คุณ</span></> : <>A good day starts with <span>you.</span></>}</h2><Link href="/shop" className="text-arrow">{th ? "พบกับคอลเลกชัน" : "Meet the collection"}<ArrowRight/></Link></Reveal></section>
  </>;
}

