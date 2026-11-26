import { cn } from "@/utils/cn";
import { formatPrice, getEffectivePrice, hasDiscount } from "@/utils/format";

export const discountPercent = (product: {
  price: number;
  discountPrice?: number | null;
}): number =>
  hasDiscount(product) && product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0;

export function Price({
  product,
  size = "md",
}: {
  product: { price: number; discountPrice?: number | null };
  size?: "md" | "lg";
}) {
  const discounted = hasDiscount(product);

  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span
        className={cn(
          "font-semibold",
          size === "lg" ? "text-2xl" : "text-base",
          discounted && "text-accent-deep"
        )}
      >
        {formatPrice(getEffectivePrice(product))}
      </span>
      {discounted ? (
        <span className={cn("text-muted line-through", size === "lg" ? "text-base" : "text-sm")}>
          <span className="sr-only">Original price </span>
          {formatPrice(product.price)}
        </span>
      ) : null}
    </p>
  );
}
