export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldError[];
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    status = 0,
    fieldErrors: FieldError[] = [],
    isNetworkError = false
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.isNetworkError = isNetworkError;
  }
}

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const isClientError = (error: unknown): boolean =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;
