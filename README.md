# Sunshine Whitening

A bilingual premium soap storefront built with Next.js, TypeScript, Tailwind CSS, shadcn-style controls, Supabase, and animated editorial UI.

## Run locally

```powershell
pnpm install
pnpm dev
```

Open `http://127.0.0.1:3000`.

Supabase setup, Auth redirect URLs, administrator access, RLS, Storage, orders, and payment notes are documented in [SUPABASE-SETUP.md](SUPABASE-SETUP.md).

The catalog and accounts are connected to Supabase. Checkout redirects to Stripe for sandbox card payments, and the signed webhook updates paid orders. Live Stripe keys are intentionally rejected.

## Stripe sandbox checkout

Add these to `.env.local` (never commit or prefix the secret with `NEXT_PUBLIC_`):

```env
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_SANDBOX_SECRET_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Use the matching sandbox where the Supabase webhook is registered. A Supabase Edge Function secret is not automatically available to the Next.js server. Restart `pnpm dev` and open the exact origin configured above so the return from Stripe retains your login cookies.

Sign in, add products, enter delivery details, and choose **Pay with Stripe**. The server saves an order through `place_order`, reads its authoritative items and delivery charge, creates a THB card Checkout Session, and attaches its ID to the order before exposing the redirect URL. Stripe receives `client_reference_id`, `metadata.order_id`, and `metadata.user_id` so the webhook can reconcile it.

The cart is cleared only once the Session has been attached and a checkout URL is obtained. If you return from Stripe without paying, the saved order has a **Pay with Stripe** action in your account. Retrying resumes the attached Session instead of creating another payable checkout. Completed/expired sessions cannot be reopened; new Session creation is limited to orders less than 23 hours old to stay inside Stripe's 24-hour idempotency retention window.

Successful returns are verified server-side with Stripe and matched to the signed-in user's order and total. A return URL never marks an order paid. Only a valid `checkout.session.completed` webhook can set `status = 'paid'`. Duplicate events are recorded once and are safe to retry. `checkout.session.expired` cancels the unpaid order and restores reserved stock exactly once.

### Supabase webhook setup

Run [`supabase/stripe-payments.sql`](supabase/stripe-payments.sql), deploy [`supabase/functions/stripe-webhook/index.ts`](supabase/functions/stripe-webhook/index.ts) with JWT verification disabled, and configure these Edge Function secrets:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

The Stripe sandbox event destination must subscribe to `checkout.session.completed` and `checkout.session.expired`.

### Still required before live payments

- Create a separate live Stripe webhook destination and use its live `whsec_...` with an `sk_live_...` server secret.
- Remove the sandbox-only key/session guards only during that controlled rollout.
- Complete a real low-value payment, cancellation, refund, dispute, and operational alerting review before accepting customers.

This implementation therefore accepts `sk_test_` keys only and labels payments as tests. Run `pnpm test`, `pnpm typecheck`, and `pnpm lint` to verify locally.
