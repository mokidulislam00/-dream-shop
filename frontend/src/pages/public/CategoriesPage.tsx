import { Link } from "react-router-dom";
import { Layers } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Container } from "@/components/layout/Container";
import { CategoryTile } from "@/components/products/CategoryTile";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCategories } from "@/hooks/useCatalog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { groupCategories } from "@/utils/category";

export default function CategoriesPage() {
  useDocumentTitle("Categories");

  const { data, isPending, isError, error, refetch } = useCategories();
  const grouped = data ? groupCategories(data.categories) : undefined;

  return (
    <Container className="py-10">
      <h1 className="mb-8 text-3xl sm:text-4xl">Categories</h1>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Categories couldn't be loaded"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : !grouped || grouped.roots.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No categories yet"
          description="Categories will appear here once they are added."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.roots.map((category) => {
            const children = grouped.childrenOf(category._id);

            return (
              <div key={category._id}>
                <CategoryTile category={category} />
                {children.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1">
                    {children.map((child) => (
                      <li key={child._id}>
                        <Link
                          to={`/categories/${child._id}`}
                          className="text-sm text-muted hover:text-accent"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
