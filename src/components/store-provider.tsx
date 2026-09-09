"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { MotionPreferences } from "./motion-preferences";
import type { CartLine, Locale, Product } from "@/lib/types";
import { products as seedProducts } from "@/lib/data";

type Store = { locale:Locale; setLocale:(l:Locale)=>void; products:Product[]; setProducts:(p:Product[])=>void; cart:CartLine[]; add:(p:string,v:string)=>void; change:(p:string,v:string,q:number)=>void; clear:()=>void; cartCount:number; cartOpen:boolean; setCartOpen:(v:boolean)=>void; signedIn:boolean; setSignedIn:(v:boolean)=>void };
const Context=createContext<Store|null>(null);
export function StoreProvider({children}:{children:React.ReactNode}){
 const [locale,setLocaleState]=useState<Locale>("th"); const [products,setProductsState]=useState(seedProducts); const [cart,setCart]=useState<CartLine[]>([]); const [cartOpen,setCartOpen]=useState(false); const [signedIn,setSignedInState]=useState(false);
 useEffect(()=>{ const read=<T,>(k:string,f:T)=>{try{return JSON.parse(localStorage.getItem(k)||"") as T}catch{return f}}; const timer=window.setTimeout(()=>{setLocaleState(read("sw-locale","th"));setProductsState(read("sw-products",seedProducts));setCart(read("sw-cart",[]));setSignedInState(read("sw-auth",false))},0);return()=>window.clearTimeout(timer)},[]);
 const save=<T,>(key:string,setter:(v:T)=>void)=>(v:T)=>{setter(v);localStorage.setItem(key,JSON.stringify(v))};
 const setLocale=save<Locale>("sw-locale",setLocaleState), setProducts=save<Product[]>("sw-products",setProductsState), setSignedIn=save<boolean>("sw-auth",setSignedInState);
 const commit=(next:CartLine[])=>{setCart(next);localStorage.setItem("sw-cart",JSON.stringify(next))};
 const add=(productId:string,variantId:string)=>{const found=cart.find(x=>x.productId===productId&&x.variantId===variantId); commit(found?cart.map(x=>x===found?{...x,quantity:x.quantity+1}:x):[...cart,{productId,variantId,quantity:1}]);setCartOpen(true)};
 const change=(productId:string,variantId:string,quantity:number)=>commit(quantity<1?cart.filter(x=>!(x.productId===productId&&x.variantId===variantId)):cart.map(x=>x.productId===productId&&x.variantId===variantId?{...x,quantity}:x));
 const value={locale,setLocale,products,setProducts,cart,add,change,clear:()=>commit([]),cartCount:cart.reduce((n,x)=>n+x.quantity,0),cartOpen,setCartOpen,signedIn,setSignedIn};
 return <Context.Provider value={value}><MotionPreferences>{children}</MotionPreferences></Context.Provider>
}
export const useStore=()=>{const v=useContext(Context);if(!v)throw new Error("StoreProvider missing");return v};
