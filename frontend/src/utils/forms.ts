import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { ApiError } from "@/utils/errors";

// Shows backend validation errors next to the matching form fields.
// Returns true when at least one field error was applied.
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: ReadonlyArray<Path<T>>
): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  let applied = false;

  for (const fieldError of error.fieldErrors) {
    const name = fieldError.field as Path<T>;

    if (fields.includes(name)) {
      setError(name, { type: "server", message: fieldError.message });
      applied = true;
    }
  }

  return applied;
}

// Only allow in-app paths when redirecting after sign-in.
export const safeRedirectPath = (value: unknown): string | undefined =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
