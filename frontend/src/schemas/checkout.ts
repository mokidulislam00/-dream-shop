import { z } from "zod";

// Rules mirror the backend shipping address validation.
export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .min(8, "Please provide a valid phone number")
    .max(20, "Phone number cannot exceed 20 characters")
    .regex(/^[0-9+\-()\s]+$/, "Use digits, spaces and + - ( ) only"),
  addressLine: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(250, "Address cannot exceed 250 characters"),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City cannot exceed 100 characters"),
  district: z
    .string()
    .trim()
    .min(2, "District must be at least 2 characters")
    .max(100, "District cannot exceed 100 characters"),
  postalCode: z
    .string()
    .trim()
    .max(15, "Postal code cannot exceed 15 characters"),
  country: z
    .string()
    .trim()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country cannot exceed 100 characters"),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
