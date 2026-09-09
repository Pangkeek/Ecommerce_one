# Sunshine Whitening

A bilingual local ecommerce template for a premium soap brand. It runs entirely in the browser: catalog edits, cart contents, demo account state, and admin changes are saved to `localStorage`.

## Run locally

```powershell
pnpm install
pnpm dev
```

Open `http://127.0.0.1:3000`.

## Demo areas

- `/` — editorial storefront
- `/shop` — searchable and filterable catalog
- `/account` — local sign-in simulation
- `/admin` — product pricing and stock editor

The cart provides a simulated checkout and does not collect money or send customer data anywhere.

## Connecting services later

The UI is intentionally separate from the local store provider in `src/components/store-provider.tsx`. Replace that adapter with your Supabase-backed queries and authentication when ready. Create payment sessions from a server Route Handler and confirm orders with signed webhooks rather than trusting the success page. Add deployment and analytics only after choosing your hosting account.
