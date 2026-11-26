
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Order, {
  IOrder,
  IOrderItem,
  IShippingAddress,
} from "../models/Order";

import Cart from "../models/Cart";
import Product from "../models/Product";
import User from "../models/User";

import { sendEmail } from "../utils/email.helpers";
import { orderConfirmationEmailTemplate } from "../templates/order.email.templates";
import { orderStatusUpdateEmailTemplate } from "../templates/order.status.email.templates";

const SHIPPING_COST = 0;

const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof orderStatuses)[number];

const paymentMethods = ["cod", "online"] as const;

type PaymentMethod = (typeof paymentMethods)[number];

const paymentProviders = [
  "sslcommerz",
  "bkash",
  "nagad",
  "stripe",
  "other",
] as const;

type PaymentProvider = (typeof paymentProviders)[number];

// Allowed order status transitions
const allowedTransitions: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  pending: ["confirmed"],
  confirmed: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// Custom error helper
const sendError = (
  message: string,
  statusCode: number
): Error & { statusCode: number } => {
  const error = new Error(message) as Error & {
    statusCode: number;
  };

  error.statusCode = statusCode;

  return error;
};

// Strict ObjectId validation
const isValidObjectId = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-fA-F]{24}$/.test(value)
  );
};

// Get authenticated user ID
const getAuthenticatedUserId = (
  res: Response
): string | null => {
  const user = res.locals.user as
    | { _id?: unknown }
    | undefined;

  if (!user?._id) {
    return null;
  }

  const userId = String(user._id);

  return isValidObjectId(userId) ? userId : null;
};

// Validate pagination parameters
const parsePagination = (
  value: unknown,
  defaultValue: number,
  maximum: number
): number | null => {
  if (value === undefined) {
    return defaultValue;
  }

  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value)
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1 ||
    parsed > maximum
  ) {
    return null;
  }

  return parsed;
};

// Validate order status
const isValidOrderStatus = (
  value: unknown
): value is OrderStatus => {
  return (
    typeof value === "string" &&
    (orderStatuses as readonly string[]).includes(value)
  );
};

// Validate payment method
const isValidPaymentMethod = (
  value: unknown
): value is PaymentMethod => {
  return (
    typeof value === "string" &&
    (paymentMethods as readonly string[]).includes(value)
  );
};

// Validate payment provider
const isValidPaymentProvider = (
  value: unknown
): value is PaymentProvider => {
  return (
    typeof value === "string" &&
    (paymentProviders as readonly string[]).includes(value)
  );
};

