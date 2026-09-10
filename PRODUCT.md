# Sunshine Whitening

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js with TypeScript, Tailwind CSS, shadcn-compatible UI primitives, Supabase PostgreSQL/Auth/Storage, Zod, React Hook Form, and local development before external payment, deployment, and email services.

## Users

Two primary audiences share the product: shoppers in Thailand buying small-batch personal-care products, and the store owner managing the catalog, inventory, images, and orders.

## Product Purpose

Sunshine Whitening is a bilingual Thai and English ecommerce storefront for a premium soap collection. Shoppers browse products, choose variants, maintain an account, save delivery details, and place clearly marked unpaid demo orders. The store owner uses `/admin` to review store activity and operate the catalog.

## Positioning

A calm, premium soap shopping experience paired with a focused owner dashboard in the same bilingual local-first product.

## Operating Context

The local app runs as a Next.js site with Supabase as the backend. The storefront reads active catalog data from PostgreSQL. Authenticated shoppers use Supabase Auth and orders reserve inventory through protected server-side database functions. Verified allowlisted administrators manage products through `/admin`. Payments, deployment, and transactional email are external integrations planned for later.

## Capabilities and Constraints

- Bilingual Thai and English storefront and account flows.
- Product variants, prices, stock, product images, cart, checkout, customer accounts, and order history.
- Supabase Row Level Security protects catalog administration, storage, profiles, and orders.
- `/admin` provides overview metrics, sales trend visualization, product search, price and stock updates, image uploads, product creation, and protected deletion.
- Products with order history cannot be hard-deleted; they should be archived when archive controls are added.
- Orders are currently unpaid until Stripe or a Thai payment gateway is connected.
- Seeded product content is illustrative and must be replaced before commercial launch.

## Brand Commitments

The name is Sunshine Whitening. The interface supports Thai and English, uses a modern pink-and-white premium direction, and keeps copy warm, clear, and factual.

## Evidence on Hand

- Local product photography: `public/hero-soap.png` and `public/product-soap.png`.
- Seed catalog and Supabase migrations under `supabase/`.
- Authenticated admin email allowlist currently includes `supawatkhaithong@gmail.com`.
- No production payment, email, deployment, efficacy, certification, review, or business-policy evidence is present.

## Product Principles

- Make browsing and purchasing feel calm and trustworthy.
- Keep prices, stock, and order state authoritative in the database.
- Give the store owner direct, understandable control over daily operations.
- Treat Thai and English as first-class content, not an afterthought.
- Keep illustrative content visibly replaceable before launch.

## Accessibility & Inclusion

The web interface should remain keyboard usable, readable in Thai and English, responsive on mobile, and explicit about authentication, unpaid orders, validation errors, and unavailable products.
