import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Heart, ShoppingBag, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Container } from "@/components/layout/Container";
import { Price } from "@/components/products/Price";
import { ProductImage } from "@/components/products/ProductImage";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { Button, buttonStyles } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useCart,
  useClearCart,
  useRemoveFromCart,
  useRemoveManyFromCart,
  useSaveForLater,
  useSetCartQuantity,
} from "@/hooks/useCart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { CartItem, CartProduct } from "@/types/models";
import { cn } from "@/utils/cn";
import { formatPrice, getEffectivePrice } from "@/utils/format";

type AvailableItem = CartItem & { product: CartProduct };

// ok          - can be ordered as is
// reduce      - in stock, but fewer than the quantity in the cart
// unavailable - inactive or out of stock; cannot be ordered
type ItemState = "ok" | "reduce" | "unavailable";

const classify = (item: AvailableItem): ItemState => {
  if (item.product.status !== "active" || item.product.stock === 0) {
    return "unavailable";
  }

  return item.product.stock < item.quantity ? "reduce" : "ok";
};

// The wishlist only accepts active and out-of-stock products.
const canSaveForLater = (product: CartProduct): boolean =>
  product.status === "active" || product.status === "out_of_stock";

export default function CartPage() {
  useDocumentTitle("Cart");

  const { data, isPending, isError, error, refetch } = useCart();
  const setQuantity = useSetCartQuantity();
  const removeItem = useRemoveFromCart();
  const removeMany = useRemoveManyFromCart();
  const saveForLater = useSaveForLater();
  const clearCart = useClearCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const [removedNotice, setRemovedNotice] = useState(0);

  // The server reports items it dropped because the product was deleted.
  // Keep the notice visible after the cart refreshes.
  const removedFromServer = data?.removedItems ?? 0;

  useEffect(() => {
    if (removedFromServer > 0) {
      setRemovedNotice((current) => Math.max(current, removedFromServer));
    }
  }, [removedFromServer]);

  if (isPending) {
    return (
      <Container className="py-10">
        <h1 className="mb-8 text-3xl sm:text-4xl">Your cart</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      </Container>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Your cart couldn't be loaded"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const available = data.cart.items.filter(
    (item): item is AvailableItem => item.product !== null
  );
  const orderable = available.filter((item) => classify(item) !== "unavailable");
  const unavailable = available.filter(
    (item) => classify(item) === "unavailable"
  );
  const needsAttention =
    unavailable.length > 0 ||
    orderable.some((item) => classify(item) === "reduce");

  const notice =
    removedNotice > 0 ? (
      <div
        role="status"
        className="mb-6 flex items-start justify-between gap-3 rounded border border-amber/30 bg-amber-soft p-4 text-sm text-amber"
      >
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            {removedNotice === 1
              ? "1 item was removed from your cart because it is no longer sold."
              : `${removedNotice} items were removed from your cart because they are no longer sold.`}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 font-medium underline"
          onClick={() => setRemovedNotice(0)}
        >
          Dismiss
        </button>
      </div>
    ) : null;

  if (available.length === 0) {
    return (
      <Container className="py-10">
        {notice}
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add a product to start your order."
          action={
            <Link to="/products" className={buttonStyles("primary")}>
              Browse products
            </Link>
          }
        />
      </Container>
    );
  }

  const subtotal =
    data.summary?.subtotal ??
    orderable.reduce(
      (sum, item) => sum + getEffectivePrice(item.product) * item.quantity,
      0
    );
  const totalItems =
    data.summary?.totalItems ??
    orderable.reduce((sum, item) => sum + item.quantity, 0);

  const isBusy = (productId: string): boolean =>
    (setQuantity.isPending && setQuantity.variables?.productId === productId) ||
    (removeItem.isPending && removeItem.variables === productId) ||
    (saveForLater.isPending && saveForLater.variables === productId);

  const renderRow = (item: AvailableItem) => {
    const { product } = item;
    const state = classify(item);
    const busy = isBusy(product._id);

    return (
      <li
        key={product._id}
        className={cn("flex gap-4 py-5", busy && "opacity-60")}
      >
        <Link
          to={`/products/${product._id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="h-28 w-24 shrink-0 overflow-hidden rounded bg-ink/5"
        >
          <ProductImage
            src={product.images[0]}
            alt=""
            width={240}
            className={state === "unavailable" ? "opacity-50 grayscale" : ""}
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row">
          <div className="min-w-0">
            <Link
              to={`/products/${product._id}`}
              className="line-clamp-2 font-medium hover:text-accent"
            >
              {product.name}
            </Link>
            <div className="mt-1">
              <Price product={product} />
            </div>

            {state === "unavailable" ? (
              <p className="mt-2 text-sm font-medium text-danger">
                {product.status === "out_of_stock" || product.stock === 0
                  ? "Currently out of stock"
                  : "No longer available"}
              </p>
            ) : null}

            {state === "reduce" ? (
              <div role="alert" className="mt-2 text-sm text-danger">
                <p>
                  Only {product.stock} left, but you have {item.quantity} in
                  your cart.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setQuantity.mutate({
                      productId: product._id,
                      quantity: product.stock,
                    })
                  }
                  className="mt-1 font-medium underline disabled:opacity-50"
                >
                  Change quantity to {product.stock}
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-between">
            {state === "unavailable" ? (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {canSaveForLater(product) ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    loading={
                      saveForLater.isPending &&
                      saveForLater.variables === product._id
                    }
                    leftIcon={<Heart className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => saveForLater.mutate(product._id)}
                  >
                    Save for later
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => removeItem.mutate(product._id)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <QuantitySelector
                  value={item.quantity}
                  max={product.stock}
                  disabled={busy}
                  onChange={(value) => {
                    if (value !== item.quantity) {
                      setQuantity.mutate({
                        productId: product._id,
                        quantity: value,
                      });
                    }
                  }}
                />
                <div className="flex items-center gap-4">
                  <p className="font-semibold">
                    {formatPrice(getEffectivePrice(product) * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem.mutate(product._id)}
                    disabled={busy}
                    aria-label={`Remove ${product.name} from cart`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl sm:text-4xl">Your cart</h1>
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="text-sm text-muted hover:text-danger"
        >
          Clear cart
        </button>
      </div>

      {notice}

      <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-12">
        <div>
          {orderable.length > 0 ? (
            <ul className="divide-y divide-line border-y border-line">
              {orderable.map(renderRow)}
            </ul>
          ) : null}

          {unavailable.length > 0 ? (
            <section
              aria-labelledby="unavailable-heading"
              className={cn(orderable.length > 0 && "mt-10")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2
                    id="unavailable-heading"
                    className="font-sans text-lg font-semibold tracking-normal"
                  >
                    Unavailable right now
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    These items can't be ordered at the moment. Save them for
                    later or remove them to continue.
                  </p>
                </div>
                {unavailable.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={removeMany.isPending}
                    onClick={() =>
                      removeMany.mutate(
                        unavailable.map((item) => item.product._id)
                      )
                    }
                  >
                    Remove all
                  </Button>
                ) : null}
              </div>
              <ul className="mt-3 divide-y divide-line border-y border-line bg-ink/[0.02]">
                {unavailable.map(renderRow)}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="mt-8 h-fit rounded border border-line bg-surface p-5 lg:sticky lg:top-24 lg:mt-0">
          <h2 className="font-sans text-lg font-semibold tracking-normal">
            Order summary
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">
                Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
              </dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd>Free</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          {needsAttention || orderable.length === 0 ? (
            <>
              <Button size="lg" className="mt-6 w-full" disabled>
                Proceed to checkout
              </Button>
              <p className="mt-3 text-sm text-danger">
                {orderable.length === 0
                  ? "There is nothing to order right now."
                  : "Update or remove the items marked above to continue."}
              </p>
            </>
          ) : (
            <Link
              to="/checkout"
              className={buttonStyles("primary", "lg", "mt-6 w-full")}
            >
              Proceed to checkout
            </Link>
          )}
          <p className="mt-3 text-center text-sm text-muted">
            Pay with cash on delivery
          </p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear your cart?"
        description="All items will be removed from your cart."
        confirmLabel="Clear cart"
        cancelLabel="Keep items"
        loading={clearCart.isPending}
        onClose={() => setConfirmClear(false)}
        onConfirm={() =>
          clearCart.mutate(undefined, {
            onSuccess: () => setConfirmClear(false),
          })
        }
      />
    </Container>
  );
}
