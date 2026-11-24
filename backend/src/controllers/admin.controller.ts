import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import User from "../models/User";
import Product from "../models/Product";
import Order from "../models/Order";

// Inventory and sales analytics configuration
const LOW_STOCK_THRESHOLD = 5;
const REPORT_TIMEZONE = "Asia/Dhaka";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Get Admin Dashboard Analytics
export const getAdminDashboard = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admin = res.locals.user as
      | {
          _id: mongoose.Types.ObjectId;
          fullName: string;
          email: string;
          role: string;
        }
      | undefined;

    if (!admin) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Sales report windows use rolling periods and group dates in Bangladesh time.
    const now = new Date();
    const dailyReportStart = new Date(now.getTime() - 7 * DAY_IN_MS);
    const weeklyReportStart = new Date(now.getTime() - 8 * 7 * DAY_IN_MS);
    const monthlyReportStart = new Date(now.getTime() - 365 * DAY_IN_MS);

    const lowStockFilter = {
      status: "active",
      stock: {
        $gt: 0,
        $lte: LOW_STOCK_THRESHOLD,
      },
    } as const;

    const paidSalesFilter = {
      paymentStatus: "paid",
      orderStatus: { $ne: "cancelled" },
    } as const;

    const [
      totalUsers,
      totalCustomers,
      totalAdmins,
      activeUsers,
      blockedUsers,

      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,

      totalOrders,
      pendingOrdersCount,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,

      revenueStats,
      recentOrders,
      pendingOrdersList,
      bestSellingProducts,

      totalStockStats,
      lowStockProductsCount,
      lowStockProductsList,
      inventoryValueStats,
      dailySalesStats,
      weeklySalesStats,
      monthlySalesStats,
      paymentMethodSalesStats,
    ] = await Promise.all([
      // User statistics
      User.countDocuments(),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ accountStatus: "active" }),
      User.countDocuments({ accountStatus: "blocked" }),

      // Product statistics
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "inactive" }),
      Product.countDocuments({ status: "out_of_stock" }),

      // Order statistics
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: "pending" }),
      Order.countDocuments({ orderStatus: "confirmed" }),
      Order.countDocuments({ orderStatus: "processing" }),
      Order.countDocuments({ orderStatus: "shipped" }),
      Order.countDocuments({ orderStatus: "delivered" }),
      Order.countDocuments({ orderStatus: "cancelled" }),

      // Existing revenue statistics: paid, non-cancelled orders only
      Order.aggregate([
        {
          $match: paidSalesFilter,
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            paidOrders: { $sum: 1 },
          },
        },
      ]),

      // Recent orders
      Order.find()
        .select(
          "user items.name items.quantity items.price items.subtotal shippingAddress orderStatus paymentStatus paymentMethod totalAmount createdAt"
        )
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(5),

      // Pending orders with customer and product details
      Order.find({ orderStatus: "pending" })
        .select(
          "user items.name items.quantity items.price items.subtotal shippingAddress paymentStatus paymentMethod totalAmount createdAt"
        )
        .populate("user", "fullName email")
        .sort({ createdAt: -1 })
        .limit(10),

      // Existing best-selling products: paid, non-cancelled orders only
      Order.aggregate([
        {
          $match: paidSalesFilter,
        },
        {
          $unwind: "$items",
        },
        {
          $group: {
            _id: "$items.product",
            productName: { $first: "$items.name" },
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: "$items.subtotal" },
          },
        },
        {
          $sort: {
            totalSold: -1,
          },
        },
        {
          $limit: 5,
        },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            productName: 1,
            totalSold: 1,
            totalRevenue: 1,
          },
        },
      ]),

      // Inventory: sum of stock units across all products
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalStockUnits: { $sum: "$stock" },
          },
        },
        {
          $project: {
            _id: 0,
            totalStockUnits: 1,
          },
        },
      ]),

      // Low-stock active products (out-of-stock products are reported separately)
      Product.countDocuments(lowStockFilter),

      // A short actionable list of low-stock products
      Product.find(lowStockFilter)
        .select("name sku stock price discountPrice category status updatedAt")
        .populate("category", "name slug")
        .sort({ stock: 1, name: 1 })
        .limit(10),

      // Estimated current retail value of inventory, using discount price when available
      Product.aggregate([
        {
          $group: {
            _id: null,
            estimatedRetailValue: {
              $sum: {
                $multiply: [
                  "$stock",
                  {
                    $ifNull: ["$discountPrice", "$price"],
                  },
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            estimatedRetailValue: 1,
          },
        },
      ]),

      // Daily paid sales for the last 7 rolling days
      Order.aggregate([
        {
          $match: {
            ...paidSalesFilter,
            createdAt: { $gte: dailyReportStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: REPORT_TIMEZONE,
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            totalRevenue: 1,
            totalOrders: 1,
          },
        },
      ]),

      // Weekly paid sales for the last 8 rolling weeks
      Order.aggregate([
        {
          $match: {
            ...paidSalesFilter,
            createdAt: { $gte: weeklyReportStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%G-W%V",
                date: "$createdAt",
                timezone: REPORT_TIMEZONE,
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            week: "$_id",
            totalRevenue: 1,
            totalOrders: 1,
          },
        },
      ]),

      // Monthly paid sales for the last 365 days
      Order.aggregate([
        {
          $match: {
            ...paidSalesFilter,
            createdAt: { $gte: monthlyReportStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
                timezone: REPORT_TIMEZONE,
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            month: "$_id",
            totalRevenue: 1,
            totalOrders: 1,
          },
        },
      ]),

      // Revenue and paid-order count grouped by payment method
      Order.aggregate([
        {
          $match: paidSalesFilter,
        },
        {
          $group: {
            _id: "$paymentMethod",
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            _id: 0,
            paymentMethod: "$_id",
            totalRevenue: 1,
            totalOrders: 1,
          },
        },
      ]),
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue ?? 0;
    const paidOrders = revenueStats[0]?.paidOrders ?? 0;

    const averageOrderValue =
      paidOrders > 0 ? totalRevenue / paidOrders : 0;

    const totalStockUnits = totalStockStats[0]?.totalStockUnits ?? 0;
    const estimatedRetailValue =
      inventoryValueStats[0]?.estimatedRetailValue ?? 0;

    res.status(200).json({
      success: true,
      message: "Admin dashboard data retrieved successfully",

      admin: {
        id: admin._id.toString(),
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },

      dashboard: {
        // Existing user analytics (preserved)
        users: {
          total: totalUsers,
          customers: totalCustomers,
          admins: totalAdmins,
          active: activeUsers,
          blocked: blockedUsers,
        },

        // Existing product analytics (preserved)
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          outOfStock: outOfStockProducts,
        },

        // Existing order analytics (preserved)
        orders: {
          total: totalOrders,
          pending: pendingOrdersCount,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          paid: paidOrders,
        },

        // Existing revenue analytics (preserved)
        revenue: {
          total: totalRevenue,
          paidOrders,
          averageOrderValue: Number(averageOrderValue.toFixed(2)),
        },

        // New inventory analytics
        inventory: {
          totalStockUnits,
          lowStockThreshold: LOW_STOCK_THRESHOLD,
          lowStockCount: lowStockProductsCount,
          lowStockProducts: lowStockProductsList,
          outOfStockProducts: outOfStockProducts,
          estimatedRetailValue: Number(estimatedRetailValue.toFixed(2)),
          valuationBasis: "stock multiplied by current selling price (discount price when available)",
        },

        // New sales analytics
        sales: {
          timezone: REPORT_TIMEZONE,
          revenueBasis: "paid orders excluding cancelled orders",
          dateBasis: "order createdAt; this is not the payment collection timestamp",
          periods: {
            daily: "Last 7 rolling days",
            weekly: "Last 56 rolling days, grouped by ISO week",
            monthly: "Last 365 days, grouped by calendar month",
          },
          daily: dailySalesStats,
          weekly: weeklySalesStats,
          monthly: monthlySalesStats,
          byPaymentMethod: paymentMethodSalesStats,
        },

        // Existing dashboard lists (preserved)
        recentOrders,
        pendingOrders: pendingOrdersList,
        bestSellingProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
