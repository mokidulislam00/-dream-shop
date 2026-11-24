
import { z } from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID");

const shippingAddressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100),

  phone: z
    .string()
    .trim()
    .min(8, "Please provide a valid phone number")
    .max(20),

  addressLine: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(250),

  city: z
    .string()
    .trim()
    .min(2)
    .max(100),

  district: z
    .string()
    .trim()
    .min(2)
    .max(100),

  postalCode: z
    .string()
    .trim()
    .max(15)
    .optional(),

  country: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .default("Bangladesh"),
});

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,

  paymentMethod: z.enum(["cod", "online"]),

  paymentProvider: z
    .enum(["sslcommerz", "bkash", "nagad", "stripe", "other"])
    .optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "online" && !data.paymentProvider) {
    ctx.addIssue({
      code: "custom",
      path: ["paymentProvider"],
      message: "Payment provider is required for online payment",
    });
  }

  if (data.paymentMethod === "cod" && data.paymentProvider) {
    ctx.addIssue({
      code: "custom",
      path: ["paymentProvider"],
      message: "Payment provider is not required for COD",
    });
  }
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Cancellation reason cannot exceed 500 characters")
    .optional(),
});

export { objectIdSchema };
