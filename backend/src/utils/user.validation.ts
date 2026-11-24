
import { z } from "zod";

// Profile update validation
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters")
      .optional(),

    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .toLowerCase()
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.email !== undefined,
    {
      message: "Provide at least one field to update",
    }
  );

// Change password validation
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required")
      .max(128),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "New password cannot exceed 128 characters"),
  })
  .strict()
  .refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }
  );

export type UpdateProfileInput = z.infer<
  typeof updateProfileSchema
>;

export type ChangePasswordInput = z.infer<
  typeof changePasswordSchema
>;
