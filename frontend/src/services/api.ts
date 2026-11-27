import axios, { type AxiosError } from "axios";

import { ApiError, type FieldError } from "@/utils/errors";

export const AUTH_EXPIRED_EVENT = "dream-shop:auth-expired";

export type AuthEndReason = "expired" | "blocked";

const SAFE_METHODS = new Set(["get", "head", "options"]);

// One axios instance for the whole app.
// - withCredentials: the JWT lives in an HTTP-only cookie we never read.
// - A long timeout tolerates a sleeping free-tier backend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  withCredentials: true,
  timeout: 60_000,
});

// The backend rejects state-changing requests without this header.
api.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();

  if (!SAFE_METHODS.has(method)) {
    config.headers.set("X-CSRF-Protection", "1");
  }

  return config;
});

interface ErrorBody {
  message?: string;
  errors?: FieldError[];
}

const toApiError = (error: unknown): ApiError => {
  if (!axios.isAxiosError(error)) {
    return new ApiError(
      error instanceof Error ? error.message : "Unexpected error"
    );
  }

  const axiosError = error as AxiosError<ErrorBody>;
  const response = axiosError.response;

  if (!response) {
    return new ApiError(
      axiosError.code === "ECONNABORTED"
        ? "The server took too long to respond. Please try again."
        : "Cannot reach the server. Check your connection and try again.",
      0,
      [],
      true
    );
  }

  const body = response.data;

  return new ApiError(
    body?.message ?? "Request failed",
    response.status,
    Array.isArray(body?.errors) ? body.errors : []
  );
};

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    const url = axios.isAxiosError(error) ? (error.config?.url ?? "") : "";

    // The session ended during a protected call. Auth endpoints handle
    // their own errors (wrong password, not logged in, blocked at login).
    if (!url.startsWith("/auth/")) {
      if (apiError.status === 401) {
        window.dispatchEvent(
          new CustomEvent<AuthEndReason>(AUTH_EXPIRED_EVENT, {
            detail: "expired",
          })
        );
      } else if (
        apiError.status === 403 &&
        /account is blocked/i.test(apiError.message)
      ) {
        window.dispatchEvent(
          new CustomEvent<AuthEndReason>(AUTH_EXPIRED_EVENT, {
            detail: "blocked",
          })
        );
      }
    }

    return Promise.reject(apiError);
  }
);

// Drop undefined / empty values so they are not sent as query parameters.
export const cleanParams = (
  params: object
): Record<string, string | number | boolean> => {
  const result: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value;
    }
  }

  return result;
};
