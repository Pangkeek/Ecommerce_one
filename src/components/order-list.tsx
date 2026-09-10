"use client";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StoreOrder } from "@/lib/order-types";
import { useStore } from "./store-provider";
import { Button } from "./ui";
import { baht } from "@/lib/utils";
import { cancelOrder } from "@/app/orders/actions";
export function OrderList({orders,admin=false}:{orders:StoreOrder[];admin?:boolean}) {
 const {locale}=useStore();const th=locale==="th";const [notice,setNotice]=useState("");const [pending,start]=useTransition();const router=useRouter();
 return <div className="order-list"><p role="status">{notice}</p>{!orders.length&&<p>{th?"ยังไม่มีคำสั่งซื้อ":"No orders yet."}</p>}{orders.map(order=><article className="order-card" key={order.id}><div className="order-heading"><strong>#{order.id.slice(0,8)}</strong><span>{order.created_at.slice(0,10)} · {order.status==="cancelled"?(th?"ยกเลิกแล้ว":"Cancelled"):(th?"รอชำระเงิน":"Awaiting payment")}</span><strong>{baht(order.total_satang/100)}</strong></div>
 {order.order_items.map(item=><p key={`${item.product_id}:${item.variant_id}`}>{item.name[locale]} · {item.label[locale]} × {item.quantity}</p>)}
 {admin&&<p>{order.email}<br/>{order.shipping_address.fullName} · {order.shipping_address.phone}<br/>{order.shipping_address.address}, {order.shipping_address.province} {order.shipping_address.postcode}</p>}
 {order.status==="pending"&&<Button variant="outline" disabled={pending} onClick={()=>start(async()=>{try{const result=await cancelOrder(order.id);setNotice(result.error||result.message||"");router.refresh()}catch{setNotice("Could not cancel. Please try again.")}})}>{th?"ยกเลิกคำสั่งซื้อ":"Cancel order"}</Button>}</article>)}</div>;
}
