import { z } from "zod";
export const credentialsSchema = z.object({
  email:z.string().trim().email().max(254), password:z.string().min(8).max(128),
  fullName:z.string().trim().max(100).optional(),
});
export const addressSchema = z.object({
  fullName:z.string().trim().min(2).max(100), phone:z.string().trim().min(8).max(20),
  address:z.string().trim().min(5).max(500), province:z.string().trim().min(2).max(100),
  postcode:z.string().regex(/^\d{5}$/, "Enter a five-digit Thai postcode"),
});
export const orderSchema = z.object({
  requestId:z.uuid(), address:addressSchema,
  lines:z.array(z.object({productId:z.string().min(1).max(100),variantId:z.string().min(1).max(100),quantity:z.number().int().min(1).max(99)})).min(1).max(30),
});
export type Address = z.infer<typeof addressSchema>;
