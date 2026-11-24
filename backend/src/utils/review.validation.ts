
import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),

  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),

  comment: z
    .string()
    .trim()
    .min(3, "Review must be at least 3 characters")
    .max(1000, "Review cannot exceed 1000 characters"),
});

export const updateReviewSchema = z
  .object({
    rating: z
      .number()
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5")
      .optional(),

    comment: z
      .string()
      .trim()
      .min(3, "Review must be at least 3 characters")
      .max(1000, "Review cannot exceed 1000 characters")
      .optional(),
  })
  .refine(
    (data) =>
      data.rating !== undefined || data.comment !== undefined,
    {
      message: "At least one field is required",
    }
  );
