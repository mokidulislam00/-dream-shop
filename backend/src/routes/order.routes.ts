
import { Router } from "express";

import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  confirmCODPayment,
} from "../controllers/order.controller";

import {
  authenticate,
  requireAdmin,
} from "../middleware/auth.middleware";

import validate from "../middleware/validate";

import {
  createOrderSchema,
  cancelOrderSchema,
} from "../utils/order.validation";

const router = Router();

// All order routes require authentication
router.use(authenticate);

// ==========================================
// CUSTOMER ROUTES
// ==========================================

// Create order from cart
router.post(
  "/",
  validate(createOrderSchema),
  createOrder
);

// Get logged-in customer's orders
router.get(
  "/my-orders",
  getMyOrders
);

// Cancel own order with optional cancellation reason
router.patch(
  "/:id/cancel",
  validate(cancelOrderSchema),
  cancelOrder
);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all orders
router.get(
  "/admin/all",
  requireAdmin,
  getAllOrders
);

// Get any single order (admin)
router.get(
  "/admin/:id",
  requireAdmin,
  getAdminOrderById
);

// Update order status
router.patch(
  "/admin/:id/status",
  requireAdmin,
  updateOrderStatus
);

// Confirm COD payment
router.patch(
  "/admin/:id/cod-payment",
  requireAdmin,
  confirmCODPayment
);

// ==========================================
// SINGLE ORDER ROUTE
// ==========================================

// Get a single order belonging to logged-in user
router.get(
  "/:id",
  getOrderById
);

export default router;
