
import express, {
  Application,
  Request,
  Response,
} from "express";

import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

// Routes
import adminRoutes from "./routes/admin.routes";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import reviewRoutes from "./routes/review.routes";
import userRoutes from "./routes/user.routes";

// Error middleware
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/error.middleware";

// CSRF middleware
import {
  csrfProtection,
} from "./middleware/csrf.middleware";

const app: Application = express();

// ==========================================
// 1. APPLICATION CONFIGURATION
// ==========================================

// Disable Express fingerprinting
app.disable("x-powered-by");

// Trust Render reverse proxy in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ==========================================
// 2. SECURITY HEADERS
// ==========================================

app.use(helmet());

// ==========================================
// 3. CORS CONFIGURATION
// ==========================================

// Supports multiple comma-separated frontend URLs
const configuredOrigins = (
  process.env.FRONTEND_URL || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Normalize configured origins
const allowedOrigins = new Set<string>();

for (const origin of configuredOrigins) {
  try {
    allowedOrigins.add(new URL(origin).origin);
  } catch {
    throw new Error(
      `Invalid FRONTEND_URL origin: ${origin}`
    );
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin (Postman/server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      // Do not grant CORS access to unknown origins
      callback(null, false);
    },

    credentials: true,

    methods: [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Protection",
    ],

    optionsSuccessStatus: 204,
  })
);

// ==========================================
// 4. API HEALTH CHECK
// ==========================================

// Basic liveness endpoint.
// Database readiness will be checked separately.
app.get(
  "/api/health",
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Dream Shop API is running",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }
);

// ==========================================
// 5. GENERAL API RATE LIMITING
// ==========================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Maximum 300 requests per IP within 15 minutes
  limit: 300,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  },
});

// Apply to all API routes except health check above
app.use("/api", apiLimiter);

// ==========================================
// 6. AUTHENTICATION RATE LIMITING
// ==========================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Maximum 10 failed authentication attempts per IP
  limit: 10,

  // Only failed requests count toward the limit
  skipSuccessfulRequests: true,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message:
        "Too many authentication attempts. Please try again later.",
    });
  },
});

// ==========================================
// 7. REQUEST BODY PARSING
// ==========================================

// Limit JSON payload size
app.use(
  express.json({
    limit: "1mb",
  })
);

// Limit URL-encoded payload size
app.use(
  express.urlencoded({
    extended: true,
    limit: "100kb",
    parameterLimit: 1000,
  })
);

// Parse cookies
app.use(cookieParser());

// ==========================================
// 8. CSRF PROTECTION
// ==========================================

// Protect state-changing API requests
app.use("/api", csrfProtection);

// ==========================================
// 9. AUTHENTICATION ROUTES
// ==========================================

// Additional rate limiting for authentication
app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

// ==========================================
// 10. PRODUCT ROUTES
// ==========================================

app.use(
  "/api/products",
  productRoutes
);

// ==========================================
// 11. CATEGORY ROUTES
// ==========================================

app.use(
  "/api/categories",
  categoryRoutes
);

// ==========================================
// 12. CART ROUTES
// ==========================================

app.use(
  "/api/cart",
  cartRoutes
);

// ==========================================
// 13. ORDER ROUTES
// ==========================================

app.use(
  "/api/orders",
  orderRoutes
);
app.use("/api/users", userRoutes);
// ==========================================
// 14. WISHLIST ROUTES
// ==========================================

app.use(
  "/api/wishlist",
  wishlistRoutes
);

// ==========================================
// 15. REVIEW & RATING ROUTES
// ==========================================

app.use(
  "/api/reviews",
  reviewRoutes
);

// ==========================================
// 16. ADMIN ROUTES
// ==========================================

app.use(
  "/api/admin",
  adminRoutes
);

// ==========================================
// 17. NOT FOUND HANDLER
// ==========================================

app.use(notFoundHandler);

// ==========================================
// 18. GLOBAL ERROR HANDLER
// ==========================================

app.use(errorHandler);

export default app;
