import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGridSkeleton } from "@/components/products/ProductGrid";
import { Button, buttonStyles } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWishlist } from "@/hooks/useWishlist";
import { queryKeys } from "@/lib/queryKeys";
import { cartService } from "@/services/cart.service";
import { wishlistService } from "@/services/wishlist.service";
import type { Product } from "@/types/models";
import { getErrorMessage } from "@/utils/errors";

function MoveToCartButton({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const move = useMutation({
    mutationFn: async () => {
      await cartService.add(product._id, 1);
      await wishlistService.remove(product._id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.cart }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wishlist }),
      ]);
      toast.success("Moved to your cart", {
        action: { label: "View cart", onClick: () => navigate("/cart") },
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const soldOut = product.stock === 0;

  return (
    <Button
      variant="secondary"
      size="sm"
      className="mt-3 w-full"
      disabled={soldOut}
      loading={move.isPending}
      onClick={() => move.mutate()}
    >
      {soldOut ? "Out of stock" : "Move to cart"}
    </Button>
  );
}

export default function WishlistPage() {
  useDocumentTitle("Wishlist");

  const { data, isPending, isError, error, refetch } = useWishlist();

  return (
    <Container className="py-10">
      <h1 className="mb-8 text-3xl sm:text-4xl">Your wishlist</h1>

      {isPending ? (
        <ProductGridSkeleton count={4} className="lg:grid-cols-4" />
      ) : isError ? (
        <ErrorState
          title="Your wishlist couldn't be loaded"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : data.products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on a product to save it for later."
          action={
            <Link to="/products" className={buttonStyles("primary")}>
              Browse products
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {data.products.map((product) => (
            <div key={product._id}>
              <ProductCard product={product} />
              <MoveToCartButton product={product} />
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
