
import { Request, Response, NextFunction } from "express";

import Product from "../models/Product";
import Category from "../models/Category";

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.helpers";

// Product query filter type
type ProductFilter = Record<string, any>;

// Product input type
interface ProductInput {
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  images: string[];
  brand?: string;
  sku: string;
  stock: number;
  status?: "active" | "inactive" | "out_of_stock";
  isFeatured?: boolean;
}

// Validate MongoDB ObjectId
const isValidObjectId = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-fA-F]{24}$/.test(value)
  );
};

// Escape special Regex characters
const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Check MongoDB duplicate key error
const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
};

// Get all active products with search, filters, sorting and pagination
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: ProductFilter = {
      status: "active",
    };

    // Search products by name, description or brand
    const search = req.query.search;

    if (search !== undefined) {
      if (typeof search !== "string") {
        res.status(400).json({
          success: false,
          message: "Invalid search parameter",
        });
        return;
      }

      const normalizedSearch = search.trim();

      if (normalizedSearch.length > 100) {
        res.status(400).json({
          success: false,
          message: "Search cannot exceed 100 characters",
        });
        return;
      }

      if (normalizedSearch) {
        const safeSearch = escapeRegex(normalizedSearch);

        filter.$or = [
          { name: { $regex: safeSearch, $options: "i" } },
          { description: { $regex: safeSearch, $options: "i" } },
          { brand: { $regex: safeSearch, $options: "i" } },
        ];
      }
    }

    // Filter by category
    const category = req.query.category;

    if (category !== undefined) {
      if (
        typeof category !== "string" ||
        !isValidObjectId(category.trim())
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
        return;
      }

      filter.category = category.trim();
    }

    // Filter by brand
    const brand = req.query.brand;

    if (brand !== undefined) {
      if (typeof brand !== "string") {
        res.status(400).json({
          success: false,
          message: "Invalid brand filter",
        });
        return;
      }

      const normalizedBrand = brand.trim();

      if (normalizedBrand.length > 100) {
        res.status(400).json({
          success: false,
          message: "Brand filter cannot exceed 100 characters",
        });
        return;
      }

      if (normalizedBrand) {
        filter.brand = {
          $regex: escapeRegex(normalizedBrand),
          $options: "i",
        };
      }
    }

    // Filter by price range
    const priceFilter: {
      $gte?: number;
      $lte?: number;
    } = {};

    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    if (minPrice !== undefined) {
      if (
        typeof minPrice !== "string" ||
        !minPrice.trim()
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid minimum price",
        });
        return;
      }

      const min = Number(minPrice);

      if (!Number.isFinite(min) || min < 0) {
        res.status(400).json({
          success: false,
          message: "Invalid minimum price",
        });
        return;
      }

      priceFilter.$gte = min;
    }

    if (maxPrice !== undefined) {
      if (
        typeof maxPrice !== "string" ||
        !maxPrice.trim()
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid maximum price",
        });
        return;
      }

      const max = Number(maxPrice);

      if (!Number.isFinite(max) || max < 0) {
        res.status(400).json({
          success: false,
          message: "Invalid maximum price",
        });
        return;
      }

      priceFilter.$lte = max;
    }

    if (
      priceFilter.$gte !== undefined &&
      priceFilter.$lte !== undefined &&
      priceFilter.$gte > priceFilter.$lte
    ) {
      res.status(400).json({
        success: false,
        message: "Minimum price cannot exceed maximum price",
      });
      return;
    }

    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }

    // Filter by featured products
    const featured = req.query.featured;

    if (featured !== undefined) {
      if (featured !== "true" && featured !== "false") {
        res.status(400).json({
          success: false,
          message: "Invalid featured filter",
        });
        return;
      }

      filter.isFeatured = featured === "true";
    }

    // Pagination
    const page = req.query.page ?? "1";
    const limit = req.query.limit ?? "12";

    if (
      typeof page !== "string" ||
      typeof limit !== "string" ||
      !/^\d+$/.test(page) ||
      !/^\d+$/.test(limit)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
      return;
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isSafeInteger(currentPage) ||
      !Number.isSafeInteger(pageSize) ||
      currentPage < 1 ||
      currentPage > 1000000 ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
      return;
    }

    const skip = (currentPage - 1) * pageSize;

    if (!Number.isSafeInteger(skip)) {
      res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
      return;
    }

    // Sorting with an allowlist
    const sortOptions: Record<
      string,
      Record<string, 1 | -1>
    > = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };

    const sort = req.query.sort;

    const sortBy =
      typeof sort === "string" &&
      Object.prototype.hasOwnProperty.call(sortOptions, sort)
        ? sortOptions[sort]
        : sortOptions.newest;

    // Fetch products and total count
    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sortBy)
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        totalProducts,
        currentPage,
        totalPages: Math.ceil(totalProducts / pageSize),
        pageSize,
      },
      products,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single active product by ID
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await Product.findOne({
      _id: id,
      status: "active",
    }).populate("category", "name slug");

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

