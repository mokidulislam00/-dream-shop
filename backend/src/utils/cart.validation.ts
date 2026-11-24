
import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID");

// Add product to cart
export const addToCartSchema = z.object({
  productId: objectIdSchema,
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .default(1),
});

// Update cart item quantity
export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});
