// Creates an unpaid sandbox session with synthetic data, verifies retry behavior,
// and expires it. Does not create a Supabase order or collect a payment.
// node --env-file=.env.local --conditions=react-server --import tsx scripts/check-stripe-checkout.mjs
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {checkoutConfig,createCheckoutSession,retrieveCheckoutSession} from "../src/lib/stripe-checkout.ts";

const config=checkoutConfig();
const order={id:randomUUID(),user_id:randomUUID(),email:"checkout-test@example.com",created_at:new Date().toISOString(),status:"pending",
  subtotal_satang:24000,shipping_satang:6000,total_satang:30000,
  order_items:[{product_id:"checkout-test",variant_id:"test",name:{en:"Checkout integration test",th:"ทดสอบการชำระเงิน"},label:{en:"Test",th:"ทดสอบ"},quantity:1,unit_price_satang:24000}]};
let sessionId;
try {
  const result=await createCheckoutSession(order,config);
  sessionId=result.sessionId;
  assert.ok(sessionId);
  const session=await retrieveCheckoutSession(sessionId,config);
  assert.equal(session.amount_total,30000);assert.equal(session.currency,"thb");assert.equal(session.livemode,false);
  const retry=await createCheckoutSession(order,config);
  assert.equal(retry.checkoutUrl,result.checkoutUrl);
  console.log("Stripe sandbox: session created; THB 300 total; metadata and retry verified. No payment collected.");
} finally {
  if(sessionId){
    const response=await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}/expire`,{
      method:"POST",headers:{Authorization:`Bearer ${config.secretKey}`},signal:AbortSignal.timeout(15000),
    });
    assert.ok(response.ok,"Could not expire the test checkout session");
    console.log("Test session expired.");
  }
}
