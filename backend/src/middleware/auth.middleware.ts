import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import User from "../models/User";

const AUTH_COOKIE_NAME = "dream_shop_access_token";

// Authenticated user middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token || typeof token !== "string") {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
      });
      return;
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    let decoded: JwtPayload;

    try {
      const verified = jwt.verify(token, secret, {
        algorithms: ["HS256"],
      });

      if (
        typeof verified !== "object" ||
        verified === null ||
        Array.isArray(verified)
      ) {
        res.status(401).json({
          success: false,
          message: "Invalid authentication token",
        });
        return;
      }

      decoded = verified;
    } catch {
      res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
      return;
    }

    if (
      typeof decoded.userId !== "string" ||
      !/^[a-f\d]{24}$/i.test(decoded.userId)
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    // Support legacy tokens that were issued before tokenVersion existed.
    const tokenVersion =
      decoded.tokenVersion === undefined ? 0 : decoded.tokenVersion;

    if (
      typeof tokenVersion !== "number" ||
      !Number.isSafeInteger(tokenVersion) ||
      tokenVersion < 0
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account not found",
      });
      return;
    }

    if (user.tokenVersion !== tokenVersion) {
      res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
      return;
    }

    if (user.accountStatus !== "active") {
      res.status(403).json({
        success: false,
        message: "Your account is blocked",
      });
      return;
    }

    res.locals.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    res.status(500).json({
      success: false,
      message: "Authentication failed due to a server error",
    });
  }
};

// Admin authorization middleware
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = res.locals.user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }

  next();
};
