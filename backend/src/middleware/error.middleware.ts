import {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";

import mongoose from "mongoose";
import multer from "multer";

// Handle invalid API routes without echoing query strings that may contain
// sensitive values.
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
};

const getCustomStatusCode = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return null;
  }

  const statusCode = (error as { statusCode?: unknown }).statusCode;

  if (
    typeof statusCode === "number" &&
    Number.isInteger(statusCode) &&
    statusCode >= 400 &&
    statusCode <= 599
  ) {
    return statusCode;
  }

  return null;
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error
    ? error.message
    : "Request failed";
};

// Centralized error handling middleware
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(error);
    return;
  }

  // Mongoose validation errors
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(error.errors).map((item) => ({
        field: item.path,
        message: item.message,
      })),
    });
    return;
  }

  // Invalid MongoDB ObjectId
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: "Invalid resource ID",
    });
    return;
  }

  // MongoDB duplicate key error
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "Duplicate value already exists",
    });
    return;
  }

  // Multer upload errors
  if (error instanceof multer.MulterError) {
    const isFileTooLarge = error.code === "LIMIT_FILE_SIZE";

    res.status(isFileTooLarge ? 413 : 400).json({
      success: false,
      message: isFileTooLarge
        ? "Uploaded file exceeds the maximum allowed size"
        : error.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field"
          : "Invalid file upload request",
    });
    return;
  }

  // Express/body-parser payload too large error
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    res.status(413).json({
      success: false,
      message: "Request payload is too large",
    });
    return;
  }

  // Preserve deliberate application HTTP errors (for example, the
  // sendError helper used by order transactions).
  const customStatusCode = getCustomStatusCode(error);

  if (customStatusCode !== null) {
    const isServerError = customStatusCode >= 500;
    const isProduction = process.env.NODE_ENV === "production";

    res.status(customStatusCode).json({
      success: false,
      message:
        isServerError && isProduction
          ? "Internal server error"
          : getErrorMessage(error),
    });
    return;
  }

  // Generic server error
  console.error("Unhandled application error:", error);

  const isProduction = process.env.NODE_ENV === "production";

  res.status(500).json({
    success: false,
    message:
      !isProduction && error instanceof Error
        ? error.message
        : "Internal server error",
  });
};
