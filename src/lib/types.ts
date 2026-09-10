export type Locale = "th" | "en";
export type Product = {
  id: string; slug: string; name: { th: string; en: string }; eyebrow: { th: string; en: string };
  description: { th: string; en: string }; ingredients: { th: string; en: string };
  price: number; category: "brightening" | "gentle" | "botanical"; tone: string; featured?: boolean; imageUrl?: string;
  variants: { id: string; label: { th: string; en: string }; stock: number; price?: number }[];
};
export type CartLine = { productId: string; variantId: string; quantity: number };
