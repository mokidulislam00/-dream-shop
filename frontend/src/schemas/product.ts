import { z } from "zod";

// Rules mirror the backend validation (utils/product.validation.ts).
// Numbers are kept as strings in the form and converted on submit.

const isPositive = (value: string): boolean =>
  value !== "" && Number.isFinite(Number(value)) && Number(value) > 0;

export const productFormSchema = z
  .object({
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
      .string()
      .trim()
      .refine(isPositive, "Price must be greater than 0"),
    discountPrice: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || isPositive(value),
        "Discount price must be greater than 0"
      ),
    category: z.string().min(1, "Choose a category"),
    brand: z.string().trim().max(100, "Brand cannot exceed 100 characters"),
    sku: z
      .string()
      .trim()
      .min(2, "SKU must be at least 2 characters")
      .max(64, "SKU cannot exceed 64 characters"),
    stock: z
      .string()
      .trim()
      .regex(/^\d+$/, "Stock must be a whole number, 0 or more"),
    status: z.enum(["active", "inactive", "out_of_stock"]),
    isFeatured: z.boolean(),
  })
  .superRefine((values, context) => {
    if (
      values.discountPrice !== "" &&
      Number(values.discountPrice) >= Number(values.price)
    ) {
      context.addIssue({
        code: "custom",
        path: ["discountPrice"],
        message: "Discount price must be lower than the regular price",
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
