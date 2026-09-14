"use client";
import { useStore } from "./store-provider";

export type CheckoutNoticeStatus = "paid" | "unverified" | "cancelled";
export function CheckoutNotice({status}:{status:CheckoutNoticeStatus}) {
  const {locale}=useStore();
  const messages={
    paid:{en:"Stripe confirmed your test payment. No real money was charged. Your order will show Paid after the secure webhook arrives—refresh once if it takes a few seconds.",th:"Stripe ยืนยันการชำระเงินทดสอบแล้ว ไม่มีการเรียกเก็บเงินจริง คำสั่งซื้อจะแสดงว่าชำระแล้วเมื่อเว็บฮุกมาถึง หากใช้เวลาสักครู่ให้รีเฟรชหนึ่งครั้ง"},
    unverified:{en:"We could not confirm the payment result. Check your Stripe test payment before trying to pay again.",th:"ยังยืนยันผลการชำระเงินไม่ได้ กรุณาตรวจสอบการชำระเงินทดสอบใน Stripe ก่อนชำระซ้ำ"},
    cancelled:{en:"You returned from Stripe. Your order is saved; use Pay with Stripe below to resume checkout.",th:"คุณกลับจาก Stripe แล้ว คำสั่งซื้อถูกบันทึกไว้ กดชำระเงินผ่าน Stripe ด้านล่างเพื่อดำเนินการต่อ"},
  };
  return <p className="demo-note" role="status">{messages[status][locale]}</p>;
}
