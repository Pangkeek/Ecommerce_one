# Sunshine Whitening design system

## Direction

Premium minimalism with an editorial, linear typography system. The storefront uses a quiet milk-white canvas, fine rules, asymmetric columns, rectangular image crops, and generous pauses. Pink and deep rose carry emphasis rather than decoration. Typography leads the composition; imagery gives the page its warmth.

## Typography

Locally bundled Manrope and Noto Sans Thai support English and Thai without runtime font requests. Large headlines use tight editorial tracking and short line lengths. Small metadata uses restrained uppercase tracking. Body copy stays readable and conversational.

## Color and surfaces

- Ink: `#3d252c`
- Rose: `#ed7194`
- Deep rose: `#9d254d`
- Blush: `#fde4ec`
- Petal: `#f5bfd0`
- Milk white: `#fffcfd`
- Border: `#ecdfe4`

Rules, whitespace, and type establish structure. Rounded corners are reserved for image crops and primary controls. Surfaces stay flat and calm; elevation is used only when a floating control needs separation.

## Motion

The homepage has one continuous editorial rhythm: the hero image reveals with a soft wipe, the product collection enters with scroll reveal, and image movement stays subtle. Hover states lift cards and guide the eye without hiding essential actions. Content remains visible by default and reduced motion is respected.

## Local assets

Photography lives in `public/hero-soap.png` and `public/product-soap.png`. Product photography is shared across the sample collection. Fonts live in `public/fonts`; adjacent OFL files contain their licenses.

All commerce behavior remains a local demo while the Supabase-backed catalog, accounts, inventory, orders, and admin controls are available when the connection is healthy.
