import { Request, Response, NextFunction } from "express";

import Product from "../models/Product";
import Category from "../models/Category";

// ==========================================
// ADMIN CATALOG ENDPOINTS
// Unlike the public catalog endpoints, these return records of every
// status (active, inactive, out_of_stock) so administrators can manage
// the complete catalog. They are read-only and additive.
// ==========================================

const PRODUCT_STATUSES = [
  "active",
  "inactive",
  "out_of_stock",
] as const;

const CATEGORY_STATUSES = ["active", "inactive"] as const;

// Validate MongoDB ObjectId
const isValidObjectId = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-fA-F]{24}$/.test(value)
  );
};

// Escape special regex characters
const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Parse and validate pagination parameters
const parsePagination = (
  value: unknown,
  defaultValue: number,
  maximum: number
): number | null => {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
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

const badRequest = (res: Response, message: string): void => {
  res.status(400).json({
    success: false,
    message,
  });
};

// Read an optional search string (max 100 characters)
// Returns undefined when absent, null when invalid.
const parseSearch = (value: unknown): string | undefined | null => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (normalized.length > 100) {
    return null;
  }

  return normalized;
};

// ==========================================
// GET /api/admin/products
// ==========================================

export const getAdminProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parsePagination(req.query.page, 1, 1000000);
    const limit = parsePagination(req.query.limit, 10, 100);

    if (page === null || limit === null) {
      badRequest(res, "Invalid pagination parameters");
      return;
    }

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      badRequest(res, "Invalid pagination parameters");
      return;
    }

    const filter: Record<string, unknown> = {};

    // Search by name, SKU, brand or description
    const search = parseSearch(req.query.search);

    if (search === null) {
      badRequest(res, "Invalid search parameter");
      return;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { sku: { $regex: safeSearch, $options: "i" } },
        { brand: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Filter by status (all statuses are visible to admins)
    const status = req.query.status;

    if (status !== undefined && status !== "") {
      if (
        typeof status !== "string" ||
        !(PRODUCT_STATUSES as readonly string[]).includes(status)
      ) {
        badRequest(res, "Invalid product status filter");
        return;
      }

      filter.status = status;
    }

    // Filter by category
    const category = req.query.category;

    if (category !== undefined && category !== "") {
      if (
        typeof category !== "string" ||
        !isValidObjectId(category.trim())
      ) {
        badRequest(res, "Invalid category ID");
        return;
      }

      filter.category = category.trim();
    }

    // Filter by featured flag
    const featured = req.query.featured;

    if (featured !== undefined && featured !== "") {
      if (featured !== "true" && featured !== "false") {
        badRequest(res, "Invalid featured filter");
        return;
      }

      filter.isFeatured = featured === "true";
    }

    // Filter low-stock products (stock between 1 and 5)
    const lowStock = req.query.lowStock;

    if (lowStock !== undefined && lowStock !== "") {
      if (lowStock !== "true" && lowStock !== "false") {
        badRequest(res, "Invalid lowStock filter");
        return;
      }

      if (lowStock === "true") {
        filter.stock = { $gt: 0, $lte: 5 };
      }
    }

    // Sorting with an allowlist
    const sortOptions: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      stock_low: { stock: 1 },
      stock_high: { stock: -1 },
    };

    const sort = req.query.sort;

    const sortBy =
      typeof sort === "string" &&
      Object.prototype.hasOwnProperty.call(sortOptions, sort)
        ? sortOptions[sort]
        : sortOptions.newest;

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        totalProducts,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        pageSize: limit,
      },
      products,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/admin/products/:id
// ==========================================

export const getAdminProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      badRequest(res, "Invalid product ID");
      return;
    }

    const product = await Product.findById(id).populate(
      "category",
      "name slug"
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/admin/categories
// ==========================================

export const getAdminCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parsePagination(req.query.page, 1, 1000000);
    const limit = parsePagination(req.query.limit, 20, 100);

    if (page === null || limit === null) {
      badRequest(res, "Invalid pagination parameters");
      return;
    }

    const skip = (page - 1) * limit;

    if (!Number.isSafeInteger(skip)) {
      badRequest(res, "Invalid pagination parameters");
      return;
    }

    const filter: Record<string, unknown> = {};

    // Search by name or slug
    const search = parseSearch(req.query.search);

    if (search === null) {
      badRequest(res, "Invalid search parameter");
      return;
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { slug: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Filter by status (all statuses are visible to admins)
    const status = req.query.status;

    if (status !== undefined && status !== "") {
      if (
        typeof status !== "string" ||
        !(CATEGORY_STATUSES as readonly string[]).includes(status)
      ) {
        badRequest(res, "Invalid category status filter");
        return;
      }

      filter.status = status;
    }

    const [categories, totalCategories] = await Promise.all([
      Category.find(filter)
        .populate("parentCategory", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Category.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      pagination: {
        totalCategories,
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        pageSize: limit,
      },
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET /api/admin/categories/:id
// ==========================================

export const getAdminCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      badRequest(res, "Invalid category ID");
      return;
    }

    const category = await Category.findById(id).populate(
      "parentCategory",
      "name slug"
    );

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};