// Create a new product
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      images,
      brand,
      sku,
      stock,
      status,
      isFeatured,
    } = req.body as ProductInput;

    // Validate category ID
    if (!isValidObjectId(category)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    // Validate discount price
    if (
      discountPrice !== undefined &&
      discountPrice >= price
    ) {
      res.status(400).json({
        success: false,
        message: "Discount price must be lower than regular price",
      });
      return;
    }

    // Verify active category
    const existingCategory = await Category.findOne({
      _id: category,
      status: "active",
    });

    if (!existingCategory) {
      res.status(400).json({
        success: false,
        message: "Selected category does not exist or is inactive",
      });
      return;
    }

    const product = await Product.create({
      name,
      description,
      price,
      discountPrice,
      category,
      images,
      brand,
      sku,
      stock,
      status,
      isFeatured,
    });

    const populatedProduct = await product.populate(
      "category",
      "name slug"
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "A product with this SKU already exists",
      });
      return;
    }

    next(error);
  }
};

// Update an existing product
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    // Validate request body
    const requestBody = req.body;

    if (
      !requestBody ||
      typeof requestBody !== "object" ||
      Array.isArray(requestBody)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid product update data",
      });
      return;
    }

    // Only allow approved product fields
    const allowedFields = [
      "name",
      "description",
      "price",
      "discountPrice",
      "category",
      "images",
      "brand",
      "sku",
      "stock",
      "status",
      "isFeatured",
    ] as const;

    const body = requestBody as Record<string, unknown>;
    const updates: Partial<ProductInput> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        (
          updates as Record<string, unknown>
        )[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide valid product fields to update",
      });
      return;
    }

    // Find existing product
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Validate category if provided
    if (updates.category !== undefined) {
      if (!isValidObjectId(updates.category)) {
        res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
        return;
      }

      const category = await Category.findOne({
        _id: updates.category,
        status: "active",
      });

      if (!category) {
        res.status(400).json({
          success: false,
          message: "Selected category does not exist or is inactive",
        });
        return;
      }
    }

    // Validate final price and discount price together
    const nextPrice =
      updates.price !== undefined
        ? updates.price
        : product.price;

    const nextDiscountPrice =
      Object.prototype.hasOwnProperty.call(
        updates,
        "discountPrice"
      )
        ? updates.discountPrice
        : product.discountPrice;

    if (
      nextDiscountPrice !== undefined &&
      nextDiscountPrice !== null &&
      nextDiscountPrice >= nextPrice
    ) {
      res.status(400).json({
        success: false,
        message: "Discount price must be lower than regular price",
      });
      return;
    }

    // Apply validated updates
    product.set(updates);

    await product.save();

    const populatedProduct = await product.populate(
      "category",
      "name slug"
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: populatedProduct,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "A product with this SKU already exists",
      });
      return;
    }

    next(error);
  }
};