// ==========================================
// 1. CREATE ORDER FROM CART
// ==========================================

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const body = req.body as {
      shippingAddress?: IShippingAddress;
      paymentMethod?: unknown;
      paymentProvider?: unknown;
    };

    const {
      shippingAddress,
      paymentMethod,
      paymentProvider,
    } = body;

    // Validate payment method
    if (!isValidPaymentMethod(paymentMethod)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
      return;
    }

    if (
      !shippingAddress ||
      typeof shippingAddress !== "object"
    ) {
      res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
      return;
    }

    // Validate payment provider
    let validatedPaymentProvider: PaymentProvider | undefined;

    if (paymentMethod === "online") {
      if (!isValidPaymentProvider(paymentProvider)) {
        res.status(400).json({
          success: false,
          message: "Valid payment provider is required",
        });
        return;
      }

      validatedPaymentProvider = paymentProvider;
    } else if (paymentProvider !== undefined) {
      res.status(400).json({
        success: false,
        message: "Payment provider is not required for COD",
      });
      return;
    }

    // Start MongoDB transaction
    const session = await mongoose.startSession();
    const orderResult: { value: IOrder | null } = {
      value: null,
    };

    try {
      await session.withTransaction(async () => {
        // Get only the logged-in user's cart
        const cart = await Cart.findOne({
          user: userId,
        }).session(session);

        if (!cart || cart.items.length === 0) {
          throw sendError("Your cart is empty", 400);
        }

        const orderItems: IOrderItem[] = [];

        let subtotal = 0;

        // Build order from current database products
        for (const cartItem of cart.items) {
          if (
            !Number.isSafeInteger(cartItem.quantity) ||
            cartItem.quantity < 1
          ) {
            throw sendError("Invalid cart quantity", 400);
          }

          const product = await Product.findOne({
            _id: cartItem.product,
            status: "active",
          }).session(session);

          if (!product) {
            throw sendError(
              "One or more products are unavailable",
              400
            );
          }

          // Validate available stock
          if (product.stock < cartItem.quantity) {
            throw sendError(
              `Insufficient stock for ${product.name}`,
              400
            );
          }

          // Always use current database price
          const currentPrice =
            product.discountPrice ?? product.price;

          if (
            !Number.isFinite(currentPrice) ||
            currentPrice < 0
          ) {
            throw sendError(
              `Invalid price for ${product.name}`,
              400
            );
          }

          const itemSubtotal =
            currentPrice * cartItem.quantity;

          if (!Number.isFinite(itemSubtotal)) {
            throw sendError("Invalid order calculation", 400);
          }

          orderItems.push({
            product: product._id,
            name: product.name,
            image: product.images?.[0],
            sku: product.sku,
            quantity: cartItem.quantity,
            price: currentPrice,
            subtotal: itemSubtotal,
          });

          subtotal += itemSubtotal;
        }

        if (!Number.isFinite(subtotal) || subtotal < 0) {
          throw sendError("Invalid order subtotal", 400);
        }

        // Deduct stock atomically
        for (const item of orderItems) {
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.product,
              status: "active",
              stock: {
                $gte: item.quantity,
              },
            },
            {
              $inc: {
                stock: -item.quantity,
              },
            },
            {
              new: true,
              session,
            }
          );

          if (!updatedProduct) {
            throw sendError(
              `Insufficient stock for ${item.name}`,
              400
            );
          }

          // Mark product out of stock
          if (updatedProduct.stock === 0) {
            await Product.updateOne(
              {
                _id: item.product,
                status: "active",
              },
              {
                $set: {
                  status: "out_of_stock",
                },
              },
              {
                session,
              }
            );
          }
        }

        // Calculate order total on the server
        const totalAmount = subtotal + SHIPPING_COST;

        if (!Number.isFinite(totalAmount)) {
          throw sendError("Invalid order total", 400);
        }

        // Create order inside transaction
        const orders = await Order.create(
          [
            {
              user: userId,
              items: orderItems,
              shippingAddress,
              paymentMethod,
              paymentProvider: validatedPaymentProvider,
              paymentStatus: "pending",
              orderStatus: "pending",
              subtotal,
              shippingCost: SHIPPING_COST,
              totalAmount,
            },
          ],
          {
            session,
          }
        );

        orderResult.value = orders[0];

        // Clear cart after successful order creation
        cart.items = [];

        await cart.save({
          session,
        });
      });
    } finally {
      // Release the MongoDB session before performing external email I/O.
      await session.endSession();
    }

    const createdOrder = orderResult.value;

    if (!createdOrder) {
      throw new Error("Order creation failed");
    }

    // Send order confirmation email after the transaction commits.
    // Email failure must not undo or fail an already-created order.
    try {
      const customer = await User.findById(userId).select(
        "fullName email"
      );

      if (customer?.email) {
        const emailItems = createdOrder.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        }));

        const itemsText = emailItems
          .map(
            (item) =>
              `- ${item.name} | Quantity: ${item.quantity} | Unit price: ৳${item.price.toFixed(2)} | Subtotal: ৳${item.subtotal.toFixed(2)}`
          )
          .join("\n");

        await sendEmail({
          to: customer.email,
          subject: `Order Confirmation - #${createdOrder._id.toString()}`,
          html: orderConfirmationEmailTemplate({
            customerName: customer.fullName,
            orderId: createdOrder._id.toString(),
            items: emailItems,
            subtotal: createdOrder.subtotal,
            shippingCost: createdOrder.shippingCost,
            totalAmount: createdOrder.totalAmount,
            paymentMethod: createdOrder.paymentMethod,
            orderStatus: createdOrder.orderStatus,
          }),
          text: `Hi ${customer.fullName},

Thank you for shopping with Dream Shop. Your order has been placed successfully.

Order ID: ${createdOrder._id.toString()}
Order Status: ${createdOrder.orderStatus}
Payment Method: ${createdOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}

Items:
${itemsText}

Subtotal: ৳${createdOrder.subtotal.toFixed(2)}
Shipping: ৳${createdOrder.shippingCost.toFixed(2)}
Total: ৳${createdOrder.totalAmount.toFixed(2)}

Thank you for choosing Dream Shop!
Dream Shop Team`,
        });
      } else {
        console.warn(
          `[EMAIL] Order confirmation skipped: customer email not found for user ${userId}`
        );
      }
    } catch (emailError) {
      console.error(
        "[EMAIL] Order confirmation email delivery failed:",
        emailError
      );
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. GET LOGGED-IN USER'S ORDERS
// ==========================================

export const getMyOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Validate pagination
    const page = parsePagination(
      req.query.page,
      1,
      1000000
    );

    const limit = parsePagination(
      req.query.limit,
      10,
      100
    );

    if (page === null || limit === null) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
      return;
    }

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
      return;
    }

    const [orders, totalOrders] = await Promise.all([
      Order.find({
        user: userId,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Order.countDocuments({
        user: userId,
      }),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        totalOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        pageSize: limit,
      },
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. GET SINGLE ORDER
// ==========================================

export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
      return;
    }

    // Customer can only access their own order
    const order = await Order.findOne({
      _id: id,
      user: userId,
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. CANCEL ORDER WITH REASON
// ==========================================

export const cancelOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(res);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
      return;
    }

    // Read optional cancellation reason
    const body = req.body as {
      reason?: unknown;
    };

    const reason = body?.reason;

    if (
      reason !== undefined &&
      (
        typeof reason !== "string" ||
        reason.trim().length > 500
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid cancellation reason",
      });
      return;
    }

    const cancellationReason =
      typeof reason === "string"
        ? reason.trim()
        : "";

    const session = await mongoose.startSession();

    try {
      let cancelledOrder: IOrder | null = null;

      await session.withTransaction(async () => {
        // Find only the logged-in user's order
        const order = await Order.findOne({
          _id: id,
          user: userId,
        }).session(session);

        if (!order) {
          throw sendError("Order not found", 404);
        }

        // Only pending and confirmed orders can be cancelled
        if (
          !["pending", "confirmed"].includes(order.orderStatus)
        ) {
          throw sendError(
            "This order cannot be cancelled",
            400
          );
        }

        // Paid orders require refund process
        if (order.paymentStatus === "paid") {
          throw sendError(
            "Paid orders require a refund process",
            400
          );
        }

        // Restore product stock inside transaction
        for (const item of order.items) {
          const restoredProduct =
            await Product.findByIdAndUpdate(
              item.product,
              {
                $inc: {
                  stock: item.quantity,
                },
              },
              {
                new: true,
                session,
              }
            );

          // Reactivate a product if stock becomes available
          if (
            restoredProduct &&
            restoredProduct.status === "out_of_stock" &&
            restoredProduct.stock > 0
          ) {
            await Product.updateOne(
              {
                _id: item.product,
                status: "out_of_stock",
                stock: {
                  $gt: 0,
                },
              },
              {
                $set: {
                  status: "active",
                },
              },
              {
                session,
              }
            );
          }
        }

        // Update order status
        order.orderStatus = "cancelled";

        // Save optional cancellation reason
        if (cancellationReason) {
          order.cancellationReason = cancellationReason;
        }

        await order.save({
          session,
        });

        cancelledOrder = order;
      });

      res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        order: cancelledOrder,
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. ADMIN: GET ALL ORDERS
// ==========================================

export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate pagination
    const page = parsePagination(
      req.query.page,
      1,
      1000000
    );

    const limit = parsePagination(
      req.query.limit,
      10,
      100
    );

    if (page === null || limit === null) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
      return;
    }

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
      return;
    }

    const filter: {
      orderStatus?: OrderStatus;
    } = {};

    // Filter by order status
    const status = req.query.status;

    if (status !== undefined) {
      if (!isValidOrderStatus(status)) {
        res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
        return;
      }

      filter.orderStatus = status;
    }

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        totalOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        pageSize: limit,
      },
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. ADMIN: UPDATE ORDER STATUS
// ==========================================

