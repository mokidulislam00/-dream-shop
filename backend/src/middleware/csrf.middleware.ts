import { Request, Response, NextFunction } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const CSRF_HEADER_NAME = "X-CSRF-Protection";
const CSRF_HEADER_VALUE = "1";

// Read the same comma-separated frontend origin list used by app.ts.
const getFrontendOrigins = (): Set<string> => {
  const frontendURLs = (
    process.env.FRONTEND_URL || "http://localhost:3000"
  )
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const origins = new Set<string>();

  for (const frontendURL of frontendURLs) {
    try {
      origins.add(new URL(frontendURL).origin);
    } catch {
      // Invalid configured URLs are rejected by validateEnv at startup.
    }
  }

  return origins;
};

// Verify request origin against every configured frontend origin.
const isTrustedOrigin = (req: Request): boolean => {
  const allowedOrigins = getFrontendOrigins();

  if (allowedOrigins.size === 0) {
    return false;
  }

  const origin = req.get("origin");

  // Browser requests normally include Origin. The literal "null"
  // origin is not trusted.
  if (origin) {
    if (origin === "null") {
      return false;
    }

    try {
      return allowedOrigins.has(new URL(origin).origin);
    } catch {
      return false;
    }
  }

  const referer = req.get("referer");

  if (referer) {
    try {
      return allowedOrigins.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  // Non-browser API clients such as Postman do not always send Origin
  // or Referer. They must still provide the custom CSRF header.
  return true;
};

// CSRF protection middleware
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const csrfHeader = req.get(CSRF_HEADER_NAME);

  if (csrfHeader !== CSRF_HEADER_VALUE) {
    res.status(403).json({
      success: false,
      message: "Missing or invalid CSRF protection header",
    });
    return;
  }

  if (!isTrustedOrigin(req)) {
    res.status(403).json({
      success: false,
      message: "Untrusted request origin",
    });
    return;
  }

  next();
};
