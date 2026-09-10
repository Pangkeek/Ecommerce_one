"use client";
import { createContext,useContext,useEffect,useState } from "react";
import { MotionPreferences } from "./motion-preferences";
import type { CartLine,Locale,Product } from "@/lib/types";
import { products as seeds } from "@/lib/data";

type Store={locale:Locale;setLocale:(l:Locale)=>void;products:Product[];cart:CartLine[];add:(p:string,v:string,q?:number)=>void;change:(p:string,v:string,q:number)=>void;clear:()=>void;cartCount:number;cartOpen:boolean;setCartOpen:(open:boolean)=>void;signedIn:boolean;};
const Context=createContext<Store|null>(null);
export function StoreProvider({children,initialProducts=seeds,signedIn=false}:{children:React.ReactNode;initialProducts?:Product[];signedIn?:boolean}){
 const [locale,setLocaleState]=useState<Locale>("th"),[cart,setCart]=useState<CartLine[]>([]),[cartOpen,setCartOpen]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{
  const timer=setTimeout(()=>{
   try {
    const savedLocale=localStorage.getItem("sw-locale");
    if(savedLocale)setLocaleState(JSON.parse(savedLocale)==="en"?"en":"th");
    const saved=JSON.parse(localStorage.getItem("sw-cart")||"[]");
    if(Array.isArray(saved))setCart(saved.filter(l=>l&&typeof l.productId==="string"&&typeof l.variantId==="string"&&Number.isInteger(l.quantity)&&l.quantity>0&&l.quantity<=99));
    localStorage.removeItem("sw-auth");
   }catch{}setReady(true);
  },0);
  return()=>clearTimeout(timer);
 },[]);
 useEffect(()=>{if(ready)try{localStorage.setItem("sw-cart",JSON.stringify(cart))}catch{}},[cart,ready]);
 const setLocale=(value:Locale)=>{setLocaleState(value);try{localStorage.setItem("sw-locale",JSON.stringify(value))}catch{}};
 const stock=(p:string,v:string)=>initialProducts.find(x=>x.id===p)?.variants.find(x=>x.id===v)?.stock||0;
 const add=(productId:string,variantId:string,quantity=1)=>{
  const available=stock(productId,variantId);if(!available)return;
  setCart(current=>{const found=current.find(l=>l.productId===productId&&l.variantId===variantId);const count=Math.min(99,available,(found?.quantity||0)+quantity);
   return found?current.map(l=>l===found?{...l,quantity:count}:l):[...current,{productId,variantId,quantity:count}];
  });setCartOpen(true);
 };
 const change=(p:string,v:string,q:number)=>setCart(current=>current.flatMap(l=>l.productId===p&&l.variantId===v?(q<1?[]:[{...l,quantity:Math.min(99,stock(p,v),q)}]):[l]).filter(l=>l.quantity>0));
 const value={locale,setLocale,products:initialProducts,cart,add,change,clear:()=>setCart([]),cartCount:cart.reduce((n,l)=>n+l.quantity,0),cartOpen,setCartOpen,signedIn};
 return <Context.Provider value={value}><MotionPreferences>{children}</MotionPreferences></Context.Provider>;
}
export const useStore=()=>{const store=useContext(Context);if(!store)throw new Error("StoreProvider missing");return store};
