# Supabase integration

This app is connected to project `kxiovludstuyleytrqdb`. The live catalog has six products and seven variants. The Supabase MCP migrations applied are `create_store_catalog`, `store_auth_storage_and_orders`, `atomic_admin_product_update`, and `consolidate_catalog_read_policies`.

The app now uses Supabase for the catalog, email/password Auth, profiles, Storage, admin product edits, and unpaid orders. Stripe or another payment gateway remains intentionally unconnected.

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
- `src/app/admin/actions.ts` — authorized product update
- `supabase/store-auth-orders.sql` — applied database/RLS/function SQL

The order function calculates price from database rows, locks variants before decrementing stock, rejects overselling, and is idempotent by `request_id`. Checkout saves unpaid orders. Connect the payment gateway later and update order status only from a signed server webhook.

## Security model

Products are public read-only data. Profiles and orders are visible only to their owner; admin can read orders and update catalog data. Product images are public to read but only the verified admin can upload, update, or delete. Service-role or secret keys are not used by this app.

Run a read-only catalog check:

```powershell
node --env-file=.env scripts/check-supabase.mjs
```

Expected: `Supabase catalog: 6 products, 7 variants.` The security regression test is `tests/supabase-security.sql`; it was executed through the Supabase MCP and rolled back all fixtures successfully.

The Supabase dashboard currently reports no security advisories. It reports one informational unused-index advisory for the order-items lookup index; it can remain until order volume makes its usage measurable.
