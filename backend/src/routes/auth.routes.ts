
import { Router } from "express";
import rateLimit from "express-rate-limit";

import { authenticate } from "../middleware/auth.middleware";

import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/auth.controller";

import validate from "../middleware/validate";

import {
  registerSchema,
  loginSchema,
} from "../utils/validation";

const router = Router();

// Registration rate limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again after an hour.",
  },
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// Customer registration
router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  register
);

// User login
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  login
);

// User logout
router.post("/logout", logout);

// Get current authenticated user
router.get("/me", authenticate, getMe);

export default router;
