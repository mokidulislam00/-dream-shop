import type { Category } from "@/types/models";

export const getParentId = (category: Category): string | null => {
  const parent = category.parentCategory;

  if (!parent) {
    return null;
  }

  return typeof parent === "string" ? parent : parent._id;
};

// Splits a flat category list into top-level categories and their children.
export const groupCategories = (
  categories: Category[]
): { roots: Category[]; childrenOf: (id: string) => Category[] } => {
  const roots: Category[] = [];
  const children = new Map<string, Category[]>();

  for (const category of categories) {
    const parentId = getParentId(category);

    if (!parentId) {
      roots.push(category);
      continue;
    }

    const siblings = children.get(parentId) ?? [];
    siblings.push(category);
    children.set(parentId, siblings);
  }

  return { roots, childrenOf: (id) => children.get(id) ?? [] };
};
