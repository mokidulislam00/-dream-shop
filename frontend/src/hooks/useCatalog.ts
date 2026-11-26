import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import {
  categoryService,
  type CategoryListParams,
} from "@/services/category.service";
import {
  productService,
  type ProductListParams,
} from "@/services/product.service";
import {
  reviewService,
  type ReviewListParams,
} from "@/services/review.service";

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productService.list(params),
    // Keep the previous page on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ""),
    queryFn: () => productService.getById(id as string),
    enabled: Boolean(id),
  });
}

const ALL_CATEGORIES: CategoryListParams = { limit: 100 };

export function useCategories(params: CategoryListParams = ALL_CATEGORIES) {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoryService.list(params),
    staleTime: 5 * 60_000,
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id ?? ""),
    queryFn: () => categoryService.getById(id as string),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useProductReviews(
  productId: string,
  params: ReviewListParams
) {
  return useQuery({
    queryKey: queryKeys.reviews.forProduct(productId, params),
    queryFn: () => reviewService.listForProduct(productId, params),
    placeholderData: keepPreviousData,
  });
}