// Upload product images to Cloudinary
export const uploadProductImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const uploadedPublicIds: string[] = [];

  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "Please select at least one image",
      });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Maximum 5 images per product
    if (product.images.length + files.length > 5) {
      res.status(400).json({
        success: false,
        message: "A product cannot have more than 5 images",
      });
      return;
    }

    // Upload images one by one
    const uploadedImages: {
      url: string;
      publicId: string;
    }[] = [];

    for (const file of files) {
      const result = await uploadToCloudinary(file.buffer);

      uploadedPublicIds.push(result.public_id);

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    // Keep old image IDs aligned with old image URLs.
    // This also supports products created before Cloudinary integration.
    const existingPublicIds = [...(product.imagePublicIds || [])];

    while (existingPublicIds.length < product.images.length) {
      existingPublicIds.push("");
    }

    // Save image URLs and Cloudinary public IDs
    product.images.push(
      ...uploadedImages.map((image) => image.url)
    );

    product.imagePublicIds = [
      ...existingPublicIds,
      ...uploadedImages.map((image) => image.publicId),
    ];

    await product.save();

    const populatedProduct = await product.populate(
      "category",
      "name slug"
    );

    // Upload and database update succeeded.
    // Do not delete the uploaded images in the catch block.
    uploadedPublicIds.length = 0;

    res.status(200).json({
      success: true,
      message: "Product images uploaded successfully",
      uploadedCount: uploadedImages.length,
      images: uploadedImages,
      product: populatedProduct,
    });
  } catch (error) {
    // Remove successfully uploaded files if a later upload or DB save fails.
    if (uploadedPublicIds.length > 0) {
      await Promise.allSettled(
        uploadedPublicIds.map((publicId) =>
          deleteFromCloudinary(publicId)
        )
      );
    }

    next(error);
  }
};

// Delete a single product image
export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;
    const imageIndexParam = req.params.imageIndex;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    if (
      typeof imageIndexParam !== "string" ||
      !/^\d+$/.test(imageIndexParam)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid image index",
      });
      return;
    }

    const imageIndex = Number(imageIndexParam);

    if (!Number.isSafeInteger(imageIndex)) {
      res.status(400).json({
        success: false,
        message: "Invalid image index",
      });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (
      imageIndex < 0 ||
      imageIndex >= product.images.length
    ) {
      res.status(404).json({
        success: false,
        message: "Product image not found",
      });
      return;
    }

    // Get matching Cloudinary public ID.
    // Empty ID means this is a legacy or externally hosted image.
    const publicId = product.imagePublicIds?.[imageIndex] || "";

    // Remove the URL and its corresponding public ID.
    product.images.splice(imageIndex, 1);

    const updatedPublicIds = [...(product.imagePublicIds || [])];

    while (updatedPublicIds.length < product.images.length + 1) {
      updatedPublicIds.push("");
    }

    updatedPublicIds.splice(imageIndex, 1);

    product.imagePublicIds = updatedPublicIds;

    // Save database changes first.
    await product.save();

    let cloudinaryDeleted = true;

    // Delete Cloudinary image if it has a public ID.
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (cloudinaryError) {
        cloudinaryDeleted = false;
        console.error(
          "Cloudinary image deletion failed:",
          cloudinaryError
        );
      }
    }

    res.status(200).json({
      success: true,
      message: cloudinaryDeleted
        ? "Product image deleted successfully"
        : "Image removed from product, but Cloudinary cleanup failed",
      cloudinaryDeleted,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a product and its Cloudinary images
export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Collect non-empty Cloudinary public IDs.
    const publicIds = [
      ...new Set(
        (product.imagePublicIds || []).filter(
          (publicId) => typeof publicId === "string" && publicId.trim()
        )
      ),
    ];

    // Delete product from database.
    await product.deleteOne();

    // Clean up Cloudinary images.
    // Product deletion remains successful even if Cloudinary cleanup fails.
    const cleanupResults = await Promise.allSettled(
      publicIds.map((publicId) =>
        deleteFromCloudinary(publicId)
      )
    );

    const failedCleanupCount = cleanupResults.filter(
      (result) => result.status === "rejected"
    ).length;

    if (failedCleanupCount > 0) {
      console.error(
        `${failedCleanupCount} Cloudinary image(s) could not be deleted for product ${id}`
      );
    }

    res.status(200).json({
      success: true,
      message:
        failedCleanupCount === 0
          ? "Product and its Cloudinary images deleted successfully"
          : "Product deleted successfully, but some Cloudinary images could not be deleted",
      imageCleanup: {
        attempted: publicIds.length,
        deleted: publicIds.length - failedCleanupCount,
        failed: failedCleanupCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
