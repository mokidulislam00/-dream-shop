import { z } from "zod";

// Rules mirror the backend validation (utils/category.validation.ts).
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens"
    ),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters"),
  image: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
      "Enter a valid image URL starting with http:// or https://"
    ),
  parentCategory: z.string(),
  status: z.enum(["active", "inactive"]),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
