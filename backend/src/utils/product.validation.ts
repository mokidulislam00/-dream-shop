
import { z } from "zod";

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID");

// Product status validation
const productStatusSchema = z.enum([
  "active",
  "inactive",
  "out_of_stock",
]);

// Product fields
const productFields = {
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters"),

  price: z
    .number()
    .positive("Price must be greater than 0"),

  // A discount price of 0 would make the product free, so it must be positive.
  discountPrice: z
    .number()
    .positive("Discount price must be greater than 0")
    .optional(),

  category: objectIdSchema,

  images: z
    .array(
      z.string().trim().url("Each image must be a valid URL")
    )
    .max(10, "A product cannot have more than 10 images"),

  brand: z
    .string()
    .trim()
    .max(100, "Brand cannot exceed 100 characters")
    .optional(),

  sku: z
    .string()
    .trim()
    .min(2, "SKU must be at least 2 characters")
    .max(64, "SKU cannot exceed 64 characters"),

  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),

  status: productStatusSchema.optional(),

  isFeatured: z.boolean().optional(),
};

// Validate discount price
const validateDiscountPrice = (
  data: {
    price?: number;
    discountPrice?: number | null;
  },
  ctx: z.RefinementCtx
): void => {
  if (
    data.price !== undefined &&
    data.discountPrice !== undefined &&
    data.discountPrice !== null &&
    data.discountPrice >= data.price
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["discountPrice"],
      message: "Discount price must be lower than regular price",
    });
  }
};

// Create product validation
export const createProductSchema = z
  .object(productFields)
  .superRefine(validateDiscountPrice);

// Update product validation
// On update, discountPrice may be null to remove an existing discount.
export const updateProductSchema = z
  .object({
    ...productFields,
    discountPrice: z
      .number()
      .positive("Discount price must be greater than 0")
      .nullable()
      .optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field is required to update a product",
      });
    }

    validateDiscountPrice(data, ctx);
  });
