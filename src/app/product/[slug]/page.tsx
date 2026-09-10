"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/components/store-provider";
import { Button } from "@/components/ui";
import { baht } from "@/lib/utils";

export default function ProductDetail(){
 const {slug}=useParams<{slug:string}>(); const {products,locale,add}=useStore(); const p=products.find(x=>x.slug===slug);
 const [variant,setVariant]=useState(p?.variants[0]?.id||""); const [qty,setQty]=useState(1);
 if(!p)return <section className="not-found"><h1>{locale==="th"?"ไม่พบสินค้านี้":"Product not found"}</h1><Link href="/shop">← {locale==="th"?"กลับไปเลือกซื้อ":"Back to shop"}</Link></section>;
 const chosen=p.variants.find(v=>v.id===variant)||p.variants[0];
 return <section className="detail-page"><Link className="back" href="/shop"><ArrowLeft/>{locale==="th"?"คอลเลกชัน":"Collection"}</Link><div className={`detail-visual tone-${p.tone}`}><Image src={p.imageUrl||"/product-soap.png"} alt={p.name[locale]} fill priority sizes="(max-width: 900px) 100vw, 55vw"/></div><div className="detail-copy"><span className="kicker">{p.eyebrow[locale]}</span><h1>{p.name[locale]}</h1><p className="detail-price">{baht(chosen.price??p.price,locale==="th"?"th-TH":"en-US")}</p><p className="detail-desc">{p.description[locale]}</p><fieldset><legend>{locale==="th"?"ขนาด":"Size"}</legend><div className="variant-list">{p.variants.map(v=><button key={v.id} className={variant===v.id?"selected":""} onClick={()=>{setVariant(v.id);setQty(1)}}>{v.label[locale]}{variant===v.id&&<Check/>}</button>)}</div></fieldset><div className="buy-row"><div className="qty large"><button onClick={()=>setQty(Math.max(1,qty-1))}><Minus/></button><span>{qty}</span><button disabled={qty>=chosen.stock} onClick={()=>setQty(Math.min(chosen.stock,qty+1))}><Plus/></button></div><Button disabled={!chosen.stock} onClick={()=>add(p.id,chosen.id,qty)}>{locale==="th"?"เพิ่มลงตะกร้า":"Add to bag"}</Button></div><div className="detail-facts"><div><span>{locale==="th"?"ส่วนผสมหลัก":"Key ingredients"}</span><p>{p.ingredients[locale]}</p></div><div><span>{locale==="th"?"วิธีเก็บรักษา":"Care"}</span><p>{locale==="th"?"วางบนที่แห้งระหว่างการใช้งาน":"Keep dry between uses."}</p></div></div></div></section>
}
