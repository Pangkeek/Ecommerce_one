import "server-only";
import { z } from "zod";

// Keep this integration in Stripe sandbox until the business is ready for a
// separate live-key, live-webhook rollout and real-payment acceptance testing.
export function checkoutConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || !/^sk_test_\S+$/.test(secretKey)) {
    throw new Error("Stripe sandbox checkout is not configured.");
  }
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(site.hostname);
  if (site.username || site.password || (site.protocol !== "https:" && !(local && site.protocol === "http:"))) {
    throw new Error("Invalid checkout return URL.");
  }
  return { secretKey, origin: site.origin };
}

const money = z.number().int().nonnegative().max(99_999_999);
const text = z.object({ en: z.string().min(1), th: z.string().min(1) });
export const checkoutOrderSchema = z.object({
  id: z.uuid(), user_id: z.uuid(), email: z.email(), created_at: z.string(),
  status: z.literal("pending"), subtotal_satang: money, shipping_satang: money, total_satang: money,
  stripe_session_id: z.string().regex(/^cs_test_[A-Za-z0-9]+$/).nullable().optional(),
  order_items: z.array(z.object({
    product_id: z.string(), variant_id: z.string(), name: text, label: text,
    quantity: z.number().int().min(1).max(99), unit_price_satang: money,
  })).min(1).max(30),
});
export type CheckoutOrder = z.infer<typeof checkoutOrderSchema>;
type Config = ReturnType<typeof checkoutConfig>;
const sessionSchema = z.object({
  id: z.string().regex(/^cs_test_[A-Za-z0-9]+$/), livemode: z.literal(false),
  url: z.string().nullable(), status: z.enum(["open", "complete", "expired"]),
  payment_status: z.enum(["paid", "unpaid", "no_payment_required"]),
  client_reference_id: z.string().nullable(), metadata: z.record(z.string(), z.string()),
  currency: z.string().nullable(), amount_total: z.number().nullable(), expires_at: z.number().int().positive(),
});

export function checkoutParameters(input: CheckoutOrder, origin: string, now = Date.now()) {
  const order = checkoutOrderSchema.parse(input);
  const age = now - Date.parse(order.created_at);
  // Stripe may discard idempotency keys after 24h. Never recreate an old order's
  // session with the same key after that window: its earlier session could be paid.
  if (!Number.isFinite(age) || age < -60_000 || age >= 23 * 60 * 60 * 1000) {
    throw new Error("This checkout has expired. View your order before trying again.");
  }
  const subtotal = order.order_items.reduce((sum, item) => sum + item.quantity * item.unit_price_satang, 0);
  if (subtotal !== order.subtotal_satang || subtotal + order.shipping_satang !== order.total_satang || order.total_satang < 1000) {
    throw new Error("The saved order total is invalid for checkout.");
  }
  const body = new URLSearchParams({
    mode: "payment", "payment_method_types[0]": "card", locale: "auto",
    customer_email: order.email, client_reference_id: order.id,
    "metadata[order_id]": order.id, "metadata[user_id]": order.user_id,
    "payment_intent_data[metadata][order_id]": order.id,
    success_url: `${origin}/account?checkout=returned&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/account?checkout=cancelled`,
  });
  // Sorting keeps idempotent requests identical regardless of database row order.
  [...order.order_items].sort((a, b) => `${a.product_id}:${a.variant_id}`.localeCompare(`${b.product_id}:${b.variant_id}`))
    .forEach((item, index) => {
      const prefix = `line_items[${index}]`;
      body.set(`${prefix}[quantity]`, String(item.quantity));
      body.set(`${prefix}[price_data][currency]`, "thb");
      body.set(`${prefix}[price_data][unit_amount]`, String(item.unit_price_satang));
      body.set(`${prefix}[price_data][product_data][name]`, `${item.name.en} / ${item.name.th} — ${item.label.en}`.slice(0, 250));
    });
  body.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  body.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(order.shipping_satang));
  body.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "thb");
  body.set("shipping_options[0][shipping_rate_data][display_name]", "Delivery / ค่าจัดส่ง");
  return body;
}

function matchingOpenSession(session:z.infer<typeof sessionSchema>,order:CheckoutOrder) {
  if (session.client_reference_id !== order.id || session.metadata.order_id !== order.id ||
      session.metadata.user_id !== order.user_id || session.amount_total !== order.total_satang || session.currency !== "thb") {
    throw new Error("The payment session does not match this order.");
  }
  if (session.status !== "open" || session.payment_status !== "unpaid" || !session.url) {
    throw new Error("This checkout is completed or expired. Check your order before paying again.");
  }
  const url = new URL(session.url);
  if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com" || url.username || url.password || url.port) {
    throw new Error("Invalid Stripe checkout URL.");
  }
  return { checkoutUrl: url.href, sessionId: session.id, expiresAt: new Date(session.expires_at*1000).toISOString() };
}

async function stripeRequest(path: string, config: Config, body?: URLSearchParams, idempotencyKey?: string) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions${path}`, {
    method: body ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Stripe-Version": "2026-08-26.dahlia",
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    ...(body ? { body: body.toString() } : {}),
  });
  if (!response.ok) {
    // Never expose Stripe response bodies, customer data, or credentials to callers.
    console.error("Stripe checkout request failed", response.status, response.headers.get("request-id"));
    throw new Error("Stripe checkout is unavailable. Please retry your saved order.");
  }
  return sessionSchema.parse(await response.json());
}

export async function retrieveCheckoutSession(id: string, config = checkoutConfig()) {
  if (!/^cs_test_[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid checkout session.");
  return stripeRequest(`/${encodeURIComponent(id)}`, config);
}

export async function expireCheckoutSession(id:string,config=checkoutConfig()) {
  if (!/^cs_test_[A-Za-z0-9]+$/.test(id)) throw new Error("Invalid checkout session.");
  return stripeRequest(`/${encodeURIComponent(id)}/expire`,config,new URLSearchParams());
}

export async function createCheckoutSession(order: CheckoutOrder, config = checkoutConfig()) {
  if(order.stripe_session_id) return matchingOpenSession(await retrieveCheckoutSession(order.stripe_session_id,config),order);
  const body = checkoutParameters(order, config.origin);
  const created = await stripeRequest("", config, body, `sunshine-checkout-v1-${order.id}`);
  // Idempotent POST responses can be stale after payment; retrieve current state.
  const session = await retrieveCheckoutSession(created.id, config);
  return matchingOpenSession(session,order);
}
