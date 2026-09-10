"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { baht } from "@/lib/utils";
import { Reveal } from "./reveal";
import { useStore } from "./store-provider";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { locale, add } = useStore();
  const th = locale === "th";
  return <Reveal delay={Math.min(index * .11, .33)} className="product-reveal">
    <article className={`product-card tone-${product.tone}`}>
      <Link href={`/product/${product.slug}`} className="product-visual">
        <Image src={product.imageUrl||"/product-soap.png"} alt={product.name[locale]} fill loading={index < 4 ? "eager" : "lazy"} sizes="(max-width: 600px) 48vw, (max-width: 1000px) 45vw, 24vw"/>
        <span className="product-badge">{product.eyebrow[locale]}</span>
        <span className="product-round-arrow"><ArrowUpRight/></span>
        <span className="view-label">{th ? "ทำความรู้จัก" : "Get to know me"}<ArrowUpRight/></span>
      </Link>
      <div className="product-meta"><div><span className="product-size">{product.variants[0].label[locale]} · {th ? "สบู่ดูแลผิว" : "BODY BAR"}</span><h3><Link href={`/product/${product.slug}`}>{product.name[locale]}</Link></h3><p>{baht(product.price, th ? "th-TH" : "en-US")}</p></div><button className="quick-add" disabled={!product.variants[0].stock} onClick={() => add(product.id, product.variants[0].id)} aria-label={`Add ${product.name[locale]}`}><Plus/></button></div>
    </article>
  </Reveal>;
}
