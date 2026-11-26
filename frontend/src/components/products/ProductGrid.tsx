import { ProductCard } from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Product } from "@/types/models";
import { cn } from "@/utils/cn";

const gridClasses = "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3";

export function ProductGrid({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  return (
    <div className={cn(gridClasses, className)}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn(gridClasses, className)} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="mt-3 h-3 w-1/3" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
