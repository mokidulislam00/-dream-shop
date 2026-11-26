import { Heart } from "lucide-react";

import { useWishlistToggle } from "@/hooks/useWishlist";
import { cn } from "@/utils/cn";

export function WishlistButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const { isWishlisted, toggle, pendingProductId } = useWishlistToggle();
  const active = isWishlisted(productId);

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      disabled={pendingProductId === productId}
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${productName} from wishlist`
          : `Add ${productName} to wishlist`
      }
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-ink shadow-card",
        "hover:text-accent disabled:opacity-60",
        className
      )}
    >
      <Heart
        className={cn("h-5 w-5", active && "fill-accent text-accent")}
        aria-hidden="true"
      />
    </button>
  );
}
