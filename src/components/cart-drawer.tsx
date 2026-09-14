"use client";
import { Minus,Plus,ShoppingBag,X } from "lucide-react";
import { useRef,useState,useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { Button,Input } from "./ui";
import { useStore } from "./store-provider";
import { baht } from "@/lib/utils";
import { addressSchema,type Address } from "@/lib/validation";
import { placeOrder,payOrder } from "@/app/orders/actions";
export function CartDrawer(){
 const {cart,products,locale,change,clear,cartOpen,setCartOpen,signedIn}=useStore();const th=locale==="th";
 const [checkout,setCheckout]=useState(false),[notice,setNotice]=useState(""),[redirecting,setRedirecting]=useState(false),[savedOrderId,setSavedOrderId]=useState<string|null>(null);
 const requestId=useRef<string|null>(null);const [pending,start]=useTransition();
 const busy=pending||redirecting;
 const form=useForm<Address>({resolver:zodResolver(addressSchema)});
 const lines=cart.flatMap(l=>{const p=products.find(p=>p.id===l.productId);const v=p?.variants.find(v=>v.id===l.variantId);return p&&v?[{...l,product:p,variant:v,price:v.price??p.price}]:[]});
 const subtotal=lines.reduce((s,l)=>s+l.price*l.quantity,0),shipping=subtotal>=1000||!subtotal?0:60;
 return <Dialog.Root open={cartOpen} onOpenChange={setCartOpen}><Dialog.Portal><Dialog.Overlay className="scrim show"/><Dialog.Content className="drawer open" aria-describedby="bag-description"><div className="drawer-head"><div><span className="kicker">{th?"ตะกร้าของคุณ":"Your selection"}</span><Dialog.Title>{th?"ตะกร้าสินค้า":"Shopping bag"}</Dialog.Title><Dialog.Description id="bag-description" className="sr-only">Review your cart and delivery details.</Dialog.Description></div><Dialog.Close className="icon-btn" aria-label="Close cart"><X/></Dialog.Close></div>
 {checkout?<form className="checkout" onSubmit={event=>{if(busy){event.preventDefault();return}void form.handleSubmit(address=>start(async()=>{
  setNotice("");requestId.current??=crypto.randomUUID();
  try{const result=savedOrderId?await payOrder(savedOrderId):await placeOrder({requestId:requestId.current,address,lines:cart});
   if(result.orderId)setSavedOrderId(result.orderId);
   if(result.error){setNotice(result.error);return}
   if(!result.checkoutUrl){setNotice("Could not open checkout. Please try again.");return}
   setRedirecting(true);window.location.assign(result.checkoutUrl);clear();
  }catch{setRedirecting(false);setNotice("Connection failed. Your cart is saved. Retry to check your order safely.")}
 }))(event)}}><button type="button" className="back" disabled={busy||!!savedOrderId} onClick={()=>setCheckout(false)}>← {th?"กลับไปตะกร้า":"Back to bag"}</button><h3>{th?"ที่อยู่จัดส่ง":"Delivery details"}</h3>
 {([["fullName",th?"ชื่อ-นามสกุล":"Full name"],["phone",th?"เบอร์โทรศัพท์":"Phone"],["address",th?"ที่อยู่":"Address"],["province",th?"จังหวัด":"Province"],["postcode",th?"รหัสไปรษณีย์":"Postcode"]] as const).map(([key,label])=><label key={key}>{label}<Input readOnly={busy||!!savedOrderId} {...form.register(key)}/>{form.formState.errors[key]&&<small role="alert">{form.formState.errors[key]?.message}</small>}</label>)}
 <div className="demo-note">{th?"ชำระเงินทดสอบผ่าน Stripe ไม่มีการเรียกเก็บเงินจริง":"Continue to Stripe for a test payment. No real money will be charged."}</div><p role="alert">{notice}</p>{savedOrderId&&<Link href="/account" onClick={()=>{setCartOpen(false);setCheckout(false);setSavedOrderId(null);requestId.current=null;clear();form.reset()}}>{th?"ดูคำสั่งซื้อที่บันทึกไว้":"View your saved order"}</Link>}<Button disabled={busy||(!lines.length&&!savedOrderId)||!signedIn}>{busy?(th?"กำลังเปิด Stripe…":"Opening Stripe…"):(th?"ชำระเงินผ่าน Stripe":"Pay with Stripe")+" · "+baht(subtotal+shipping)}</Button></form>
 :lines.length?<><div className="cart-lines">{lines.map((l,index)=><div className="cart-line" style={{"--cart-index":index} as CSSProperties} key={l.productId+":"+l.variantId}><div className={"mini-product tone-"+l.product.tone} style={l.product.imageUrl?{backgroundImage:`url("${l.product.imageUrl}")`}:undefined}/><div><h3>{l.product.name[locale]}</h3><p>{l.variant.label[locale]}</p><strong>{baht(l.price)}</strong><div className="qty"><button aria-label="Decrease quantity" onClick={()=>change(l.productId,l.variantId,l.quantity-1)}><Minus/></button><span>{l.quantity}</span><button aria-label="Increase quantity" disabled={l.quantity>=l.variant.stock} onClick={()=>change(l.productId,l.variantId,l.quantity+1)}><Plus/></button></div>{l.quantity>l.variant.stock&&<small role="alert">Stock changed. Reduce quantity.</small>}</div></div>)}</div><div className="cart-total"><div><span>{th?"ยอดรวม":"Subtotal"}</span><span>{baht(subtotal)}</span></div><div><span>{th?"ค่าจัดส่ง":"Delivery"}</span><span>{baht(shipping)}</span></div><div className="grand"><span>{th?"รวมทั้งหมด":"Total"}</span><span>{baht(subtotal+shipping)}</span></div>{signedIn?<Button onClick={()=>{setCheckout(true)}}>{th?"ดำเนินการต่อ":"Continue to checkout"}</Button>:<Link className="button button-solid" href="/account" onClick={()=>setCartOpen(false)}>{th?"เข้าสู่ระบบเพื่อสั่งซื้อ":"Sign in to place an order"}</Link>}</div></>
 :<div className="cart-empty"><ShoppingBag/><h3>{th?"ตะกร้ายังว่างอยู่":"Your bag is waiting"}</h3><Link className="button button-solid" href="/shop" onClick={()=>setCartOpen(false)}>{th?"เลือกซื้อสินค้า":"Explore the collection"}</Link></div>}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
