import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Layers, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FormAlert } from "@/components/forms/FormAlert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/schemas/category";
import { adminService } from "@/services/admin.service";
import { categoryService } from "@/services/category.service";
import type { Category, CategoryStatus } from "@/types/models";
import { cn } from "@/utils/cn";
import { getParentId } from "@/utils/category";
import { ApiError, getErrorMessage } from "@/utils/errors";
import { applyFieldErrors } from "@/utils/forms";
import { slugify } from "@/utils/slug";

const PAGE_SIZE = 20;
const FIELDS = ["name", "slug", "description", "image", "status"] as const;

const parentName = (category: Category): string => {
  const parent = category.parentCategory;
  return parent && typeof parent === "object" ? parent.name : "";
};

function CategoryForm({
  category,
  options,
  onDone,
}: {
  category: Category | null;
  options: Category[];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const initial: CategoryFormValues = {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    image: category?.image ?? "",
    parentCategory: category ? (getParentId(category) ?? "") : "",
    status: category?.status ?? "active",
  };

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initial,
  });

  // A category cannot be its own parent.
  const parentOptions = options.filter((item) => item._id !== category?._id);

  const nameField = register("name");

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      if (category) {
        const changes: Parameters<typeof categoryService.update>[1] = {};

        if (values.name !== initial.name) changes.name = values.name;
        if (values.slug !== initial.slug) changes.slug = values.slug;
        if (values.description !== initial.description) changes.description = values.description;
        // The backend can replace an image but not clear it.
        if (values.image !== initial.image && values.image !== "") changes.image = values.image;
        if (values.status !== initial.status) changes.status = values.status;
        if (values.parentCategory !== initial.parentCategory) {
          changes.parentCategory = values.parentCategory || null;
        }

        if (Object.keys(changes).length === 0) {
          toast.info("There are no changes to save.");
          return;
        }

        await categoryService.update(category._id, changes);
        toast.success("Category saved");
      } else {
        await categoryService.create({
          name: values.name,
          slug: values.slug,
          ...(values.description ? { description: values.description } : {}),
          ...(values.image ? { image: values.image } : {}),
          ...(values.parentCategory ? { parentCategory: values.parentCategory } : {}),
          status: values.status,
        });
        toast.success("Category created");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
      ]);
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("slug", { type: "server", message: error.message });
        return;
      }

      if (applyFieldErrors(error, setError, FIELDS)) {
        return;
      }

      setFormError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <Input
        label="Name"
        error={errors.name?.message}
        {...nameField}
        onChange={(event) => {
          void nameField.onChange(event);

          // Suggest a slug from the name until the slug is edited by hand.
          if (!category && !dirtyFields.slug) {
            setValue("slug", slugify(event.target.value));
          }
        }}
      />
      <Input
        label="Slug"
        hint="Lowercase letters, numbers and hyphens"
        error={errors.slug?.message}
        {...register("slug")}
      />
      <Textarea
        label="Description (optional)"
        error={errors.description?.message}
        {...register("description")}
      />
      <Input
        label="Image URL (optional)"
        type="url"
        inputMode="url"
        hint={
          category?.image
            ? "Paste a new URL to replace the image. An image can't be removed."
            : "A link to an image on the web"
        }
        error={errors.image?.message}
        {...register("image")}
      />
      <Select label="Parent category" {...register("parentCategory")}>
        <option value="">None (top level)</option>
        {parentOptions.map((item) => (
          <option key={item._id} value={item._id}>
            {item.name}
          </option>
        ))}
      </Select>
      <Select label="Status" {...register("status")}>
        <option value="active">Active (visible)</option>
        <option value="inactive">Inactive (hidden)</option>
      </Select>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {category ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminCategoriesPage() {
  useDocumentTitle("Categories");

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const status: CategoryStatus | undefined =
    statusParam === "active" || statusParam === "inactive" ? statusParam : undefined;
  const search = (searchParams.get("search") ?? "").slice(0, 100);
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [searchDraft, setSearchDraft] = useState(search);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const params = { search: search || undefined, status, page, limit: PAGE_SIZE };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.categories(params),
    queryFn: () => adminService.listCategories(params),
    placeholderData: keepPreviousData,
  });

  // Every category, used for the parent selector.
  const allQuery = useQuery({
    queryKey: queryKeys.admin.categories({ limit: 100 }),
    queryFn: () => adminService.listCategories({ limit: 100 }),
    staleTime: 60_000,
  });

  const remove = useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: async () => {
      setDeleting(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
      ]);
      toast.success("Category deleted");
    },
    onError: (mutationError) => {
      setDeleting(null);
      // For example: the category still has products or subcategories.
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

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Group products so customers can browse them."
        actions={
          <Button onClick={() => setEditing("new")} leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
            Add category
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_12rem]">
        <form onSubmit={submitSearch} role="search" className="flex gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="category-search" className="sr-only">
              Search categories
            </label>
            <input
              id="category-search"
              type="search"
              value={searchDraft}
              maxLength={100}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search name or slug"
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
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Categories couldn't be loaded"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : data.categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No categories found"
          description="Add a category to organise your products."
          action={<Button onClick={() => setEditing("new")}>Add category</Button>}
        />
      ) : (
        <div className={cn(isFetching && "opacity-60 transition-opacity")}>
          <div className="hidden overflow-x-auto rounded border border-line bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Slug</th>
                  <th scope="col" className="px-4 py-3 font-medium">Parent</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.categories.map((category) => (
                  <tr key={category._id} className="hover:bg-ink/[0.02]">
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3 text-muted">{category.slug}</td>
                    <td className="px-4 py-3 text-muted">{parentName(category) || "None"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={category.status === "active" ? "success" : "neutral"}>
                        {category.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setEditing(category)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(category)}
                          aria-label={`Delete ${category.name}`}
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
            {data.categories.map((category) => (
              <li key={category._id} className="rounded border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted">
                      {category.slug}
                      {parentName(category) ? ` · in ${parentName(category)}` : ""}
                    </p>
                  </div>
                  <Badge tone={category.status === "active" ? "success" : "neutral"}>
                    {category.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setEditing(category)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleting(category)}
                    aria-label={`Delete ${category.name}`}
                  >
                    Delete
                  </Button>
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

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add category" : "Edit category"}
      >
        {editing !== null ? (
          <CategoryForm
            key={editing === "new" ? "new" : editing._id}
            category={editing === "new" ? null : editing}
            options={allQuery.data?.categories ?? []}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this category?"
        description={
          deleting
            ? `"${deleting.name}" will be removed. A category that still has products or subcategories can't be deleted.`
            : undefined
        }
        confirmLabel="Delete category"
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
