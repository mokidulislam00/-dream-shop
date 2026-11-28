import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Package, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Price } from "@/components/products/Price";
import { ProductImage } from "@/components/products/ProductImage";
import { ProductStatusBadge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import { adminService } from "@/services/admin.service";
import { productService } from "@/services/product.service";
import type { AdminProductSort } from "@/types/api";
import type { Product, ProductStatus } from "@/types/models";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/errors";

const PAGE_SIZE = 15;

const SORT_OPTIONS: Array<{ value: AdminProductSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "stock_low", label: "Stock: low to high" },
  { value: "stock_high", label: "Stock: high to low" },
];

const STATUS_VALUES: ProductStatus[] = ["active", "inactive", "out_of_stock"];

const stockClass = (stock: number): string =>
  stock === 0 ? "text-danger font-medium" : stock <= 5 ? "text-amber font-medium" : "";

export default function AdminProductsPage() {
  useDocumentTitle("Products");

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get("status");
  const status = STATUS_VALUES.find((value) => value === statusParam);
  const category = searchParams.get("category") || undefined;
  const featured = searchParams.get("featured") === "true" ? true : undefined;
  const lowStock = searchParams.get("lowStock") === "true" ? true : undefined;
  const sortParam = searchParams.get("sort");
  const sort: AdminProductSort =
    SORT_OPTIONS.find((option) => option.value === sortParam)?.value ?? "newest";
  const search = (searchParams.get("search") ?? "").slice(0, 100);
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [searchDraft, setSearchDraft] = useState(search);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const params = {
    search: search || undefined,
    status,
    category,
    featured,
    lowStock,
    sort,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.products(params),
    queryFn: () => adminService.listProducts(params),
    placeholderData: keepPreviousData,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.admin.categories({ limit: 100 }),
    queryFn: () => adminService.listCategories({ limit: 100 }),
    staleTime: 60_000,
  });

  const remove = useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: async () => {
      setDeleting(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
      ]);
      toast.success("Product deleted");
    },
    onError: (mutationError) => {
      setDeleting(null);
      toast.error(getErrorMessage(mutationError));
    },
  });

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(patch)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }

    if (!("page" in patch)) {
      next.delete("page");
    }

    setSearchParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ search: searchDraft.trim() || undefined });
  };

  const hasFilters = Boolean(search || status || category || featured || lowStock);

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description="Every product, whatever its status."
        actions={
          <Link to="/admin/products/new" className={buttonStyles("primary")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />

      <div className="mb-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <form onSubmit={submitSearch} role="search" className="flex gap-2 lg:col-span-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="product-search" className="sr-only">
                Search products
              </label>
              <input
                id="product-search"
                type="search"
                value={searchDraft}
                maxLength={100}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search name, SKU or brand"
                className="h-11 w-full rounded border border-line bg-surface px-3 hover:border-ink/40"
              />
            </div>
            <Button type="submit" variant="secondary" aria-label="Search">
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          <Select
            label="Status"
            hideLabel
            value={status ?? ""}
            onChange={(event) => update({ status: event.target.value })}
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of stock</option>
          </Select>

          <Select
            label="Category"
            hideLabel
            value={category ?? ""}
            onChange={(event) => update({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {categoriesQuery.data?.categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(featured)}
              onChange={(event) =>
                update({ featured: event.target.checked ? "true" : undefined })
              }
              className="h-5 w-5 rounded border-line accent-accent"
            />
            Featured only
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(lowStock)}
              onChange={(event) =>
                update({ lowStock: event.target.checked ? "true" : undefined })
              }
              className="h-5 w-5 rounded border-line accent-accent"
            />
            Low stock (5 or fewer)
          </label>
          <div className="sm:ml-auto sm:w-52">
            <Select
              label="Sort by"
              hideLabel
              value={sort}
              onChange={(event) => update({ sort: event.target.value })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Products couldn't be loaded"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : data.products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={hasFilters ? "No products match" : "No products yet"}
          description={
            hasFilters
              ? "Try removing a filter or searching for something else."
              : "Add your first product to start selling."
          }
          action={
            hasFilters ? undefined : (
              <Link to="/admin/products/new" className={buttonStyles("primary")}>
                Add product
              </Link>
            )
          }
        />
      ) : (
        <div className={cn(isFetching && "opacity-60 transition-opacity")}>
          <div className="hidden overflow-x-auto rounded border border-line bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Product</th>
                  <th scope="col" className="px-4 py-3 font-medium">Category</th>
                  <th scope="col" className="px-4 py-3 font-medium">Price</th>
                  <th scope="col" className="px-4 py-3 font-medium">Stock</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.products.map((product) => (
                  <tr key={product._id} className="hover:bg-ink/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-ink/5">
                          <ProductImage src={product.images[0]} alt="" width={120} />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="line-clamp-1 font-medium text-accent hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-muted">
                            SKU {product.sku}
                            {product.isFeatured ? " · Featured" : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.category?.name}</td>
                    <td className="px-4 py-3">
                      <Price product={product} />
                    </td>
                    <td className={cn("px-4 py-3", stockClass(product.stock))}>
                      {product.stock}
                    </td>
                    <td className="px-4 py-3">
                      <ProductStatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className={buttonStyles("secondary", "sm")}
                        >
                          Edit
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(product)}
                          aria-label={`Delete ${product.name}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {data.products.map((product) => (
              <li
                key={product._id}
                className="rounded border border-line bg-surface p-4"
              >
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-ink/5">
                    <ProductImage src={product.images[0]} alt="" width={160} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium">{product.name}</p>
                    <p className="text-xs text-muted">SKU {product.sku}</p>
                    <div className="mt-1">
                      <Price product={product} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ProductStatusBadge status={product.status} />
                    <span className={cn("text-sm", stockClass(product.stock))}>
                      Stock {product.stock}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/products/${product._id}/edit`}
                      className={buttonStyles("secondary", "sm")}
                    >
                      Edit
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(product)}
                      aria-label={`Delete ${product.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Pagination
              page={data.pagination.currentPage}
              totalPages={data.pagination.totalPages}
              onChange={(next) => update({ page: String(next) })}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this product?"
        description={
          deleting
            ? `"${deleting.name}" and its images will be permanently removed. This can't be undone.`
            : undefined
        }
        confirmLabel="Delete product"
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            remove.mutate(deleting._id);
          }
        }}
      />
    </div>
  );
}