export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
      return;
    }

    const requestedStatus = req.body?.orderStatus;

    if (!isValidOrderStatus(requestedStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
      return;
    }

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // Cancellation must use the cancellation process
    if (requestedStatus === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Use the order cancellation process instead",
      });
      return;
    }

    // Enforce valid status transitions
    const allowedNextStatuses =
      allowedTransitions[order.orderStatus];

    if (!allowedNextStatuses.includes(requestedStatus)) {
      res.status(400).json({
        success: false,
        message:
          `Invalid order status transition from ${order.orderStatus} to ${requestedStatus}`,
      });
      return;
    }

    // Prevent delivery of unpaid online orders
    if (
      requestedStatus === "delivered" &&
      order.paymentMethod === "online" &&
      order.paymentStatus !== "paid"
    ) {
      res.status(400).json({
        success: false,
        message: "Online payment must be completed before delivery",
      });
      return;
    }

    order.orderStatus = requestedStatus;

    await order.save();

    // Notify the customer after the order status has been saved.
    // Email delivery failure must not undo or fail the status update.
    try {
      const customer = await User.findById(order.user).select(
        "fullName email"
      );

      if (customer?.email) {
        const emailItems = order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        }));

        const paymentMethodLabel =
          order.paymentMethod === "cod"
            ? "Cash on Delivery"
            : "Online Payment";

        const itemsText = emailItems
          .map(
            (item) =>
              `- ${item.name} | Quantity: ${item.quantity} | Unit price: ৳${item.price.toFixed(2)} | Subtotal: ৳${item.subtotal.toFixed(2)}`
          )
          .join("\n");

        await sendEmail({
          to: customer.email,
          subject: `Dream Shop Order Update - ${requestedStatus.toUpperCase()}`,
          html: orderStatusUpdateEmailTemplate({
            customerName: customer.fullName,
            orderId: order._id.toString(),
            orderStatus: requestedStatus,
            items: emailItems,
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            totalAmount: order.totalAmount,
            paymentMethod: paymentMethodLabel,
          }),
          text: `Hi ${customer.fullName},

Your Dream Shop order status has been updated.

Order ID: ${order._id.toString()}
New Order Status: ${requestedStatus.toUpperCase()}
Payment Method: ${paymentMethodLabel}

Items:
${itemsText}

Subtotal: ৳${order.subtotal.toFixed(2)}
Shipping: ৳${order.shippingCost.toFixed(2)}
Total: ৳${order.totalAmount.toFixed(2)}

Thank you for choosing Dream Shop!
Dream Shop Team`,
        });

        console.log(
          `[EMAIL] Order status update email sent to ${customer.email} (${requestedStatus})`
        );
      } else {
        console.warn(
          `[EMAIL] Order status update skipped: customer email not found for order ${order._id.toString()}`
        );
      }
    } catch (emailError) {
      console.error(
        "[EMAIL] Order status update email delivery failed:",
        emailError
      );
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. ADMIN: CONFIRM COD PAYMENT
// ==========================================

export const confirmCODPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
      return;
    }

    // Atomically confirm delivered COD payment
    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "delivered",
      },
      {
        $set: {
          paymentStatus: "paid",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      const existingOrder = await Order.findById(id);

      if (!existingOrder) {
        res.status(404).json({
          success: false,
          message: "Order not found",
        });
        return;
      }

      if (existingOrder.paymentMethod !== "cod") {
        res.status(400).json({
          success: false,
          message: "Only COD orders can use this endpoint",
        });
        return;
      }

      if (existingOrder.orderStatus !== "delivered") {
        res.status(400).json({
          success: false,
          message: "Only delivered orders can be marked as paid",
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: "Payment is not pending",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "COD payment confirmed successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};
