import test from "node:test";
import assert from "node:assert/strict";
import { checkoutConfig, checkoutParameters, createCheckoutSession, expireCheckoutSession, type CheckoutOrder } from "../src/lib/stripe-checkout";

const config = {secretKey:"sk_test_fixture",origin:"http://localhost:3000"};
function order():CheckoutOrder {
  return {
    id:"b63291b1-2c1b-42c7-96bf-9f9367633832",user_id:"82e2eb18-b49e-4bf6-bc66-5ca5e9ea2a65",
    email:"checkout@example.com",status:"pending",created_at:new Date().toISOString(),
    subtotal_satang:48000,shipping_satang:6000,total_satang:54000,
    order_items:[{product_id:"soap",variant_id:"90g",name:{en:"Soap",th:"สบู่"},label:{en:"90 g",th:"90 กรัม"},quantity:2,unit_price_satang:24000}],
  };
}
function session(input = order()) {
  return {id:"cs_test_fixture",livemode:false,url:"https://checkout.stripe.com/c/pay/cs_test_fixture",status:"open",payment_status:"unpaid",
    client_reference_id:input.id,metadata:{order_id:input.id,user_id:input.user_id},currency:"thb",amount_total:input.total_satang,
    expires_at:2_000_000_000};
}

test("sandbox key required and secret configuration is never public",t=>{
  const oldKey=process.env.STRIPE_SECRET_KEY,oldSite=process.env.NEXT_PUBLIC_SITE_URL;
  t.after(()=>{
    if(oldKey===undefined)delete process.env.STRIPE_SECRET_KEY;else process.env.STRIPE_SECRET_KEY=oldKey;
    if(oldSite===undefined)delete process.env.NEXT_PUBLIC_SITE_URL;else process.env.NEXT_PUBLIC_SITE_URL=oldSite;
  });
  delete process.env.STRIPE_SECRET_KEY;
  assert.throws(()=>checkoutConfig(),/not configured/);
  process.env.STRIPE_SECRET_KEY="sk_live_fixture";
  assert.throws(()=>checkoutConfig(),/not configured/);
  process.env.STRIPE_SECRET_KEY="sk_test_fixture";
  process.env.NEXT_PUBLIC_SITE_URL="http://localhost:3000";
  assert.deepEqual(checkoutConfig(),config);
  process.env.NEXT_PUBLIC_SITE_URL="http://store.example.com";
  assert.throws(()=>checkoutConfig(),/Invalid checkout/);
});

test("THB session uses saved integer prices, quantities, shipping and order references",()=>{
  const input=order(),body=checkoutParameters(input,config.origin);
  assert.equal(body.get("line_items[0][price_data][unit_amount]"),"24000");
  assert.equal(body.get("line_items[0][quantity]"),"2");
  assert.equal(body.get("line_items[0][price_data][currency]"),"thb");
  assert.equal(body.get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"),"6000");
  assert.equal(body.get("metadata[order_id]"),input.id);
  assert.equal(body.get("metadata[user_id]"),input.user_id);
  assert.equal(body.get("client_reference_id"),input.id);
  assert.equal(body.get("success_url"),"http://localhost:3000/account?checkout=returned&session_id={CHECKOUT_SESSION_ID}");
  assert.equal(body.get("payment_method_types[0]"),"card");
});

test("free delivery stays free and reordered rows produce identical idempotent parameters",()=>{
  const input=order();
  input.order_items.push({...input.order_items[0],product_id:"another-soap"});
  input.subtotal_satang=96000;input.shipping_satang=0;input.total_satang=96000;
  const before=checkoutParameters(input,config.origin).toString();
  input.order_items.reverse();
  assert.equal(checkoutParameters(input,config.origin).toString(),before);
  assert.equal(checkoutParameters(input,config.origin).get("shipping_options[0][shipping_rate_data][fixed_amount][amount]"),"0");
});

test("inconsistent totals and old orders never create another session",()=>{
  assert.throws(()=>checkoutParameters({...order(),total_satang:1},config.origin),/total/);
  assert.throws(()=>checkoutParameters({...order(),subtotal_satang:100},config.origin),/total/);
  assert.throws(()=>checkoutParameters({...order(),created_at:new Date(Date.now()-24*60*60*1000).toISOString()},config.origin),/expired/);
});

test("repeat checkout reuses one idempotency key and refreshes current Stripe state",async t=>{
  const input=order();const calls:{url:string;init:RequestInit}[]=[];
  t.mock.method(globalThis,"fetch",async (url:string,init:RequestInit)=>{
    calls.push({url,init});return Response.json(session(input));
  });
  const first=await createCheckoutSession(input,config),second=await createCheckoutSession(input,config);
  assert.deepEqual(first,second);
  assert.equal(calls.length,4);
  assert.equal(new Headers(calls[0].init.headers).get("Idempotency-Key"),`sunshine-checkout-v1-${input.id}`);
  assert.equal(new Headers(calls[2].init.headers).get("Idempotency-Key"),new Headers(calls[0].init.headers).get("Idempotency-Key"));
  assert.equal(calls[0].init.body,calls[2].init.body);
  assert.equal(calls[1].init.method,"GET");
  assert.equal(calls[1].init.cache,"no-store");
});

test("an attached checkout is resumed without creating a second Stripe session",async t=>{
  const input={...order(),stripe_session_id:"cs_test_fixture"};const calls:string[]=[];
  t.mock.method(globalThis,"fetch",async (url:string)=>{calls.push(url);return Response.json(session(input));});
  const result=await createCheckoutSession(input,config);
  assert.equal(result.sessionId,"cs_test_fixture");
  assert.equal(calls.length,1);
  assert.match(calls[0],/\/cs_test_fixture$/);
});

test("expiring a checkout uses Stripe's server-side expire endpoint",async t=>{
  let request:{url:string;init:RequestInit}|undefined;
  t.mock.method(globalThis,"fetch",async (url:string,init:RequestInit)=>{request={url,init};return Response.json({...session(),status:"expired",url:null});});
  const result=await expireCheckoutSession("cs_test_fixture",config);
  assert.equal(result.status,"expired");
  assert.match(request!.url,/\/cs_test_fixture\/expire$/);
  assert.equal(request!.init.method,"POST");
});

test("cached open session is not reused after payment or expiration",async t=>{
  const input=order();
  for(const status of ["complete","expired"]){
    t.mock.method(globalThis,"fetch",async (_url:string,init:RequestInit)=>Response.json({...session(input),...(init.method==="GET"?{status,url:null}: {})}));
    await assert.rejects(createCheckoutSession(input,config),/completed or expired/);
    t.mock.restoreAll();
  }
});

test("unexpected session amount, owner, live mode and redirect destination are rejected",async t=>{
  const input=order();
  for(const patch of [
    {amount_total:1},{currency:"usd"},{metadata:{order_id:input.id,user_id:"another-user"}},
    {livemode:true},{url:"https://checkout.stripe.com.evil.example/pay"},
  ]){
    t.mock.method(globalThis,"fetch",async ()=>Response.json({...session(input),...patch}));
    await assert.rejects(createCheckoutSession(input,config));t.mock.restoreAll();
  }
});

test("Stripe errors do not expose response bodies or credentials",async t=>{
  t.mock.method(console,"error",()=>{});
  t.mock.method(globalThis,"fetch",async ()=>Response.json({error:{message:"sensitive provider message"}},{status:401}));
  await assert.rejects(createCheckoutSession(order(),config),error=>{
    assert.ok(error instanceof Error);assert.match(error.message,/unavailable/);
    assert.doesNotMatch(error.message,/sensitive|sk_test/);return true;
  });
});
