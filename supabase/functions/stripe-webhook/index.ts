import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@1";
import Stripe from "npm:stripe@22.0.0";

const stripeSecret=requiredSecret("STRIPE_SECRET_KEY");
const webhookSecret=requiredSecret("STRIPE_WEBHOOK_SECRET");
const stripe=new Stripe(stripeSecret);
const cryptoProvider=Stripe.createSubtleCryptoProvider();
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requiredSecret(name:string) {
  const value=Deno.env.get(name)?.trim();
  if(!value)throw new Error(`${name} is not configured`);
  return value;
}

function json(body:unknown,status=200) {
  return Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
}

export default {
  fetch:withSupabase({auth:"none"},async(req,{supabaseAdmin})=>{
    if(req.method!=="POST")return json({error:"Method not allowed"},405);
    const signature=req.headers.get("stripe-signature");
    if(!signature)return json({error:"Missing Stripe signature"},400);

    let event:Stripe.Event;
    try {
      event=await stripe.webhooks.constructEventAsync(await req.text(),signature,webhookSecret,undefined,cryptoProvider);
    } catch {
      return json({error:"Invalid Stripe signature"},400);
    }

    if(event.type!=="checkout.session.completed"&&event.type!=="checkout.session.expired")
      return json({received:true,result:"ignored_event_type"});

    const session=event.data.object as Stripe.Checkout.Session;
    const orderId=uuid.test(session.metadata?.order_id??"")?session.metadata.order_id:null;
    const userId=uuid.test(session.metadata?.user_id??"")?session.metadata.user_id:null;
    if((stripeSecret.startsWith("sk_test_")&&session.livemode)||(stripeSecret.startsWith("sk_live_")&&!session.livemode))
      return json({received:true,result:"ignored_mode_mismatch"});

    const paymentIntent=typeof session.payment_intent==="string"?session.payment_intent:null;
    const amountTotal=typeof session.amount_total==="number"&&Number.isSafeInteger(session.amount_total)&&session.amount_total>=0?session.amount_total:null;
    const {data,error}=await supabaseAdmin.rpc("process_stripe_checkout_event",{
      p_event_id:event.id,
      p_event_type:event.type,
      p_session_id:session.id,
      p_order_id:orderId,
      p_user_id:userId,
      p_payment_intent_id:paymentIntent,
      p_amount_total:amountTotal,
      p_currency:session.currency,
      p_livemode:session.livemode,
      p_payment_status:session.payment_status,
    });
    if(error){
      console.error("Stripe event processing failed",event.id,error.code);
      return json({error:"Event processing failed"},500);
    }
    return json({received:true,...(data??{})});
  }),
};
