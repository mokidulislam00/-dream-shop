
import { Request, Response, NextFunction } from "express";

import Category from "../models/Category";
import Product from "../models/Product";

// Category filter type
type CategoryFilter = {
  status: "active";
  name?: {
    $regex: string;
    $options: "i";
  };
};

// Category ancestor result type
type CategoryAncestor = {
  parentCategory?: unknown;
} | null;

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

// Check MongoDB duplicate key error
const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
};

// Prevent circular category relationships
const wouldCreateCircularRelationship = async (
  categoryId: string,
  proposedParentId: string
): Promise<boolean> => {
  const normalizedCategoryId = categoryId.toLowerCase();

  let currentId: string | null = proposedParentId.toLowerCase();

  const visited = new Set<string>();

  while (currentId) {
    if (currentId === normalizedCategoryId) {
      return true;
    }

    if (visited.has(currentId)) {
      return true;
    }

    visited.add(currentId);

    // Explicitly type Mongoose query result
    const ancestor = (
      await Category.findById(currentId)
        .select("parentCategory")
        .lean()
        .exec()
    ) as CategoryAncestor;

    if (!ancestor) {
      break;
    }

    // Explicitly type parent reference
    const nextParent: unknown = ancestor.parentCategory;

    currentId =
      nextParent === null || nextParent === undefined
        ? null
        : String(nextParent).toLowerCase();
  }

  return false;
};

// Get all active categories
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parsePagination(
      req.query.page,
      1,
      1000000
    );

    const limit = parsePagination(
      req.query.limit,
      12,
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

    const filter: CategoryFilter = {
      status: "active",
    };

    // Search categories by name
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
        filter.name = {
          $regex: escapeRegex(normalizedSearch),
          $options: "i",
        };
      }
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

// Get single active category by ID
export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    const category = await Category.findOne({
      _id: id,
      status: "active",
    }).populate("parentCategory", "name slug");

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

// Create category (Admin only)
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      description,
      image,
      slug,
      parentCategory,
      status,
    } = req.body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof slug !== "string" ||
      !name.trim() ||
      !slug.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Category name and slug are required",
      });
      return;
    }

    // Check duplicate slug
    const existingCategory = await Category.findOne({
      slug: slug.trim(),
    });

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
      return;
    }

    let normalizedParent: string | null = null;

    // Validate parent category
    if (
      parentCategory !== undefined &&
      parentCategory !== null &&
      parentCategory !== ""
    ) {
      if (!isValidObjectId(parentCategory)) {
        res.status(400).json({
          success: false,
          message: "Invalid parent category ID",
        });
        return;
      }

      const parent = await Category.findOne({
        _id: parentCategory,
        status: "active",
      });

      if (!parent) {
        res.status(400).json({
          success: false,
          message: "Parent category not found or inactive",
        });
        return;
      }

      normalizedParent = parentCategory;
    }

    const category = await Category.create({
      name,
      description,
      image,
      slug,
      parentCategory: normalizedParent,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
      return;
    }

    next(error);
  }
};

// Update category (Admin only)
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid category update data",
      });
      return;
    }

    // Only allow approved category fields
    const allowedFields = [
      "name",
      "description",
      "image",
      "slug",
      "parentCategory",
      "status",
    ] as const;

    const unknownFields = Object.keys(body).filter(
      (field) =>
        !allowedFields.includes(
          field as (typeof allowedFields)[number]
        )
    );

    if (unknownFields.length > 0) {
      res.status(400).json({
        success: false,
        message: "Unsupported category fields",
        fields: unknownFields,
      });
      return;
    }

    if (Object.keys(body).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide category fields to update",
      });
      return;
    }

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    // Validate slug
    if (body.slug !== undefined) {
      if (
        typeof body.slug !== "string" ||
        !body.slug.trim()
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid category slug",
        });
        return;
      }

      const existingSlug = await Category.findOne({
        slug: body.slug.trim(),
        _id: { $ne: id },
      });

      if (existingSlug) {
        res.status(409).json({
          success: false,
          message: "A category with this slug already exists",
        });
        return;
      }
    }

    // Validate parent category
    if (body.parentCategory !== undefined) {
      if (body.parentCategory === null) {
        category.set("parentCategory", null);
      } else {
        if (!isValidObjectId(body.parentCategory)) {
          res.status(400).json({
            success: false,
            message: "Invalid parent category ID",
          });
          return;
        }

        const parentId = body.parentCategory;

        // Prevent category from being its own parent
        if (parentId.toLowerCase() === id.toLowerCase()) {
          res.status(400).json({
            success: false,
            message: "A category cannot be its own parent",
          });
          return;
        }

        const parent = await Category.findOne({
          _id: parentId,
          status: "active",
        });

        if (!parent) {
          res.status(400).json({
            success: false,
            message: "Parent category not found or inactive",
          });
          return;
        }

        // Prevent circular parent-child relationships
        const createsCycle =
          await wouldCreateCircularRelationship(id, parentId);

        if (createsCycle) {
          res.status(400).json({
            success: false,
            message: "Circular category relationships are not allowed",
          });
          return;
        }

        category.set("parentCategory", parentId);
      }
    }

    // Apply permitted fields
    const updateFields = [
      "name",
      "description",
      "image",
      "slug",
      "status",
    ] as const;

    for (const field of updateFields) {
      if (body[field] !== undefined) {
        category.set(field, body[field]);
      }
    }

    await category.save();

    const updatedCategory = await category.populate(
      "parentCategory",
      "name slug"
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
      return;
    }

    next(error);
  }
};

// Delete category (Admin only)
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
      return;
    }

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    // Prevent deletion if subcategories exist
    const hasSubcategories = await Category.exists({
      parentCategory: id,
    });

    if (hasSubcategories) {
      res.status(400).json({
        success: false,
        message: "Delete or reassign subcategories first",
      });
      return;
    }

    // Prevent deletion if products use this category
    const hasProducts = await Product.exists({
      category: id,
    });

    if (hasProducts) {
      res.status(400).json({
        success: false,
        message:
          "Cannot delete category because products are assigned to it",
      });
      return;
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
