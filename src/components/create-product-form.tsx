"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createProduct } from "@/app/admin/actions";
import { Button, Input } from "./ui";
import styles from "./create-product-form.module.css";

export function CreateProductForm({ onClose }: { onClose: () => void }) {
  const [notice, setNotice] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  return <form id="create-product-form" className={styles.form} aria-labelledby="create-product-title" aria-busy={pending} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setNotice("");
    start(async () => {
      try {
        const result = await createProduct({
          productId: data.get("productId"), slug: data.get("slug"),
          nameEn: data.get("nameEn"), nameTh: data.get("nameTh"),
          eyebrowEn: "Everyday ritual", eyebrowTh: "ดูแลทุกวัน",
          descriptionEn: data.get("descriptionEn"), descriptionTh: data.get("descriptionEn"),
          ingredientsEn: "Natural oils", ingredientsTh: "น้ำมันธรรมชาติ",
          price: Number(data.get("price")), category: data.get("category"), tone: "rose",
          variantId: "90g", variantEn: "90 g", variantTh: "90 กรัม", stock: Number(data.get("stock")),
        });
        if (result.error) { setNotice(result.error); return; }
        onClose();
        router.refresh();
      } catch {
        setNotice("Could not connect. Your details are still here — please try again.");
      }
    });
  }}>
    <div className={styles.heading}>
      <div><h3 id="create-product-title">Add a product</h3><p>Start with the essentials. You can add a photo after creating your product.</p></div>
      <button type="button" className={styles.close} aria-label="Close add product" disabled={pending} onClick={onClose}><X aria-hidden="true"/></button>
    </div>
    <fieldset className={styles.fields} disabled={pending}>
      <legend className={styles.srOnly}>Product information</legend>
      <div className={styles.layout}>
        <section className={styles.details} aria-labelledby="product-details-title">
          <h4 id="product-details-title">Product details</h4>
          <div className={styles.grid}>
            <label htmlFor="new-name-en">Product name · English<Input autoFocus id="new-name-en" name="nameEn" placeholder="e.g. Rose milk soap" minLength={2} maxLength={100} required/></label>
            <label htmlFor="new-name-th">ชื่อสินค้า · ภาษาไทย<Input id="new-name-th" name="nameTh" placeholder="เช่น สบู่น้ำนมกุหลาบ" lang="th" minLength={2} maxLength={100} required/></label>
            <label className={styles.fullWidth} htmlFor="new-description">Short description<textarea className="input" id="new-description" name="descriptionEn" placeholder="Describe the product in a few words" rows={3} minLength={5} maxLength={500} required/></label>
            <label htmlFor="new-product-id">Product ID<Input id="new-product-id" name="productId" placeholder="rose-milk-soap" pattern="[a-z0-9\-]{2,80}" minLength={2} maxLength={80} autoCapitalize="none" spellCheck={false} aria-describedby="product-identifiers-help" required/></label>
            <label htmlFor="new-slug">URL slug<Input id="new-slug" name="slug" placeholder="rose-milk-soap" pattern="[a-z0-9\-]{2,80}" minLength={2} maxLength={80} autoCapitalize="none" spellCheck={false} aria-describedby="product-identifiers-help" required/></label>
          </div>
          <p className={styles.hint} id="product-identifiers-help">Use 2–80 lowercase letters, numbers, or hyphens. Each ID and URL slug must be unique.</p>
        </section>
        <section className={styles.inventory} aria-labelledby="product-inventory-title">
          <h4 id="product-inventory-title">Pricing & inventory</h4>
          <label htmlFor="new-category">Category<select id="new-category" name="category" className="input" defaultValue="gentle"><option value="gentle">Gentle</option><option value="brightening">Brightening</option><option value="botanical">Botanical</option></select></label>
          <div className={styles.numbers}>
            <label htmlFor="new-price">Price (THB)<Input id="new-price" name="price" type="number" inputMode="decimal" min="0" max="100000" step="0.01" placeholder="0.00" required/></label>
            <label htmlFor="new-stock">Initial stock<Input id="new-stock" name="stock" type="number" inputMode="numeric" min="0" max="100000" step="1" placeholder="0" required/></label>
          </div>
          <p className={styles.hint}>Stock is added to the standard 90 g variant.</p>
        </section>
      </div>
    </fieldset>
    <div className={styles.footer}>
      <p className={notice ? styles.error : styles.hint} role="status" aria-live="polite">{notice || "All fields are required."}</p>
      <div className={styles.actions}><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button><Button type="submit" disabled={pending}><Plus aria-hidden="true"/>{pending ? "Creating…" : "Create product"}</Button></div>
    </div>
  </form>;
}
