"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, ArrowRight, Sun, Flower2 } from "lucide-react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, useEffect } from "react";
import { ProductGrid } from "@/components/product-grid";
import { Reveal } from "@/components/reveal";
import { useSiteMotion } from "@/components/motion-preferences";
import { useStore } from "@/components/store-provider";

function MovingRibbon() {
  const ref = useRef<HTMLDivElement>(null);
  const { enabled } = useSiteMotion();
  const { locale } = useStore();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false;
    const update = () => el.dataset.playing = String(enabled && visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, [enabled]);
  const words = locale === "th" ? ["ช่วงเวลาของคุณ", "ความสุขก้อนเล็ก", "ดูแลตัวเองทุกวัน"] : ["GOOD DAYS START HERE", "A LITTLE EVERYDAY JOY", "SKINCARE, SLOWLY"];
  return <div ref={ref} className="ribbon" aria-label={words.join(" · ")}>
    <div className="ribbon-track" aria-hidden="true">{[0, 1].map(group => <div className="ribbon-group" key={group}>{words.map(word => <span key={word}>{word}<Flower2/></span>)}</div>)}</div>
  </div>;
}

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
  return <>
    <section className="campaign" ref={hero}>
      <div className="campaign-copy">
        <Reveal><div className="edition"><span className="edition-line"/>{th ? "คอลเลกชันดูแลผิวประจำวัน" : "THE EVERYDAY COLLECTION"}</div></Reveal>
        <Reveal delay={.1}><h1>{th ? <>ความสุขเล็ก ๆ<br/><span>ในทุกวัน</span><Sun className="headline-sun"/></> : <>Your daily<br/><span>feel-good.</span><Sun className="headline-sun"/></>}</h1></Reveal>
        <Reveal delay={.2}><p className="campaign-description">{th ? "เปลี่ยนการดูแลผิวให้เป็นช่วงเวลาที่รอคอย สบู่สัมผัสนุ่ม กลิ่นละมุน และความสุขในก้อนเดียว" : "Make a little room for yourself. Thoughtful soap bars, soft scents, and a moment that feels entirely yours."}</p></Reveal>
        <Reveal delay={.3}><Link className="pill-link" href="/shop"><span>{th ? "ค้นหาสบู่ที่ใช่" : "Find your everyday bar"}</span><span className="arrow-disc"><ArrowUpRight/></span></Link></Reveal>
        <Reveal delay={.35}><div className="campaign-foot"><div className="mini-stack"><Image src="/product-soap.png" alt="" width={52} height={52}/><Image src="/hero-soap.png" alt="" width={52} height={52}/><span><Flower2/></span></div><span>{th ? "6 สูตร · เลือกตามจังหวะของคุณ" : "6 formulas. One little daily ritual."}</span></div></Reveal>
      </div>
      <div className="campaign-art" onPointerMove={event => {
        if (!enabled || event.pointerType !== "mouse") return;
        const box = event.currentTarget.getBoundingClientRect();
        pointerX.set(((event.clientX - box.left) / box.width - .5) * 7);
        pointerY.set(((event.clientY - box.top) / box.height - .5) * -7);
      }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
        <div className="art-caption"><span>SUNSHINE / BODY CARE</span><span>MADE FOR YOUR EVERYDAY</span></div>
        <motion.div className="campaign-photo-shell" style={{ y: enabled ? parallax : 0, rotateX: enabled ? rotateX : 0, rotateY: enabled ? rotateY : 0 }}>
          <Reveal className="campaign-photo" variant="wipe"><Image src="/hero-soap.png" alt={th ? "สบู่สีชมพูและสีครีมบนแท่นหิน" : "Pink and cream soap bars in soft sunlight"} fill priority sizes="(max-width: 760px) 100vw, 55vw"/></Reveal>
        </motion.div>
        <Reveal className="floating-note" delay={.3} variant="drift"><Sun/><span>A LITTLE<br/>SUNSHINE<br/><i>for your skin.</i></span></Reveal>
        <Reveal className="floating-product" delay={.35} variant="drift"><Link href="/product/rose-clay"><Image src="/product-soap.png" alt={th ? "สบู่โรสเคลย์" : "Rose Clay Bar"} width={150} height={150}/><div><small>{th ? "รู้จักกับ" : "MEET YOUR NEW RITUAL"}</small><strong>Rose Clay Bar</strong></div><ArrowUpRight/></Link></Reveal>
      </div>
      <a className="campaign-scroll" href="#collection"><ArrowDown/><span>{th ? "เลื่อนเพื่อค้นพบ" : "Scroll to feel good"}</span></a>
    </section>
    <MovingRibbon/>
    <section className="collection-section" id="collection">
      <div className="section-heading"><Reveal><span className="section-label">{th ? "คอลเลกชันของเรา" : "THE SOAP EDIT"}</span><h2>{th ? <>ก้อนเล็ก ๆ<br/><span>ความสุขเต็มมือ</span></> : <>Small bars.<br/><span>Big little moments.</span></>}</h2></Reveal><Reveal delay={.15} className="collection-aside"><p>{th ? "เลือกจากเนื้อสัมผัสและกลิ่นที่คุณชอบ แล้วทำให้ทุกวันเป็นวันของคุณ" : "Find the texture and scent you love. Make the everyday feel a little more like you."}</p><Link className="text-arrow" href="/shop">{th ? `ดูทั้ง ${products.length} สูตร` : `Explore all ${products.length} bars`}<ArrowUpRight/></Link></Reveal></div>
      <ProductGrid compact/>
    </section>
    <section className="brand-story" id="story" ref={story}>
      <div className="story-photo-wrap"><motion.div className="story-photo" style={{ y: enabled ? storyY : 0 }}><Image src="/product-soap.png" alt={th ? "สบู่โรสเคลย์และกลีบกุหลาบ" : "Rose clay soap with a fallen rose petal"} fill sizes="(max-width: 760px) 100vw, 45vw"/></motion.div><div className="story-photo-label"><Flower2/><span>LESS RUSH.<br/>MORE RITUAL.</span></div></div>
      <div className="brand-story-copy"><Reveal><span className="section-label">{th ? "โลกของซันไชน์" : "OUR WORLD"}</span><h2>{th ? <>ให้เวลากับ<br/>ตัวเอง<span>อีกนิด</span></> : <>Life moves fast.<br/>Your ritual<br/><span>doesn’t have to.</span></>}</h2></Reveal><Reveal delay={.12}><p>{th ? "เริ่มจากกลิ่นที่ชอบ ฟองนุ่ม ๆ และเวลาสักนิด ซันไชน์ชวนคุณเปลี่ยนการดูแลตัวเองให้เป็นช่วงเวลาที่มีความหมาย แม้ในวันที่ธรรมดาที่สุด" : "A scent you love. A soft lather. A moment to slow down. Sunshine is about making a little space for yourself, even on the most ordinary days."}</p><Link href="/shop" className="pill-link pill-light"><span>{th ? "สร้างช่วงเวลาของคุณ" : "Make it your ritual"}</span><span className="arrow-disc"><ArrowUpRight/></span></Link></Reveal><div className="story-signature">with love, sunshine <Sun/></div></div>
    </section>
    <section className="closing-note"><Reveal><Sun/><h2>{th ? <>วันดี ๆ เริ่มจาก<span>คุณ</span></> : <>A good day starts with <span>you.</span></>}</h2><Link href="/shop" className="text-arrow">{th ? "พบกับคอลเลกชัน" : "Meet the collection"}<ArrowRight/></Link></Reveal></section>
  </>;
}
