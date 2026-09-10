export type StoreOrder = {
 id:string; email:string; status:"pending"|"cancelled"; total_satang:number; created_at:string;
 shipping_address:{fullName:string;phone:string;address:string;province:string;postcode:string};
 order_items:{product_id:string;variant_id:string;name:{th:string;en:string};label:{th:string;en:string};quantity:number;unit_price_satang:number}[];
};
