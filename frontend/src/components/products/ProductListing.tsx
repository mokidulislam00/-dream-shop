import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PackageSearch, SlidersHorizontal } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { ProductFilters } from "@/components/products/ProductFilters";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/products/ProductGrid";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { PRODUCT_SORT_OPTIONS } from "@/constants/status";
import { useProducts } from "@/hooks/useCatalog";
import type { ProductSort } from "@/types/api";

const PAGE_SIZE = 12;
const SORT_VALUES: string[] = PRODUCT_SORT_OPTIONS.map((option) => option.value);

const toPositiveInt = (value: string | null): number | undefined => {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return parsed >= 1 ? parsed : undefined;
};

const toPrice = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

interface ProductListingProps {
  // Search term or category fixed by the page (the URL cannot change them)
  fixedSearch?: string;
  fixedCategory?: string;
}

// Every filter lives in the URL, so results are shareable and the back
// button works. All filtering and sorting is done by the backend.
export function ProductListing({
  fixedSearch,
  fixedCategory,
}: ProductListingProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = toPositiveInt(searchParams.get("page")) ?? 1;
  const sortParam = searchParams.get("sort");
  const sort: ProductSort = SORT_VALUES.includes(sortParam ?? "")
    ? (sortParam as ProductSort)
    : "newest";
  const category = fixedCategory ?? (searchParams.get("category") || undefined);
  const brand = searchParams.get("brand")?.trim() || undefined;
  const minPrice = toPrice(searchParams.get("minPrice"));
  const maxPrice = toPrice(searchParams.get("maxPrice"));
  const featured = searchParams.get("featured") === "true" ? true : undefined;
  const inStock = searchParams.get("inStock") === "true" ? true : undefined;

  const params = useMemo(
    () => ({
      search: fixedSearch,
      category,
      brand,
      minPrice,
      maxPrice,
      featured,
      inStock,
      page,
      limit: PAGE_SIZE,
      sort,
    }),
    [fixedSearch, category, brand, minPrice, maxPrice, featured, inStock, page, sort]
  );

  const { data, isPending, isError, error, isFetching, refetch } =
    useProducts(params);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    // Any change except paging itself returns to the first page.
    if (!("page" in patch)) {
      next.delete("page");
    }

    setSearchParams(next);
  };

  const activeFilterCount = [
    !fixedCategory && category,
    brand,
    minPrice !== undefined,
    maxPrice !== undefined,
    featured,
    inStock,
  ].filter(Boolean).length;

  const clearFilters = () => {
    const next = new URLSearchParams();

    if (sortParam) {
      next.set("sort", sort);
    }

    setSearchParams(next);
  };

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
      <div className="mb-4 lg:mb-0">
        <Button
          variant="secondary"
          size="sm"
          className="lg:hidden"
          leftIcon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
          aria-expanded={filtersOpen}
          aria-controls="product-filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>

        <div
          id="product-filters"
          className={`${filtersOpen ? "mt-4 block" : "hidden"} lg:sticky lg:top-24 lg:mt-0 lg:block`}
        >
          <ProductFilters
            showCategory={!fixedCategory}
            category={category}
            brand={brand}
            minPrice={minPrice}
            maxPrice={maxPrice}
            featured={Boolean(featured)}
            inStock={Boolean(inStock)}
            activeCount={activeFilterCount}
            onChange={update}
            onClear={clearFilters}
          />
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <p className="text-sm text-muted" aria-live="polite">
            {data
              ? `${data.pagination.totalProducts} ${
                  data.pagination.totalProducts === 1 ? "product" : "products"
                }`
              : "Loading products…"}
          </p>
          <div className="w-full sm:w-52">
            <Select
              label="Sort by"
              value={sort}
              onChange={(event) => update({ sort: event.target.value })}
            >
              {PRODUCT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isPending ? (
          <ProductGridSkeleton count={PAGE_SIZE} className="xl:grid-cols-3" />
        ) : isError ? (
          <ErrorState
            title="Products couldn't be loaded"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : data.products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products found"
            description={
              activeFilterCount > 0 || fixedSearch
                ? "Try removing a filter or searching for something else."
                : "There are no products in this section yet."
            }
            action={
              activeFilterCount > 0 ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear all filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
              <ProductGrid
                products={data.products}
                className="xl:grid-cols-3"
              />
            </div>
            <div className="mt-10">
              <Pagination
                page={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
                onChange={(next) => update({ page: String(next) })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
