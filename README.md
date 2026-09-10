# Sunshine Whitening

A bilingual premium soap storefront built with Next.js, TypeScript, Tailwind CSS, shadcn-style controls, Supabase, and animated editorial UI.

## Run locally

```powershell
pnpm install
pnpm dev
```

Open `http://127.0.0.1:3000`.

Supabase setup, Auth redirect URLs, administrator access, RLS, Storage, orders, and payment notes are documented in [SUPABASE-SETUP.md](SUPABASE-SETUP.md).

The catalog and accounts are connected to Supabase. Orders are saved as unpaid records; no payment is collected until a gateway is added.
