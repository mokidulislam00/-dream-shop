import { Link, useParams } from "react-router-dom";
import { ChevronRight, SearchX } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Container } from "@/components/layout/Container";
import { ProductListing } from "@/components/products/ProductListing";
import { buttonStyles } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { useCategories, useCategory } from "@/hooks/useCatalog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { groupCategories } from "@/utils/category";
import { isClientError } from "@/utils/errors";

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data: category, isPending, isError, error, refetch } = useCategory(id);
  const { data: allCategories } = useCategories();

  useDocumentTitle(category?.name);

  if (isPending) {
    return <PageSpinner label="Loading category" />;
  }

  if (isError) {
    return isClientError(error) ? (
      <EmptyState
        icon={SearchX}
        title="Category not found"
        description="This category doesn't exist or is no longer available."
        action={
          <Link to="/categories" className={buttonStyles("primary")}>
            All categories
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  const subcategories = allCategories
    ? groupCategories(allCategories.categories).childrenOf(category._id)
    : [];

  return (
    <Container className="py-10">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted">
        <Link to="/categories" className="hover:text-ink">
          Categories
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-ink" aria-current="page">
          {category.name}
        </span>
      </nav>

      <h1 className="text-3xl sm:text-4xl">{category.name}</h1>
      {category.description ? (
        <p className="mt-3 max-w-2xl text-muted">{category.description}</p>
      ) : null}

      {subcategories.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Subcategories:</span>
          {subcategories.map((child) => (
            <Link
              key={child._id}
              to={`/categories/${child._id}`}
              className="rounded-full border border-line px-3 py-1 text-sm hover:border-ink"
            >
              {child.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <ProductListing key={category._id} fixedCategory={category._id} />
      </div>
    </Container>
  );
}
