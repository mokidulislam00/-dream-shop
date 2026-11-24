import { Response, CookieOptions } from "express";
import jwt, { SignOptions } from "jsonwebtoken";

import { IUser } from "../models/User";

const AUTH_COOKIE_NAME = "dream_shop_access_token";

const getTokenExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN?.trim() || "1d";
};

// Convert the supported JWT duration format into cookie maxAge.
// Supported units match the validation in config/env.ts.
const getTokenMaxAge = (): number => {
  const duration = getTokenExpiresIn();
  // jsonwebtoken treats a numeric string without a unit as milliseconds.
  const numericDuration = /^\d+$/.test(duration);
  const match = /^(\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|seconds?|m|minutes?|h|hours?|d|days?|w|weeks?|y|years?)$/i.exec(duration);

  if (!numericDuration && !match) {
    throw new Error(
      "JWT_EXPIRES_IN must be a positive duration such as 15m, 1h, or 1d"
    );
  }

  const amount = Number(numericDuration ? duration : match?.[1]);
  const unit = numericDuration ? "ms" : (match?.[2].toLowerCase() || "ms");

  const unitMultipliers: Record<string, number> = {
    ms: 1,
    millisecond: 1,
    milliseconds: 1,
    s: 1000,
    second: 1000,
    seconds: 1000,
    m: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    h: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
  };

  const maxAge = amount * unitMultipliers[unit];

  if (
    !Number.isFinite(amount) ||
    amount < 1 ||
    !Number.isSafeInteger(maxAge) ||
    maxAge < 1
  ) {
    throw new Error("JWT_EXPIRES_IN is outside the supported range");
  }

  return maxAge;
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

const getCookieOptions = (): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: getTokenMaxAge(),
    path: "/",
  };
};

export const generateToken = (
  userId: string,
  tokenVersion = 0
): string => {
  const options: SignOptions = {
    expiresIn: getTokenExpiresIn() as SignOptions["expiresIn"],
    algorithm: "HS256",
  };

  return jwt.sign(
    { userId, tokenVersion },
    getJwtSecret(),
    options
  );
};

export const sendAuthCookie = (
  res: Response,
  userId: string,
  tokenVersion = 0
): void => {
  const token = generateToken(userId, tokenVersion);

  res.cookie(
    AUTH_COOKIE_NAME,
    token,
    getCookieOptions()
  );
};

// Clear the authentication cookie using the same path and security
// attributes used when setting it.
export const clearAuthCookie = (res: Response): void => {
  const cookieOptions = getCookieOptions();
  delete cookieOptions.maxAge;

  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
};

export const formatUserResponse = (user: IUser) => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
});
