import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, SearchX } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImageManager, MAX_PRODUCT_IMAGES } from "@/components/admin/ImageManager";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FormAlert } from "@/components/forms/FormAlert";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/schemas/product";
import { adminService } from "@/services/admin.service";
import {
  productService,
  type UpdateProductInput,
} from "@/services/product.service";
import type { Product } from "@/types/models";
import { ApiError, getErrorMessage, isClientError } from "@/utils/errors";
import { applyFieldErrors } from "@/utils/forms";

const FIELDS = [
  "name",
  "description",
  "price",
  "discountPrice",
  "category",
  "brand",
  "sku",
  "stock",
  "status",
] as const;

const toFormValues = (product?: Product): ProductFormValues => ({
  name: product?.name ?? "",
  description: product?.description ?? "",
  price: product ? String(product.price) : "",
  discountPrice:
    product?.discountPrice !== undefined ? String(product.discountPrice) : "",
  category: product?.category?._id ?? "",
  brand: product?.brand ?? "",
  sku: product?.sku ?? "",
  stock: product ? String(product.stock) : "0",
  status: product?.status ?? "active",
  isFeatured: product?.isFeatured ?? false,
});

function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.admin.categories({ limit: 100, status: "active" }),
    queryFn: () => adminService.listCategories({ limit: 100, status: "active" }),
    staleTime: 60_000,
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(product),
  });

  // Active categories, plus the product's current one if it is inactive.
  const categoryOptions = [...(categoriesQuery.data?.categories ?? [])].map(
    (item) => ({ id: item._id, name: item.name })
  );

  if (
    product?.category &&
    !categoryOptions.some((option) => option.id === product.category._id)
  ) {
    categoryOptions.push({
      id: product.category._id,
      name: `${product.category.name} (inactive)`,
    });
  }

  const refreshCatalog = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    ]);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      if (product) {
        // Send only what changed. A cleared discount is sent as null.
        const changes: UpdateProductInput = {};
        const initial = toFormValues(product);

        if (values.name !== initial.name) changes.name = values.name;
        if (values.description !== initial.description) changes.description = values.description;
        if (values.price !== initial.price) changes.price = Number(values.price);
        if (values.category !== initial.category) changes.category = values.category;
        if (values.brand !== initial.brand) changes.brand = values.brand;
        if (values.sku !== initial.sku) changes.sku = values.sku;
        if (values.stock !== initial.stock) changes.stock = Number(values.stock);
        if (values.status !== initial.status) changes.status = values.status;
        if (values.isFeatured !== initial.isFeatured) changes.isFeatured = values.isFeatured;

        if (values.discountPrice !== initial.discountPrice) {
          changes.discountPrice =
            values.discountPrice === "" ? null : Number(values.discountPrice);
        }

        if (Object.keys(changes).length === 0) {
          toast.info("There are no changes to save.");
          return;
        }

        const updated = await productService.update(product._id, changes);
        await refreshCatalog();
        reset(toFormValues(updated));
        toast.success("Product saved");
        return;
      }

      // New product: create it, then upload the chosen images.
      const created = await productService.create({
        name: values.name,
        description: values.description,
        price: Number(values.price),
        ...(values.discountPrice !== ""
          ? { discountPrice: Number(values.discountPrice) }
          : {}),
        category: values.category,
        images: [],
        ...(values.brand ? { brand: values.brand } : {}),
        sku: values.sku,
        stock: Number(values.stock),
        status: values.status,
        isFeatured: values.isFeatured,
      });

      if (newFiles.length > 0) {
        try {
          await productService.uploadImages(created._id, newFiles);
        } catch (uploadError) {
          toast.error(
            `The product was created, but the images could not be uploaded: ${getErrorMessage(uploadError)}`
          );
        }
      }

      await refreshCatalog();
      toast.success("Product created");
      navigate(`/admin/products/${created._id}/edit`, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("sku", { type: "server", message: error.message });
        return;
      }

      if (applyFieldErrors(error, setError, FIELDS)) {
        return;
      }

      setFormError(getErrorMessage(error));
    }
  });

  return (
    <div className="max-w-3xl space-y-8">
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        {formError ? <FormAlert>{formError}</FormAlert> : null}

        <section className="rounded border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-xl">Details</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Name" error={errors.name?.message} {...register("name")} />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Description"
                className="min-h-[140px]"
                error={errors.description?.message}
                {...register("description")}
              />
            </div>
            <Input
              label="Price (৳)"
              inputMode="decimal"
              error={errors.price?.message}
              {...register("price")}
            />
            <Input
              label="Discount price (৳, optional)"
              inputMode="decimal"
              hint="Leave empty for no discount"
              error={errors.discountPrice?.message}
              {...register("discountPrice")}
            />
            <Select label="Category" {...register("category")}>
              <option value="">Choose a category</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
            <Input
              label="Brand (optional)"
              error={errors.brand?.message}
              {...register("brand")}
            />
            <Input label="SKU" error={errors.sku?.message} {...register("sku")} />
            <Input
              label="Stock"
              inputMode="numeric"
              error={errors.stock?.message}
              {...register("stock")}
            />
            <Select label="Status" {...register("status")}>
              <option value="active">Active (visible and sellable)</option>
              <option value="inactive">Inactive (hidden from customers)</option>
              <option value="out_of_stock">Out of stock</option>
            </Select>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 self-end text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-line accent-accent"
                {...register("isFeatured")}
              />
              Show in Featured products
            </label>
          </div>
          {errors.category?.message ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {errors.category.message}
            </p>
          ) : null}
        </section>

        {!product ? (
          <section className="rounded border border-line bg-surface p-5 sm:p-6">
            <h2 className="text-xl">Images</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              Optional. The first image is the main one. Images are uploaded
              after the product is created.
            </p>
            <ImagePicker
              files={newFiles}
              onChange={setNewFiles}
              maxFiles={MAX_PRODUCT_IMAGES}
              disabled={isSubmitting}
            />
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" loading={isSubmitting}>
            {product ? "Save changes" : "Create product"}
          </Button>
          <Link to="/admin/products" className={buttonStyles("ghost", "lg")}>
            Back to products
          </Link>
        </div>
      </form>

      {product ? (
        <section className="rounded border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-xl">Images</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Up to {MAX_PRODUCT_IMAGES} images. The first one is shown on the
            storefront.
          </p>
          <ImageManager product={product} />
        </section>
      ) : null}
    </div>
  );
}

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: product, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.product(id ?? ""),
    queryFn: () => adminService.getProduct(id as string),
    enabled: isEdit,
  });

  useDocumentTitle(isEdit ? (product?.name ?? "Edit product") : "New product");

  const back = (
    <Link
      to="/admin/products"
      className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      Products
    </Link>
  );

  if (!isEdit) {
    return (
      <div>
        {back}
        <AdminPageHeader title="New product" />
        <ProductForm />
      </div>
    );
  }

  if (isPending) {
    return <PageSpinner label="Loading product" />;
  }

  if (isError) {
    return isClientError(error) ? (
      <EmptyState
        icon={SearchX}
        title="Product not found"
        action={
          <Link to="/admin/products" className={buttonStyles("primary")}>
            Back to products
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  return (
    <div>
      {back}
      <AdminPageHeader title={product.name} description={`SKU ${product.sku}`} />
      {/* Keyed by id so a different product starts with fresh form state;
          image changes refresh the product without resetting the form. */}
      <ProductForm key={product._id} product={product} />
    </div>
  );
}
