import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Banknote, ChevronRight, SearchX, ShoppingBag, Truck } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Container } from "@/components/layout/Container";
import { ImageGallery } from "@/components/products/ImageGallery";
import { Price, discountPercent } from "@/components/products/Price";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { ReviewList } from "@/components/products/ReviewList";
import { WishlistButton } from "@/components/products/WishlistButton";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useProduct } from "@/hooks/useCatalog";
import { useAddToCart } from "@/hooks/useCart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { Product } from "@/types/models";
import { isClientError } from "@/utils/errors";

const LOW_STOCK_THRESHOLD = 5;

function StockStatus({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge tone="danger">Out of stock</Badge>;
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return <Badge tone="warning">Only {stock} left</Badge>;
  }

  return <Badge tone="success">In stock</Badge>;
}

function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const requireAuth = useRequireAuth();
  const addToCart = useAddToCart();

  const soldOut = product.stock === 0;
  const percent = discountPercent(product);

  const handleAdd = () => {
    if (!requireAuth("Sign in to add products to your cart")) {
      return;
    }

    addToCart.mutate({ productId: product._id, quantity });
  };

  return (
    <Container className="py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted">
        <Link to="/products" className="hover:text-ink">
          Shop
        </Link>
        {product.category ? (
          <>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link to={`/categories/${product.category._id}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        ) : null}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-ink" aria-current="page">
          {product.name}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ImageGallery images={product.images} alt={product.name} />

        <div>
          {product.brand ? (
            <p className="text-sm uppercase tracking-wide text-muted">{product.brand}</p>
          ) : null}
          <h1 className="mt-1 text-3xl sm:text-4xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Price product={product} size="lg" />
            {percent > 0 ? <Badge tone="accent">Save {percent}%</Badge> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StockStatus stock={product.stock} />
            <span className="text-sm text-muted">SKU {product.sku}</span>
          </div>

          <p className="mt-6 max-w-prose whitespace-pre-line text-ink/90">
            {product.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuantitySelector
              value={quantity}
              max={product.stock}
              onChange={setQuantity}
              disabled={soldOut}
            />
            <Button
              size="lg"
              className="min-w-[200px] flex-1 sm:flex-none"
              disabled={soldOut}
              loading={addToCart.isPending}
              onClick={handleAdd}
              leftIcon={<ShoppingBag className="h-5 w-5" aria-hidden="true" />}
            >
              {soldOut ? "Out of stock" : "Add to cart"}
            </Button>
            <WishlistButton
              productId={product._id}
              productName={product.name}
              className="h-12 w-12 border border-line"
            />
          </div>

          <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
            <li className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-accent" aria-hidden="true" />
              Pay with cash when your order is delivered
            </li>
            <li className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-accent" aria-hidden="true" />
              No delivery charge
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-16">
        <ReviewList productId={product._id} />
      </div>
    </Container>
  );
}

function ProductDetailSkeleton() {
  return (
    <Container className="grid gap-8 py-10 lg:grid-cols-2 lg:gap-14">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-64" />
      </div>
    </Container>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isPending, isError, error, refetch } = useProduct(id);

  useDocumentTitle(product?.name);

  if (isPending) {
    return <ProductDetailSkeleton />;
  }

  if (isError) {
    return isClientError(error) ? (
      <EmptyState
        icon={SearchX}
        title="Product not found"
        description="This product doesn't exist or is no longer available."
        action={
          <Link to="/products" className={buttonStyles("primary")}>
            Browse all products
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  return <ProductDetail key={product._id} product={product} />;
}
