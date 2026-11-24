
import { z } from "zod";

// MongoDB ObjectId validation
const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID");

// Category status validation
const categoryStatusSchema = z.enum([
  "active",
  "inactive",
]);

// Category fields
const categoryFields = {
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  image: z
    .string()
    .trim()
    .url("Please provide a valid image URL")
    .refine(
      (value) => /^https?:\/\//i.test(value),
      "Image URL must use HTTP or HTTPS"
    )
    .optional(),

  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),

  parentCategory: objectIdSchema.nullable().optional(),

  status: categoryStatusSchema.optional(),
};

// Validate category creation
export const createCategorySchema = z.object(categoryFields);

// Validate category update
export const updateCategorySchema = z
  .object(categoryFields)
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field is required to update a category",
      });
    }
  });
