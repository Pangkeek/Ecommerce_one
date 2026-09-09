"use client";
import { ProductGrid } from "@/components/product-grid";
import { Reveal } from "@/components/reveal";
import { useStore } from "@/components/store-provider";
export default function Shop(){const {locale}=useStore();return <section className="shop-page"><Reveal className="shop-intro"><span className="kicker">{locale==="th"?"คอลเลกชันทั้งหมด":"Full collection"}</span><h1>{locale==="th"?"เลือกช่วงเวลาของคุณ":"Choose your ritual"}</h1><p>{locale==="th"?"สบู่หกสูตรสำหรับทุกอารมณ์และจังหวะของวัน":"Six thoughtful formulas for every mood and moment."}</p></Reveal><ProductGrid/></section>}
