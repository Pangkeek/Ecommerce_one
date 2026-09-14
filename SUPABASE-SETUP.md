# Supabase integration

This app is connected to project `kxiovludstuyleytrqdb`. The live catalog has six products and seven variants. The store/auth/catalog migrations and [`supabase/stripe-payments.sql`](supabase/stripe-payments.sql) are applied, and `stripe-webhook` is deployed.

The app uses Supabase for the catalog, email/password Auth, profiles, Storage, admin product edits, and orders. Stripe sandbox Checkout and signed paid-order webhooks are connected. See [README.md](README.md#stripe-sandbox-checkout).

## Auth setup

In Supabase Dashboard → Authentication → Providers, keep Email enabled and require email confirmation. In URL Configuration, add:

```text
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

The administrator allowlist contains `supawatkhaithong@gmail.com`. Create and verify that account through `/account`; the admin page checks the verified email against the private allowlist. Authorization does not use editable user metadata.

## Run the app

`.env.local` enables the Supabase catalog:

```env
SUPABASE_CATALOG_ENABLED=true
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart after changing environment variables:

```powershell
pnpm run dev
```

## Main files

- `src/lib/supabase/server.ts` — cookie-aware server client
- `src/lib/supabase/client.ts` — browser client for image uploads
- `src/proxy.ts` — refreshes Auth cookies with `getClaims`
- `src/app/auth/callback/route.ts` — email confirmation callback
- `src/app/account/actions.ts` — sign-up, sign-in, password reset, profile address
- `src/app/orders/actions.ts` — validated order placement and cancellation
- `src/lib/stripe-checkout.ts` — server-only Stripe Session creation, retrieval, and expiration
- `src/app/admin/actions.ts` — authorized product update
- `supabase/store-auth-orders.sql` — applied database/RLS/function SQL
- `supabase/stripe-payments.sql` — paid state, Stripe identifiers, idempotent webhook processor, expiration stock release
- `supabase/functions/stripe-webhook/index.ts` — signature-verified Stripe event handler

The order function calculates price from database rows, locks variants before decrementing stock, rejects overselling, and is idempotent by `request_id`. Checkout saves an unpaid order, attaches one Stripe Session, and opens Stripe sandbox Checkout. The signed webhook validates order ownership, amount, currency, Session, and Stripe mode before marking it paid. Event IDs are recorded for idempotency. Expired Sessions restore reserved stock in deterministic lock order.

## Security model

Products are public read-only data. Profiles and orders are visible only to their owner; admin can read orders and update catalog data. Product images are public to read but only the verified admin can upload, update, or delete. The browser and Next.js app never receive a Supabase service-role key. Supabase's Edge Function runtime supplies its server-only admin client for the narrowly granted webhook RPC. Stripe secrets are read only by server-side code.

Run a read-only catalog check:

```powershell
node --env-file=.env scripts/check-supabase.mjs
```

Expected: `Supabase catalog: 6 products, 7 variants.` The security regression test is `tests/supabase-security.sql`; it was executed through the Supabase MCP and rolled back all fixtures successfully.

After the Stripe migration, the Supabase dashboard reports zero Security Advisor errors and zero Performance Advisor errors or warnings. Rollback-only live tests verified paid-state transitions, duplicate-event handling, expiration stock restoration, and service-role-only webhook permissions.
