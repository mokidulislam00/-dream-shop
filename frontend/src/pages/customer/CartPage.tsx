import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShoppingBag, Trash2 } from "lucide-react";

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
  useSetCartQuantity,
} from "@/hooks/useCart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { CartItem, CartProduct } from "@/types/models";
import { formatPrice, getEffectivePrice } from "@/utils/format";

type AvailableItem = CartItem & { product: CartProduct };

// Why an item cannot be ordered right now (undefined = fine).
const itemProblem = (item: AvailableItem): string | undefined => {
  if (item.product.status !== "active") {
    return "This product is no longer available";
  }

  if (item.product.stock < item.quantity) {
    return item.product.stock === 0
      ? "Out of stock"
      : `Only ${item.product.stock} in stock. Reduce the quantity to continue`;
  }

  return undefined;
};

export default function CartPage() {
  useDocumentTitle("Cart");

  const { data, isPending, isError, error, refetch } = useCart();
  const setQuantity = useSetCartQuantity();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();
  const [confirmClear, setConfirmClear] = useState(false);

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

  const items = data.cart.items;

  if (items.length === 0) {
    return (
      <Container className="py-10">
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

  const available = items.filter(
    (item): item is AvailableItem => item.product !== null
  );
  const missingCount = items.length - available.length;
  const blocked =
    missingCount > 0 || available.some((item) => itemProblem(item));

  const subtotal =
    data.summary?.subtotal ??
    available.reduce(
      (sum, item) => sum + getEffectivePrice(item.product) * item.quantity,
      0
    );
  const totalItems =
    data.summary?.totalItems ??
    available.reduce((sum, item) => sum + item.quantity, 0);

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

      {missingCount > 0 ? (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded border border-amber/30 bg-amber-soft p-4 text-sm text-amber"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            {missingCount === 1
              ? "One item in your cart is no longer available."
              : `${missingCount} items in your cart are no longer available.`}{" "}
            Clear your cart and add your products again to continue.
          </p>
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-12">
        <ul className="divide-y divide-line border-y border-line">
          {available.map((item) => {
            const { product } = item;
            const problem = itemProblem(item);
            const busy =
              (setQuantity.isPending &&
                setQuantity.variables?.productId === product._id) ||
              (removeItem.isPending && removeItem.variables === product._id);

            return (
              <li
                key={product._id}
                className={`flex gap-4 py-5 ${busy ? "opacity-60" : ""}`}
              >
                <Link
                  to={`/products/${product._id}`}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="h-28 w-24 shrink-0 overflow-hidden rounded bg-ink/5"
                >
                  <ProductImage src={product.images[0]} alt="" width={240} />
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
                    {problem ? (
                      <p role="alert" className="mt-2 text-sm text-danger">
                        {problem}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-between">
                    <QuantitySelector
                      value={item.quantity}
                      max={product.stock}
                      disabled={busy || product.status !== "active"}
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
                        {formatPrice(
                          getEffectivePrice(product) * item.quantity
                        )}
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
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

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

          {blocked ? (
            <>
              <Button size="lg" className="mt-6 w-full" disabled>
                Proceed to checkout
              </Button>
              <p className="mt-3 text-sm text-danger">
                Fix the items marked above to continue.
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
