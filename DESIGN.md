# Sunshine Whitening design system

## Direction

A modern pink-and-white beauty campaign. Oversized sans-serif headlines, rounded photography, overlapping product notes, and generous white space give the soap collection a playful premium character. Clear prices and quick-add controls keep the collection easy to shop.

## Typography

Locally bundled Manrope and Noto Sans Thai support English and Thai without runtime font requests. Bold display text gives the campaign its graphic character. Body copy uses comfortable line spacing; small labels distinguish product details and navigation.

## Color and surfaces

- Ink: `#3d252c`
- Rose: `#ed7194`
- Deep rose: `#9d254d`
- Blush: `#fde4ec`
- Petal: `#f5bfd0`
- Milk white: `#fffcfd`
- Border: `#ecdfe4`

Large rounded photo panels, pill buttons, circular arrow controls, and restrained shadows repeat throughout the storefront. The shop, product details, account, admin, and cart share the same typography, colors, and control styling.

## Motion

The hero combines a vertical photo reveal, gentle scroll parallax, and spring-smoothed pointer tilt. A moving brand ribbon leads into the collection. Product cards reveal over 1.15 seconds with a capped stagger; their images zoom gently on hover while arrows rotate and shopping prompts slide into view. The story photograph moves subtly with scrolling. Buttons, navigation, and the cart provide animated interaction feedback.

Reveals begin in browser effects after hydration, keeping server HTML and the initial client render identical. Content stays visible if JavaScript is unavailable. The ribbon pauses outside the viewport or when the document is hidden. This storefront intentionally keeps its authored motion enabled for the full visual experience.

## Local assets

Photography lives in `public/hero-soap.png` and `public/product-soap.png`. Product photography is shared across the sample collection. Fonts live in `public/fonts`; adjacent OFL files contain their licenses. `scripts/download-fonts.mjs` can refresh the fonts from Google Fonts.

All commerce behavior remains a local demo. This redesign does not connect payments, Supabase, deployment, or external email services.
