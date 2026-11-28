import { z } from "zod";

// Rules mirror the backend validation (utils/review.validation.ts).
// The form only offers whole-star ratings from 1 to 5.
export const reviewSchema = z.object({
  rating: z
    .number({
      required_error: "Please choose a rating",
      invalid_type_error: "Please choose a rating",
    })
    .int()
    .min(1, "Please choose a rating")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .trim()
    .min(3, "Review must be at least 3 characters")
    .max(1000, "Review cannot exceed 1000 characters"),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
